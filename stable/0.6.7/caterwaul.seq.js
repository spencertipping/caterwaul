// Caterwaul JS sequence library | Spencer Tipping
// Licensed under the terms of the MIT source code license

// Introduction.
// Javascript's looping facilities are side-effectful and more importantly operate in statement-mode rather than expression-mode. This sequence library moves finite and anamorphic looping into
// expression-mode using both methods and macros. Macros are used sparingly here; they provide comprehensions, but are ultimately just shorthands for sequence methods. All sequences ultimately
// inherit from Array, which may or may not work as desired.

  caterwaul.tconfiguration('std', 'seq.core', function () {this.shallow('seq', {core: fn_[null] /se[_.prototype = [] /se.p[p.constructor = _]]})}).

// There are two kinds of sequences represented here. One is a finite sequence, which is eager and acts like a Javascript array (though it has a different prototype). The other is an infinite
// stream; this is an anamorphism that generates new elements from previous ones. Because Javascript isn't required to optimize tail calls, any recursion done by the sequence library is coded in
// CPS using the continuation library.

// Finite sequence API.
// Finite sequences are assumed to have numbered elements and a 'length' field, just like a Javascript array or jQuery object. Any mapping, filtering, or folding on these sequences is done
// eagerly (put differently, most sequence/stream operations are closed under eagerness). There's a core prototype for finite sequences that contains eager implementations of each(), map(),
// filter(), foldl(), foldr(), zip(), etc.

// Note that because of an IE7 bug, all lengths are stored twice. Once in 'l' and once in 'length' -- the 'length' property is only updated for array compatibility on compliant platforms, but it
// will always be 0 on IE7.

  tconfiguration('std opt', 'seq.finite.core', function () {
    this.configure('seq.core').seq.finite = fc[xs][this.length = this.l = xs ? opt.unroll[i, xs.size ? xs.size() : xs.length][this[i] = xs[i]] : 0] /se.c[c.prototype = new this.seq.core() /se[
      _.size() = this.l || this.length, _.slice() = [] /se[opt.unroll[i, this.size()][_.push(this[i])]], _.constructor = c]]}).

  tconfiguration('std', 'seq.finite.serialization', function () {
    this.configure('seq.finite.core').seq.finite.prototype /se[_.toString() = 'seq[#{this.slice().join(", ")}]', _.join(x) = this.slice().join(x)]}).

//   Mutability.
//   Sequences can be modified in-place. Depending on how Javascript optimizes this case it may be much faster than reallocating. Note that the methods here are not quite the same as the regular
//   Javascript array methods. In particular, push() returns the sequence rather than its new length. Also, there is no shift()/unshift() API. These would each be linear-time given that we're
//   using hard indexes. concat() behaves as it does for arrays; it allocates a new sequence rather than modifying either of its arguments.

    tconfiguration('std opt', 'seq.finite.mutability', function () {
      l[push = Array.prototype.push, slice = Array.prototype.slice] in
      this.configure('seq.finite.core').seq.finite.prototype /se[_.push()     = l[as = arguments] in opt.unroll[i, as.length][this[this.l++] = as[i]] /re[this.length = this.l, this],
                                                                 _.pop()      = this[--this.l] /se[delete this[this.length = this.l]],
                                                                 _.concat(xs) = new this.constructor(this) /se[_.push.apply(_, slice.call(xs))]]}).

//   Object interfacing.
//   Sequences can be built from object keys, values, or key-value pairs. This keeps you from having to write for (var k in o) ever again. Also, you can specify whether you want all properties or
//   just those which belong to the object directly (by default the latter is assumed). For example:

//   | var keys     = caterwaul.seq.finite.keys({foo: 'bar'});             // hasOwnProperty is used
//     var all_keys = caterwaul.seq.finite.keys({foo: 'bar'}, true);       // hasOwnProperty isn't used; you get every enumerable property

//   Javascript, unlike Perl, fails to make the very useful parallel between objects and arrays. Because references are cheap in Javascript (both notationally and computationally), the
//   representation of an object is slightly different from the one in Perl. You use an array of pairs, like this: [[k1, v1], [k2, v2], ..., [kn, vn]].

//   | object([o = {}]): Zips a sequence of pairs into an object containing those mappings. Later pairs take precedence over earlier ones if there is a collision. You can specify an optional
//                       object o to zip into; if you do this, then the pairs are added to o and o is returned instead of creating a new object and adding pairs to that.

    tconfiguration('std', 'seq.finite.object', function () {
      l[own = Object.prototype.hasOwnProperty] in
      this.configure('seq.finite.core').seq.finite /se[_.keys  (o, all) = new _() /se[(function () {for (var k in o) if (all || own.call(o, k)) _.push(k)})()],
                                                       _.values(o, all) = new _() /se[(function () {for (var k in o) if (all || own.call(o, k)) _.push(o[k])})()],
                                                       _.pairs (o, all) = new _() /se[(function () {for (var k in o) if (all || own.call(o, k)) _.push([k, o[k]])})()],
                                                       _.prototype.object(o) = (o || {}) /se[this.each(fn[p][_[p[0]] = p[1]])]]}).

//   Mapping and traversal.
//   Sequences support the usual set of map/filter/fold operations. Unlike most sequence libraries, though, all of these functions used unrolled loops. This means that if your JS runtime has good
//   hot-inlining support they should be really fast. (The same does not hold for the infinite stream library, which uses simulated continuations for lots of things and is probably quite slow.)

//   If you fold on a sequence with too few elements (and you don't supply extras by giving it more arguments), it will return something falsy.

    tconfiguration('std opt', 'seq.finite.traversal', function () {
      this.configure('seq.finite.core seq.finite.mutability').seq.finite.prototype
        /se[_.map(f)      = new this.constructor() /se[opt.unroll[i, this.l][_.push(f.call(this, this[i], i))]],
            _.filter(f)   = new this.constructor() /se[opt.unroll[i, this.l][_.push(this[i]), when[f.call(this, this[i], i)]]],
            _.each(f)     = this                   /se[opt.unroll[i,    _.l][f.call(_, _[i], i)]],
            _.reversed()  = new this.constructor() /se[l[l = this.l] in opt.unroll[i, l][_.push(this[l - i - 1])]],
            _.flat_map(f) = new this.constructor() /se[this.each(fn[x, xi][(f.call(this, x, xi) /re.xs[xs.each ? xs : new this.constructor(xs)]).each(fn[x][_.push(x)])])],

            _.foldl(f, x) = l[x = arguments.length > 1 ? x : this[0], xi = 2 - arguments.length]
                             [opt.unroll[i, this.l - xi][x = f.call(this, x, this[i + xi], i + xi)], x, when[this.l >= xi]],
            _.foldr(f, x) = l[x = arguments.length > 1 ? x : this[this.l - 1], xi = 3 - arguments.length, l = this.l]
                             [opt.unroll[i, l - (xi - 1)][x = f.call(this, this[l - (i + xi)], x, l - (i + xi))], x, when[l >= xi - 1]]]}).

//   Zipping.
//   Zipping as a generalized construct has a few variants. One is the function used to zip (by default, [x, y]), another is the number of sequences to zip together, and the last one is whether
//   you want an inner or outer product. Here's the full argument syntax for zip() with defaults:

//   | xs.zip(xs1, xs2, ..., xsn, {f: fn_[new seq(arguments)], outer: false})

//   Each of xsi should be an array-ish object (i.e. should support .length and [i] attributes). If you specify the optional hash at the end, its 'f' attribute, if specified, will be invoked
//   on every n-tuple of items, and if 'outer' is truthy then you will have the outer-product of all of your sequences (i.e. the longest sequence length is used, and undefined is specified when
//   you run past the end of any other one).

    tconfiguration('std opt', 'seq.finite.zip', function () {
      this.configure('seq.finite.traversal').seq.finite
        /se[_.prototype.zip() = l[as = new seq([this].concat(slice.call(arguments))), options = {f: fn_[new seq(arguments)], outer: false}]
                                 [caterwaul.util.merge(options, as.pop()), when[as[as.size() - 1].constructor === Object],
                                  l[l = as.map(fn[x][x.size ? x.size() : x.length]).foldl(options.outer ? fn[x, y][Math.max(x, y)] : fn[x, y][Math.min(x, y)]), f = options.f] in
                                  new this.constructor() /se[opt.unroll[i, l][_.push(f.apply({i: i}, as.map(fn[x][x[i]]).slice()))]]],
            where[seq = _, slice = Array.prototype.slice]]}).

//   Quantification.
//   Functions to determine whether all sequence elements have some property. If an element satisfying the predicate is found, exists() returns the output of the predicate for that element. (So,
//   for example, xs.exists(fn[x][x.length]) would return the length of the nonempty item, which we know to be truthy.) forall() has no such behavior, since the quantifier is decided when the
//   predicate returns a falsy value and there are only a few falsy values in Javascript.

    tconfiguration('std opt continuation', 'seq.finite.quantification', function () {
      this.configure('seq.finite.core').seq.finite.prototype /se[_.exists(f) = call/cc[fb[cc][opt.unroll[i, this.l][f.call(this, this[i], i) /re[_ && cc(_)]], false]],
                                                                 _.forall(f) = ! this.exists(fn_[! f.apply(this, arguments)])]}).

// Stream API.
// All streams are assumed to be infinite in length; that is, given some element there is always another one. Streams provide this interface with h() and t() methods; the former returns the first
// element of the stream, and the latter returns a stream containing the rest of the elements.

  tconfiguration('std', 'seq.infinite.core', function () {
    this.configure('seq.core').seq.infinite = fn_[null] /se[_.prototype = new this.seq.core() /se[_.constructor = ctor], where[ctor = _]]
      /se[_.def(name, ctor, h, t) = i[name] = ctor /se[_.prototype = new i() /se[_.h = h, _.t = t, _.constructor = ctor]], where[i = _],

          _.def('cons', fn[h, t][this._h = h, this._t = t], fn_[this._h], fn_[this._t]),
          _.def('k',    fn   [x][this._x = x],              fn_[this._x], fn_[this])]}).

//   Anamorphisms via fixed-point.
//   Anamorphic streams are basically unwrapped version of the Y combinator. An anamorphic stream takes a function f and an initial element x, and returns x, f(x), f(f(x)), f(f(f(x))), ....

    tconfiguration('std', 'seq.infinite.y', function () {
      this.configure('seq.infinite.core').seq.infinite.def('y', fc[f, x][this._f = f, this._x = x], fn_[this._x], fn_[new this.constructor(this._f, this._f(this._x))])}).

//   Lazy map and filter.
//   These are implemented as separate classes that wrap instances of infinite streams. They implement the next() method to provide the desired functionality. map() and filter() are simple
//   because they provide streams as output. filter() is eager on its first element; that is, it remains one element ahead of what is requested.

    tconfiguration('std continuation', 'seq.infinite.transform', function () {
      this.configure('seq.infinite.core').seq.infinite
        /se[_.prototype.map(f) = new _.map(f, this),
            _.def('map', fc[f, xs][this._f = f, this._xs = xs], fn_[this._f(this._xs.h())], fn_[new this.constructor(this._f, this._xs.t())]),

            _.prototype.filter(f) = new _.filter(f, this),
            _.def('filter', fc[f, xs][this._f = f, this._xs = l*[next(s)(cc) = f(s.h()) ? cc(s) : call/tail[next(s.t())(cc)]] in call/cc[next(xs)]],
                            fn_[this._xs.h()], fn_[new this.constructor(this._f, this._xs.t())])]}).

//   Traversal and forcing.
//   This is where we convert from infinite streams to finite sequences. You can take or drop elements while a condition is true. take() always assumes it will return a finite sequence, whereas
//   drop() assumes it will return an infinite stream. (In other words, the number of taken or dropped elements is assumed to be finite.) Both take() and drop() are eager. drop() returns a
//   sequence starting with the element that fails the predicate, whereas take() returns a sequence for which no element fails the predicate.

    tconfiguration('std continuation', 'seq.infinite.traversal', function () {
      l[finite = this.configure('seq.finite.core seq.finite.mutability').seq.finite] in
      this.configure('seq.infinite.core').seq.infinite.prototype
        /se[_.drop(f) = l*[next(s)(cc) = f(s.h()) ? call/tail[next(s.t())(cc)] : cc(s)] in call/cc[next(this)],
            _.take(f) = l*[xs = new finite(), next(s)(cc) = l[h = s.h()][f(h) ? (xs.push(h), call/tail[next(s.t())(cc)]) : cc(xs)]] in call/cc[next(this)]]}).

// Sequence utilities.
// These methods are useful both for finite and for infinite sequences. Probably the most useful here is n(), which produces a bounded sequence of integers. You use n() like this:

// | caterwaul.seq.n(10)                   -> [0, 1, 2, ..., 8, 9]
//   caterwaul.seq.n(1, 10)                -> [1, 2, ..., 8, 9]
//   caterwaul.seq.n(1, 10, 0.5)           -> [1, 1.5, 2, 2.5, ..., 8, 8.5, 9, 9.5]
//   caterwaul.seq.n(-10)                  -> [0, -1, -2, ..., -8, -9]
//   caterwaul.seq.n(-1, -10)              -> [-1, -2, ..., -8, -9]
//   caterwaul.seq.n(-1, -10, 0.5)         -> [-1, -1.5, -2, ..., -8, -8.5, -9, -9.5]

// Also useful is the infinite stream of natural numbers and its companion function naturals_from:

// | caterwaul.seq.naturals                -> [0, 1, 2, 3, ...]
//   caterwaul.seq.naturals_from(2)        -> [2, 3, 4, 5, ...]

  tconfiguration('std opt', 'seq.numeric', function () {
    this.configure('seq.infinite.core seq.infinite.y seq.finite.core').seq /se[
      _.naturals_from(x) = new _.infinite.y(fn[n][n + 1], x),
      _.naturals         = _.naturals_from(0),
      _.n(l, u, s)       = l[lower = arguments.length > 1 ? l : 0, upper = arguments.length > 1 ? u : l]
                            [l[step = Math.abs(s || 1) * (lower < upper ? 1 : -1)] in new _.infinite.y(fn[n][n + step], lower).take(fn[x][(upper - lower) * (upper - x) > 0])]]}).

// Sequence manipulation language.
// Using methods to manipulate sequences can be clunky, so the sequence library provides a macro to enable sequence-specific manipulation. You enter this mode by using seq[], and expressions
// inside the brackets are interpreted as sequence transformations. For example, here is some code translated into the seq[] macro:

// | var primes1 = l[two = naturals.drop(fn[x][x < 2])] in two.filter(fn[n][two.take(fn[x][x <= Math.sqrt(n)]).forall(fn[k][n % k])]);
//   var primes2 = l[two = seq[naturals >>[_ < 2]] in seq[two %n[two[_ <= Math.sqrt(n)] &[n % _]]];

// These operators are supported and take their normal Javascript precedence and associativity:

// | x *[_ + 2]            // x.map(fn[_, _i][_ + 2])
//   x *~[_ + xs]          // x.map(fn[_, _i][_.concat(xs)])
//   x *-[_ + 2]           // x.map(fb[_, _i][_ + 2])
//   x *~-[_ + xs]         // x.map(fb[_, _i][_.concat(xs)])
//   x *+(console/mb/log)  // x.map(console/mb/log)
//   x *!+f                // x.each(f)
//   x *![console.log(_)]  // x.each(fn[_, _i][console.log(_)])
//   x /[_ + _0]           // x.foldl(fn[_, _0, _i][_ + _0])
//   x /![_ + _0]          // x.foldr(fn[_, _0, _i][_ + _0])
//   x %[_ >= 100]         // x.filter(fn[_, _i][_ >= 100])
//   x %![_ >= 100]        // x.filter(fn[_, _i][!(x >= 100)])
//   x *n[n + 2]           // x.map(fn[n, ni][n + 2])
//   x *!n[console.log(n)] // x.each(fn[n, ni][console.log(n)])
//   x /n[n + n0]          // x.foldl(fn[n, n0, ni][n + n0])
//   x /!n[n + n0]         // x.foldr(fn[n, n0, ni][n + n0])
//   x %n[n % 100 === 0]   // x.filter(fn[n, ni][n % 100 === 0])
//   x %!n[n % 100]        // x.filter(fn[n, ni][!(n % 100 === 0)])
//   x <<[_ >= 10]         // x.take(fn[_][_ >= 10])
//   x <<n[n >= 10]        // x.take(fn[n][n >= 10])
//   x >>[_ >= 10]         // x.drop(fn[_][_ >= 10])
//   x >>n[n >= 10]        // x.drop(fn[n][n >= 10])
//   x |[_ === 5]          // x.exists(fn[_, _i][_ === 5])
//   x &[_ === 5]          // x.forall(fn[_, _i][_ === 5])
//   x |n[n === 5]         // x.exists(fn[n, ni][n === 5])
//   x &n[n === 5]         // x.forall(fn[n, ni][n === 5])
//   x -~[~[_, _ + 1]]     // x.flat_map(fn[_, _i][seq[~[_, _ + 1]]])
//   x -~i[~[i, i + 1]]    // x.flat_map(fn[i, ii][seq[~[i, i + 1]]])
//   x >>>[_ + 1]          // new caterwaul.seq.infinite.y(fn[_][_ + 1], x)
//   x >>>n[n + 1]         // new caterwaul.seq.infinite.y(fn[n][n + 1], x)
//   x || y                // x && x.size() ? x : y        // except that each sequence is evaluated at most once, and if x && x.size() then y is not evaluated at all
//   x && y                // x && x.size() ? y : x        // same here, except evaluation semantics are for && instead of ||
//   x > y                 // x.size() > y.size()
//   x >= y                // x.size() >= y.size()
//   x < y                 // x.size() < y.size()
//   x <= y                // x.size() <= y.size()
//   x == y                // x.size() === y.size()
//   x != y                // x.size() !== y.size()
//   x === y               // x.size() === y.size() && x.zip(y).forall(fn[p][p[0] === p[1]])
//   x !== y               // !(x === y)
//   sk[x]                 // caterwaul.seq.finite.keys(x)
//   sv[x]                 // caterwaul.seq.finite.values(x)
//   sp[x]                 // caterwaul.seq.finite.pairs(x)
//   n[...]                // caterwaul.seq.n(...)
//   N                     // caterwaul.seq.naturals
//   N[x]                  // caterwaul.seq.naturals_from
//   x ^ y                 // x.zip(y)
//   x + y                 // x.concat(y)
//   !x                    // x.object()
//   ~x                    // new caterwaul.seq.finite(x)
//   +(x)                  // x    (this means 'literal', so no sequence transformations are applied to x)

// Method calls are treated normally and arguments are untransformed; so you can call methods normally. Also, each operator above makes sure to evaluate each operand at most once (basically
// mirroring the semantics of the Javascript operators in terms of evaluation).

//   Modifiers.
//   There are patterns in the above examples. For instance, x %[_ + 1] is the root form of the filter operator, but you can also write x %n[n + 1] to use a different variable name. The ~
//   modifier is available as well; this evaluates the expression inside brackets in sequence context rather than normal Javascript. (e.g. xs %~[_ |[_ === 1]] finds all subsequences that contain
//   1.) Finally, some operators have a ! variant (fully listed in the table above). In this case, the ! always precedes the ~.

//   New in Caterwaul 0.6.7 is the unary - modifier, which preserves a function's binding. For example, seq[~xs *[this]] returns a sequence containing references to itself, whereas seq[~xs
//   *-[this]] returns a sequence containing references to whatever 'this' was in the context containing the sequence comprehension. The difference is whether an fn[] or fb[] is used.

//   Another modifier is +; this lets you use point-free form rather than creating a callback function. For example, xs %+divisible_by(3) expands into xs.filter(divisible_by(3)). This modifier
//   goes where ~ would have gone.

//   Bound variables.
//   In addition to providing operator-to-method conversion, the seq[] macro also provides some functions. Prior to Caterwaul 0.6.7 you had to manually construct anamorphic sequences of integers,
//   so a lot of code looked like seq[(0 >>>[_ + 1]) *![...]]. Caterwaul 0.6.7 introduces the following shorthands:

//   | seq[N]              // caterwaul.seq.naturals
//     seq[N[10]]          // caterwaul.seq.naturals_from(10)
//     seq[n[10]]          // caterwaul.seq.n(10), which becomes [0, 1, ..., 9]
//     seq[n[5, 10]]       // caterwaul.seq.n(5, 10), which becomes [5, 6, 7, 8, 9]
//     seq[n[5, 8, 0.5]]   // caterwaul.seq.n(5, 8, 0.5)

//   These should eliminate most if not all occurrences of manual anamorphic generation.

//   Inside the DSL code.
//   This code probably looks really intimidating, but it isn't actually that complicated. The first thing I'm doing is setting up a few methods to help with tree manipulation. The
//   prefix_substitute() method takes a prefix and a tree and looks for data items in the tree that start with underscores. It then changes their names to reflect the variable prefixes. For
//   example, prefix_substitute(qs[fn[_, _x, _i][...]], 'foo') would return fn[foo, foox, fooi].

//   The next interesting thing is define_functional. This goes beyond macro() by assuming that you want to define an operator with a function body to its right; e.g. x >>[body]. It defines two
//   forms each time you call it; the first form is the no-variable case (e.g. x *[_ + 1]), and the second is the with-variable case (e.g. x *n[n + 1]). The trees_for function takes care of the
//   bang-variant of each operator. This gets triggered if you call define_functional on an operator that ends in '!'.

//   After this is the expansion logic (which is just the regular Caterwaul macro logic). Any patterns that match are descended into; otherwise expansion returns its tree verbatim. Also, the
//   expander-generator function rxy() causes expansion to happen on each side. This is what keeps expansion going. When I specify a custom function it's because either (1) rxy doesn't take
//   enough parameters, or (2) I want to specify that only some subtrees should be expanded. (That's what happens when there's a dot or invocation, for instance.)

//   Pattern matching always starts at the end of the arrays as of Caterwaul 0.5. This way any new patterns that you define will bind with higher precedence than the standard ones.

    tconfiguration('std opt continuation', 'seq.dsl', function () {
      this.configure('seq.core seq.infinite.y seq.finite.core seq.finite.zip seq.finite.traversal seq.finite.mutability').seq.dsl = caterwaul.global().clone()

      /se[_.prefix_substitute(tree, prefix)      = tree.rmap(fn[n][new n.constructor('#{prefix}#{n.data.substring(1)}'), when[n.data.charAt(0) === '_']]),
          _.define_functional(op, expansion, xs) = trees_for(op).map(fn[t, i][_.macro(t,
            fn[l, v, r][expansion.replace({_x: _.macroexpand(l), _y: i >= 8 ? v : qs[fn[xs][y]].replace({fn: i & 2 ? qs[fb] : qs[fn], xs: _.prefix_substitute(xs, i & 1 ? v.data : '_'), 
                                                                                                                                      y: (i & 4 ? _.macroexpand : fn[x][x])(r || v)})})])]),

          _.define_functional /se[_('%',  qs[_x.filter(_y)],                      qs[_, _i]), _('*',  qs[_x.map(_y)],    qs[_, _i]), _('/',  qs[_x.foldl(_y)],    qs[_, _0, _i]),
                                  _('%!', qs[_x.filter(c(_y))].replace({c: not}), qs[_, _i]), _('*!', qs[_x.each(_y)],   qs[_, _i]), _('/!', qs[_x.foldr(_y)],    qs[_, _0, _i]),
                                  _('&',  qs[_x.forall(_y)],                      qs[_, _i]), _('|',  qs[_x.exists(_y)], qs[_, _i]), _('-',  qs[_x.flat_map(_y)], qs[_, _i]),
                                  _('>>', qs[_x.drop(_y)],  qs[_]), _('<<', qs[_x.take(_y)], qs[_]), _('>>>', qs[new caterwaul.seq.infinite.y(_y, _x)], qs[_])],

          seq(qw('> < >= <= == !=')).each(fn[op][_.macro(qs[_ + _].clone() /se[_.data = op], rxy(qs[qg[_x].size() + qg[_y].size()].clone() /se[_.data = op]))]),

          l[e(x) = _.macroexpand(x)] in
          _.macro /se[_(qs[_ && _], rxy(qse[qg[l[xp = _x][xp && xp.size() ? _y : xp]]])), _(qs[_ || _], rxy(qse[qg[l[xp = _x][xp && xp.size() ? xp : _y]]])),
                      _(qs[_ === _], rxy(qs[qg[l[xp = _x, yp = _y][xp === yp ||  xp.size() === yp.size() && xp.zip(yp).forall(fn[p][p[0] === p[1]])]]])),
                      _(qs[_ !== _], rxy(qs[qg[l[xp = _x, yp = _y][xp !== yp && (xp.size() !== yp.size() || xp.zip(yp).exists(fn[p][p[0] !== p[1]]))]]])),

                      _(qs[_ ^ _], rxy(qs[_x.zip(_y)])), _(qs[_ + _], rxy(qs[_x.concat(_y)])), _(qs[!_], rxy(qs[_x.object()])), _(qs[_, _], rxy(qs[_x, _y])),
                      _(qs[~_], rxy(qs[qg[new caterwaul.seq.finite(_x)]])), _(qs[_?_:_], fn[x, y, z][qs[x ? y : z].replace({x: e(x), y: e(y), z: e(z)})]),

                      l[rx(t)(x, y) = t.replace({_x: e(x), _y: y})][_(qs[_(_)], rx(qs[_x(_y)])), _(qs[_[_]], rx(qs[_x[_y]])), _(qs[_._], rx(qs[_x._y])), _(qs[_].as('('), rx(qs[qg[_x]]))],
                      _(qs[+_], fn[x][x]),

                      l[rx(t)(x) = t.replace({x: x})][_(qs[N], fn_[qs[caterwaul.seq.naturals]]), _(qs[N[_]], rx(qs[caterwaul.seq.naturals_from(x)])), _(qs[n[_]], rx(qs[caterwaul.seq.n(x)]))],

                      seq(qw('sk sv sp')).zip(qw('keys values pairs')).each(fb[p][_(qs[p[_]].replace({p: p[0]}), fn[x][qs[caterwaul.seq.finite.r(x)].replace({r: p[1], x: x})])])],

          this.rmacro(qs[seq[_]], _.macroexpand),

          where*[rxy(tree)(x, y)      = tree.replace({_x: _.macroexpand(x), _y: y && _.macroexpand(y)}), seq = fb[xs][new this.seq.finite(xs)],
                 prepend(operator)(x) = qs[-x].replace({x: x}) /se[_.data = operator],
                 tree_forms           = l*[base = seq([qs[[_]], qs[_[_]]]), mod(fs, op) = fs.concat(fs.map(prepend(op)))] in mod(mod(base, 'u-'), 'u~').concat(seq([qs[+_]])),

                 template(op)(t)      = qs[_ + x].replace({x: t}) /se[_.data = op], qw = caterwaul.util.qw, not = qs[qg[fn[f][fn_[!f.apply(this, arguments)]]]],
                 trees_for(op)        = tree_forms /re[op.charAt(op.length - 1) === '!' ? _.map(prepend('u!')) : _] /re[_.map(template(op.replace(/!$/, '')))]]]}).

// Final configuration.
// Rather than including individual configurations above, you'll probably just want to include this one.

  configuration('seq', function () {this.configure('seq.core seq.finite.core seq.finite.object seq.finite.mutability seq.finite.traversal seq.finite.zip seq.finite.quantification ' +
                                                            'seq.finite.serialization seq.infinite.core seq.infinite.y seq.infinite.transform seq.infinite.traversal ' +
                                                            'seq.numeric seq.dsl')});
// Generated by SDoc 
