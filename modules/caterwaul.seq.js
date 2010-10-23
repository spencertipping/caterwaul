// Caterwaul JS sequence library | Spencer Tipping
// Licensed under the terms of the MIT source code license

// Introduction.
// JavaScript lacks a robust lazy sequence library. Most of its sequence-manipulation constructs are side-effectful, which means that they take up a lot of code-space and don't compose well in
// expressions. This library is designed to provide first-class sequence macros/classes to (hopefully) obviate the need for 'for' loops and similar JavaScript statement-level constructs.

//   Sequence metaclass.
//   Sequences provide some methods such as 'grep', and selectors such as 'before' and 'after', whose matching parameters can mean very different things depending on what the sequence is used
//   for. As such, you can instantiate the sequence metaclass into a regular class to provide a sequence with well-defined behavior for element matching. For example:

//   | var seq        = caterwaul.util.seq;
//     var seq_of_int = seq.specialize({match: fn[pattern, x][pattern.constructor === Number   ? x === pattern :
//                                                            pattern.constructor === Function ? pattern(x) : false]});
//     var seq_modulo = seq.specialize({match: fn[pattern, x][pattern.constructor === Number   ? ! (x % pattern) : ...]});

//   | var threes     = seq_of_int.from([1, 2, 3, 4, 5, 4, 3, 2, 1]).grep(3);
//     var evens      = seq_modulo.from([1, 2, 3, 4, 5, 6, 7, 8, 9]).grep(2);

//   Macros and sequence construction.
//   In addition to providing utility as classes, there are also some nice macros that come with sequences. You get comprehensions, generators, and side-effectful and pure traversal. Here are
//   some examples (using 'std', 'seq.ana', 'seq.comp', 'seq.cons', and 'seq.iter'):

//   | var naturals = seq.ana[x + 1](0);                                   // O(1) time
//     naturals.length             // -> Infinity                          // O(1) time (obviously, it's a property)
//     naturals.size()             // -> Infinity                          // O(1) time
//     naturals.at(0)              // -> 0                                 // O(1) time
//     naturals.at(1)              // -> 1                                 // O(1) time given that we called at(0) already
//     naturals.force()            // throws error: can't force infinite stream // O(1) time

//   | var to_10 = naturals.first(10);                                     // O(1) time
//     to_10.length                // -> 10                                // O(1) time
//     to_10.at(0)                 // -> 0                                 // O(1) time
//     to_10.at(9)                 // -> 9                                 // O(n) time (since it's generating each element from the previous one)
//     to_10.at(-1)                // -> 9                                 // O(1) time (since generated elements are memoized)
//     to_10.at(10)                // -> undefined                         // O(1) time (out of bounds)
//     to_10.force()               // -> [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]    // O(1) time (returns memoization buffer directly)

//   | var to_20 = to_10.first(20);                                        // O(1) time
//     to_20.length                // -> 10 (length must be accurate for <se< iteration below -- see 'Traversal')
//     to_20.force()               // -> [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

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

//   | var primes = ! naturals.between(2, x).exists(fn[y][x % y === 0]) <sf< naturals.after(1);                    // O(1) time
//     primes.length                                 // -> Infinity                                                // O(1) time
//     primes.at(0)                                  // -> 2                                                       // O(1) time
//     primes.at(1)                                  // -> 3                                                       // O(n) time
//     primes.at(2)                                  // -> 5                                                       // O(n) time

//   | var fibonacci = seq.ana[this.at(n - 1) + this.at(n - 2)] (naturals.before(2));    // More compactly: seq.ana[$(-1) + $(-2)] ([0, 1]);
//     fibonacci.length                              // -> Infinity
//     fibonacci.first(10)                           // -> seq[0, 1, 1, 2, 3, 5, 8, 13, 21, 34]                    // O(n) time

//   | var custom1 = 1 |sc| (2 |sc| (3 |sc| undefined));                                                           // O(n) time (n conses)
//     var custom2 = 4 |sc| (5 |sc| undefined);                                                                    // O(n) time
//     (custom1 |sa| custom2).length                 // -> 5                                                       // O(1) time (lazy append)

//   Traversal.
//   Side-effectful traversal can be achieved by using the each() method (which takes a JavaScript function), or by using the <se< or >se> macros, which take a block of code. each() does not
//   rewrite your code, but <se< and >se> do. These macros optimize the rewritten form like this (with gensym details elided):

//   | console.log(x) <se< naturals.between(1, 10);
//     // becomes (though see 'Advanced optimization options' below for the full story here):
//     (function (_gensym_seq) {
//       for (var _gensym_i = 0, _gensym_l = _gensym_seq.length, x; x = _gensym_seq.at(_gensym_i), _gensym_i < _gensym_l; ++_gensym_i)
//         console.log(x);
//       return _gensym_seq;
//     }) (naturals.between(1, 10));

//   Because '<' and '>' are left-associative, you can use the right-handed >se> to write sequences of side-effects:

//   | sequence >se> foo(x) >se> bar(x) >se> bif(x);
//     foo(x) <se< bar(x) <se< bif(x) <se< sequence        // <- Won't do what you want!
//     foo(x) <se< (bar(x) <se< (bif(x) <se< sequence))    // <- This is what you want.

//   Other traversal functions include <sm< and >sm> (map), <sfm< and >sfm> (flatmap), <sc< and >sc> (fold, 'c' stands for catamorphism), and <smf< and >smf> (map-filter -- returns a map across
//   your function for elements for which your function is defined).

//   Because sequences are always rewritten into numerically-indexed for-loops, you should write any sequence classes in such a way that at() for successive elements runs in constant time.

//     Advanced optimization options.
//     For-loops aren't actually that fast in JavaScript, even running under V8. Better is to use some form of loop unrolling such as Duff's device (http://en.wikipedia.org/wiki/Duff's_device).
//     The sequence library uses this by default (8 steps of unrolling -- see the caterwaul.opt module), but if for some reason you want to use regular for loops instead you can configure it like
//     this:

//     | caterwaul.seq.optimize(false);

//   Lazy mapping.
//   The <sm<, <sf<, <sfm<, <sc<, and <smf< transforms (and their right-handed equivalents) return proxy sequences that operate on the originals.
// Generated by SDoc 
