// Caterwaul precompiler | Spencer Tipping
// Licensed under the terms of the MIT source code license

// Precompilation logic.
// Even though Caterwaul operates as a runtime library, most of the time it will be used in a fairly static context. Precompilation can be done to bypass parsing, macroexpansion, and
// serialization of certain functions, significantly accelerating Caterwaul's loading speed.

caterwaul.js.base(function ($) {

//   Precompiled output format.
//   The goal of precompilation is to produce code whose behavior is identical to the original. Caterwaul can do this by taking a function whose behavior we want to emulate. It then executes the
//   function with an annotated copy of the caterwaul compiler, tracing calls to compile(). It assumes, incorrectly in pathological cases, that the macroexpansion step does not side-effect
//   against caterwaul or other escaping values. If it does, the precompiled code won't reflect those side-effects. (Though local side-effects, like defmacro[], will apply within the scope of the
//   function being compiled -- as they normally would, in other words.)

//   The output function performs side-effects necessary to emulate the behavior of your macroexpanded code. All other behavior performed by the precompiled function will be identical to the
//   original. Here's an example of how it is used:

//   | var f = caterwaul.precompile(function () {
//       alert('hi');
//       caterwaul.tconfiguration('std', 'foo', function () {
//         this.macro(qs[foo], qs[bar]);
//       });
//       return 10;
//     });

//   After this statement, f.toString() will look something like this (except all mashed together, because Caterwaul doesn't format generated code):

//   | function () {
//       alert('hi');
//       caterwaul.tconfiguration('std', 'foo', caterwaul.precompiled_internal((function () {
//         var gensym_1 = caterwaul.parse('foo');
//         var gensym_2 = caterwaul.parse('bar');
//         return function () {
//           this.macro(gensym_1, function () {
//             return gensym_2;
//           });
//         })()));
//       return 10;
//     }

//   The precompiled_internal() function returns a reference that will inform Caterwaul not to operate on the function in question. You should (almost) never use this method! It will break all
//   kinds of stuff if you artificially mark functions as being precompiled when they are not.

//   There are some very important things to keep in mind when precompiling things:

//   | 1. Precompiling a function executes that function at compile time! This has some important consequences, perhaps most importantly that if you do something global, you could bork your
//        precompiling environment. The other important consequence is that if some code paths aren't run, those paths won't be precompiled. Caterwaul can only precompile paths that it has
//        traced.
//     2. As mentioned above, Caterwaul assumes that the act of macroexpanding a function will have no side effects. This is not always true, and by design. In particular, stuff in the 'macro'
//        module violates this assumption. So if your code relies on escaping side-effects of the macroexpansion process, the precompiled version will behave differently from the regular version.
//        For instance, if you are using defmacro[], defsubst[], or compile_eval[] and hanging onto the caterwaul function, then the precompiled version will act as if those macros had never been
//        encountered.
//     3. Precompilation doesn't macroexpand the function being precompiled, even if the caterwaul function performing the precompilation has macros defined.
//     4. Most syntax tree refs can't be precompiled! If Caterwaul bumps into one it will throw an error. The only refs that it knows how to handle are (1) itself, and (2) references to syntax
//        trees that don't contain other refs. If you want it to handle other refs, you'll need to write a macro that transforms them into something else before the precompiler sees them.
//        (Actually, the standard library contains a fair amount of this kind of thing to avoid this very problem. Instead of using refs to generated values, it installs values onto the caterwaul
//        global and generates references to them.)
//     5. Caterwaul assumes that compilation is completely deterministic. Any nondeterminism won't be reflected. This generally isn't a problem, it just means that your code may have
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

    nontrivial_function_pattern         = caterwaul.parse('function (_args) {_body}'),
    trivial_function_pattern            = caterwaul.parse('function ()      {_body}'),
    nontrivial_function_gensym_template = caterwaul.parse('function (_args, _gensym) {_body}'),
    trivial_function_gensym_template    = caterwaul.parse('function (_gensym)        {_body}'),

    nontrivial_gensym_detection_pattern = nontrivial_function_gensym_template,
    trivial_gensym_detection_pattern    = trivial_function_gensym_template,

    annotate_macro_generator(template)(references)(match) = result -effect[references[s] = {tree: result}]
                                                                   -where[s      = caterwaul.gensym(),
                                                                          result = template.replace({_args: match._args, _gensym: s, _body: annotate_functions_in(match._body, references)})],

    mark_nontrivial_function_macro = annotate_macro_generator(nontrivial_function_gensym_template),
    mark_trivial_function_macro    = annotate_macro_generator(trivial_function_gensym_template),

//   Macroexpansion for function origins.
//   The function annotation is done by a macro that matches against each embedded function. Only one level of precompilation is applied; if you have invocations of caterwaul from inside
//   transformed functions, these sub-functions won't be identified and thus won't be precompiled. (It's actually impossible to precompile them in the general case since we don't ultimately know
//   what part of the code they came from.)

//   Note that the ordering of trivial and nontrivial cases here is important. Later macros take precedence over earlier ones, so we use the most specific case last and let it fall back to the
//   more generic case.

    annotate_functions_in(tree, references) = caterwaul.macroexpand(tree, [trivial_function_pattern,                nontrivial_function_pattern],
                                                                          [mark_trivial_function_macro(references), mark_nontrivial_function_macro(references)]),

//   Also, an interesting failure case has to do with duplicate compilation:

//   | var f = function () {...};
//     caterwaul.tconfiguration('std', 'foo', f);
//     caterwaul.tconfiguration('macro', 'bar', f);

//   In this example, f() will be compiled twice under two different configurations. But because the replacement happens against the original function (!) due to lack of flow analysis, we won't
//   be able to substitute just one new function for the old one. In this case an error is thrown (see below).

//   Compilation wrapper.
//   Functions that get passed into compile() are assumed to be fully macroexpanded. If the function contains a gensym marker that we're familiar with, then we register the compiled function as
//   the final form of the original. Once the to-be-compiled function returns, we'll have a complete table of marked functions to be converted. We can then do a final pass over the original
//   source, replacing the un-compiled functions with compiled ones.

    function_key(tree) = matches._gensym.data -when.matches -where[matches = nontrivial_gensym_detection_pattern.match(tree) ||
                                                                             trivial_gensym_detection_pattern   .match(tree)],
    mark_as_compiled(references, k, tree, environment) = references[k]
                                                         -effect- wobbly[new Error('detected multiple compilations of #{references[k].tree.serialize()}')] /when[references[k].compiled]
                                                         -effect[references[k].compiled = tree, references[k].environment = environment] -when[k && references[k]],

    wrapped_compile(original, references)(tree, environment) = original.call(this, tree, environment)
                                                               -effect- mark_as_compiled(references, function_key(tree), tree, caterwaul.merge({}, this.globals, environment)),

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

      closure_template                     = caterwaul.parse('(function () {_vars; return (_value)}).call(this)'),
      closure_variable_template            = caterwaul.parse('var _var = _value'),
      closure_null_template                = caterwaul.parse('null'),

      escape_string(s)                     = '\'' + s.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/'/g, '\\\'') + '\'',
      caterwaul_ref_string(configurations) = '\'' + it /over_keys[configurations] + '\'',

//     Detecting caterwaul functions.
//     This can be done by using the is_caterwaul property of caterwaul functions. (Presumably other functions won't have this property, but if they attempt to look like caterwaul functions by
//     taking on its value then there isn't much we can do.) The idea here is to compare this to a known global value and see if it matches up. Only a caterwaul function (we hope) will have the
//     right value for this property, since the value is a unique gensym.

//     Because it's so trivial to handle falsy things (they're all primitives), I've included that case here. Also, the standard library apparently depends on it somehow.

//     There's a nice optimization we can make here. Rather than using parse() to reconstruct syntax trees, we can actually go a step further and build the constructor invocations that will build
//     them up from scratch. This should end up being just a bit faster than parsing, at the expense of larger code. (That said, the code should pack very well under gzip and/or minification.)
//     Another advantage of this optimization is that you can change caterwaul's parse() function without causing problems. This lets you use a caterwaul function as a cross-compiler from another
//     language without breaking native Javascript quotation.

      serialize_syntax(value)          = value.length === 0 ? qs[new caterwaul.syntax(_name)].replace({_name: escape_string(value.data)}) :
                                                              qs[new caterwaul.syntax(_name, _children)].replace({_name: escape_string(value.data), _children: children})
                                                                -where[children = new caterwaul.syntax(',', serialize_syntax(it) -over.value).unflatten()],

      serialize_caterwaul(value)       = qs[caterwaul(_string)].replace({_string: caterwaul_ref_string(value.active_configurations())}),

      serialize_ref(value, name, seen) = ! value                                       ? '#{value}' :
                                         value.constructor  === caterwaul.syntax       ? seen[value.id()] || (seen[value.id()] = name) -returning- serialize_syntax(value) :
                                         value.is_caterwaul === caterwaul.is_caterwaul ? seen[value.id()] || (seen[value.id()] = name) -returning- serialize_caterwaul(value) :
                                                                                         wobbly[new Error('syntax ref value is not serializable: #{value}')],

//     Variable table generation.
//     Now we just dive through the syntax tree, find everything that binds a value, and install a variable for it.

      single_variable(name, value)      = closure_variable_template.replace({_var: name, _value: value}),
      names_and_values_for(environment) = single_variable(it, environment[it]) -over_keys.environment,

      tree_variables(tree)              = vars -effect- tree.reach(given.n in vars.push(single_variable(n.data, serialize_ref(n.value, n.data, seen))) -when[n && n.binds_a_value])
                                               -where[vars = [], seen = {}],

      variables_for(tree, environment)  = bind[all_variables = names_and_values_for(environment).concat(tree_variables(tree))]
                                              [all_variables.length ? new caterwaul.syntax(';', all_variables) : closure_null_template],

//     Closure state generation.
//     This is where it all comes together. Given an original function, we construct a replacement function that has been marked by caterwaul as being precompiled.

      precompiled_closure(tree, environment)  = closure_template.replace({_vars: variables_for(tree, environment), _value: tree}),
      precompiled_function(tree, environment) = signal_already_compiled(precompiled_closure(tree, environment)),

//   Substitution.
//   Once the reference table is fully populated, we perform a final macroexpansion pass against the initial source tree. This time, rather than annotating functions, we replace them with their
//   precompiled versions. The substitute_precompiled() function returns a closure that expects to be used as a macroexpander whose pattern is gensym_detection_pattern.

    substitute_precompiled(references)(match) = precompiled_function(ref.compiled, ref.environment) -when[ref && ref.compiled] -where[ref = references[match._gensym.data]],

    perform_substitution(references, tree)    = caterwaul.macroexpand(tree, [trivial_gensym_detection_pattern, nontrivial_gensym_detection_pattern],
                                                                            [expander,                         expander])
                                                -where[expander = substitute_precompiled(references)],

//     Gensym removal.
//     After we're done compiling we should nuke all of the gensyms we introduced to mark the functions. The remove_gensyms() function does this.

      reconstruct_original(references, match)      = bind[new_match = {_body: remove_gensyms(references, match._body), _args: match._args}]
                                                         [match._args ? nontrivial_function_pattern.replace(new_match) : trivial_function_pattern.replace(new_match)],

      remove_referenced_gensyms(references)(match) = reconstruct_original(references, match) -when[ref && ref.tree] -where[ref = references[match._gensym.data]],

      remove_gensyms(references, tree)             = caterwaul.macroexpand(tree, [trivial_gensym_detection_pattern, nontrivial_gensym_detection_pattern],
                                                                                 [expander,                         expander])
                                                     -where[expander = remove_referenced_gensyms(references)],

//   Tracing.
//   This is where we build the references hash. To do this, we first annotate the functions, build a traced caterwaul, and then run the function that we want to precompile. The traced caterwaul
//   builds references for us.

    annotated_caterwaul(caterwaul, references) = caterwaul.method('compile', wrapped_compile(caterwaul.compile, references)),
    trace_execution(caterwaul, f)              = {references: references, annotated: annotated}
                                                 -effect- caterwaul.compile(annotated, {caterwaul: annotated_caterwaul(caterwaul, references)})()
                                                 -where[references = {}, annotated = annotate_functions_in(caterwaul.parse(f), references)]]})(caterwaul);
// Generated by SDoc 
