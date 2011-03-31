
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

// Local macroexpansion (the 'locally' library).
// Sometimes you want to write a configuration that isn't applied globally, but rather just to a delimited section of code. This macro does just that: You can specify one or more configurations
// and a block of code, and the block of code will be transformed under a Caterwaul clone with those configurations and returned. So, for example:

// | caterwaul.clone('std.locally')(function () {
//     return locally['std'][fn[x][x + 1]];        // General case (especially if you want multiple configurations separated by spaces)
//     return locally[std][fn[x][x + 1]];          // Same thing
//     return locally.std[fn[x][x + 1]];           // Also the same thing
//   });

// Note that the implementation of this isn't terribly efficient. It creates a custom Caterwaul clone for the block in question and then throws that clone away. This probably pales in comparison
// to the macroexpansion process in general, but if your Caterwaul has a ton of configurations applied it could be a performance bottleneck during macroexpansion.

  tconfiguration('std.qs std.bind std.lvalue', 'std.locally', function () {
    l*[t = this, handler(c, e) = t.clone(c.is_string() ? c.as_escaped_string() : c.data).macroexpand(e)] in this.macro(qs[locally[_][_]], handler).macro(qs[locally._[_]], handler)}).

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

  configuration('std', function () {this.configure('std.qs std.qg std.bind std.lvalue std.cond std.fn std.obj std.defmacro std.with_gensyms std.ref std.locally std.compile_eval std.string')});
// Generated by SDoc 

// Caterwaul optimization library | Spencer Tipping
// Licensed under the terms of the MIT source code license

// Introduction.
// JavaScript JIT technology has come a long way, but there are some optimizations that it still isn't very good at performing. One is loop unrolling, which can have a large impact on execution
// speed. Another is function inlining, which may be coming soon but for now also makes a difference. This library provides macros to transform well-factored code into high-performance code.

// Loop unrolling.
// This is probably the most straightforward family of optimizations in the library. If you're using the 'seq' library for iteration, then you will already benefit from these macros; but you can
// also use them directly.

//   Counting loops.
//   Loop unrolling is designed to optimize the most common use of 'for' loops, a loop from zero to some upper boundary. For example:

//   | for (var i = 0, total = 0; i < xs.length; ++i) {
//       console.log(xs[i]);
//       total += xs[i];
//     }

//   Using opt.unroll.
//   The opt.unroll macro takes two bracketed expressions. The first describes the loop parameters and the second is the body to be executed on each iteration. The loop parameters are the
//   variable representing the index, and its upper bound. (At present there is no way to specify a lower loop bound, nor custom incrementing. This may be added later.)

//   Note that there isn't a good way to break out of a loop that's running. Using 'break' directly is illegal because of JavaScript's syntax rules. In the future there will be some mechanism
//   that supports break and perhaps continue, in some form or another.

//   Here is the unrolled version of the for loop described in 'Counting loops':

//   | var total = 0;
//     var x;
//     opt.unroll[i, xs.length][
//       x = xs[i],
//       console.log(x),
//       total += x
//     ];

//   And here is the generated code, reformatted for readability:

//   | var total = 0;
//     var x;
//     (function (_gensym_iterations) {
//       var _gensym_rounds = _gensym_iterations >>> 3;
//       var _gensym_extra  = _gensym_iterations & 7;
//       for (var i = 0; i < _gensym_extra; ++i)
//         x = xs[i], console.log(x), total += x;
//       for (var _gensym_i = 0; _gensym_i < _gensym_rounds; ++_gensym_i) {
//         x = xs[i], console.log(x), total += x; i++;
//         x = xs[i], console.log(x), total += x; i++;
//         x = xs[i], console.log(x), total += x; i++;
//         x = xs[i], console.log(x), total += x; i++;
//         x = xs[i], console.log(x), total += x; i++;
//         x = xs[i], console.log(x), total += x; i++;
//         x = xs[i], console.log(x), total += x; i++;
//         x = xs[i], console.log(x), total += x; i++;
//       }
//       return _gensym_iterations;
//     }) (xs.length);

//   Caveats.
//   Caterwaul's optimizer is not smart about identifying loop invariants or non-side-effectful things about loops. In other words, it really exists only for the purpose of taking the work out of
//   unrolling things or doing similarly mechanical low-level optimization. It also does not optimize algorithms or any other high-level aspects of your code that generally have a more
//   significant performance impact than low-level stuff like loop unrolling.

  caterwaul.tconfiguration('std', 'opt.unroll', function () {this.rmacro(qs[opt.unroll[_, _][_]], fn[variable, iterations, body][
    with_gensyms[l, rs, es, j][qg[function (l) {for (var rs = l >= 0 && l >> 3, es = l >= 0 && l & 7, _i_ = 0; _i_ < es; ++_i_) _body_;
                                                for (var j = 0; j < rs; ++j) {_body_; _i_++; _body_; _i_++; _body_; _i_++; _body_; _i_++;
                                                                              _body_; _i_++; _body_; _i_++; _body_; _i_++; _body_; _i_++}; return l}].call(this, _iterations_)].
    replace({_i_: variable, _body_: body, _iterations_: iterations})])});

// Opt module collection.
// Loading the 'opt' configuration will enable all of the individual macros in the optimization library.

  caterwaul.configuration('opt', function () {this.configure('opt.unroll')});
// Generated by SDoc 

// Continuation manipulation module | Spencer Tipping
// Licensed under the terms of the MIT source code license

// Introduction.
// This module provides macros to assist with continuations. The most widely-known case of continuation manipulation is probably continuation-passing-style conversion, which you use when you do
// nonblocking things such as AJAX. In this case the callback function is the continuation of the call. (I'm not going to fully explain continuations here, but
// http://en.wikipedia.org/wiki/Continuation is a good if intimidating place to start if you're into functional programming -- which I assume you are if you're using Caterwaul :).)

  caterwaul.configuration('continuation.core', function () {this.shallow('continuation', {})}).

// Unwind protection.
// This is how you can implement error handling. You can intercept both the normal and the escaping cases and specify a return value for each alternative. Unwind-protect ultimately compiles into
// a try/catch. Also provided is the unwind[] macro, which causes an unwind through any call/cc operations until an unwind-protect is hit or the toplevel is reached, in which case it shows up as
// an error. unwind[x] is exactly equivalent to (function () {throw x})().

// Unwind-protect is of this form:

// | unwind_protect[<escape>][<body>]      // === caterwaul.continuation.unwind_protect(fn[e][<escape>], fn_[<body>])

// The escape block will be run if any abnormal escaping is being performed (e.g. escaping via call/cc, unwind[], or an exception). Body is executed regardless, and if it returns normally then
// its return value is the return value of the unwind_protect block. The escape block can refer to 'e', the escaping value. 'this' is preserved in the body and escape blocks.

  tconfiguration('std', 'continuation.unwind', function () {
    this.configure('std.fn continuation.core').continuation /se[_.unwind_protect = function (escape, f) {try {return f()} catch (e) {return escape(e)}},
                                                                _.unwind         = function (e) {throw e}];
    this.rmacro(qs[unwind_protect[_][_]], fn[escape, body][qse[_f(fb[e][_escape], fb_[_body])].replace({_f: qs[caterwaul.continuation.unwind_protect], _escape: escape, _body: body})]).
         rmacro(qs[unwind[_]], fn[e][qs[caterwaul.continuation.unwind(_e)].replace({_e: e})])}).

// CPS-conversion.
// Converting a whole program to CPS to get re-entrant continuations is a lot of work, so I'm not even trying that. But localized CPS is really useful, especially for nested AJAX calls and such.
// Here's a common example:

// | $.getJSON('some-url', fn[result]
//     [$.getJSON('some-other-url-#{result.property}', fn[other_result][...])]);

// Rather than dealing with this nesting explicitly, it's more convenient to use normal l-notation. That's exactly what l/cps does:

// | l/cps[result       <- $.getJSON('some-url', _),
//         other_result <- $.getJSON('some-other-url-#{result.property}', _)]
//   [console.log(result)];

// There are a couple of things to note about this setup. First, the arrows. This is so that your continuations can be n-ary. (Javascript doesn't let you assign into a paren-list.)

// | l/cps[(x, y) <- binary_ajax_call('some-url', _)][...];

// Second, and this is important: l/cps returns immediately with the result of the first continuation-producing expression (so in the above example, the return value of binary_ajax_call would be
// the value of the l/cps[][] block). This has some important ramifications, perhaps most importantly that the code in the block must be side-effectful to be productive. No magic is happening
// here; l/cps ultimately gets translated into the set of nested functions that you would otherwise write.

// As of version 0.5.5 the alternative "l/cps[x <- ...] in f(x)" notation is supported (basically, just like regular let-bindings). It's purely a stylistic thing.

// There's also a shorthand form to CPS-convert functions. If you care only about the first parameter (which is true for a lot of functions), you can use the postfix /cps[] form, like this:

// | $.getJSON('foo', _) /cps[alert(_)];
//   $.getJSON('foo', _) /cps.x[alert(x)];         // Also has named form

// Bound variants of both l/cps and /cps[] are also available:

// | $.getJSON('foo', _) /cpb[...];
//   l/cpb[x <- foo(_)][...];

// The legacy let/cps and let/cpb forms are also supported for backwards compatibility.

// There's an interesting scoping bug in Caterwaul <= 0.5.1. Suppose you have a form that binds _ in some context, but doesn't intend for it to be a continuation; for example:

// | f(seq[xs *[_ + 1]], _) /cps[...];

// In this case, _ + 1 is supposed to use the implicitly-bound _, not the outer continuation callback. However, the old continuation logic was perfectly happy to rewrite the term with two
// continuation functions, a semantic disaster. What happens now is a regular lexical binding for _, which has the added benefit that multiple _'s in continuation-rewriting positions will refer
// to the same callback function rather than multiply-evaluating it (though I'm not sure this actually matters...).

  tconfiguration('std', 'continuation.cps', function () {
    l*[cps_convert(v, f, b, bound) = qse[l[_ = _c][_f]].replace({_c: caterwaul.macroexpand(qs[_f[_v][_b]].replace({_f: bound ? qs[fb] : qs[fn]})).replace({_v: v.as('(')[0], _b: b}), _f: f}),

         l_cps_def(t, form, bound) = l[inductive(cs, v, f, b) = qs[l/cps[cs][_f]].replace({cs: cs, _f: cps_convert(v, f, b, bound)}), base(v, f, b) = cps_convert(v, f, b, bound)] in
                                     t.rmacro(qs[l/_form[_, _ <- _] in _].replace({_form: form}), inductive).rmacro(caterwaul.parse('let/#{form.serialize()}[_, _ <- _] in _'), inductive).
                                       rmacro(qs[l/_form[   _ <- _] in _].replace({_form: form}), base)     .rmacro(caterwaul.parse('let/#{form.serialize()}[   _ <- _] in _'), base).
                                       rmacro(qs[l/_form[_, _ <- _][_]]  .replace({_form: form}), inductive).rmacro(caterwaul.parse('let/#{form.serialize()}[_, _ <- _][_]'),   inductive).
                                       rmacro(qs[l/_form[   _ <- _][_]]  .replace({_form: form}), base)     .rmacro(caterwaul.parse('let/#{form.serialize()}[   _ <- _][_]'),   base),

         cps_def(t, form, bound)   = t.rmacro(qs[_ /_form[_]].  replace({_form: form}), fn[f, b][qse[_f /_form._[_b]].replace({_form: form, _f: f, _b: b})]).
                                       rmacro(qs[_ /_form._[_]].replace({_form: form}), fn[f, v, b][qse[l[_ = _c][_f]].replace(
                                         {_c: caterwaul.macroexpand(qs[_f[_v][_b]].replace({_f: bound ? qs[fb] : qs[fn]})).replace({_v: v, _b: b}), _f: f})])] in

    this.configure('std.fn continuation.core') /se[cps_def(_, qs[cps], false), cps_def(_, qs[cpb], true), l_cps_def(_, qs[cps], false), l_cps_def(_, qs[cpb], true)]}).

// Escaping continuations and tail call optimization.
// The most common use for continuations besides AJAX is escaping. This library gives you a way to escape from a loop or other function by implementing a non-reentrant call/cc. You can also use
// tail-call-optimized recursion if your functions are written as such.

// | call/cc[fn[cc][cc(5)]]        // returns 5
//   call/cc[fn[cc][cc(5), 6]]     // still returns 5
//   call/cc[fn[cc][19]]           // returns 19

// Tail calls must be indicated explicitly with call/tail. (Otherwise they'll be regular calls.) For example:

// | var factorial_cps = fn[n, acc, cc][n > 0 ? call/tail[factorial_cps(n - 1, acc * n, cc)] : call/tail[cc(acc)]];
//   call/cc[fn[cc][factorial_cps(5, 1, cc)]];   // -> 120

// In this example it's also legal to call the final continuation 'cc' normally: cc(acc). It's faster to use call/tail[cc(acc)] though. Importantly, continuations lose their bindings! This means
// that tail-calling a method won't do what you want:

// | call/tail[object.method(5)]   // calls object.method with wrong 'this'

// What you can do instead is eta-expand or use Caterwaul's /mb notation (note the extra parens; they're necessary, just as they would be if you were invoking an /mb'd method directly):

// | call/tail[fn[x][object.method(x)](5)];
//   call/tail[(object/mb/method)(5)];             // At this rate you're probably better off using the call_tail function directly.

// Either of these will invoke object.method in the right context.

// Delimited continuations work because call/cc uses an internal while loop to forward parameters outside of the tail call. This keeps the stack bounded by a constant. Note that tail calls work
// only inside a call/cc context. You can use them elsewhere, but they will not do what you want. Also, tail calls really do have to be tail calls. You need to return the call/tail[...]
// expression in order for it to work, just like you'd have to do in Scheme or ML (except that in JS, return is explicit rather than implicit).

// Note that call/cc and call/tail are macros, not functions. The functions are available in normal Javascript form, however (no deep macro-magic is ultimately required to support delimited
// continuations). call/cc is stored as caterwaul.continuation.call_cc, and call/tail is caterwaul.continuation.call_tail. The invocation of call_tail is different from call/tail:

// | caterwaul.continuation.call_tail.call(f, arg1, arg2, ...);

  tconfiguration('std', 'continuation.delimited', function () {
    l[magic = this.configure('std.qg continuation.core').continuation.magic = this.magic('continuation.delimited')] in
    this.continuation /se[_.call_cc     = function (f) {var escaped = false, cc = function (x) {escaped = true; throw x}, frame = {magic: magic, continuation: f, parameters: [cc]};
                                                        try       {while ((frame = frame.continuation.apply(this, frame.parameters)) && frame && frame.magic === magic); return frame}
                                                        catch (e) {if (escaped) return e; else throw e}},
                          _.call_tail() = {magic: magic, continuation: this, parameters: arguments}];

    this.rmacro(qs[call/cc[_]],      fn[f]      [qs[qg[caterwaul.continuation.call_cc.call(this, _f)]].   replace({_f: f})]).
         rmacro(qs[call/tail[_(_)]], fn[f, args][qs[qg[caterwaul.continuation.call_tail.call(_f, _args)]].replace({_f: f, _args: args})])}).

// End-user library.

  configuration('continuation', function () {this.configure('continuation.core continuation.unwind continuation.cps continuation.delimited')});
// Generated by SDoc 

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

// Heap implementation | Spencer Tipping
// Licensed under the terms of the MIT source code license

// Introduction.
// This module provides a basic heap implementation on top of finite caterwaul sequences. The heap is parameterized by a function that orders elements, returning true if the element belongs more
// towards the root and false otherwise. (So a minheap on numbers or strings would use the function fn[x, y][x < y].)

// Usage.
// caterwaul.heap is a function that takes an order function and returns a constructor for heaps implementing that ordering. So, for example:

// | var minheap = caterwaul.heap(fn[x, y][x < y]);
//   var h = new minheap();
//   h.insert(10).insert(20).root()        // -> 10
//   h.rroot()                             // -> 10, removes the root

  caterwaul.tconfiguration('std seq', 'heap', function () {
    this.heap(less) = fc_[null] /se.c[c.prototype = new caterwaul.seq.finite() /se[_.constructor = c] /se[
      _.insert(x) = this.push(x).heapify_up(this.size() - 1),
      _.root()    = this[0],
      _.rroot()   = this[0] /se[this.pop() /se[this[0] = _, this.heapify_down(0), when[this.size()]]],

// Implementation.
// There's some less-than-obvious math going on here. Down-heapifying requires comparing an element to its two children and finding the top of the three. We then swap that element into the top
// position and heapify the tree that we swapped.

// Normally in a heap the array indexes are one-based, but this is inconvenient considering that everything else in Javascript is zero-based. To remedy this, I'm using some makeshift offsets. We
// basically transform the index in one-based space, but then subtract one to get its zero-based offset. Normally the left and right offsets are 2i and 2i + 1, respectively; in this case, here's
// the math:

// | right = 2(i + 1) + 1 - 1 = 2(i + 1)
//   left  = 2(i + 1) - 1     = right - 1

      _.swap(i, j)      = this /se[_[j] = _[i], _[i] = temp, where[temp = _[j]]],
      _.heapify_up(i)   = this /se[_.swap(i, p).heapify_up(p), when[less.call(_, _[i], _[p])], where[p = i >> 1]],
      _.heapify_down(i) = this /se[_.swap(lr, i).heapify_down(lr), unless[lr === i],
                                   where*[s = _.size(), r = i + 1 << 1, l = r - 1, ll = l < s && less.call(_, _[l], _[i]) ? l : i, lr = r < s && less.call(_, _[r], _[ll]) ? r : ll]]]]});
// Generated by SDoc 

// Memoization module | Spencer Tipping
// Licensed under the terms of the MIT source code license

// Introduction.
// This memoizer is implemented a bit differently from Perl's memoize module; this one leaves more up to the user. To mitigate the difficulty involved in using it I've written a couple of default
// proxy functions. The basic model is that functions are assumed to map some 'state' (which obviously involves their arguments, but could involve other things as well) into either a return value
// or an exception. This memoization library lets you introduce a proxy around a function call:

// | var null_proxy = fn[context, args, f][f.apply(context, args)];                                        // Identity memoizer (does no memoization)
//   var memo_proxy = fn[context, args, f][this[args[0]] || (this[args[0]] = f.apply(context, args))];     // Memoizes on first argument
//   var identity = caterwaul.memoize.from(null_proxy);
//   var memoizer = caterwaul.memoize.from(memo_proxy);
//   var fibonacci = memoizer(fn[x][x < 2 ? x : fibonacci(x - 1) + fibonacci(x - 2)]);                     // O(n) time

// Here the 'fstate' argument represents state specific to the function being memoized. 'f' isn't the real function; it's a wrapper that returns an object describing the return value. This object
// contains:

// | 1. The amount of time spent executing the function. This can be used later to expire memoized results (see the 'heap' module for one way to do this).
//   2. Any exceptions thrown by the function.
//   3. Any value returned by the function.

// Internals.
// The core interface is the proxy function, which governs the memoization process at a low level. It is invoked with three parameters: the invocation context, the original 'arguments' object,
// and the function being memoized (wrapped by a helper, explained below). It also receives an implicit fourth as 'this', which is bound to a generic object specific to the memoized function. The
// proxy function owns this object, so it's allowed to manipulate it in any way.

//   Helpers.
//   The function passed into the proxy isn't the original. It's been wrapped by a result handler that captures the full range of things the function can do, including throwing an exception. This
//   guarantees the following things:

//   | 1. The wrapped function will never throw an exception.
//     2. The wrapped function will always return a truthy value, and it will be an object.
//     3. Each invocation of the wrapped function is automatically timed, and the time is accessible via the .time attribute on its return value.

//   The proxy function is expected to return one of these values, which will then be translated into the corresponding real action.

  caterwaul.tconfiguration('std seq continuation', 'memoize', function () {
    this.namespace('memoize') /se.m[m.wrap(f) = fn_[l[as = arguments, start = +new Date()] in unwind_protect[{error: e}][{result: f.apply(this, as)}] /se[_.time = +new Date() - start]]
                                                /se[_.original = f],
                                    m.perform(result) = result.error ? unwind[result.error] : result.result,
                                    m.from(proxy) = fn[f][l[state = {}, g = m.wrap(f)] in fn_[m.perform(proxy.call(state, this, arguments, g))]]]});
// Generated by SDoc 
