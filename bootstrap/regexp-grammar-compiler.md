Regular expression grammar compiler | Spencer Tipping
Licensed under the terms of the MIT source code license

# Introduction

This module compiles regular expression grammars into polymorphic cons cells with associated parsing and serialization methods. Most regular expression syntax is supported and maps
transparently to Javascript data structures. Here is the mapping:

    1. Repetition is encoded in array form: x* maps to [x1, x2, ...], where x1, x2, etc are match data.
    2. Alternation is encoded using polymorphic conses. That is, each alternative is a new class.
    3. Optional values are encoded verbatim or with null if there is no match.
    4. Sub-matches are encoded directly.
    5. Forgetful groups are structurally erased and encoded as strings (though they have some GC overhead).

Each matched region contains information about its match region, accessible via the start() and end() methods. This is useful for mapping syntactic regions back into string positions.

    caterwaul.module('regexp-grammar-compiler', ':all', function ($) {

## Encoding of variants

Regular expressions are made of constant and variant pieces. For example, /foob*ar/ consists of two constants, 'foo' and 'ar', and one variant, 'b*'. Within the variant, 'b' is a constant,
but we don't optimize this case specially. We need to know how many times 'b' occurred to reconstruct the original. Because repetition is encoded as an array, the resulting class would look
like this:

    foobar_regexp(start_, end_) *= capture [start()    = this.start_,
                                            end()      = this.end_,
                                            toString() = +this -seq -re- it.join('')]

Pieces are one of:

    1. Constant: contains just the start/end data; the text is encoded in the prototype. This is a metaclass; a single class is generated for each constant.
    2. Erased variant: contains the result of an erased match; e.g. /(?:foo|bar|bif)/ is stored as just a string snippet, not as a proper alternative.
    3. Sequence: contains start/end data along with numerically-indexed sub-pieces that are optionally aliased onto named methods. Length is per-instance to allow for seq[] copying.

You can think of these classes as being variations of atoms and conses, where conses have arbitrarily high arity (but are not variadic). Mapping semantics follow this model.

## Notation

Most regular expression constructs follow normal notational conventions. There are three significant exceptions:

    1. Regexps are parsed in terms of words, not characters. This is a big deal and is too involved to explain fully here (see source docs in caterwaul-regexp.waul).
    2. You can refer to other parse stages using a cross-reference, which is written as 'reference@'.
    3. You can name a piece of a regexp using a nominal binding, which is written as 'name:thing'. The : binds everything to its right up until a | or group-closer.

Nominal bindings turn into additional methods that refer to numerically-bound properties.

# Implementation

Classes are emitted as uncompiled syntax trees rather than closures. This allows you to emit the output from this function as a runnable Javascript program.

      $.regexp_grammar(rules) = rules %v*$.regexp /pairs *[metaclass(x[0], x[1])] /['_x; _y'.qs /~replace/ {_x: x0, _y: x}] -seq

## Metaclass instantiation

The metaclass constructor function (just a regular function) looks at the tree you hand it and builds a metaclass instance based on that.

    -where [metaclass(name, tree) = tree.is_join()                                                   ? name /-sequence_metaclass/ tree
                                  : tree.is_disjunction()                                            ? name /-alternative_metaclass/ tree
                                  : tree.is_forgetful()                                              ? erased_variant_metaclass(name, metaclass(sub, tree[0]) -then- sub)
                                                                                                       -where [sub = name /!$.gensym]
                                  : tree.is_group()                                                  ? name /-metaclass/ tree[0]
                                  : tree.is_character_class() || tree.is_atom() && tree.data === '.' ? name /-trivially_variant_metaclass/ tree
                                  : tree.is_repetition()                                             ? name /-repetition_metaclass/ tree
                                                                                                     : name /-invariant_metaclass/ tree.toString(),

## Metaclass instance generation

Metaclass instances are emitted as cross-referential functions that have two modes of operation:

    1. Direct invocation causes a parse to occur. Returns null if given a non-conforming string. An optional second argument specifies the current input position; the resulting input position
       can be read using the .end() method.
    2. Constructor invocation builds a syntax node and returns immediately. This is used internally, though it might also be useful externally.
    3. Nullary constructor invocation builds a syntax node that has no children. This is used by caterwaul's seq[] macro.

Each metaclass contains a .map() method that recursively descends through the tree. It uses a standard protocol to indicate nondestructive node replacement, stop-traversal, and continuation.
Unlike caterwaul 1.3's map() method, this one is optimized to rewrite only modified subtrees.

            metaclass_constructor(name, args)  = template /~replace/ {_name: name, _formals: formals, _formal_assignments: formal_assignments}
                   -where [template            = qse[_name(_formals) = this.constructor === _name ? _formal_assignments -then- this : _name.parse(arguments[0], arguments[1] || 0),
                                                     _name.parse     = _@parser_implementation],

                           fold_into_comma(xs) = xs /[new $.syntax(',')][x0 /~push/ x] -seq -re- it.unflatten(),
                           formals             = args /!fold_into_comma,
                           formal_assignments  = args *[/^_\d+/.test(x) ? 'this[_i] = _x'.qs /~replace/ {_i: x.substr(1), _x: x}
                                                                        : 'this._x  = _x'.qs /~replace/ {                 _x: x}] /seq /!fold_into_comma],

            metaclass_instance(n, ctor, proto) = qse[_constructor, _prototype, _name.prototype.constructor = _name]
                                                 /~replace/ {_constructor: ctor, _prototype: proto, _name: n},

## Invariant instances

These have predetermined content and length, so all that is necessary for each instance is the 'start' parameter. Serialization and mapping are both trivial. The end() method simply adds the
starting position to the precomputed length of the constant. Here, 'k' is the invariant string.

            invariant_metaclass(name, k) = metaclass_instance(name, metaclass_constructor(name, 'start_'.qw) /~replace/ {'_@parser_implementation': parser(name, k)},
                                                                    proto(k))

                 -where [proto(k)        = qse[capture [map(f, r = f(this)) = r === true || !r ? this : r,
                                                        end()               = this.start_ + _l,
                                                        length              = 0,
                                                        toString()          = _s]] /~replace/ {_s: k /!$.syntax.from_string, _l: '#{k.length}'},

                         parser(name, k) = qse[new _name(i) -when [_s === s.substr(i, _l)] -given [s, i]]
                                           /~replace/ {_name: name, _s: k /!$.syntax.from_string, _l: '#{k.length}'}],

## Erased-variant instances

These have variant content and length and therefore take two parameters. The metaclass evaluates the given parser and turns the result into a string before saving it.

            erased_variant_metaclass(name, sub) = metaclass_instance(name, metaclass_constructor(name, 'parsed_'.qw) /~replace/ {'_@parser_implementation': parser(name, p)},
                                                                           qse[capture [map(f, r = f(this)) = r === true || !r ? this : r
                                                                                        end()               = this.start_ + this.parsed_.length,
                                                                                        length              = 0,
                                                                                        toString()          = this.parsed_]])

                      -where [parser(name, sub) = qse[new _name(i, result.toString()) -when.result -where [result = _sub.parse(s, i)] -given [s, i]]
                                                  /~replace/ {_name: name, _parse: parse}],

## Trivially variant instances

These are single-component variants like character classes. The match result is stored as a string.

            trivially_variant_metaclass(name, tree) = metaclass_instance(name, metaclass_constructor(name, 'start_ match_'.qw) /~replace/ {'_@parser_implementation': parser(name, tree)},
                                                                               proto)

                            -where [proto           = qse[capture [map(f, r = f(this)) = r === true || !r ? this : r,
                                                                   end()               = this.start_ + this.match_.length,
                                                                   length              = 0,
                                                                   toString()          = this.match_]],

                                    parser(name, t) = qse[new _name(i, s.charAt(i)) -when [_r /~test/ s.charAt(i)] -given [s, i]]
                                                      /~replace/ {_name: name, _r: '/#{t}/'}],

## Repetition instances

Repetitions represent *, +, and ? in sequences. Each contains numerically indexed children along with a .length property; this allows you to iterate through the entries using the seq[]
macro. Unlike other instances, they are designed to support local mutability; this is useful when copying information from one repetition instance to another using seq[] -- though .map() is
probably a better way to do it.

Note that any copies that seq[] creates won't have start() or end() defined. This probably isn't a problem in most cases, since dynamically-constructed instances don't necessarily map back
to the original input string. You won't have this problem if you use map() instead.

            repetition_metaclass(name, tree) = metaclass_instance(name, metaclass_constructor(name, 'start_ end_ length'.qw) /~replace/ {'_@parser_implementation': parser},
                                                                        proto(tree))

                 -where [proto(t)            = qse[capture [push(x, this.length -oeq- 0) = this[this.length++] -eq- x -then- this,
                                                            pop(x = this[--this.length]) = delete this[this.length] -then- x,
                                                            map(f, r = this, t = null)   = this *![r -eq- new this.constructor(this.start_, this.end_, this.length)
                                                                                            -then- this *![r[xi] = x] /seq /when [r !== this && (t = x /~map/ f) !== x]
                                                                                            -then- r[xi] /eq.t] -seq
                                                                                           -then.r,
                                                            toString()                   = this *[x.toString()] -seq -re- it.join('')]],

                          sub                = name /!$.gensym,
                          repeated_metaclass = sub /-metaclass/ tree.repeated_child(),

                          parser             = raise [new Error('lazy matching semantics are not supported: #{tree}')] -when- tree.is_non_greedy()
                                        -then- qse[function (s, i) {var ii = i, r = new _name.constructor(i, 0, 0), x = _sub(s, i), count = 1, limit = _upper;
                                                                    while (x && ++count <= upper) r.push(x), r.end_ = x.end(), x = _sub(s, r.end_);
                                                                    if (count >= _lower) return r}]

                                               /~replace/ {_name:  name,
                                                           _sub:   sub,
                                                           _upper: '#{tree.upper_limit()}',
                                                           _lower: '#{tree.lower_limit()}'}],

## Sequence instances

Sequences destructure regular expressions piece by piece. This isn't quite as simple as the above cases for a couple of reasons. First, regular expressions don't map one-to-one against
metaclass instances. In cases like /foo|bar/, two subclasses will be created, one for each constant possibility. Second, pieces of the regular expression can have names aliased onto numeric
members. For example, /foo (bar:bif) baz/ creates a prototype method called bar() that returns this[1].

Identifying the sequence elements isn't as simple as pulling off one piece at a time. Because there are some special forms built from the other ones, we need to first test to see if we have
one. The tree is right-associative, which is ideal.

### Map function semantics

  Mapping over a sequence node is fairly straightforward. It has the following semantics:

    1. If f(node) returns false or node, node is replaced by node.map(f).
    2. If f(node) returns true, node is not replaced at all and is not descended into.
    3. If f(node) returns anything else, node is replaced immediately and the new value is not descended into.

This allows you to use map() as a non-consing iterator by continuously returning false or the receiver.

### Serialization

Any AST can be rendered back into the string that produced it using toString(). If you've modified the node, however, it will need to generate a new string since it no longer reflects its
original state. It's important for this operation to be as fast as possible, so I'm constructing an array and join()ing the pieces.

Technically this is not the fastest way to do it on V8. Because V8 uses string cons trees, it's actually a little faster to just use naive + concatenation. But this code should be
performant across browsers/platforms if possible.

          sequence_special_forms         = [/_ref@/, /_ref@_rest/, /_name:_value/, /_name:_value _rest/] *[x /-$.regexp/ {atom: 'word'}] -seq,
          sequence_metaclass(name, tree) = auxiliary_classes /values /[metaclass()]['_x; _y'.qs /~replace/ {_x: x0, _y: x}] -seq
          -where [metaclass()                       = metaclass_instance(name, metaclass_constructor(name, formals) /~replace/ {'_@parser_implementation': parser},
                                                                               proto),

                  special_form(t)                   = sequence_special_forms |[x /~match/ t] |seq,
                  unflatten(t, s = special_form(t)) = s           ? s._rest ? [s] /~concat/ unflatten(rest) : [s]
                                                    : t.is_join() ? [t[0]] /~concat/ unflatten(t[1])
                                                                  : [t],
                  auxiliary_classes                 = {},
                  auxiliary(piece)                  = auxiliary_classes[sub] -eq- metaclass(sub, piece) -then- '_name(s, ii)'.qse /~replace/ {_name: sub}
                                                      -where [sub = name /!$.gensym],

                  pieces                            = tree /!unflatten,
                  formals                           = 'start_ end_'.qw + pieces *['_#{x}'] -seq,
                  parse_invocation(piece)           = auxiliary(piece._value || piece),

                  parser                            = qse[function (s, i) {var ii = i; _steps; return _instantiation}] /~replace/ {_steps:         pieces /!steps,
                                                                                                                                   _instantiation: instantiation}
                                                      -where [steps(ps)          = ps /['null'.qs]['_x; _y' /~replace/ {_x: x0, _y: step_for(x, xi)}] -seq,

                                                              step_template      = qs[var _name = _invocation; if (!_name) return; ii = _name.end()],
                                                              step_for(piece, i) = step_template /~replace/ {_name:       '_#{i}',
                                                                                                             _invocation: '_f(s, ii)'.qs /~replace/ {_f: piece /!parse_invocation}},

                                                              instantiation      = qse[new _name(i, _end.end(), _formals)]
                                                                                   /~replace/ {_name:    name,
                                                                                               _end:     '_#{pieces.length - 1}',
                                                                                               _formals: formals.slice(2) /['_x, _y'.qs /~replace/ {_x: x0, _y: x}] -seq}],

                  proto                             = {} /nominal_bindings /-$.merge/intrinsics /!$.syntax.from_object
                                                      -where [map_qs()            = qse[function (f) {var receiver = f(this) || this; if (receiver === true) return this;
                                                                                                      _stages; return receiver}]
                                                                                    /~replace/ {_stages: pieces /!map_stages},

                                                              map_stages(ps)      = ps *[map_stage(xi)] /['_x; _y'.qs /~replace/ {_x: x0, _y: x}] -seq,
                                                              map_stage(i)        = qse[if (receiver === this && (x = this[_i].map(f)) !== receiver[_i]) {
                                                                                          receiver = new this.constructor(this.start(), this.end());
                                                                                          for (var j = 0; j < _i; ++j) receiver[j] = this[j]}
                                                                                        receiver[_i] = x]
                                                                                    /~replace/ {_i: '#{i}'},

                                                              tostring_qs()       = qse[function () {return [_pieces].join('')}] /~replace/ {_pieces: pieces /!tostring_stages},
                                                              tostring_stages(ps) = pieces *['this[_i].toString()'.qs /~replace/ {_i: '#{xi}'}]
                                                                                           /['_x, _y'.qs              /~replace/ {_x: x0, _y: x}] -seq,

                                                              intrinsics          = capture [map = map_qs(), toString = tostring_qs(), length = new $.syntax('#{pieces.length}')],
                                                              nominal_bindings    = pieces %~![[x._name, 'function () {return this[_i]}'.qs /~replace/ {_i: xi}], when[x._name]] /object -seq]],

## Alternative instances

The alternative case is an interesting one. If the regular expression represents a disjunction, then we flatten it out and construct a virtual class. This class will never be instantiated,
but it will have a .parse() static method as promised to whoever created it. That way sub-instantiation and cross-references will both work. Note that there is no prototype chaining; it
would be unnecessary because alternatives don't necessarily have anything in common.

            alternative_metaclass(name, tree) = qse[_name = capture [parse = _parser], _alternatives] /~replace/ {_name: name, _parser: parser, _alternatives: alternative_instances}
                -where [unflatten(tree)       = tree.data === '|' ? [tree[0]] /~concat/ unflatten(tree[1]) : [tree],

                        alternatives          = tree /!unflatten,
                        alternative_names     = alternatives *['#{name}_alternative' /!$.gensym] -seq,
                        alternative_instances = alternatives *[[alternative_names[xi], '/#{x}/']] /object /seq /!$.regexp_grammar,
                        parser                = qse[_names |[x.parse(s, i)] |seq, given[s, i]] /~replace/ {_names: alternative_names /!$.syntax.from_array}]]});