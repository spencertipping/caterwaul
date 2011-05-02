// Macroexpansion.
// Caterwaul's main purpose is to transform code, and the way it does this is by using macroexpansion. Macroexpansion involves finding pieces of the syntax tree that have a particular form and
// changing them somehow. Normally this is done by first defining a pattern and then defining a function that returns something to replace occurrences of that pattern. For example:

// | caterwaul.macro('_a + _b', '_a * _b');

// This macro finds binary addition and replaces it with multiplication. In previous versions of caterwaul the macro would have been written using anonymous wildcards and a macroexpansion
// function, but caterwaul 1.0 now supports named pattern matching. If you write a function to generate the expansion, it will receive an object containing the match data:

// | var tree = caterwaul.parse('foo + bar');
//   caterwaul.macro('_a + _b', function (match) {
//     console.log(match);                                 // logs {_a: (foo), _b: (bar)}
//   });

// Inside the macroexpander 'this' is bound to the instance of caterwaul that is performing macroexpansion.

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
//   4. Implement an .is_wildcard() method. This should return a truthy value if your node represents a wildcard when used in a pattern.

// As of version 0.7.0 this compatibility may change without notice. The reason is that the macroexpansion logic used by Caterwaul is becoming more sophisticated to increase performance, which
// means that it may become arbitrarily optimized. (See sdoc::js::core/caterwaul.macroexpand-jit for information about additional features your nodes should support.)

//   Macro vs. final_macro.
//   Normally you want the output of a macro to be re-macroexpanded. For example, suppose you're mapping _a + _b to (_a).plus(_b). If you didn't re-expand the output of this macro, then applying
//   it to the expression 'x + y + z' would yield (x + y).plus(z), since macros are applied outside-in. Fortunately macro() takes care of this for you and re-expands output automatically.

//   There are some cases where you wouldn't want re-expansion. One of them is when you're assigning context-specific meaning to operators or other syntax nodes; in this case you want to control
//   the traversal process manually. Another case is if you were to define a literal macro:

//   | caterwaul.final_macro('literal(_x)', '_x')          // final_macro says "don't re-expand the output"

//   Under the hood the macro() method ultimately uses final_macro(), but wraps your macroexpander in a function that knows how to re-expand output. All re-expansion is done by the compiler that
//   is macroexpanding in the first place.

    caterwaul_global.attr_lazy('macro_patterns',  Array).
                     attr_lazy('macro_expanders', Array).class_eval(function (def) {

      def('final_macro', this.right_variadic_binary(function (pattern, expander) {return this.macro_patterns().push(this.global.ensure_syntax(pattern)),
                                                                                         this.macro_expanders().push(this.global.ensure_expander(expander)), this}));

      def('macro',       this.right_variadic_binary(function (pattern, expander) {expander = this.global.ensure_expander(expander);
                                                                                  return this.final_macro(pattern, function () {
                                                                                    var t = expander.apply(this, arguments); return t && this.macroexpand(t)})}))});

    caterwaul_global.self_eval(function (def) {
      def('with_gensyms', function (t) {var gensyms = {}; return this.ensure_syntax(t).rmap(function (n) {
                                          return /^gensym/.test(n.data) && new this.constructor(gensyms[n.data] || (gensyms[n.data] = gensym()), this)})});

      def('expander_from_string', function (expander) {var tree = this.parse(expander); return function (match) {return tree.replace(match)}});
      def('ensure_expander',      function (expander) {return expander.constructor === String      ? this.expander_from_string(expander) :
                                                              expander.constructor === this.syntax ? function (match) {return expander.replace(match)} :
                                                              expander.constructor === Function    ? expander : fail('unknown macroexpander format: ' + expander)})});

//   Naive macroexpander implementation.
//   This is the macroexpander used in Caterwaul 0.6.x and prior. It offers reasonable performance when there are few macros, but for high-macro cases it becomes prohibitive. The 0.7.x series
//   used an optimizing half-precompiled macroexpander, but because the compilation overhead was prohitibitive version 1.0 uses the naive macroexpander and full offline precompilation for
//   performance-sensitive code.

//   Expansion.
//   Uses the straightforward brute-force algorithm to go through the source tree and expand macros. At first I tried to use indexes, but found that I couldn't think of a particularly good way to
//   avoid double-expansion -- that is, problems like qs[qs[foo]] -- the outer must be expanded without the inner one. Most indexing strategies would not reliably (or if reliably, not profitably)
//   index the tree in such a way as to encode containment. Perhaps at some point I'll find a faster macroexpander, especially if this one proves to be slow. At this point macroexpansion is by
//   far the most complex part of this system, at O(nki) where n is the number of parse tree nodes, k is the number of macros, and i is the number of nodes in the macro pattern tree. (Though in
//   practice it's generally not quite so bad.)

//   Note! This function by default does not re-macroexpand the output of macros defined with final_macro. That is handled at a higher level by Caterwaul's macro definition facility (see the
//   'macro' method).

//   Note that as of version 0.5, macroexpansion proceeds backwards. This means that the /last/ matching macro is used, not the first. It's an important feature, as it lets you write new macros
//   to override previous definitions. This ultimately lets you define sub-caterwaul functions for DSLs, and each can define a default case by matching on qs[_] (thus preventing access to other
//   macro definitions that may exist).

//   As of caterwaul 1.0 we delegate pattern matching to the tree implementation rather than having a static function to do it. The expected behavior is that x.match(y) returns null or another
//   falsy value if y doesn't match the pattern x, and it returns an object containing wildcard data if y does match x. Wildcards begin with an underscore; for example:

//   | qs[_a + _b].match(qs[3 + x])        // -> {_a: 3, _b: x}
//     qs[_a + _b].match(qs[3 / x])        // -> null

    caterwaul_global.self_eval(function (def) {
      def('macroexpand', function (t, patterns, expanders, context) {return this.ensure_syntax(t).rmap(function (n) {
                                                                       for (var i = patterns.length - 1, match, replacement; i >= 0; --i)
                                                                         if ((match = patterns[i].match(n)) && (replacement = expanders[i].call(context, match))) return replacement})})});

    caterwaul_global.class_eval(function (def) {def('macroexpand', function (t) {return this.global.macroexpand(t, this.macro_patterns(), this.macro_expanders(), this)})});
// Generated by SDoc 
