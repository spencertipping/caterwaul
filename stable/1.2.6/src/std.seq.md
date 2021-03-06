Sequence comprehensions | Spencer Tipping
Licensed under the terms of the MIT source code license

# Introduction

Caterwaul pre-1.0 had a module called 'seq' that provided a finite and an infinite sequence class and localized operator overloading to make them easier to use. Using wrapper classes was both
unnecessary (since most sequence operations were done inside the seq[] macro anyway) and problematic, as it required the user to remember to cast sequences back into arrays and such. It also
reduced runtime performance and created a lot of unnecessary copying.

Caterwaul 1.0 streamlines the seq[] macro by removing the sequence classes and operating directly on arrays or array-like things. Not everything in Javascript is an array, but I'm going to
pretend that everything is (or at least looks like one) and rely on the [i] and .length properties. This allows the sequence library to (1) have a very thin design, and (2) compile down to
tight loops without function calls.

# Distributive property

The seq[] modifier distributes across several operators. They are:

    1. Ternary ?:
    2. Short-circuit && and ||
    3. Parentheses

It won't cross a square-bracket or invocation boundary, however. This includes distributing over array elements and [] dereferencing. You can cause it to cross an array boundary by prefixing
the array with ~ (which should be familiar, as it is the same syntax that's used to cause function bodies to be interpreted in sequence context). For instance:

    [1, 2, 3, X] -seq             // <- X is interpreted in regular Javascript context
    ~[1, 2, 3, X] -seq            // <- X is interpreted in sequence context

# Notation

The notation is mostly a superset of the pre-1.0 sequence notation. Operators that have the same functionality as before (others are reserved for future meanings, but probably won't do what
they used to):

    *  = map                      e.g.  [1, 2, 3] *[x + 1] |seq            ->  [2, 3, 4]
    *! = each                     e.g.  [1, 2, 3] *![console.log(x)] |seq  ->  [1, 2, 3]  (and logs 1, 2, 3)
    /  = foldl                    e.g.  [1, 2, 3] /[x - next] |seq         ->  -4
    /! = foldr                    e.g.  [1, 2, 3] /![x - next] |seq        ->  2
    %  = filter                   e.g.  [1, 2, 3] %[x & 1] |seq            ->  [1, 3]
    %! = filter-not               e.g.  [1, 2, 3] %![x & 1] |seq           ->  [2]
    +  = concatenate              e.g.  [1, 2, 3] + [4, 5] |seq            ->  [1, 2, 3, 4, 5]
    |  = exists                   e.g.  [1, 2, 3] |[x === 2] |seq          ->  true
    |! = not-exists               e.g.  [1, 2, 3] |![x >= 4] |seq          ->  true

Note that ^ has higher precedence than |, so we can use it in a sequence comprehension without interfering with the |seq macro (so long as the |seq macro is placed on the right).

## Modifiers

Modifiers are unary operators that come after the primary operator. These have the same (or similar) functionality as before:

    x = rename the variable from 'x'              e.g.  [1, 2, 3] *y[y + 1] -seq             ->  [2, 3, 4]

Here, 'x' means any identifier. Caterwaul 1.0 introduces some new stuff. The map function now has a new variant, *~!. Filter also supports this variant. Like other operators, they support
variable renaming and sequence context. You can do this by putting those modifiers after the *~!; for instance, xs *~!~[exp] interprets 'exp' in sequence context. Similarly, *~!y[exp] uses
'y' rather than 'x'.

    *~! = flatmap         e.g. [1, 2, 3] *~![[x, x + 1]] |seq      ->  [1, 2, 2, 3, 3, 4]
    %~! = map/filter      e.g. [1, 2, 3] %~![x & 1 && x + 1] |seq  ->  [2, 4]
    /~! = unfold          e.g. 1 /~![x < 5 ? x + 1 : null] |seq    ->  [1, 2, 3, 4, 5]
    |~! = right-exists    e.g. [1, 2, 3] |~![x & 1] |seq           ->  3

## Variables

All of the variables from before are still available and the naming is still mostly the same. Each block has access to 'x', which is the immediate element. 'xi' is the index, and 'x0' is the
alternative element for folds. Because all sequences are finite, a new variable 'xl' is available -- this is the total number of elements in the source sequence. The renaming is done exactly
as before:

    [1, 2, 3] *[x + 1] |seq             -> [2, 3, 4]
    [1, 2, 3] *y[y + 1] |seq            -> [2, 3, 4]
    [1, 2, 3] *[xi] |seq                -> [0, 1, 2]
    [1, 2, 3] *foo[fooi] |seq           -> [0, 1, 2]

## Word operators

Some operators are designed to work with objects, just like in prior versions. However, the precedence has been changed to improve ergonomics. For example, it's uncommon to use objects as an
intermediate form because all of the sequence operators are built around arrays. Similarly, it's very common to unpack objects immediately before using them. Therefore the unpack operators
should be very high precedence and the pack operator should have very low precedence:

    {foo: 'bar'} /keys |seq             -> ['foo']
    {foo: 'bar'} /values |seq           -> ['bar']
    {foo: 'bar'} /pairs |seq            -> [['foo', 'bar']]
    {foo: 'bar'} /pairs |object |seq    -> {foo: 'bar'}
    {foo: 'bar'} /pairs |mobject |seq   -> {foo: ['bar']}

Note that unlike regular modifiers you can't use a variety of operators with each word. Each one is defined for just one form. I may change this in the future, but I'm reluctant to start
with it because it would remove a lot of syntactic flexibility.

Update: After using this in the field, I've found that the low-precedence |object form is kind of a pill. Now the sequence library supports several variants, /object, -object, and |object.
The same is true of mobject, introduced in Caterwaul 1.2.

## Prefixes

New in Caterwaul 1.0.3 is the ability to specify the scope of operation for sequence macros. For instance, you might want to operate on one of several types of data. Normally the sequence
macro assumes arrays, but you may want to modify a unary operator such as *[] to transform an object's keys or values. Prefixes let you do this.

    o %k*[x.substr(1)] -seq     (equivalent to  o /pairs *[[x[0].substr(1), x[1]]]  -object -seq)
    o %v*[x.split(/a/)] -seq    (equivalent to  o /pairs *[[x[0], x[1].split(/a/)]] -object -seq)

Prefixes are generally faster than manual unpacking and repacking. However, some operations (e.g. fold and its variants) don't work with prefixes. The reason is that it's unclear what to do
with the values that correspond to a folded key, for instance. (Imagine what this would mean: o %k/[x + x0] -seq) The following operators can be used with prefixes:

    *   = map
    *!  = each          <- returns the original object
    %   = filter        <- removes key/value pairs
    %!  = filter-not
    %~! = map-filter    <- changes some key-value pairs, removes others

These operators support the standard set of modifiers, including ~ prefixing and variable renaming. However, indexing variables such as xi and xl are unavailable because no temporary arrays
are constructed.

The following operators cannot be used with prefixes because it's difficult to imagine what purpose they would serve:

    *~! = flatmap
    /   = foldl
    /!  = foldr
    /~! = unfold

None of the binary operators (e.g. +, -, ^, etc) can be used with prefixes because of precedence. Any prefix would bind more strongly to the left operand than it would to the binary
operator, which would disrupt the syntax tree.

## Folding prefixes

New in Caterwaul 1.1 is the ability to specify fold prefixes. This allows you to specify the initial element of a fold:

    xs /[0][x0 + x*x] -seq                      (sum the squares of each element)
    xs /[[]][x0 + [x, x + 1] -seq] -seq         (equivalent to xs *~![[x, x + 1]] -seq, but a lot less efficient)

From 1.1.5 onwards, these fold prefixes can be used with other operators as well. For example:

    1 /~![xi < 10][x + 1] -seq                  (return the array [1, 2, ..., 9]: the first block conditionalizes the unfold)
    xs %~![x < 0][-x] -seq                      (return an array of the negation of all negative elements in the first)
    xs *~![xi < 10][f(x)] -seq                  (return the tenth composition of f over x)

## Function promotion

Caterwaul 1.1 also adds support for implicit function promotion of sequence block expressions:

    f(x) = x + 1
    seq in [1, 2, 3] *f
    seq in [-1, 0, 1] %f

You can use this to make method calls, which will remain bound to the original object:

    xs *foo.bar -seq            (equivalent to xs *[foo.bar(x)] -seq)
    xs *(bar + bif).baz -seq    (equivalent to xs *[(bar + bif).baz(x)] -seq)

The only restriction is that you can't use a bracketed expression as the last operator; otherwise it will be interpreted as a block. You also can't rename variables with function promotion.

## Numbers

Caterwaul 1.0 removes support for the infinite stream of naturals (fun though it was), since all sequences are now assumed to be finite and are strictly evaluated. So the only macros
available are n[] and ni[], which generate finite sequences of evenly-spaced numbers. The only difference between n[] and ni[] is that ni[] uses an inclusive upper bound, whereas n[] is
exclusive.

    n[1, 10] -seq               ->  [1, 2, 3, 4, 5, 6, 7, 8, 9]
    | ni[1, 10] -seq              ->  [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    n[10] -seq                  ->  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
    ni[10] -seq                 ->  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    n[0, 10, 2] -seq            ->  [0, 2, 4, 6, 8]
    ni[0, 10, 2] -seq           ->  [0, 2, 4, 6, 8, 10]

## Slicing

There are two reasons you might want to slice something. One is that you're legitimately taking a subsequence of the original thing; in that case, you can invoke the .slice() method
manually. The more interesting case is when you want to promote a non-array into an array. This is such a common thing to do (and has so much typing overhead) that I've dedicated a shorthand
to it:

    +xs -seq, where [xs = arguments]            -> Array.prototype.slice.call(arguments)

# Generated code

Previously the code was factored into separate methods that took callback functions. (Basically the traditional map/filter/each arrangement in functional languages.) However, now the library
optimizes the methods out of the picture. This means that now we manage all of the dataflow between the different sequence operators. I thought about allocating gensym variables -- one for
each temporary result -- but this means that the temporary results won't be garbage-collected until the entire sequence comprehension is complete. So instead it generates really gnarly code,
with each dependent sequence listed in the for-loop variable initialization.

Luckily this won't matter because, like, there aren't any bugs or anything ;)

## Type closure

Caterwaul 1.1.3 includes a modification that makes the sequence library closed over types. Suppose you've got a special collection type that you want to use instead of arrays. A sequence
operation will assume that your collection type implements .length and [i], but any maps or flat maps that you do will return new instances of your type rather than generalizing to a regular
array. For example:

    xs = new my_sequence();
    ys = xs *f -seq;
    ys.constructor === xs.constructor           // -> true

In order for this to work, your sequence classes need to implement a nullary constructor that creates an empty instance. They should also implement a variadic push() method.

Note that this is a breaking change! The fix is to prepend sequence variables with '+' (see 'Slicing' above). This breaks any code that relies on the seq library taking care of Arguments
objects by promoting them into arrays.

# Breaking changes in Caterwaul 1.2.3

I discovered that Caterwaul <= 1.2.2 had scope leakage; in particular, any occurrences of variables like _x in the sequence body would be rewritten into seq variables such as 'x', 'x0', etc.
This arose because of replacement ordering; the body was substituted first and the variable substitution happened later. I refactored the seq library internals significantly for Caterwaul
1.2.3, in the process removing two previously-supported constructs:

    xs *~[n[x]] -seq              <- no longer valid; the ~ prefix modifier is not supported
    xs *+["x".qf] -seq            <- also not valid; the + prefix modifier is not supported

# Portability

The seq library is theoretically portable to syntaxes besides JS, but you'll probably want to do some aggressive preprocessing if you do this. It assumes a lot about operator precedence and
such (from a design perspective).

    caterwaul.module('std.seq', 'js_all', function ($) {
      $.seq(caterwaul_function) = caterwaul_function -se [it.modifiers.seq = $.grammar('S', 'S[_x]'.qs, given [rule, anon] in operator_macros /~concat/ word_macros

      -where [operator_macros = [rule('S[_x]'.qs, '_x'.qs),  rule('S[_xs + _ys]'.qs, concat),

                                                             // Distributive property
                                                             rule('S[(_x)]'.qs, '(S[_x])'.qs),  rule('S[_x[_y]]'.qs, 'S[_x][_y]'.qs),     rule('S[_xs(_ys)]'.qs, 'S[_xs](_ys)'.qs),
                                                             rule('S[[_x]]'.qs, '[_x]'.qs),     rule('S[_x, _y]'.qs, 'S[_x], S[_y]'.qs),  rule('S[_xs._p]'.qs,   'S[_xs]._p'.qs),

                                                             rule('S[~[_x]]'.qs,     '[S[_x]]'.qs),                // ~ modifier on arrays
                                                             rule('S[~_xs(_ys)]'.qs, 'S[_xs](S[_ys])'.qs),         // ~ modifier on function calls

                                                             rule('S[_x ? _y : _z]'.qs, '(S[_x]) ? (S[_y]) : (S[_z])'.qs),  rule('S[_x && _y]'.qs, '(S[_x]) && (S[_y])'.qs),
                                                                                                                            rule('S[_x || _y]'.qs, '(S[_x]) || (S[_y])'.qs),
                                                             // Unary seq operators
                                                             rule('S[+_xs]'.qs, 'Array.prototype.slice.call((S[_xs]))'.qs),

                                                             rule('S[_xs %_thing]'.qs,   filter_forms),   rule('S[_xs *_thing]'.qs,   map_forms),
                                                             rule('S[_xs /_thing]'.qs,   fold_forms),     rule('S[_xs |_thing]'.qs,   exists_forms),

                                                             rule('S[_xs %k*_thing]'.qs, kmap_forms),     rule('S[_xs %v*_thing]'.qs, vmap_forms),
                                                             rule('S[_xs %k%_thing]'.qs, kfilter_forms),  rule('S[_xs %v%_thing]'.qs, vfilter_forms)]

                        -where [// High-level form specializations
                                operator_case(forms)(match)        = parse_modifiers(match._thing, use(forms.normal, forms.inormal), use(forms.bang, forms.ibang), use(forms.tbang, forms.itbang))
                                                                     -where [use(form, iform)(body) = render_form(match._xs, body, form, iform)],

                                map_forms                          = operator_case({normal: map,     bang: each,        tbang: flatmap,                                    itbang: iterate}),
                                filter_forms                       = operator_case({normal: filter,  bang: filter_not,  tbang: map_filter,                                 itbang: imap_filter}),
                                fold_forms                         = operator_case({normal: foldl,   bang: foldr,       tbang: unfold,     inormal: ifoldl, ibang: ifoldr, itbang: iunfold}),

                                kmap_forms                         = operator_case({normal: kmap,    bang: keach}),
                                kfilter_forms                      = operator_case({normal: kfilter, bang: kfilter_not, tbang: kmap_filter}),
                                vmap_forms                         = operator_case({normal: vmap,    bang: veach}),
                                vfilter_forms                      = operator_case({normal: vfilter, bang: vfilter_not, tbang: vmap_filter}),

                                exists_forms                       = operator_case({normal: exists,  bang: not_exists,  tbang: r_exists}),

                                parse_modifiers(tree, n, b, tb)    = ((r = '~!_x'.qs.match(tree)) ? tb(r._x) : (r = '!_x'.qs.match(tree)) ? b(r._x) : n(tree)) -where [r = null],

                                render_form(xs, body, form, iform) = ((r = '_var@0[_init][_x]'.qs.match(body) || '[_init][_x]'.qs.match(body)) ? use(iform, r) :
                                                                      (r =        '_var@0[_x]'.qs.match(body) ||        '[_x]'.qs.match(body)) ? use(form,  r) : promote(form, body))

                                                -where [r                = null,
                                                        use(f, match)    = f.replace({_f: match._x, _init: match._init, _s: xs} /-$.merge/ names_for(match._var)),
                                                        promote(f, body) = f /~replace/ {_f: (f.uses_x0 ? '_f(_x,_x0)'.qs : '_f(_x)'.qs).replace({_f: body} /-$.merge/ gensym_names), _s: xs}
                                                                             /~replace/ gensym_names],

                                names_for(p)                       = p ? {_x:  p , _x0: '#{p}0', _xi: '#{p}i', _xl: '#{p}l', _xs: '#{p}s', _xr: '#{p}r'}
                                                                       : {_x: 'x', _x0:    'x0', _xi:    'xi', _xl:    'xl', _xs:    'xs', _xr:    'xr'},

                                // It's ok to use -seq inside the seq library due to waul precompilation
                                gensym_names                       = names_for(null) %v*$.gensym -seq]

                        -where [// Setup for form definitions (see below)
                                loop_anon   = $.anonymizer('x', 'y', 'i', 'j', 'l', 'lj', 'r', 'o', 'k'),
                                scope       = anon('(function (_xs) {var _x, _x0, _xi, _xl, _xr; _body}).call(this, S[_s])'.qs),
                                scoped(t)   = scope /~replace/ {_body: t},

                                form(x)     = x /!anon /!scoped /!loop_anon -se [it.uses_x0 = /_x0\s*=/.test(x.toString())],

      // Form definitions
      map         = form('for (var _xr = new _xs.constructor(), _xi = 0, _xl = _xs.length; _xi < _xl; ++_xi) _x = _xs[_xi], _xr.push((_f));                                        return _xr'.qs),
      each        = form('for (var                              _xi = 0, _xl = _xs.length; _xi < _xl; ++_xi) _x = _xs[_xi], (_f);                                                  return _xs'.qs),
      flatmap     = form('for (var _xr = new _xs.constructor(), _xi = 0, _xl = _xs.length; _xi < _xl; ++_xi) _x = _xs[_xi], _xr.push.apply(_xr, Array.prototype.slice.call((_f))); return _xr'.qs),

      iterate     = form('for (var _x = _xs, _xi = 0, _x0, _xl; _x0 = (_init); ++_xi) _x = (_f); return _x'.qs),

      filter      = form('for (var _xr = new _xs.constructor(), _xi = 0, _xl = _xs.length;     _xi < _xl; ++_xi) _x = _xs[_xi], (_f) && _xr.push(_x);        return _xr'.qs),
      filter_not  = form('for (var _xr = new _xs.constructor(), _xi = 0, _xl = _xs.length;     _xi < _xl; ++_xi) _x = _xs[_xi], (_f) || _xr.push(_x);        return _xr'.qs),
      map_filter  = form('for (var _xr = new _xs.constructor(), _xi = 0, _xl = _xs.length, _y; _xi < _xl; ++_xi) _x = _xs[_xi], (_y = (_f)) && _xr.push(_y); return _xr'.qs),

      imap_filter = form('for (var _xr = new _xs.constructor(), _xi = 0, _xl = _xs.length, _x0; _xi < _xl; ++_xi) _x = _xs[_xi], (_x0 = (_init)) && _xr.push(_f); return _xr'.qs),

      foldl       = form('for (var _x0 = _xs[0], _xi = 1, _xl = _xs.length;            _xi < _xl; ++_xi) _x = _xs[_xi], _x0 = (_f); return _x0'.qs),
      foldr       = form('for (var _xl = _xs.length, _xi = _xl - 2, _x0 = _xs[_xl - 1]; _xi >= 0; --_xi) _x = _xs[_xi], _x0 = (_f); return _x0'.qs),
      unfold      = form('for (var _xr = [], _x = _xs, _xi = 0;                      _x !== null; ++_xi) _xr.push(_x), _x = (_f);   return _xr'.qs),

      ifoldl      = form('for (var _x0 = (_init), _xi = 0, _xl = _xs.length;      _xi < _xl; ++_xi) _x = _xs[_xi], _x0 = (_f);      return _x0'.qs),
      ifoldr      = form('for (var _xl = _xs.length - 1, _xi = _xl, _x0 = (_init); _xi >= 0; --_xi) _x = _xs[_xi], _x0 = (_f);      return _x0'.qs),
      iunfold     = form('for (var _xr = [], _x = _xs, _xi = 0, _x0;          _x0 = (_init); ++_xi) _xr.push(_x), _x = (_f);        return _xr'.qs),

      exists      = form('for (var _x = _xs[0], _xi = 0, _xl = _xs.length, x; _xi < _xl; ++_xi) {_x = _xs[_xi]; if (x = (_f)) return x} return false'.qs),
      not_exists  = form('for (var _x = _xs[0], _xi = 0, _xl = _xs.length, x; _xi < _xl; ++_xi) {_x = _xs[_xi]; if (x = (_f)) return false} return true'.qs),
      r_exists    = form('for (var _xl = _xs.length, _xi = _xl - 1, _x = _xs[_xi], x; _xi >= 0; --_xi) {_x = _xs[_xi]; if (x = (_f)) return x} return false'.qs),

      concat      = anon('(S[_xs]).concat((S[_ys]))'.qs),

      kmap        = form('var _xr = new _xs.constructor(); for (var _x in _xs) if (Object.prototype.hasOwnProperty.call(_xs, _x)) _xr[_f] = _xs[_x]; return _xr'.qs),
      keach       = form('                                 for (var _x in _xs) if (Object.prototype.hasOwnProperty.call(_xs, _x)) _f;                return _xs'.qs),

      kfilter     = form('var _xr = new _xs.constructor();    for (var _x in _xs) if (Object.prototype.hasOwnProperty.call(_xs, _x) &&      (_f))  _xr[_x] = _xs[_x]; return _xr'.qs),
      kfilter_not = form('var _xr = new _xs.constructor();    for (var _x in _xs) if (Object.prototype.hasOwnProperty.call(_xs, _x) &&    ! (_f))  _xr[_x] = _xs[_x]; return _xr'.qs),
      kmap_filter = form('var _xr = new _xs.constructor(), x; for (var _x in _xs) if (Object.prototype.hasOwnProperty.call(_xs, _x) && (x = (_f))) _xr[x]  = _xs[_x]; return _xr'.qs),

      vmap        = form('var _xr = new _xs.constructor();    for (var  k in _xs) if (Object.prototype.hasOwnProperty.call(_xs, k)) _x = _xs[k], _xr[k] = (_f); return _xr'.qs),
      veach       = form('                                    for (var  k in _xs) if (Object.prototype.hasOwnProperty.call(_xs, k)) _x = _xs[k], _f;            return _xs'.qs),

      vfilter     = form('var _xr = new _xs.constructor();    for (var  k in _xs) if (Object.prototype.hasOwnProperty.call(_xs, k)) _x = _xs[k],        (_f) && (_xr[k] = _x); return _xr'.qs),
      vfilter_not = form('var _xr = new _xs.constructor();    for (var  k in _xs) if (Object.prototype.hasOwnProperty.call(_xs, k)) _x = _xs[k],        (_f) || (_xr[k] = _x); return _xr'.qs),
      vmap_filter = form('var _xr = new _xs.constructor(), x; for (var  k in _xs) if (Object.prototype.hasOwnProperty.call(_xs, k)) _x = _xs[k], x = (_f), x && (_xr[k] =  x); return _xr'.qs)],

              word_macros     = [rule('S[n[_u]]'.qs,            n),  rule('S[ni[_u]]'.qs,            ni),
                                 rule('S[n[_l, _u]]'.qs,        n),  rule('S[ni[_l, _u]]'.qs,        ni),
                                 rule('S[n[_l, _u, _step]]'.qs, n),  rule('S[ni[_l, _u, _step]]'.qs, ni),

                                 rule('S[_o /keys]'.qs,   keys),    rule('S[_o |object]'.qs, object),  rule('S[_o /mobject]'.qs, mobject),
                                 rule('S[_o /values]'.qs, values),  rule('S[_o -object]'.qs, object),  rule('S[_o -mobject]'.qs, mobject),
                                 rule('S[_o /pairs]'.qs,  pairs),   rule('S[_o /object]'.qs, object),  rule('S[_o |mobject]'.qs, mobject)]

                        -where [n(match)   = n_pattern .replace({_l: '0', _step: '1'} /-$.merge/ match),
                                ni(match)  = ni_pattern.replace({_l: '0', _step: '1'} /-$.merge/ match),

                                scope      = anon('(function (o) {_body}).call(this, (S[_o]))'.qs),
                                scoped(t)  = scope.replace({_body: t}),
                                form(p)    = "tree.replace(_)".qf -where [tree = scoped(anon(p))],

      n_pattern  = anon('(function (i, u, s) {if ((u - i) * s <= 0) return []; for (var r = [], d = u - i; d > 0 ? i <  u : i >  u; i += s) r.push(i); return r})((_l), (_u), (_step))'.qs),
      ni_pattern = anon('(function (i, u, s) {if ((u - i) * s < 0 || !s) return []; for (var r = [], d = u - i; d > 0 ? i <= u : i >= u; i += s) r.push(i); return r})((_l), (_u), (_step))'.qs),

      keys       = form('var ks = []; for (var k in o) Object.prototype.hasOwnProperty.call(o, k) && ks.push(k); return ks'.qs),
      values     = form('var vs = []; for (var k in o) Object.prototype.hasOwnProperty.call(o, k) && vs.push(o[k]); return vs'.qs),
      pairs      = form('var ps = []; for (var k in o) Object.prototype.hasOwnProperty.call(o, k) && ps.push([k, o[k]]); return ps'.qs),

      object     = form('for (var r = {}, i = 0, l = o.length, x; i < l; ++i) x = o[i], r[x[0]] = x[1]; return r'.qs),
      mobject    = form('for (var r = {}, i = 0, l = o.length, x; i < l; ++i) x = o[i], (r[x[0]] || (r[x[0]] = [])).push(x[1]); return r'.qs)]])]});