// Caterwaul standard library | Spencer Tipping
// Licensed under the terms of the MIT source code license

  caterwaul.

// Qs library.
// You really need to use this if you're going to write macros. It enables the qs[] construct in your code. This comes by default when you configure with 'std'. A variant, qse[], macroexpands the
// quoted code first and returns the macroexpansion. This improves performance while still enabling terse macro forms -- for example, if you write this:

// | this.rmacro(qs[foo[_]], function (tree) {return qse[fn_[x + 1]].replace({x: tree})})

// The fn_[] will be expanded exactly once when the qse[] is processed, rather than each time as part of the macroexpansion. I don't imagine it improves performance that noticeably, but it's
// been bugging me for a while so I decided to add it.

// Finally, there's also a literal[] macro to preserve code forms. Code inside literal[] will not be macroexpanded in any way.

  configuration('std.qs', function () {this.macro(this.parse('qs[_]'),      function (tree) {return new this.ref(tree)}).
                                            macro(this.parse('qse[_]'),     function (tree) {return new this.ref(this.macroexpand(tree))}).
                                            macro(this.parse('literal[_]'), function (tree) {return tree})}).

// Qg library.
// The qg[] construct seems useless; all it does is parenthesize things. The reason it's there is to overcome constant-folding and rewriting Javascript runtimes such as SpiderMonkey. Firefox
// failed the unit tests when ordinary parentheses were used because it requires disambiguation for expression-mode functions only at the statement level; thus syntax trees are not fully mobile
// like they are ordinarily. Already-parenthesized expressions aren't wrapped.

  tconfiguration('std.qs', 'std.qg', function () {this.rmacro(qs[qg[_]], function (expression) {return expression.as('(')})}).

// Function abbreviations (the 'fn' library).
// There are several shorthands that are useful for functions. fn[x, y, z][e] is the same as function (x, y, z) {return e}, fn_[e] constructs a nullary function returning e. fb[][] and fb_[]
// are identical to fn[][] and fn_[], but they preserve 'this' across the function call.

// The fc[][] and fc_[] variants build constructor functions. These are just like regular functions, but they always return undefined.

  tconfiguration('std.qs std.qg', 'std.fn', function () {
    this.configure('std.qg').
         rmacro(qs[fn[_][_]], function (vars, expression) {return qs[qg[function (vars) {return expression}]].replace({vars: vars, expression: expression})}).
         rmacro(qs[fn_[_]],   function       (expression) {return qs[qg[function     () {return expression}]].replace({expression: expression})}).
         rmacro(qs[fb[_][_]], function (vars, expression) {return qse[fn[_t][fn_[fn[vars][e].apply(_t, arguments)]](this)].replace({_t: this.gensym(), vars: vars, e: expression})}).
         rmacro(qs[fb_[_]],   function       (expression) {return qse[fn[_t][fn_[fn_     [e].apply(_t, arguments)]](this)].replace({_t: this.gensym(),             e: expression})}).
         rmacro(qs[fc[_][_]], function       (vars, body) {return qse[qg[fn[vars][body, undefined]]].replace({vars: vars, body: body})}).
         rmacro(qs[fc_[_]],   function             (body) {return qse[qg[fn[vars][body, undefined]]].replace({            body: body})})}).

// Object abbreviations (the 'obj' library).
// Another useful set of macros is the /mb/ and the /mb[] notation. These return methods bound to the object from which they were retrieved. This is useful when you don't want to explicitly
// eta-expand when calling a method in point-free form:

// | xs.map(object/mb/method);           // === xs.map(fn[x][object.method(x)])
//   xs.map(object/mb[method]);          // === xs.map(fn[x][object[method](x)])

// Note that undefined methods are returned as such rather than having a fail-later proxy. (i.e. if foo.bar === undefined, then foo/mb/bar === undefined too) Neither the object nor the property
// (for the indirected version) are evaluated more than once.

// Also useful is side-effecting, which you can do this way:

// | {} /se[_.foo = 'bar']               // === l[_ = {}][_.foo = 'bar', _]

// Conveniently, side-effects can be chained since / is left-associative. An alternative form of side-effecting is the 'right-handed' side-effect (which is still left-associative, despite the
// name), written x /re[y]. This returns the result of evaluating y, where _ is bound to x. Variants of /se and /re allow you to specify a variable name:

// | {} /se.o[o.foo = 'bar']

  tconfiguration('std.qs std.qg std.fn', 'std.obj', function () {
    this.configure('std.qg std.fn').
      rmacro(qs[_/mb/_],    fn[object, method][qse[qg[fn[_o]    [_o.m   && fn_[_o.m.apply  (_o, arguments)]]](o)]   .replace({_o: this.gensym(),                    o: object, m: method})]).
      rmacro(qs[_/mb[_]],   fn[object, method][qse[qg[fn[_o, _m][_o[_m] && fn_[_o[_m].apply(_o, arguments)]]](o, m)].replace({_o: this.gensym(), _m: this.gensym(), o: object, m: method})]).
      rmacro(qs[_/se._[_]], fn[v, n, b][qse[qg[fn[n][b, n]].call(this, v)].replace({b: b, n: n, v: v})]).rmacro(qs[_/se[_]], fn[v, b][qse[v /se._[b]].replace({b: b, v: v})]).
      rmacro(qs[_/re._[_]], fn[v, n, b][qse[qg[fn[n]   [b]].call(this, v)].replace({b: b, n: n, v: v})]).rmacro(qs[_/re[_]], fn[v, b][qse[v /re._[b]].replace({b: b, v: v})])}).

// Binding abbreviations (the 'bind' library).
// Includes forms for defining local variables. One is 'l[bindings] in expression', and the other is 'expression, where[bindings]'. For the second, keep in mind that comma is left-associative.
// This means that you'll get the whole comma-expression placed inside a function, rendering it useless for expressions inside procedure calls. (You'll need parens for that.) Each of these
// expands into a function call; e.g.

// | l[x = 6] in x + y         -> (function (x) {return x + y}).call(this, 6)

// You also get l* and where*, which define their variables in the enclosed scope:

// | l*[x = 6, y = x] in x + y
//   // compiles into:
//   (function () {
//     var x = 6, y = x;
//     return x + y;
//   }).call(this);

// This form has a couple of advantages over the original. First, you can use the values of previous variables; and second, you can define recursive functions:

// | l*[f = fn[x][x > 0 ? f(x - 1) + 1 : x]] in f(5)

// You can also use the less English-like but more expressive l[...][...] syntax:

// | l[x = 5][x + 1]
//   l*[f = fn[x][x > 0 ? f(x - 1) + 1 : x]][f(5)]

// This has the advantage that you no longer need to parenthesize any short-circuit, decisional, or relational logic in the expression.

// The legacy let and let* forms are also supported, but they will cause syntax errors in some Javascript interpreters (hence the change).

  tconfiguration('std.qs std.qg std.fn', 'std.bind', function () {this.configure('std.qg');
    var lf = fb[form][this.rmacro(form, l_expander)], lsf = fb[form][this.rmacro(form, l_star_expander)],
        l_star_expander = fb[vars, expression][qs[qg[function () {var vars; return expression}].call(this)].replace({vars: this.macroexpand(vars), expression: expression})],
        l_expander      = fb[vars, expression][vars = this.macroexpand(vars).flatten(','),
                            qs[qg[function (vars) {return e}].call(this, values)].replace({vars: vars.map(fn[n][n[0]]).unflatten(), e: expression, values: vars.map(fn[n][n[1]]).unflatten()})];

    lf (qs[l [_] in _]), lf (qs[l [_][_]]), lf (this.parse('let [_] in _')), lf (this.parse('let [_][_]')).rmacro(qs[_, where [_]], fn[expression, vars][l_expander(vars, expression)]);
    lsf(qs[l*[_] in _]), lsf(qs[l*[_][_]]), lsf(this.parse('let*[_] in _')), lsf(this.parse('let*[_][_]')).rmacro(qs[_, where*[_]], fn[expression, vars][l_star_expander(vars, expression)])}).

// Assignment abbreviations (the 'lvalue' library).
// Lets you create functions using syntax similar to the one supported in Haskell and OCaml -- for example, f(x) = x + 1. You can extend this too, though Javascript's grammar is not very easy
// to work with on this point. (It's only due to an interesting IE feature (bug) that assigning to a function call is possible in the first place.)

  tconfiguration('std.qs std.qg std.fn', 'std.lvalue', function () {this.rmacro(qs[_(_) = _], fn[base, params, value][qs[base = qg[function (params) {return value}]].
                                                                                                                        replace({base: base, params: params, value: value})])}).

// Conditional abbreviations (the 'cond' library).
// Includes forms for making decisions in perhaps a more readable way than using short-circuit logic. In particular, it lets you do things postfix; i.e. 'do X if Y' instead of 'if Y do X'.

  tconfiguration('std.qs std.fn', 'std.cond', function () {this.configure('std.qg').rmacro(qs[_,   when[_]], fn[expression, cond][qs[  qg[l] && qg[r]].replace({l: cond, r: expression})]).
                                                                                    rmacro(qs[_, unless[_]], fn[expression, cond][qs[! qg[l] && qg[r]].replace({l: cond, r: expression})])}).

// Macro authoring tools (the 'defmacro' library).
// Lisp provides some handy macros for macro authors, including things like (with-gensyms (...) ...) and even (defmacro ...). Writing defmacro is simple because 'this' inside a macroexpander
// refers to the caterwaul function that is running. It is trivial to expand into 'null' and side-effectfully define a new macro on that caterwaul object.

// Another handy macro is 'with_gensyms', which lets you write hygienic macros. For example:

// | defmacro[forEach[_][_]][fn[xs, f][with_gensyms[i, l, xs][(function() {for (var i = 0, xs = _xs, l = xs.length, it; it = xs[i], it < l; ++it) {_body}})()].replace({_xs: xs, _body: f})]];

// This will prevent 'xs', 'l', and 'i' from being visible; here is a sample (truncated) macroexpansion:

// | forEach[[1, 2, 3]][console.log(it)]   ->  (function() {for (var _gensym_gesr8o7u_10fo11_ = 0, _gensym_gesr8o7u_10fo12_ = [1, 2, 3],
//                                                                   _gensym_gesr8o7u_10fo13_ = _gensym_gesr8o7u_10fo12_.length, it;
//                                                               it = _gensym_gesr8o7u_10fo12_[_gensym_...], _gensym_... < ...; ...) {console.log(it)}})()

// Since nobody in their right mind would name a variable _gensym_gesr8o7u_10fo11_, it is effectively collision-proof. (Also, even if you load Caterwaul twice you aren't likely to have gensym
// collisions. The probability of it is one-in-several-billion at least.)

// Note that macros defined with 'defmacro' are persistent; they outlast the function they were defined in. Presently there is no way to define scoped macros. Related to 'defmacro' is 'defsubst',
// which lets you express simple syntactic rewrites more conveniently. Here's an example of a defmacro and an equivalent defsubst:

// | defmacro[_ <equals> _][fn[left, right][qs[left === right].replace({left: left, right: right})]];
//   defsubst[_left <equals> _right][_left === _right];

// Syntax variables are prefixed with underscores; other identifiers are literals.

  tconfiguration('std.qs std.fn std.bind std.lvalue', 'std.defmacro', function () {
    l[wildcard(n) = n.data.constructor === String && n.data.charAt(0) === '_' && '_'] in
    this.macro(qs[defmacro[_][_]], fn[pattern, expansion][this.rmacro(pattern, this.compile(this.macroexpand(expansion))), qs[null]]).
         macro(qs[defsubst[_][_]], fn[pattern, expansion][this.rmacro(pattern.rmap(wildcard), l[wildcards = pattern.collect(wildcard)] in fn_[l[hash = {}, as = arguments]
                                                            [this.util.map(fn[v, i][hash[v.data] = as[i]], wildcards), expansion.replace(hash)]]), qs[null]])}).

  tconfiguration('std.qs std.fn std.bind', 'std.with_gensyms', function () {
    this.rmacro(qs[with_gensyms[_][_]], fn[vars, expansion][l[bindings = {}][vars.flatten(',').each(fb[v][bindings[v.data] = this.gensym()]),
                                                                             qs[qs[_]].replace({_: expansion.replace(bindings)})]])}).

// Compile-time eval (the 'compile_eval' library).
// This is one way to get values into your code (though you don't have closure if you do it this way). Compile-time evals will be bound to the current caterwaul function and the resulting
// expression will be inserted into the code as a reference. The evaluation is done at macro-expansion time, and any macros defined when the expression is evaluated are used.

  tconfiguration('std.qs std.fn', 'std.compile_eval', function () {
    this.macro(qs[compile_eval[_]], fn[e][new this.ref(this.compile(this.macroexpand(qs[fn_[_]].replace({_: e}))).call(this))])}).

// Self-reference (the 'ref' library).
// Sometimes you want to get a reference to 'this Caterwaul function' at runtime. If you're using the anonymous invocation syntax (which I imagine is the most common one), this is actually not
// possible without a macro. This macro provides a way to obtain the current Caterwaul function by writing 'caterwaul'. The expression is replaced by a closure variable that will refer to
// whichever Caterwaul function was used to transform the code.

  tconfiguration('std.qs std.fn', 'std.ref', function () {this.macro(qs[caterwaul], fn_[new this.ref(this)])}).

// String interpolation.
// Rebase provides interpolation of #{} groups inside strings. Caterwaul can do the same using a similar rewrite technique that enables macroexpansion inside #{} groups. It generates a syntax
// tree of the form (+ 'string' (expression) 'string' (expression) ... 'string') -- that is, a flattened variadic +. Strings that do not contain #{} groups are returned as-is.

// There is some weird stuff going on with splitting and bounds here. Most of it is IE6-related workarounds; IE6 has a buggy implementation of split() that fails to return elements inside match
// groups. It also fails to return leading and trailing zero-length strings (so, for example, splitting ':foo:bar:bif:' on /:/ would give ['foo', 'bar', 'bif'] in IE, vs. ['', 'foo', 'bar',
// 'bif', ''] in sensible browsers). So there is a certain amount of hackery that happens to make sure that where there are too few strings empty ones get inserted, etc.

// Another thing that has to happen is that we need to take care of any backslash-quote sequences in the expanded source. The reason is that while generally it's safe to assume that the user
// didn't put any in, Firefox rewrites strings to be double-quoted, escaping any double-quotes in the process. So in this case we need to find \" and replace them with ".

// In case the 'result.push' at the end looks weird, it's OK because result is a syntax node and syntax nodes return themselves when you call push(). If 'result' were an array the code would be
// seriously borked.

  tconfiguration('std.qs std.fn std.bind', 'std.string', function () {
    this.rmacro(qs[_], fn[string]
      [string.is_string() && /#\{[^\}]+\}/.test(string.data) &&
       l*[q = string.data.charAt(0), s = string.as_escaped_string(), eq = new RegExp('\\\\' + q, 'g'), strings = s.split(/#\{[^\}]+\}/), xs = [], result = new this.syntax('+')]
         [s.replace(/#\{([^\}]+)\}/g, fn[_, s][xs.push(s), '']),
          this.util.map(fb[x, i][result.push(new this.syntax(q + (i < strings.length ? strings[i] : '') + q)).push(new this.syntax('(', this.parse(xs[i].replace(eq, q))))], xs),
          new this.syntax('(', result.push(new this.syntax(q + (xs.length < strings.length ? strings[strings.length - 1] : '') + q)).unflatten())]])}).

// Standard configuration.
// This loads all of the production-use extensions.

  configuration('std', function () {this.configure('std.qs std.qg std.bind std.lvalue std.cond std.fn std.obj std.defmacro std.with_gensyms std.ref std.compile_eval std.string')});
// Generated by SDoc 
