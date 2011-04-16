// Macroexpansion.
// Caterwaul is a Lisp, which in this case means that it provides the ability to transform code before that code is compiled. Lisp does macroexpansion inline; that is, as the code is being read
// (or compiled -- there are several stages I believe). Caterwaul provides offline macros instead; that is, you define them separately from their use. This gives Caterwaul some opportunity to
// optimize macro-rewriting.

// Defining offline macros is done in the normal execution path. For example:

// | caterwaul(function () {
//     caterwaul.rmacro(qs[let (_ = _) in _], fn[n, v, e][qs[fn[args][body].call(this, values)].replace({args: n, body: e, values: v})]);
//   }) ();        // Must invoke the function

// | // Macro is usable in this function:
//   caterwaul(function () {
//     let (x = 5) in console.log(x);
//   });

// Wrapping the first function in caterwaul() wasn't necessary, though it was helpful to get the qs[] and fn[] shorthands. In this case, the macro is persistent to the caterwaul function that it
// was called on. (So any future caterwaul()ed functions would have access to it.) You can also define conditional macros, though they will probably be slower. For example:

// | caterwaul(function () {
//     caterwaul.rmacro(qs[let (_) in _], fn[bs, e][bs.data === '=' && ...]);
//   }) ();

// Here, returning a falsy value indicates that nothing should be changed about this syntax tree. It is replaced by itself and processing continues normally. You should try to express things in
// terms of patterns; there are theoretical optimizations that can cut the average-case runtime of pattern matching to a fraction of a full linear scan. The worst possible case is when you match
// on a universal pattern and restrict later:

// | caterwaul(function () {
//     caterwaul.rmacro(qs[_], fn[x][...]);
//   }) ();

// This will call your macroexpander once for every node in the syntax tree, which for large progams is costly. If you really do have such a variant structure, your best bet is to define separate
// macros, one for each case:

// | caterwaul(function () {
//     var patterns = [qs[foo], qs[bar], qs[bif]];
//     patterns.map (function (p) {
//       caterwaul.rmacro(p, fn[x][...]);
//     });
//   }) ();

// Caterwaul implements several optimizations that make it much faster to macroexpand code when the macro patterns are easily identified.

  (function () {

//   Pitfalls of macroexpansion.
//   Macroexpansion as described here can encode a lambda-calculus. The whole point of having macros is to make them capable, so I can't complain about that. But there are limits to how far I'm
//   willing to go down the pattern-matching path. Let's suppose the existence of the let-macro, for instance:

//   | let (x = y) in z   ->   (function (x) {return z}) (y)

//   If you write these macros:

//   | foo[x, y]   ->   let (x = y)
//     bar[x, y]   ->   x in y

//   Caterwaul is not required to expand bar[foo[x, y], z] into (function (x) {return z}) (y). It might just leave it at let (x = y) in z instead. The reason is that while the individual
//   macroexpansion outputs are macroexpanded, a fixed point is not run on macroexpansion in general. (That would require multiple-indexing, which in my opinion isn't worth the cost.) To get the
//   extra macroexpansion you would have to wrap the whole expression in another macro, in this case called 'expand':

//   | caterwaul.configure(function () {
//       this.rmacro(expand[_], fn[expression][caterwaul.macroexpand(expression)]);
//     });

//   This is an eager macro; by outputting the already-expanded contents, it gets another free pass through the macroexpander.

//   Things that are not guaranteed:

//   | 1. Reassembly of different pieces (see above).
//     2. Anything at all, if you modify the syntax tree in the macro code. Returning a replacement is one thing, but modifying one will break things.
//     3. Performance bounds.

//   Matching.
//   macro_try_match returns null if two syntax trees don't match, or a possibly empty array of wildcards if the given tree matches the pattern. Wildcards are indicated by '_' nodes, as
//   illustrated in the macro definition examples earlier in this section. Note that this function is O(n) in the number of nodes in the pattern. It is optimized, though, to reject invalid nodes
//   quickly -- that is, if there is any mismatch in arity or data.

    caterwaul_global.method('macro_try_match', function (pattern, t) {if (pattern.data === '_')                                   return [t];
                                                                      if (pattern.data !== t.data || pattern.length !== t.length) return null;
                                                                      for (var i = 0, l = pattern.length, wildcards = [], match = null; i < l; ++i)
                                                                        if (match = macro_try_match(pattern[i], t[i])) Array.prototype.push.apply(wildcards, match);
                                                                        else                                           return null;
                                                                      return wildcards});

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
//       this.macro(qs[literal[_]], fn[x][x]);
//     });

//   While macro() is marginally faster than rmacro(), the difference isn't significant in most cases.

//   New in caterwaul 1.0 is the ability to specify multiple macro patterns that share an expander by passing more than two arguments to macro() and rmacro().

    var variadic_definition = function (f) {return function () {for (var i = 0, l = arguments.length - 1; i < l; ++i) f.call(this, arguments[i], arguments[l]); return this}};

    caterwaul_global.shallow('macro_patterns', []).
                     shallow('macro_expanders', []).

          method_until_baked('macro',  variadic_definition(function (pattern, expander) {if (! expander.apply) throw new Error('macro: cannot define macro with non-function expander');
                                                                                         else return this.macro_patterns.push(pattern), this.macro_expanders.push(expander), this})).

          method_until_baked('rmacro', variadic_definition(function (pattern, expander) {if (! expander.apply) throw new Error('rmacro: cannot define macro with non-function expander');
                                                                                         else return this.macro(pattern, function () {var t = expander.apply(this, arguments);
                                                                                                                                      return t && this.macroexpand(t)})})).
                      method('macroexpand', function (t) {return macro_expand_naive(t, this.macro_patterns, this.macro_expanders, this)}).
                  when_baked(function () {var f = this.create_baked_macroexpander(this.macro_patterns, this.macro_expanders);
                                          this.method('macroexpand', function (t) {return t.rmap(function (n) {return f.call(this, n)})})})})();
// Generated by SDoc 
