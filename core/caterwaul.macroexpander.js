// Macroexpansion.
// Caterwaul's main purpose is to transform code, and the way it does this is by using macroexpansion. Macroexpansion involves finding pieces of the syntax tree that have a particular form and
// changing them somehow. Normally this is done by first defining a pattern and then defining a function that returns something to replace occurrences of that pattern. For example:

// | caterwaul.rmacro('_a + _b', '_a * _b');

// This macro finds binary addition and replaces it with multiplication. In previous versions of caterwaul the macro would have been written using anonymous wildcards and a macroexpansion
// function, but caterwaul 1.0 now supports named pattern matching. If you write a function to generate the expansion, it will receive an object containing the match data:

// | var tree = caterwaul.parse('foo + bar');
//   caterwaul.rmacro('_a + _b', function (match) {
//     console.log(match);                                 // logs {_a: (foo), _b: (bar)}
//   });

// Inside the macroexpander 'this' is bound to the instance of caterwaul that is performing macroexpansion.

// Notice that I've been typing 'rmacro' rather than just 'macro'. Both are methods, but generally you'll want to use rmacro. (See 'Macro vs. rmacro' below for more details.)

  (function () {

//   Pitfalls of macroexpansion.
//   Macroexpansion as described here can encode a lambda-calculus. The whole point of having macros is to make them capable, so I can't complain about that. But there are limits to how far I'm
//   willing to go down the pattern-matching path. Let's suppose the existence of the let-macro, for instance:

//   | let (x = y) in z   ->   (function (x) {return z}) (y)

//   If you write these macros:

//   | foo[x, y]   ->   let (x = y)
//     bar[x, y]   ->   x in y

//   Caterwaul is not required to expand bar[foo[x, y], z] into (function (x) {return z}) (y). It might just leave it at let (x = y) in z instead. The reason is that while the individual
//   macroexpansion outputs are macroexpanded, a fixed point is not run on macroexpansion in general. To get the extra macroexpansion you would have to wrap the whole expression in another macro,
//   in this case called 'expand':

//   | caterwaul.configure(function () {
//       this.rmacro('expand[_x]', fn[match][caterwaul.macroexpand(match._x)]);
//     });

//   This is an eager macro; by outputting the already-expanded contents, it gets another free pass through the macroexpander.

//   Things that are not guaranteed:

//   | 1. Reassembly of different pieces (see above).
//     2. Anything at all, if your macroexpansion function destructively modifies its syntax trees. Returning a replacement is one thing, but modifying one will break things.
//     3. Performance bounds.

// Macroexpansion behavior.
// Caterwaul exposes macroexpansion as a contained interface. This lets you write your own compilers with macroexpansion functionality, even if the syntax trees weren't created by Caterwaul.
// (Though you won't be able to precompile these.) In order for this to work, your syntax trees must:

// | 1. Look like arrays -- that is, have a .length property and be indexable by number (e.g. x[0], x[1], ..., x[x.length - 1])
//   2. Implement an rmap() method. This should perform a depth-first traversal of the syntax tree, invoking a callback function on each node. If the callback returns a value, that value should
//      be subsituted for the node passed in and traversal should continue on the next node (not the one that was grafted in). Otherwise traversal should descend into the unmodified node. The
//      rmap() method defined for Caterwaul syntax trees can be used as a reference implementation. (It's fairly straightforward.)
//   3. Implement a .data property. This represents an equivalence class for syntax nodes under ===. Right now there is no support for using other equivalence relations.

// As of version 0.7.0 this compatibility may change without notice. The reason is that the macroexpansion logic used by Caterwaul is becoming more sophisticated to increase performance, which
// means that it may become arbitrarily optimized.

//   Macro vs. rmacro.
//   macro() defines a macro whose expansion is left alone. rmacro(), on the other hand, will macroexpand the expansion, letting you emit macro-forms such as fn[][]. Most of the time you will
//   want to use rmacro(), but if you want to have a literal[] macro, for instance, you would use macro():

//   | caterwaul.configure(function () {
//       // Using macro() instead of rmacro(), so no further expansion:
//       this.macro('literal[_x]', '_x');
//     });

//   New in caterwaul 1.0 is the ability to specify multiple macro patterns that share an expander by passing more than two arguments to macro() and rmacro().

    var variadic_definition = function (f) {return function () {for (var i = 0, l = arguments.length - 1; i < l; ++i) f.call(this, arguments[i], arguments[l]); return this}};

    caterwaul_global.shallow('macro_patterns',  []).
                     shallow('macro_expanders', []).

          method_until_baked('macro',  variadic_definition(function (pattern, expander) {
                                                             if (! expander.apply) throw new Error('macro: cannot define macro with non-function expander');
                                                             else return this.macro_patterns.push(this.ensure_syntax(pattern)), this.macro_expanders.push(expander), this})).

          method_until_baked('rmacro', variadic_definition(function (pattern, expander) {
                                                             if (! expander.apply) throw new Error('rmacro: cannot define macro with non-function expander');
                                                             else return this.macro(pattern, function () {var t = expander.apply(this, arguments); return t && this.macroexpand(t)})})).

                      method('macroexpand', function (t) {return macro_expand_naive(t, this.macro_patterns, this.macro_expanders, this)}).

                  when_baked(function () {var f = this.create_baked_macroexpander(this.macro_patterns, this.macro_expanders);
                                          this.method('macroexpand', function (t) {return t.rmap(function (n) {return f.call(this, n)})})})})();
// Generated by SDoc 
