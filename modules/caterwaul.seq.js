// Caterwaul JS sequence library | Spencer Tipping
// Licensed under the terms of the MIT source code license

// Introduction.
// JavaScript lacks a robust lazy sequence library. Most of its sequence-manipulation constructs are side-effectful, which means that they take up a lot of code-space and don't compose well in
// expressions. This library is designed to provide first-class sequence macros/classes to (hopefully) obviate the need for 'for' loops and similar JavaScript statement-level constructs.

//   Macros and sequence construction.
//   In addition to providing utility as classes, there are also some nice macros that come with sequences. You get comprehensions, generators, and side-effectful and pure traversal. Here are
//   some examples (using 'std', 'seq.ana', 'seq.comp', and 'seq.iter'):

//   | var naturals_from = fn[n][x + 1 <sa< [n]];                          // O(1) time
//     var naturals      = naturals_from(0);                               // O(1) time
//     naturals.length             // -> Infinity                          // O(1) time (obviously, it's a property)
//     naturals.size()             // -> Infinity                          // O(1) time
//     naturals.at(0)              // -> 0                                 // O(1) time
//     naturals.at(1)              // -> 1                                 // O(1) time given that we called at(0) already
//     naturals.force()            // throws error: can't force infinite stream // O(1) time (error optional; may infinite-loop)

//   | var to_10 = naturals.first(10);                                     // O(1) time
//     to_10.length                // -> 10                                // O(1) time
//     to_10.at(0)                 // -> 0                                 // O(1) time
//     to_10.at(-1)                // -> 0                                 // O(1) time
//     to_10.at(9)                 // -> 9                                 // O(n) time (since it's generating each element from the previous one)
//     to_10.at(-1)                // -> 9                                 // O(1) time (since generated elements are memoized)
//     to_10.at(10)                // -> undefined                         // O(1) time (out of bounds)
//     to_10.force()               // -> [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]    // O(n) time (returns a copy of the memoized element array)
//     to_10[0]                    // -> 0                                 // O(1) time (this is the cache for this.at(0))
//     to_10[9]                    // -> 9                                 // O(1) time (this is the cache for this.at(9))

//   | var to_20 = to_10.first(20);                                        // O(1) time
//     to_20.length                // -> 10 (length must be accurate for <se< iteration below -- see 'Traversal')
//     to_20.prepare(10)           // -> to_20                             // O(n) time (populates the [n] cache)
//     to_20.prepare(10)           // -> to_20                             // O(1) time (the cache is already there -- this checks only the last element)
//     to_20[0]                    // -> 0                                 // O(1) time (already cached because of prepare())
//     to_20.force()               // -> [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]    // O(n) time (returns a copy)

//   | var odds = naturals.grep(fn[x][x & 1]);                             // O(1) time
//     odds.length                 // -> Infinity                          // O(1) time
//     odds.at(0)                  // -> 1                                 // O(n) time (might take a while to find a match)
//     odds.at(1)                  // -> 3                                 // O(n) time

//   | var times_3 = x * 3 <sm< naturals;                                  // O(1) time
//     times_3.length              // -> Infinity                          // O(1) time
//     times_3.at(0)               // -> 0                                 // O(1) time
//     times_3.at(1)               // -> 3                                 // O(1) time

//   | var depth_first_cartesian_product = (([x, y] <sm< naturals, where[y = x]) <sm< naturals).flatten();         // O(1) time
//     depth_first_cartesian_product.length          // -> Infinity                                                // O(1) time
//     depth_first_cartesian_product.at(0)           // -> [0, 0]                                                  // O(1) time
//     depth_first_cartesian_product.at(1)           // -> [1, 0]                                                  // O(1) time

//   | var primes = ! naturals.between(2, x).exists(fn[y][x % y === 0]) <sf< naturals.after(2);                    // O(1) time
//     primes.length                                 // -> Infinity                                                // O(1) time
//     primes.at(0)                                  // -> 2                                                       // O(1) time
//     primes.at(1)                                  // -> 3                                                       // O(n) time
//     primes.at(2)                                  // -> 5                                                       // O(n) time

//   | var fibonacci = $(-1) + $(-2) <sa< [0, 1];
//     fibonacci.length                              // -> Infinity
//     fibonacci.first(10)                           // -> seq[0, 1, 1, 2, 3, 5, 8, 13, 21, 34]                    // O(n) time

//   Traversal.
//   Side-effectful traversal can be achieved by using the each() method (which takes a Javascript function), or by using the <se< or >se> macros, which take a block of code. each() does not
//   rewrite your code, but <se< and >se> do. These macros optimize the rewritten form like this (with gensym details elided):

//   | console.log(x) <se< naturals.between(1, 10);
//     // becomes:
//     (function (_gensym_seq) {
//       _gensym_seq.prepare && _gensym_seq.prepare();
//       for (var _gensym_i = 0, _gensym_l = _gensym_seq.length, x; x = _gensym_seq[_gensym_i], _gensym_i < _gensym_l; ++_gensym_i)
//         console.log(x);
//       return _gensym_seq;
//     }).call(this, naturals.between(1, 10));

//   Because '<' and '>' are left-associative, you can use the right-handed >se> to write sequences of side-effects:

//   | sequence >se> foo(x) >se> bar(x) >se> bif(x);
//     foo(x) <se< bar(x) <se< bif(x) <se< sequence        // <- Won't do what you want!
//     foo(x) <se< (bar(x) <se< (bif(x) <se< sequence))    // <- This is what you want.

//   Other traversal functions include <sm< and >sm> (map), <sfm< and >sfm> (flatmap), <sc< and >sc> (fold, 'c' stands for catamorphism), and <smf< and >smf> (map-filter -- returns a map across
//   your function for elements for which your function is defined). The nice thing about these methods is that you can also use them with arrays -- they don't assume any methods besides
//   prepare(), and they use that only if it exists.

//   Lazy mapping.
//   The <sm<, <sf<, <sfm<, <sc<, and <smf< transforms (and their right-handed equivalents) return proxy sequences that operate on the originals. This is true even if the original is an array,
//   which has the important consequence that, for example, code like this will probably not do what you want:

//   | var xs = [1, 2, 3];
//     var ys = x + 1 <sm< xs;
//     xs[0] = 4;
//     console.log(x) <se< ys;     // Prints 5, 3, 4 instead of 2, 3, 4
//     xs[0] = 5;
//     console.log(x) <se< ys;     // Prints 5, 3, 4 instead of 6, 3, 4

//   The issue here is when ys gets forced. In this case it is forced when we use <se< on it; after that its elements aren't recomputed. If this is an issue, a safe way to get around it is to
//   call prepare() on the result:

//   | var ys = (x + 1 <sm< xs).prepare()  // By default prepares all elements

//   This code isn't subject to the problem because ys is forced before xs can be modified.

// Implementation.
// A stream at its core is just a data structure that caches entries. The most important thing is that every stream is an anamorphism of some sort -- this means that it has an initial value and a
// function to generate the next. The initial value is always stored as [0], and subsequent values are either cached or generated as appropriate.

//   Core sequence extensions.
//   If you want to extend sequences, this is the place to do it. You can add methods to caterwaul.seq.core and they will automatically be added to every type of sequence that is defined later
//   on. All sequences automatically get element caching and continuity -- that is, xs[i] will be set to xs.at(i) for you, and if you have xs[i] then you also have xs[i - 1] for i > 0.

    caterwaul.tconfiguration('std', 'seq.core', function () {
      this.configure('std').shallow('seq', {core: fn_[this], define: fb[name, ctor, _at][(this.seq[name] = ctor).prototype = this.util.merge(new this.seq.core(), {_at: _at}), this.seq]});
      this.seq.core.prototype.size() = this.length;
      this.seq.core.prototype.at(n)  = n < 0 ? this.at(this.finite_bound + n) : n < this.finite_bound ? this[n] : n >= this.length ? undefined :
                                       (n > 0 && this.at(n - 1), this[n] = this._at(n), this.finite_bound = n + 1, this[n])}).

//     Preparation.
//     Sequences can be 'prepared' -- that is, they can have their [n] caches populated for some finite n. This is done by accessing the stream at the maximum element required for preparation.
//     Similarly, you can 'force' a finite stream into an array. It will probably fail for infinite sequences, though that's up to Array.prototype.slice.

      tconfiguration('std iter', 'seq.core.prepare', function () {
        this.configure('seq.core').seq.core.prototype.prepare(n) = (this.at((n || this.length) - 1), this);
                              this.seq.core.prototype.force(n)   = (this.prepare(n), let[result = []][iter.n[i, n || this.length][result.push(this[i])], result])}).

//     Array-like adaptation.
//     You can turn anything that looks like an array into a stream. The requirements are that it provides a length property and can be numerically indexed (e.g. xs[0], xs[1], etc.). The length
//     property is optional if you specify a different length; in that case yours will take precedence.

      tconfiguration('std', 'seq.core.array', function () {this.seq.define('array', fn[xs, length][this.base = xs, this.length = length || xs.length], fn[n][this.base[n]])}).

//     Existential and universal quantification.
//     Sequences have brute-force methods for determining whether there exist any elements with property P, or whether all of the elements have that property. These quantification methods are not
//     smart! They just iterate through the sequence deterministically until either (1) the end of the sequence is reached, or (2) a decisive element is found.

      tconfiguration('std iter continuation', 'seq.core.quantifiers', function () {
        this.util.merge(this.configure('seq.core').seq.core.prototype, {forall: fn[f][call/cc[fb[cc][iter.n[i, this.length][f(this.at(i)) || cc(false)], true]]],
                                                                        exists: fn[f][! this.forall(fn[x][! f(x)])]})}).

//   Anamorphic core stream.
//   This is the basis for generating new streams. There are other stream classes that capture the semantics of filtering, mapping, and iteration patterns -- importantly, they do this lazily.

    tconfiguration('std', 'seq.class.ana', function () {
      this.configure('seq.core').seq.define('ana',
        fn[f, xs][this.length = 0, this.next = f, this.finite_bound = Array.prototype.push.apply(this, xs || []), this.length = Infinity],
        fn[n][this.next.call(this, n > 0 ? this.at(n - 1) : undefined)])}).

//     Anamorphic syntax extensions.
//     The idea here is that 'x' is the most recent element, '$' is 'this.at', and 'n' is the finite bound of the stream -- that is, the index of the element being computed. (Remember that all
//     anamorphic streams are infinite until explicitly bounded later. At that point they are no longer anamorphic streams.) There are three ways to get an anamorphic stream. One is to use the
//     anamorphic stream constructor:

//     | var xs = new caterwaul.seq.ana(fn[x][x + 1], 0);

//     Better is to use one of the syntax macros:

//     | var xs = seq.ana[x + 1]([0]);
//       var xs = x + 1 <sa< [0];

      tconfiguration('std', 'seq.ana', function () {
        let[ctransform = this.configure('seq.core seq.class.ana').seq.ana.anamorphic_constructor_transform(body) =
                         qs[fn[x][_body, where*[t = this, $(n) = t.at(n), n = t.finite_bound]]].replace({_body: body}), ana = this.seq.ana] in
        this.rmacro(qs[seq.ana[_]], fn[body][with_gensyms[init][fn[init][new _class(_f, init)]].replace({_f: ctransform(body), _class: new this.ref(ana)})]).
             rmacro(qs[_ <sa< _],   fn[form, init][qs[seq.ana[_form](_init)].replace({_form: form, _init: init})])}).

//   Transformative streams.
//   These wrap other sequences and expose a new set of elements.

//     Mapping stream.
//     Lazily maps a function f over elements of a sequence. Constructed using the <sm< operator or the .map() method; for instance:

//     | x * 2 <sm< (x + 1 <sa< [0])               // even naturals
//       (x + 1 <sa< [0]).map(fn[x][x * 2])        // ditto

      tconfiguration('std', 'seq.class.map', function () {
        this.configure('seq.core').seq.define('map', fn[f, xs][this.length = xs.length, this.base = xs, this.f = f, this.finite_bound = 0], fn[n][this.f.call(this, this.base.at(n))]);
        let[map = this.seq.map][this.seq.core.prototype.map(f) = new map(f, this)]}).

      tconfiguration('std', 'seq.map', function () {
        let[ctransform = this.configure('seq.core seq.class.map').seq.map.map_comprehension_transform(body) =
                         qs[fn[x][_body, where*[t = this, $(n) = t.at(n), n = t.finite_bound]]].replace({_body: body}), map = this.seq.map] in
        this.rmacro(qs[_ <sm< _], fn[body, xs][qs[qg[new _class(_f, _xs)]].replace({_class: new this.ref(map), _f: ctransform(body), _xs: xs})])}).

//     Filtering stream.
//     Lazily returns a subset of the elements in the original stream. Constructed using the <sf< operator or the .filter() method.

//     | x & 1 <sf< (x + 1 <sa< [0])               // odd naturals
//       (x + 1 <sa< [0]).filter(fn[x][x & 1])     // ditto

//     The code here works because _at() is guaranteed to be invoked exactly once for each element, in ascending order, starting at 0. Otherwise it would take considerably more logic to make the
//     filter accessor do the right thing. (So really, the 'n' parameter passed into the _at() method is purely for show; the class could just keep count of the number of times _at() has been
//     invoked.)

//     Note that this sequence will report an incorrect size for finite bases. Computing a correct size would force the base, which would kind of defeat the purpose of using these streams in the
//     first place. It can also run out of stack space when searching for an element. In the future I may CPS-convert it.

      tconfiguration('std', 'seq.class.filter', function () {
        this.configure('seq.core').seq.define('filter', fn[f, xs][this.length = xs.length, this.base = xs, this.f = f, this.base_finite_bound = -1, this.finite_bound = 0],
                                                        fn[n][this.f.call(this, this.base.at(++this.base_finite_bound)) ? this.base[this.base_finite_bound] : this._at(n)]);
        let[filter = this.seq.filter][this.seq.core.prototype.filter(f) = new filter(f, this)]}).

      tconfiguration('std', 'seq.filter', function () {
        let[ctransform = this.configure('seq.core seq.class.filter').seq.filter.filter_comprehension_transform(body) =
                         qs[fn[x][_body]].replace({_body: body}), filter = this.seq.filter] in
        this.rmacro(qs[_ <sf< _], fn[body, xs][qs[qg[new _class(_f, _xs)]].replace({_class: new this.ref(filter), _f: ctransform(body), _xs: xs})])}).

//     Slicing stream.
//     Lazily takes a continuous or discontinuous slice of another stream. This imposes an additional O(n) step on retrieval; however, amortized retrieval time of the combined stream will still
//     be O(n) worst case and O(1) average case.

//     | (x + 1 <sa< [0]).first(10)                // elements 0 .. 9, inclusive
//       (x + 1 <sa< [0]).after(9)                 // elements 10 .. infinity, inclusive
//       (x + 1 <sa< [0]).between(1, 10)           // elements 1 .. 9, inclusive
//       (x + 1 <sa< [0]).slice(x + 2 <sa< [0])    // elements 0, 1, 2, 3, 4, ... are mapped to elements 0, 2, 4, 6, 8, ...

      tconfiguration('std seq.ana', 'seq.class.slice', function () {
        this.configure('seq.core seq.core.array seq.class.ana').seq.define('slice',
          fn[xs, is, n][this.base = xs, this.index = is, this.length = n !== undefined ? n : (xs.length < is.length ? xs.length : is.length)], fn[n][this.base.at(this.index.at(n))]);
        let[slice = this.seq.slice, array = this.seq.array] in this.util.merge(this.seq.core.prototype,
          {first: fn[n][new slice(this, x + 1 <sa< [0], n)], after: fn[n][new slice(this, x + 1 <sa< [n])], slice: fn[s][new slice(this, s)], between: fn[a, b][this.after(a).first(b - a)]})}).

// End-user configuration.
// Generally you won't want to use the above configurations; this one gathers those all into a coherent module.

  configuration('seq', function () {this.configure('seq.core.prepare seq.core.array seq.core.quantifiers seq.ana seq.map seq.filter seq.class.slice')});

// Generated by SDoc 
