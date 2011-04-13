// Macroexpansion behavior.
// Caterwaul exposes macroexpansion as a contained interface. This lets you write your own compilers with macroexpansion functionality, even if the syntax trees weren't created by Caterwaul. In
// order for this to work, your syntax trees must:

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

  var macroexpansion = function (f) {return f.
      field('macroexpand_jit_compiled_functions', {}).
    shallow('macro_patterns',  []).method('macro', function (pattern, expansion) {return this.macro_patterns.push(pattern), this.macro_expanders.push(expansion), this}).
    shallow('macro_expanders', []).method('macroexpand', function (t) {return macro_expand_jit(t, this.macro_patterns, this.macro_expanders, this, this.macroexpand_jit_compiled_functions)}).
     method('rmacro', function (pattern, expander) {if (! expander.apply) throw new Error('rmacro: Cannot define macro with non-function expander');
                                                    else return this.macro(pattern, function () {var t = expander.apply(this, arguments); return t && this.macroexpand(t)})})},

// Composition behavior.
// New in 0.6.4 is the ability to compose caterwaul functions. This allows you to write distinct macroexpanders that might not be idempotent (as is the case for the Figment translator, for
// example: http://github.com/spencertipping/figment). Composition is achieved by invoking after(), which governs the behavior of the macroexpand() function. The list of functions to be invoked
// after a caterwaul function can be inspected by invoking after() with no arguments.

// | var f = caterwaul.clone(), g = caterwaul.clone();
//   f.after(g);           // Causes g to be run on f's output; that is, g is an after-effect of f.
//   f.after(h);           // Adds another after function, to be run after all of the others.
//   f.after();            // -> [g, h]

// The design for this feature is different in 0.6.5. The problem with the original design, in which after() returned a clone of the original function, was that you couldn't set up
// after-composition from within a configuration (since, reasonably enough, configuration is closed over the caterwaul instance).

// There is deliberately no before() method. The reason for this is that when you define a macro on a caterwaul function, it should take precedence over all other macros that get run. Obviously
// this doesn't happen for g if g comes after f, but generally that relationship is obvious from the setup code (which it might not be if a before() method could be invoked by configurations).

  composition = function (f) {return f.
    shallow('after_functions', []).method('after', function () {if (arguments.length) {for (var i = 0, l = arguments.length; i < l; ++i) this.after_functions.push(arguments[i]); return this}
                                                                else                  return this.after_functions})},

// Global Caterwaul setup.
// Now that we've defined lexing, parsing, and macroexpansion, we can create a global Caterwaul function that has the appropriate attributes. As of version 0.6.4, the init() property is
// polymorphic in semantics as well as structure. There are two cases:

// | 1. You invoke caterwaul on a syntax node. In this case only macroexpansion is performed.
//   2. You invoke caterwaul on anything else. In this case the object is decompiled, macroexpanded, and then compiled.

// This pattern is then closed under intent; that is, caterwaul functions compose both in the context of function -> function compilers (though composition here isn't advisable), and in the
// context of tree -> tree compilers (macroexpansion). Having such an arrangement is important for before() and after() to work properly.

// New in version 0.6.5 is the ability to bind closure variables during a tconfiguration(). This makes it simpler to close over non-globals such as node.js's require() function.

  caterwaul_core = function (f) {return configurable(f).configure(macroexpansion, composition).
    method('tconfiguration', function (configs, name, f, bindings) {this.configurations[name] = this.clone(configs)(f, bindings); return this}).
     field('syntax', syntax_node).field('ref', ref).field('parse', parse).field('compile', compile).field('gensym', gensym).field('map', map).field('self', self).field('unique', unique).

     field('macroexpansion', macroexpansion).field('replica', replica).field('configurable', configurable).field('caterwaul', caterwaul_core).field('decompile', parse).
     field('composition', composition).field('global', function () {return caterwaul_global}).

    method('init', function (f, environment) {var result = f.constructor === this.syntax ? this.macroexpand(f) : this.compile(this(this.decompile(f)), environment);
                                              if (f.constructor === this.syntax) for (var i = 0, l = this.after_functions.length; i < l; ++i) result = this.after_functions[i](result);
                                              return result}).

    method('reinitialize', function (transform, erase_configurations) {var c = transform(this.self), result = c(c, undefined, this.unique).deglobalize();
                                                                       erase_configurations || (result.configurations = this.configurations); return result}).

//   Utility library.
//   Caterwaul uses and provides some design-pattern libraries to encourage extension consistency. This is not entirely selfless on my part; configuration functions have no access to the
//   variables I've defined above, since the third-party ones are defined outside of the Caterwaul main function. So anything that they need access to must be accessible on the Caterwaul function
//   that is being configured; thus a 'util' object that contains some useful stuff. For starters it contains some general-purpose methods:

    shallow('util', {extend: extend, merge: merge, se: se, id: id, bind: bind, map: map, qw: qw}).

//   Magic.
//   Sometimes you need to grab a unique value that is unlikely to exist elsewhere. Caterwaul gives you such a value given a string. These values are shared across all Caterwaul instances and are
//   considered to be opaque. Because of the possibility of namespace collisions, you should name your magic after a configuration or otherwise prefix it somehow.

     method('magic', (function (table) {return function (name) {return table[name] || (table[name] = {})}})({}))};
// Generated by SDoc 
