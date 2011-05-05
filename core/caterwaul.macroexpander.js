// Macroexpansion.
// Caterwaul's main purpose is to transform your code, and the easiest way to transform things is through macroexpansion. The idea is to locate syntax nodes with a given pattern and rewrite them
// somehow. For example, suppose we wanted to define a macro to enable the postfix /log modifier. Here's how it might look:

// | x /log   ->   (function (it) {console.log(it); return it})(x)

// The macro needs to first identify things of the form '_something /log' and transform them accordingly. Here's a macro to do that:

// | var m = caterwaul.macro('_something /log', '(function (it) {console.log(it); return it})(_something)');

//   Building macros.
//   Caterwaul gives you several ways to build macros. The simplest is to use caterwaul.macro() as shown above. It will parse each string, using the first as a pattern and the second as a
//   template. It then fills in the values on the right from the ones on the left and re-expands the result. In place of each string, caterwaul.macro() can take either a syntax tree or a
//   function. The function on the left should take a syntax tree, try to match the pattern against it, and return either a match object or false. The function on the right should take a match
//   object and return a new syntax tree. (It won't be invoked if the left function returned false.)

//   Macro function internals.
//   Caterwaul's macros are just functions from syntax to syntax. They return false if they don't match a particular node. So, for example, the macro '_x * 2' -> '_x << 1' would return 'a << 1'
//   on 'a * 2', but would return false on 'a * 3'. The macroexpander knows to descend into child nodes when a macroexpander returns false. If a macroexpander returns a value then that value is
//   taken and no further expansion is performed. (This is necessary if we want to implement literal macros -- that is, literal(x) -> x and x isn't macroexpanded further.)

//   If a macro wants to re-expand stuff it should use 'this.expand', which invokes the macroexpander on a tree. Most of the time macros will do this, and it's done automatically by
//   caterwaul.macro() when you use a string or a syntax tree as the expansion. You'll have to call this.expand() if you're using a function as an expander.

    caterwaul_global.ensure_syntax   = function (thing)    {return thing && thing.constructor === String ? this.parse(thing) : thing};

    caterwaul_global.ensure_pattern  = function (pattern)  {return pattern.constructor  === String      ? this.ensure_pattern(this.parse(pattern)) :
                                                                   pattern.constructor  === this.syntax ? function (tree) {return pattern.match(tree)} : pattern};

    caterwaul_global.ensure_expander = function (expander) {return expander.constructor === String      ? this.ensure_expander(this.parse(expander)) :
                                                                   expander.constructor === this.syntax ? function (match) {return this.expand(expander.replace(match))} : expander};

    caterwaul_global.macro = caterwaul_global.right_variadic(function (pattern, expander) {pattern = this.ensure_pattern(pattern), expander = this.ensure_expander(expander);
                                                               return function (tree) {var match = pattern.call(this, tree); return match && expander.call(this, match)}});

//   Macroexpander logic.
//   This behaves just like the pre-1.0 macroexpander, except that the patterns and expanders are now fused. The macro functions are also evaluated under a different context; rather than being
//   bound to the caterwaul function they came from, they are bound to a context object that gives them a way to re-expand stuff under the same set of macros. It also provides the caterwaul
//   function that is performing the expansion. (Though you shouldn't modify the macro list from inside a macro -- this pre-1.0 feature is now removed.)

//   Just like previous versions of caterwaul the macros are matched last-to-first. This means that the /last/ matching macro is used, allowing you to easily override stuff. Also, the
//   macroexpand() function takes optional extra parameters; these are either macros or arrays of macros to be added to the macro list stored on the caterwaul function.

    caterwaul_global.macroexpand = function (tree) {for (var macros = arguments.length ? [].concat(this._macros || []) : this._macros || [], i = 1, l = arguments.length, x; i < l; ++i)
                                                      (x = arguments[i]) instanceof Array ? macros.push.apply(macros, x) : macros.push(x);

                                                    var context = {caterwaul: this, macros: macros, expand: function (tree) {
                                                      return tree.rmap(function (node) {
                                                        for (var new_node = null, i = macros.length - 1; i >= 0; --i) if (new_node = macros[i].call(context, node)) return new_node})}};

                                                    return context.expand(this.ensure_syntax(tree))};
// Generated by SDoc 
