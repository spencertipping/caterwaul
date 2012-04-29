Regular expression grammar compiler | Spencer Tipping
Licensed under the terms of the MIT source code license

# Introduction

This module compiles regular expression grammars into polymorphic cons cells with associated parsing and serialization methods. Most regular expression syntax is supported and maps
transparently to Javascript data structures. Here is the mapping:

    1. Repetition is encoded in array form: x* maps to [x1, x2, ...], where x1, x2, etc are match data. Note that a native array is not used.
    2. Alternation is encoded using polymorphic conses. That is, each alternative is a new class.
    3. Optional values are encoded verbatim or with null if there is no match.
    4. Sub-matches are encoded directly.

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
    2. Sequence: contains start/end data along with numerically-indexed sub-pieces that are optionally aliased onto named methods. Length is shared through the prototype.
    3. Primitive: contains start/end data but no structure. You get this when you don't use cross-references or nominal bindings within an alternative branch.
    4. Repetition: contians start/end data and numerically-indexed sub-pieces, along with an instance-specific length property.

You can think of these classes as being variations of atoms and conses, where conses have arbitrarily high arity (but are not variadic, except for repetition). The data contained within an
atom is accessible via the .data() method. Conses don't have this method predefined, but you can use nominal binding to create it.

## Notation

Most regular expression constructs follow normal notational conventions. There are three significant exceptions:

    1. Regexps are parsed in terms of words, not characters. This is a big deal and is too involved to explain fully here (see source docs in caterwaul-regexp.waul).
    2. You can refer to other parse stages using a cross-reference, which is written as '@reference'.
    3. You can name a piece of a regexp using a nominal binding, which is written as 'name:thing'. The : binds the thing directly to its right. (You can bind multiple things using ().)

Nominal bindings turn into additional methods that refer to numerically-bound properties.

# Implementation

Classes are emitted as uncompiled syntax trees rather than closures. This allows you to emit the output from this function as a runnable Javascript program. Each input can have custom methods
that get compiled into its prototype. You can access this functionality by attaching additional methods to each regexp:

    $.regexp_grammar(capture [add = $.merge(/lhs:(\d+) op:\+ rhs:(\d+)/, capture [eval() = this.lhs() + this.rhs()])])

Methods that you bind this way can't be closures, since they'll be destructured into syntax trees. They can contain expression refs, however, if you call .late_bound_tree on the result of
$.regexp_grammar().

      $.regexp_grammar(rules, common_methods) = '(function () {_definitions; return _result})'.qs /~replace/ {_definitions: definition_body(), _result: return_object()}

      -where [definition_body()           = (common_method_definitions() + metaclass_definitions() + prototype_extensions()) /['_x; _y'.qs /~replace/ {_x: x0, _y: x}] -seq,

              rule_pairs                  = rules /pairs -seq,
              metaclass_definitions()     = rule_pairs *[x[0] /-metaclass/ $.regexp(x[1], {atom: 'word'})] -seq,
              prototype_extensions()      = rule_pairs *~![x[0] /-prototype_extension/ x[1]] -seq,

              common_method_prefix        = 'common_method' /!$.gensym,
              common_method_definitions() = common_methods /pairs *['var _name = _v'.qs /~replace/ {_name: '#{common_method_prefix}#{x[0]}', _v: new $.opaque_tree(x[1])}] -seq,

              return_object()             = rules /keys *[[x, new $.syntax(x)]] /object /seq /!$.syntax.from_object,

## Prototype extensions

This is just a series of side-effectful assignments into the constructor function prototypes. These are rendered after all of the constructors are defined.

            prototype_extension(name, regexp) = regexp /pairs *['_name.prototype._k = _v'.qs /~replace/ {_name: name, _k: x[0], _v: new $.opaque_tree(x[1])}] -seq,

            common_method_tree(name)          = common_methods ? common_methods /keys *['_name.prototype._k = _ref'.qs /~replace/ {_name: name, _k: x, _ref: '#{common_method_prefix}#{x}'}]
                                                                                      /['_x, _y'.qs                    /~replace/ {_x: x0, _y: x}] -seq
                                                               : new $.syntax('null /* no common methods for #{name} */'),

## Metaclass instantiation

The metaclass constructor function (just a regular function) looks at the tree you hand it and builds a metaclass instance based on that.

            metaclass(name, tree) = tree /!is_primitive                                              ? name /-primitive_metaclass/         tree
                                  : inline_ref_form /~match/ tree -re [it && !it._ref.length]        ? name /-alias_metaclass/             tree[1].data
                                  : tree.is_group()                                                  ? name /-metaclass/                   tree[0]
                                  : tree.is_disjunction()                                            ? name /-alternative_metaclass/       tree
                                  : tree.is_repetition()                                             ? name /-repetition_metaclass/        tree
                                  : tree.is_join()                                                   ? name /-sequence_metaclass/          tree
                                  : tree.is_character_class() || tree.is_atom() && tree.data === '.' ? name /-trivially_variant_metaclass/ tree
                                                                                                     : name /-invariant_metaclass/         tree.toString(),
            inline_ref_form       = $.regexp(/@_ref/, {atom: 'word'}),
            special_forms         = [/@_ref _rest/, /@_ref/, /_name:@_ref _rest/, /_name:@_ref/, /_name:_value _rest/, /_name:_value/] *[x /-$.regexp/ {atom: 'word'}] -seq,
            is_primitive(tree)    = special_forms |![x /~match/ tree] |seq |and[tree.is_join()        ? tree[0] /!is_primitive -and- tree[1] /!is_primitive
                                                                              : tree.is_disjunction() ? tree[0] /!is_primitive -and- tree[1] /!is_primitive
                                                                              : tree.is_repetition()  ? tree.repeated_child() /!is_primitive
                                                                              : tree.is_group()       ? tree[0] /!is_primitive
                                                                                                      : true],

## Metaclass instance generation

Metaclass instances are emitted as cross-referential functions that have two modes of operation:

    1. Direct invocation causes a parse to occur. Returns null if given a non-conforming string. An optional second argument specifies the current input position; the resulting input position
       can be read using the .end() method.
    2. Constructor invocation builds a syntax node and returns immediately. This is used internally, though it might also be useful externally.
    3. Nullary constructor invocation builds a syntax node that has no children. This is used by caterwaul's seq[] macro.

            metaclass_instance(n, ctor, proto) = qse[_constructor; _name.prototype = _prototype; _name.original_name = _string_name; _name.prototype.constructor = _name; _common_methods]
                                                 /~replace/ {_constructor: ctor, _prototype: proto, _name: n, _string_name: n /!$.syntax.from_string, _common_methods: n /!common_method_tree},

            metaclass_constructor(name, args)  = template /~replace/ {_name: name, _formals: formals, _formal_assignments: formal_assignments}
                   -where [template            = qse[var _name(_formals) = this.constructor === _name ? _formal_assignments -then- this : _name.parse(arguments[0], arguments[1] || 0);
                                                     _name.parse         = _parser_implementation],

                           fold_into_comma(xs) = xs /['_x, _y'.qs /~replace/ {_x: x0, _y: x}] -seq,
                           formals             = args /!fold_into_comma,
                           formal_assignments  = args *[/^_\d+/.test(x) ? 'this[_i] = _x'.qs /~replace/ {_i: x.substr(1), _x: x}
                                                                        : 'this._x  = _x'.qs /~replace/ {                 _x: x}] /seq /!fold_into_comma],

## Alias instances

This is really simple. Sometimes someone will have requested a metaclass with a given name, but in practice it already exists. We can simply write an equivalence for cases like these. The
only thing we need to do is allow for the fact that the target may not yet be defined. This can be done using a forward definition.

            alias_metaclass(name, target) = qse[var _name() = _target.apply(this, arguments); _name.parse() = _target.parse.apply(this, arguments)] /~replace/ {_name: name, _target: target},

## Primitive instances

These just map to a range within the original string, but they don't actually parse things. The idea is to not cons up tons of memory for simple sequences of unlabeled things, and to enable
you to use repetition on a group. The following constructs are supported:

    1. Greedy repetition operators and optional quantification (lazy ones aren't supported by this library at all).
    2. Alternation.
    3. Sequential joining.
    4. Vanilla match groups, though groups have no memory and don't create backreferences. They just exist for precedence.
    5. Character classes.
    6. End-of-string marker ($).

These instances behave like constant strings in that they have no children. They also hold onto references to the original input string, potentially causing a GC problem (but it uses less
memory in the common case). You can get to the string data using the data() method.

            primitive_metaclass(name, tree) = wrapper() /~replace/ {_body: tree /-compile/ 'ii'}

                      -where [wrapper()     = metaclass_instance(name, metaclass_constructor(name, 'input_ start_ end_'.qw) /~replace/ {_parser_implementation: parser()},
                                                                       proto()),

                              parser()      = qse[function (s, i) {var ii = i; _body; if (ii > -1) return new _name(s, i, ii)}] /~replace/ {_name: name},
                              proto()       = qse[capture [start()    = this.start_,
                                                           end()      = this.end_,
                                                           length     = 0,
                                                           toString() = this.input_.substring(this.start_, this.end_),
                                                           data()     = this.toString()]],

                              use_regexp(t) = t.is_character_class() || t.is_single_escape() || t.data === '.' && t.length === 0,
                              marks_end(t)  = t.is_zero_width() && t.data === '$',

                              compile(t, i) = 'if (_i > -1) {_form}'.qs /~replace/ {_i: i, _form: form(t, i)},
                              form(t, i)    = t.is_join()        ? '_x; _y'.qs                                     /~replace/ {_x: t[0] /-compile/ i, _y: t[1] /-compile/ i}
                                            : t /!use_regexp     ? 'if (!_c.test(s.charAt(_i++))) _i = -1'.qs      /~replace/ {_i: i, _c: '/#{t}/'}
                                            : t.is_group()       ? t[0] /-compile/ i
                                            : t /!marks_end      ? 'if (_i < s.length) _i = -1'.qs                 /~replace/ {_i: i}

                                            : t.is_disjunction() ? 'var _ni=_i;_t1;if(_ni>-1)_i=_ni; else{_t2}'.qs /~replace/ {_ni: ni, _i: i, _t1: compile(t[0], ni), _t2: compile(t[1], i)}
                                                                                                                   /where     [ni = $.gensym()]
                                            : t.is_repetition()  ? qse[var _ni = _i, _count = 0; _each;
                                                                                                 while (_ni > -1 && ++_count <= _upper) {_i = _ni; _each}
                                                                                                 if (_count < _lower) _i = -1]
                                                                   /~replace/ {_i:    i,                                _count:  $.gensym(),
                                                                               _ni:   ni,                               _upper: '#{t.upper_limit()}',
                                                                               _each: compile(t.repeated_child(), ni),  _lower: '#{t.lower_limit()}'} /where [ni = $.gensym()]

                                                                 : 'if (s.substring(_i, _i+=_l) !== _s) _i=-1'.qs  /~replace/ {_i: i, _s: t.data /!$.syntax.from_string, _l: '#{t.data.length}'}],

## Invariant instances

These have predetermined content and length, so all that is necessary for each instance is the 'start' parameter. Serialization is trivial. The end() method simply adds the starting position
to the precomputed length of the constant. Here, 'k' is the invariant string.

            invariant_metaclass(name, k) = metaclass_instance(name, metaclass_constructor(name, 'start_'.qw) /~replace/ {_parser_implementation: parser(name, k)},
                                                                    proto(k))

                 -where [parser(name, k) = qse[new _name(i) -when [_s === s.substr(i, _l)] -given [s, i]]
                                           /~replace/ {_name: name, _s: k /!$.syntax.from_string, _l: '#{k.length}'},

                         proto(k)        = qse[capture [start()    = this.start_,
                                                        end()      = this.start_ + _l,
                                                        length     = 0,
                                                        toString() = _s]] /~replace/ {_s: k /!$.syntax.from_string, _l: '#{k.length}'}],

## Trivially variant instances

These are single-component variants like character classes. The match result is stored as a string, accessible via .toString() and .data().

            trivially_variant_metaclass(name, tree) = metaclass_instance(name, metaclass_constructor(name, 'start_ match_'.qw) /~replace/ {_parser_implementation: parser(name, tree)},
                                                                               proto)

                            -where [parser(name, t) = qse[new _name(i, s.charAt(i)) -when [_r /~test/ s.charAt(i)] -given [s, i]]
                                                      /~replace/ {_name: name, _r: '/#{t}/'},

                                    proto           = qse[capture [start()    = this.start_,
                                                                   end()      = this.start_ + this.match_.length,
                                                                   length     = 0,
                                                                   toString() = this.match_,
                                                                   data()     = this.match_]]],

## Repetition instances

Repetitions represent *, +, and ? in sequences. Each contains numerically indexed children along with a .length property; this allows you to iterate through the entries using the seq[]
macro. Unlike other instances, they are designed to support local mutability; this is useful when copying information from one repetition instance to another using seq[] -- though structured
mapping is probably a better way to do it.

Note that any copies that seq[] creates won't have start() or end() defined. This probably isn't a problem in most cases, since dynamically-constructed instances don't necessarily map back
to the original input string.

            repetition_metaclass(name, tree) = '_init; _repeated'.qs /~replace/ {_init: this_metaclass(), _repeated: repeated_metaclass}

                 -where [this_metaclass()    = metaclass_instance(name, metaclass_constructor(name, 'start_ end_ length'.qw) /~replace/ {_parser_implementation: parser},
                                                                        proto(tree)),
                          sub                = $.gensym(),
                          repeated_metaclass = sub /-metaclass/ tree.repeated_child(),

                          parser             = raise [new Error('lazy matching semantics are not supported: #{tree}')] -when- tree.is_non_greedy()
                                        -then- qse[function (s, i) {var ii = i, r = new _name(i, 0, 0), x = _sub(s, i), count = 1;
                                                                    while (x && ++count <= _upper) r.push(x), r.end_ = x.end(), x = _sub(s, r.end_);
                                                                    if (count >= _lower) return r}]

                                               /~replace/ {_name: name,  _upper: '#{tree.upper_limit()}',
                                                           _sub:  sub,   _lower: '#{tree.lower_limit()}'},

                          proto(t)           = qse[capture [start()                      = this.start_,
                                                            end()                        = this.end_,
                                                            push(x, this.length -oeq- 0) = this[this.length++] -eq- x -then- this,
                                                            pop(x = this[--this.length]) = delete this[this.length] -then- x,
                                                            toString()                   = +this /seq /~join/ '']]],

## Sequence instances

Sequences destructure regular expressions piece by piece. This isn't quite as simple as the above cases for a couple of reasons. First, regular expressions don't map one-to-one against
metaclass instances. In cases like /foo|bar/, two subclasses will be created, one for each constant possibility. Second, pieces of the regular expression can have names aliased onto numeric
members. For example, /foo (bar:bif) baz/ creates a prototype method called bar() that returns this[1].

Identifying the sequence elements isn't as simple as pulling off one piece at a time. Because there are some special forms built from the other ones, we need to first test to see if we have
one. The tree is right-associative, which is ideal.

### Serialization

  Any AST can be rendered back into the string that produced it using toString(). If you've modified the node, however, it will need to generate a new string since it no longer reflects its
  original state. It's important for this operation to be as fast as possible, so I'm constructing an array and join()ing the pieces.

Technically this is not the fastest way to do it on V8. Because V8 uses string cons trees, it's actually a little faster to just use naive + concatenation. But this code should be
performant across browsers/platforms if possible.

          sequence_metaclass(name, tree) = auxiliary_classes /values /[base_metaclass()]['_x; _y'.qs /~replace/ {_x: x0, _y: x}] -seq
          -where [base_metaclass()                  = metaclass_instance(name, metaclass_constructor(name, formals) /~replace/ {_parser_implementation: parser},
                                                                               proto),

                  handle_binding_case(s)            = s._name ? r.binding_name -eq- s._name.data -then- r -where [r = s._value || s]
                                                              : s,

                  special_form(t)                   = special_forms |[x /~match/ t] |seq,
                  unflatten(t, s = special_form(t)) = s           ? [s /!handle_binding_case].concat(s._rest ? unflatten(s._rest) : [])
                                                    : t.is_join() ? [t[0]] /~concat/ unflatten(t[1])
                                                                  : [t],
                  auxiliary_classes                 = {},
                  auxiliary(piece)                  = piece._ref ? piece._ref.data
                                                                 : auxiliary_classes[sub] -eq- metaclass(sub, piece) -then- sub -where [sub = $.gensym()],

                  pieces                            = tree /!unflatten,
                  formals                           = 'start_ end_'.qw + pieces *['_#{xi}'] -seq,

                  parser                            = qse[function (s, i) {var ii = i; _steps; return _instantiation}] /~replace/ {_steps:         pieces /!steps,
                                                                                                                                   _instantiation: instantiation}
                                                      -where [steps(ps)          = ps *[step_for(x, xi)] /['_x; _y'.qs /~replace/ {_x: x0, _y: x}] -seq,

                                                              step_template      = qs[var _name = _invocation; if (!_name) return; ii = _name.end()],
                                                              step_for(piece, i) = step_template /~replace/ {_name:       '_#{i}',
                                                                                                             _invocation: '_f(s, ii)'.qs /~replace/ {_f: piece /!auxiliary}},

                                                              instantiation      = qse[new _name(i, _end.end(), _formals)]
                                                                                   /~replace/ {_name:    name,
                                                                                               _end:     '_#{pieces.length - 1}',
                                                                                               _formals: formals.slice(2) /['_x, _y'.qs /~replace/ {_x: x0, _y: x}] -seq}],

                  proto                             = {} /nominal_bindings /-$.merge/intrinsics /!$.syntax.from_object
                                                      -where [tostring_qs()       = qse[function () {return [_pieces].join('')}] /~replace/ {_pieces: pieces /!tostring_stages},
                                                              tostring_stages(ps) = pieces *['this[_i].toString()'.qs /~replace/ {_i: '#{xi}'}]
                                                                                           /['_x, _y'.qs              /~replace/ {_x: x0, _y: x}] -seq,

                                                              intrinsics          = capture [toString = tostring_qs(),
                                                                                             start    = qse[this.start_, given[]],
                                                                                             end      = qse[this.end_,   given[]],
                                                                                             length   = new $.syntax('#{pieces.length}')],
                                                              nominal_bindings    = pieces %~![[x.binding_name, 'this[_i], given[]'.qse /~replace/ {_i: '#{xi}'}], when[x.binding_name]]
                                                                                           /object -seq]],

## Alternative instances

The alternative case is an interesting one. If the regular expression represents a disjunction, then we flatten it out and construct a virtual class. This class will never be instantiated,
but it will have a .parse() static method as promised to whoever created it. That way sub-instantiation and cross-references will both work. Note that there is no prototype chaining; it
would be unnecessary because alternatives don't necessarily have anything in common.

            alternative_metaclass(name, tree) = qse[var _name(s, i) = _name.parse(s, i); _name.parse = _parser; _alternatives]
                                                /~replace/ {_name: name, _parser: parser, _alternatives: alternative_instances}

                -where [unflatten(tree)       = tree.is_disjunction() ? [tree[0]] /~concat/ unflatten(tree[1]) : [tree],

                        alternatives          = tree /!unflatten,
                        alternative_names     = alternatives *[$.gensym()] -seq,
                        alternative_instances = alternatives *[alternative_names[xi] /-metaclass/ x] /['_x; _y'.qs /~replace/ {_x: x0, _y: x}] -seq,
                        parser                = qse[_disjunction, given[s, i]]
                                                /~replace/ {_disjunction: alternative_names *['_f(s, i)'.qs /~replace/ {_f: x}]
                                                                                            /['_x || _y'.qs /~replace/ {_x: x0, _y: x}] -seq}]]});