// Caterwaul development extensions | Spencer Tipping
// Licensed under the terms of the MIT source code license

// Process extensions.
// These apply to the development process somehow. Precompilation is here because it's something that you'd do at dev-time (pre-deploy) but not something that you have to include in the standard
// library. (The core caterwaul support for precompilation is rudimentary and very small.)



// Caterwaul precompiler | Spencer Tipping
// Licensed under the terms of the MIT source code license

// Precompilation logic.
// Even though Caterwaul operates as a runtime library, most of the time it will be used in a fairly static context. Precompilation can be done to bypass parsing, macroexpansion, and
// serialization of certain functions, significantly accelerating Caterwaul's loading speed.

caterwaul.js_base()(function ($) {

//   Precompiled output format.
//   The goal of precompilation is to produce code whose behavior is identical to the original. Caterwaul can do this by taking a function whose behavior we want to emulate. It then executes the
//   function with an annotated copy of the caterwaul compiler, tracing calls to compile(). It assumes, incorrectly in pathological cases, that the macroexpansion step does not side-effect
//   against caterwaul or other escaping values. If it does, the precompiled code won't reflect those side-effects. (Though local side-effects, like defmacro[], will apply within the scope of the
//   function being compiled -- as they normally would, in other words.)

//   The output function performs side-effects necessary to emulate the behavior of your macroexpanded code. All other behavior performed by the precompiled function will be identical to the
//   original. Here's an example of how it is used:

//   | var f = caterwaul.precompile(function () {
//       alert('hi');
//       caterwaul.js_all()(function () {
//         console.log(x /given.y, qs[foo]);
//       })();
//       return 10;
//     });

//   After this statement, f.toString() will look something like this (except all mashed together, because Caterwaul doesn't format generated code):

//   | function () {
//       alert('hi');
//       caterwaul.js_all()(caterwaul.precompiled_internal((function () {
//         var gensym_1 = new caterwaul.syntax('foo');
//         return function () {
//           console.log(function (y) {return x}, gensym_1);
//         })()))();
//       return 10;
//     }

//   The precompiled_internal() function returns a reference that will inform Caterwaul not to operate on the function in question. You should (almost) never use this method! It will break all
//   kinds of stuff if you artificially mark functions as being precompiled when they are not.

//   There are some very important things to keep in mind when precompiling things:

//   | 1. Precompiling a function executes that function at compile time! This has some important consequences, perhaps most importantly that if you do something global, you could bork your
//        precompiling environment. The other important consequence is that if some code paths aren't run, those paths won't be precompiled. Caterwaul can only precompile paths that it has
//        traced.
//     2. Precompilation doesn't macroexpand the function being precompiled, even if the caterwaul function performing the precompilation has macros defined.
//     3. Most syntax tree refs can't be precompiled! If Caterwaul bumps into one it will throw an error. The only refs that it knows how to handle are (1) itself, and (2) references to syntax
//        trees that don't contain other refs. If you want it to handle other refs, you'll need to write a macro that transforms them into something else before the precompiler sees them.
//        (Actually, the standard library contains a fair amount of this kind of thing to avoid this very problem. Instead of using refs to generated values, it installs values onto the caterwaul
//        global and generates indirect references to them.)
//     4. Caterwaul assumes that compilation is completely deterministic. Any nondeterminism won't be reflected. This generally isn't a problem, it just means that your code may have
//        un-precompiled segments if the precompilation test run didn't cover all of those cases.

//   For most code these concerns won't be a problem at all. But if you're doing anything especially dynamic you might run into one of them.

//   Silliness of runtime precompilation.
//   Obviously it doesn't do much good to precompile stuff at runtime -- the point of precompilation is to save time, but it's too late if the code is already running on an end-user system.
//   Fortunately, precompilation is separable:

//   | // Inside the precompiler:
//     var f = caterwaul.precompile(first_code_chunk);
//     var g = caterwaul.precompile(second_code_chunk);
//     // Later, in end-user code:
//     f();
//     g();

//   As a result, individual Javascript files can be precompiled separately, loaded separately, and run in their original order to perform their original behavior (minus pathological caveats
//   above).

    $.precompile(f) = this.compile(remove_gensyms(traced.references, perform_substitution(traced.references, traced.annotated))) -where[traced = trace_execution(this, f)]
    -where[

//   Tracing function destinations.
//   This is more subtle than you might think. We need to construct a custom traced caterwaul function to pass into the function being precompiled. This caterwaul function delegates
//   macroexpansion to the original one but lets us know when anything is compiled.

//   When a parse() call happens, we'll have a reference to the function being parsed. We can identify which function it came from (in the original syntax tree that is) by marking each of the
//   initial functions with a unique gensym on the end of the parameter list:

//   | function (x, y, z, gensym_foo_bar_bif) {...}

//   This serves as a no-op that lets us track the function from its original parse tree into its final compiled state.

//   Next the function may be macroexpanded. If so, we make sure the gensym tag is on the macroexpanded output (if the output of macroexpansion isn't a function, then it's a side-effect and we
//   can't track it). Finally, the function will be compiled within some environment. This is where we go through the compilation bindings, serializing each one with the function. We then wrap
//   this in an immediately-invoked anonymous function (to create a new scope and to simulate the one created by compile()), and this becomes the output.

//   Note that for these patterns we need to use parse() because Spidermonkey optimizes away non-side-effectful function bodies.

    nontrivial_function_pattern         = $.parse('function (_args) {_body}'),
    trivial_function_pattern            = $.parse('function ()      {_body}'),
    nontrivial_function_gensym_template = $.parse('function (_args, _gensym) {_body}'),
    trivial_function_gensym_template    = $.parse('function (_gensym)        {_body}'),

    nontrivial_gensym_detection_pattern = nontrivial_function_gensym_template,
    trivial_gensym_detection_pattern    = trivial_function_gensym_template,

    annotate_macro_generator(template)(references)(match) = result -effect[references[s] = {tree: result}]
                                                                   -where[s      = $.gensym('mark'),
                                                                          result = template.replace({_args: match._args, _gensym: s, _body: annotate_functions_in(match._body, references)})],

    mark_nontrivial_function_macro = annotate_macro_generator(nontrivial_function_gensym_template),
    mark_trivial_function_macro    = annotate_macro_generator(trivial_function_gensym_template),

//   Macroexpansion for function origins.
//   The function annotation is done by a macro that matches against each embedded function. Only one level of precompilation is applied; if you have invocations of caterwaul from inside
//   transformed functions, these sub-functions won't be identified and thus won't be precompiled. (It's actually impossible to precompile them in the general case since we don't ultimately know
//   what part of the code they came from.)

//   Note that the ordering of trivial and nontrivial cases here is important. Later macros take precedence over earlier ones, so we use the most specific case last and let it fall back to the
//   more generic case.

    annotate_functions_in(tree, references) = $.macroexpand(tree, $.macro(trivial_function_pattern,    mark_trivial_function_macro(references)),
                                                                  $.macro(nontrivial_function_pattern, mark_nontrivial_function_macro(references))),

//   Also, an interesting failure case has to do with duplicate compilation:

//   | var f = function () {...};
//     caterwaul.js_all()(f);
//     caterwaul.js_ui(caterwaul.js_all())(f);

//   In this example, f() will be compiled twice under two different configurations. But because the replacement happens against the original function (!) due to lack of flow analysis, we won't
//   be able to substitute just one new function for the old one. In this case an error is thrown (see below).

//   Compilation wrapper.
//   Functions that get passed into compile() are assumed to be fully macroexpanded. If the function contains a gensym marker that we're familiar with, then we register the compiled function as
//   the final form of the original. Once the to-be-compiled function returns, we'll have a complete table of marked functions to be converted. We can then do a final pass over the original
//   source, replacing the un-compiled functions with compiled ones.

    function_key(tree) = matches._gensym.data -when.matches -where[matches = nontrivial_gensym_detection_pattern.match(tree) ||
                                                                             trivial_gensym_detection_pattern   .match(tree)],
    mark_as_compiled(references, k, tree, environment) = references[k]
                                                         -effect- wobbly[new Error('detected multiple compilations of #{references[k].tree}')] /when[references[k].compiled]
                                                         -effect[references[k].compiled = tree, references[k].environment = environment] -when[k && references[k]],

    wrapped_compile(original, references)(tree, environment, options) = original.call(this, tree, environment, options)
                                                                        -effect- mark_as_compiled(references, function_key(tree), tree, $.merge({}, this._environment || {}, environment)),

//   Generating compiled functions.
//   This involves a few steps, including (1) signaling to the caterwaul function that the function is precompiled and (2) reconstructing the list of syntax refs.

//     Already-compiled signaling.
//     We don't necessarily know /why/ a particular function is being compiled, so it's beyond the scope of this module to try to produce a method call that bypasses this step. Rather, we just
//     inform caterwaul that a function is going to be compiled ahead-of-time, and all caterwaul functions will bypass the compilation step automatically. To do this, we use the dangerous
//     precompiled_internal() method, which returns a placeholder.

      signal_already_compiled(tree) = qs[caterwaul.precompiled_internal(_x)].replace({_x: tree}),

//     Syntax ref serialization.
//     This is the trickiest part. We have to identify ref nodes whose values we're familiar with and pull them out into their own gensym variables. We then create an anonymous scope for them,
//     along with the compiled function, to simulate the closure capture performed by the compile() function.

      closure_template                     = $.parse('(function () {_vars; return (_value)}).call(this)'),
      closure_variable_template            = $.parse('var _var = _value'),
      closure_null_template                = $.parse('null'),

      escape_string(s)                     = '\'' + s.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/'/g, '\\\'') + '\'',

//     Detecting serializable values.
//     Because it's so trivial to handle falsy things (they're all primitives), I've included that case here. Also, the pre-1.0 standard library apparently depends on it somehow.

//     There's a nice optimization we can make here. Rather than using parse() to reconstruct syntax trees, we can actually go a step further and build the constructor invocations that will build
//     them up from scratch. This should end up being just a bit faster than parsing, at the expense of larger code. (That said, the code should pack very well under gzip and/or minification.)
//     Another advantage of this optimization is that you can change caterwaul's parse() function without causing problems. This lets you use a caterwaul function as a cross-compiler from another
//     language without breaking native Javascript quotation.

      serialize_syntax(value)          = value.length === 0 ? qs[new caterwaul.syntax(_name)].replace({_name: escape_string(value.data)}) :
                                                              qs[new caterwaul.syntax(_name, _children)].replace({_name: escape_string(value.data), _children: children})
                                                                -where[children = new $.syntax(',', serialize_syntax(it) -over.value).unflatten()],

      serialize_ref(value, name, seen) = ! value                        ? '#{value}' :
                                         value.constructor === $.syntax ? seen[value.id()] || (seen[value.id()] = name) -returning- serialize_syntax(value) :
                                                                          wobbly[new Error('syntax ref value is not serializable: #{value}')],

//     Variable table generation.
//     Now we just dive through the syntax tree, find everything that binds a value, and install a variable for it.

      single_variable(name, value)      = closure_variable_template.replace({_var: name, _value: value}),
      names_and_values_for(environment) = single_variable(it, environment[it]) -over_keys.environment,

      tree_variables(tree)              = vars -effect- tree.reach(given.n in vars.push(single_variable(n.data, serialize_ref(n.value, n.data, seen))) -when[n && n.binds_a_value])
                                               -where[vars = [], seen = {}],

      variables_for(tree, environment)  = bind[all_variables = names_and_values_for(environment).concat(tree_variables(tree))]
                                              [all_variables.length ? new $.syntax(';', all_variables) : closure_null_template],

//     Closure state generation.
//     This is where it all comes together. Given an original function, we construct a replacement function that has been marked by caterwaul as being precompiled.

      precompiled_closure(tree, environment)  = closure_template.replace({_vars: variables_for(tree, environment), _value: tree}),
      precompiled_function(tree, environment) = signal_already_compiled(precompiled_closure(tree, environment)),

//   Substitution.
//   Once the reference table is fully populated, we perform a final macroexpansion pass against the initial source tree. This time, rather than annotating functions, we replace them with their
//   precompiled versions. The substitute_precompiled() function returns a closure that expects to be used as a macroexpander whose pattern is gensym_detection_pattern.

    substitute_precompiled(references)(match) = precompiled_function(ref.compiled, ref.environment) -when[ref && ref.compiled] -where[ref = references[match._gensym.data]],

    perform_substitution(references, tree)    = $.macroexpand(tree, $.macro(trivial_gensym_detection_pattern, nontrivial_gensym_detection_pattern, substitute_precompiled(references))),

//     Gensym removal.
//     After we're done compiling we should nuke all of the gensyms we introduced to mark the functions. The remove_gensyms() function does this.

      reconstruct_original(references, match)      = bind[new_match = {_body: remove_gensyms(references, match._body), _args: match._args}]
                                                         [match._args ? nontrivial_function_pattern.replace(new_match) : trivial_function_pattern.replace(new_match)],

      remove_referenced_gensyms(references)(match) = reconstruct_original(references, match) -when[ref && ref.tree] -where[ref = references[match._gensym.data]],

      remove_gensyms(references, tree)             = $.macroexpand(tree, $.macro(trivial_gensym_detection_pattern, nontrivial_gensym_detection_pattern, remove_referenced_gensyms(references))),

//   Tracing.
//   This is where we build the references hash. To do this, we first annotate the functions, build a traced caterwaul, and then run the function that we want to precompile. The traced caterwaul
//   builds references for us.

    annotated_caterwaul(caterwaul, references) = caterwaul.clone() -effect[it.compile = wrapped_compile(it.compile, references)],
    trace_execution(caterwaul, f)              = {references: references, annotated: annotated}
                                                 -effect- caterwaul.compile(annotated, {caterwaul: annotated_caterwaul(caterwaul, references)}, {gensym_renaming: false})()
                                                 -where[references = {}, annotated = annotate_functions_in($.parse(f), references)]]})(caterwaul);
// Generated by SDoc 




// Development tooling.
// These assist the development process. Tracing is useful for finding bugs (you normally wouldn't use it in production code), and unit testing has obvious benefits.



// Code trace behavior | Spencer Tipping
// Licensed under the terms of the MIT source code license

// Introduction.
// The 'tracer' function constructs a caterwaul compiler that invokes hooks before and after each expression. You can inspect the value after it is computed and can measure how long it takes to
// return (or whether it fails to return due to an exception being thrown). For example, here's a very simple profiler (it doesn't account for 'own time', just 'total time'):

// | var trace    = caterwaul.tracer(function (expression)        {timings[expression.id()] = timings[expression.id()] || 0; timers.push(+new Date())},
//                                   function (expression, value) {timings[expression.id()] += +new Date() - timers.pop()});
//   var timings  = {};
//   var timers   = [];
//   var profiled = trace(function () {...});      // Annotations inserted during macroexpansion
//   profiled();                                   // This run is measured

// Interface details.
// Tracing things involves modifying the generated expressions in a specific way. First, the tracer marks that an expression will be evaluated. This is done by invoking a 'start' function, which
// then alerts the before-evaluation listener. Then the tracer evaluates the original expression, capturing its output and alerting the listener in the process. Listeners are free to use and/or
// modify this value, but doing so may change how the program runs. (Note that value types are immutable, so in this case no modification will be possible.)

// There is currently no way to catch errors generated by the code. This requires a more aggressive and much slower method of tracing, and most external Javascript debuggers can give you a
// reasonable stack trace. (You can also deduce the error location by observing the discrepancy between before and after events.)

// Here is the basic transformation applied to each expression in the code (where qs[] indicates a reference to the syntax tree):

// | some_expression   ->  (before_hook(qs[some_expression]), after_hook(qs[some_expression], some_expression))

// Note that when you're building up a caterwaul function you'll probably want to trace the code last.

// The reason is that traced code isn't much like the code going in due to the way the transformation works. Another side-effect of tracing is that some of the functions you're tracing will have
// transformed source code. For example, suppose you're tracing this:

// | xs.map(function (x) {return x + 1});

// The sequence of values will include the trace-annotated version of function (x) {return x + 1}, and this function will be seriously gnarly. I've thought of ways to try to fix this, but I
// haven't come up with any good ones yet. If anyone finds one let me know.

// The hard part.
// If Javascript were any kind of sane language this module would be trivial to implement. Unfortunately, however, it is fairly challenging, primarily because of two factors. One is the role of
// statement-mode constructs, which can't be wrapped directly inside function calls. The other is method invocation binding, which requires either (1) no record of the value of the method itself,
// or (2) caching of the object. In this case I've written a special function to handle the caching to reduce the complexity of the generated code.

caterwaul.js_base()(function ($) {
  $.tracer(before, after) = $.clone().macros(expression_macros, statement_macros, hook_macros)
                            -effect [it.init_function(tree) = this.macroexpand(anon('S[_x]').replace({_x: tree}))]

//   Expression-mode transformations.
//   Assuming that we're in expression context, here are the transforms that apply. Notationally, H[] means 'hook this', D[] means 'hook this direct method call', I[] means 'hook this indirect
//   method call', E[] means 'trace this expression recursively', and S[] means 'trace this statement recursively'. A special case V[] is used in conjunction with var statements (see the
//   statement-mode stuff below for a more complete explanation.) It's essentially a simple context-free grammar over tree expressions.

  -where [anon              = $.anonymizer('E', 'S', 'H', 'D', 'I'),
          rule(p, e)        = $.macro(anon(p), e.constructor === Function ? given.match in this.expand(e.call(this, match)) : anon(e)),

          expression_macros = [rule('E[_x]', 'H[_, _x]'),                                                             // Base case: identifier, literal, or empty function
                               rule('E[]',   ''),                                                                     // Base case: oops, descended into nullary something

                               assignment_operator(it) -over- qw('= += -= *= /= %= &= |= ^= <<= >>= >>>='),
                               binary_operator(it)     -over- qw('() [] + - * / % < > <= >= == != === !== in instanceof ^ & | && ||'),
                               unary_operator(it)      -over- qw('+ - ! ~'),

                               rule('E[(_x)]', '(E[_x])'),                                                            // Destructuring of parens
                               rule('E[++_x]', 'H[_, ++_x]'), rule('E[--_x]', 'H[_, --_x]'),                          // Increment/decrement (can't trace original value)
                               rule('E[_x++]', 'H[_, _x++]'), rule('E[_x--]', 'H[_, _x--]'),

                               rule('E[_x, _y]',                 'E[_x], E[_y]'),                                     // Preserve commas -- works in an argument list
                               rule('E[_x._y]',                  'H[_, E[_x]._y]'),                                   // No tracing for constant attributes

                               rule('E[_o._m(_xs)]',             'D[_, E[_o], _m, [E[_xs]]]'),                        // Use D[] to indicate direct method binding
                               rule('E[_o[_m](_xs)]',            'I[_, E[_o], E[_m], [E[_xs]]]'),                     // Use I[] to indicate indirect method binding

                               rule('E[typeof _x]',              'H[_, typeof _x]'),                                  // No tracing for typeof since the value may not exist
                               rule('E[void _x]',                'H[_, void E[_x]]'),                                 // Normal tracing
                               rule('E[delete _x]',              'H[_, delete _x]'),                                  // Lvalue, so no tracing for the original
                               rule('E[delete _x._y]',           'H[_, delete E[_x]._y]'),
                               rule('E[delete _x[_y]]',          'H[_, delete E[_x][E[_y]]]'),
                               rule('E[new _x(_y)]',             'H[_, new H[_x, _x](E[_y])]'),                       // Hook the constructor to prevent method-handling from happening
                               rule('E[{_ps}]',                  'H[_, {E[_ps]}]'),                                   // Hook the final object and distribute across k/v pairs (more)
                               rule('E[_k: _v]',                 '_k: E[_v]'),                                        // Ignore keys (which are constant)
                               rule('E[[_xs]]',                  'H[_, [E[_xs]]]'),                                   // Hook the final array and distribute across elements
                               rule('E[_x ? _y : _z]',           'H[_, E[_x] ? E[_y] : E[_z]]'),
                               rule('E[function ()    {_body}]', 'H[_, function ()    {S[_body]}]'),
                               rule('E[function (_xs) {_body}]', 'H[_, function (_xs) {S[_body]}]')]                  // Trace body in statement mode rather than expression mode

                       -where [assignment_operator(op) = [rule('E[_x     = _y]', 'H[_, _x           = E[_y]]'),
                                                          rule('E[_x[_y] = _z]', 'H[_, E[_x][E[_y]] = E[_z]]'),
                                                          rule('E[_x._y  = _z]', 'H[_, E[_x]._y     = E[_z]]')] -where [t(x)       = anon(x).replace({'=': op}),
                                                                                                                        rule(x, y) = $.macro(t(x), t(y))],

                               binary_operator(op)     = $.macro(anon('E[_x + _y]').replace({'+': op}),    anon('H[_, E[_x] + E[_y]]').replace({'+': op})),
                               unary_operator(op)      = $.macro(anon('E[+_x]').replace({'u+': 'u#{op}'}), anon('H[_, +E[_x]]').replace({'u+': 'u#{op}'})),

                               qw(s)                   = s.split(/\s+/)],

//   Statement-mode transformations.
//   A lot of the time this will drop back into expression mode. However, there are a few cases where we need disambiguation. One is the var statement, where we can't hook the result of the
//   assignment. Another is the {} construct, which can be either a block or an object literal.

//   There's some interesting stuff going on with = and commas. The reason is that sometimes you have var definitions, and they contain = and , trees that can't be traced quite the same way that
//   they are in expressions. For example consider this:

//   | var x = 5, y = 6;

//   In this case we can't evaluate 'x = 5, y = 6' in expression context; if we did, it would produce H[x = H[5]], H[y = H[6]], and this is not valid Javascript within a var statement. Instead,
//   we have to produce x = H[5], y = H[6]. The statement-mode comma and equals rules do exactly that. Note that we don't lose anything by doing this because in statement context the result of an
//   assignment is never used anyway.

//   There's another interesting case regarding var statements. Sometimes you have a var statement like this: 'var x = 5, y' -- in this case, we can't hook the y because it's technically in
//   assignment context. So we need to keep track of the fact that we're within a var statement by using the V[] modifier. (V[] is identical to S[], but used only inside vars.)

          statement_macros = [rule('S[_x]',              'E[_x]'),
                              rule('S[{_x}]',            '{S[_x]}'),
                              rule('S[{}]',              '{}'),                 // Do nothing for an empty block. We know it's a block because it was in statement context.
                              rule('S[_x; _y]',          'S[_x]; S[_y]'),
                              rule('S[_x _y]',           'S[_x] S[_y]'),        // Invisible semicolon case; preserve invisibility.

                              rule('S[break _label]',    'break _label'),       rule('S[for (_x) _y]',                           'for (S[_x]) S[_y]'),
                              rule('S[break]',           'break'),              rule('S[for (_x; _y; _z) _body]',                'for (S[_x]; E[_y]; E[_z]) S[_body]'),
                                                                                rule('S[while (_x) _y]',                         'while (E[_x]) S[_y]'),
                              rule('S[_x, _y]',          'S[_x], S[_y]'),       rule('S[do _x; while (_y)]',                     'do S[_x]; while (E[_y])'),
                              rule('S[_x = _y]',         '_x = E[_y]'),         rule('S[do {_x} while (_y)]',                    'do {S[_x]} while (E[_y])'),
                              rule('V[_x]',              '_x'),
                              rule('V[_x = _y]',         '_x = E[_y]'),         rule('S[try {_x} catch (_e) {_y}]',              'try {S[_x]} catch (_e) {S[_y]}'),
                              rule('V[_x, _y]',          'V[_x], V[_y]'),       rule('S[try {_x} catch (_e) {_y} finally {_z}]', 'try {S[_x]} catch (_e) {S[_y]} finally {S[_z]}'),
                              rule('S[var _xs]',         'var V[_xs]'),         rule('S[try {_x} finally {_y}]',                 'try {S[_x]} finally {S[_y]}'),
                              rule('S[const _xs]',       'const V[_xs]'),
                                                                                rule('S[function _f(_args) {_body}]',            'function _f(_args) {S[_body]}'),
                              rule('S[return _x]',       'return E[_x]'),       rule('S[function _f()      {_body}]',            'function _f()      {S[_body]}'),
                              rule('S[return]',          'return'),
                              rule('S[throw _x]',        'throw E[_x]'),        rule('S[if (_x) _y]',                            'if (E[_x]) S[_y]'),
                                                                                rule('S[if (_x) _y; else _z]',                   'if (E[_x]) S[_y]; else S[_z]'),
                              rule('S[continue _label]', 'continue _label'),    rule('S[if (_x) {_y} else _z]',                  'if (E[_x]) {S[_y]} else S[_z]'),
                              rule('S[continue]',        'continue'),
                                                                                rule('S[switch (_c) {_body}]',                   'switch (E[_c]) {S[_body]}'),
                              rule('S[_label: _stuff]',  '_label: S[_stuff]'),  rule('S[with (_x) _y]',                          'with (E[_x]) S[_y]')],

//   Hook generation.
//   Most of the actual hook generation code is fairly routine for JIT stuff. The patterns here don't actually expand into other state marker patterns; H, D, and I are all terminal. The [1]
//   subscript is a hack. We want to grab the un-annotated tree, but all of the patterns have state markers on them. So we subscript by [1] to get the child of that state annotation.

          hook_macros      = [rule('H[_tree, _x]',                              expression_hook     (match._tree[1], match._x) -given.match),
                              rule('D[_tree, _object, _method, [_parameters]]', direct_method_hook  (match._tree[1], match)    -given.match),
                              rule('I[_tree, _object, _method, [_parameters]]', indirect_method_hook(match._tree[1], match)    -given.match)]

                      -where [before_hook(tree)                                   = before(tree)       /when.before,
                              after_hook(tree, value)                             = after(tree, value) /when.after -returning- value,
                              after_method_hook(tree, object, method, parameters) = before_hook(tree[0]) -then- after_hook(tree[0], resolved) -then-
                                                                                    after_hook(tree, resolved.apply(object, parameters)) -where[resolved = object[method]],

                              before_hook_ref                                     = new $.ref(before_hook),
                              after_hook_ref                                      = new $.ref(after_hook),
                              after_method_hook_ref                               = new $.ref(after_method_hook),

                              quote_method_name(node)                             = '"#{node.data.replace(/(")/g, "\\$1")}"',

                              expression_hook_template                            = $.parse('(_before(_tree), _after(_tree, _expression))'),
                              indirect_method_hook_template                       = $.parse('(_before(_tree), _after(_tree, _object, _method, [_parameters]))'),

                              expression_hook(original, tree)                     = expression_hook_template.replace({_before: before_hook_ref, _after: after_hook_ref,
                                                                                                                      _tree: new $.ref(original), _expression: tree.as('(')}),

                              method_hook(tree, object, method, parameters)       = indirect_method_hook_template.replace({_before: before_hook_ref, _after: after_method_hook_ref,
                                                                                                                           _tree: new $.ref(tree), _object: object, _method: method,
                                                                                                                           _parameters: parameters}),

                              direct_method_hook(tree, match)                     = method_hook(tree, match._object, quote_method_name(match._method), match._parameters),
                              indirect_method_hook(tree, match)                   = method_hook(tree, match._object, match._method,                    match._parameters)]]})(caterwaul);
// Generated by SDoc 





// Unit/integration testing behavior | Spencer Tipping
// Licensed under the terms of the MIT source code license

// Introduction.
// This behavior provides words that are useful for unit testing. It also creates functions on caterwaul to define and handle unit tests. For example, using the unit testing library you can do
// stuff like this:

// | caterwaul.test(function () {
//     'foo'.length -should_be- 3;
//     'foo' -should_not_be- 'bar';
//     // etc
//   });

caterwaul.js_base()(function ($) {
  $.assert(condition, message) = condition || wobbly[new Error(message)];

  $.assertions = {should_be:     given[a, b, statement] in $.assert(a === b, '#{statement.toString()}: #{a} !== #{b}'),
                  should_not_be: given[a, b, statement] in $.assert(a !== b, '#{statement.toString()}: #{a} === #{b}')};

  $.test_case_gensym     = $.gensym();
  $.test_words(language) = $.map(assertion_method, ['should_be', 'should_not_be'])
                           -where [assertion_method(name) = language.parameterized_modifier(name, given.match in qs[caterwaul.assertions._name(_expression, _parameters, _ref)].
                                                                                                                   replace({_expression: match._expression, _parameters: match._parameters,
                                                                                                                            _name: name, _ref: new $.ref(match._)}))];

  $.test_base() = this.clone() -effect- it.macros((it.macros() || []).concat(it.test_words(it.js())));
  $.test(f)     = this.test_base()(f)()})(caterwaul);
// Generated by SDoc 



// Generated by SDoc 
