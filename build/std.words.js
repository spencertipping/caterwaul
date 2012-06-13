 caterwaul . module ('std.words' ,(function ( qs1 , qs2 , qs3 , qs4 , qs5 , qs6 , qs7 , qs8 , qs9 , qsa , qsb , qsc , qsd , qsf , qsg , qsh , qsi , qsj) {var result=( function ($) { ( function ( ) { var scope_template = qs1 ; return  
  $.words =  function (  caterwaul_function) {   ; return  ($.merge (caterwaul_function.modifiers,               $.words.modifiers),
                                 $.merge (caterwaul_function.parameterized_modifiers, $.words.parameterized_modifiers),
                                 caterwaul_function)},

  $.words.modifiers = { 

// Unparameterized modifiers.
// These are basically flags that you can set on chunks of code.

  // Quotation.
//   qs[] comes from pre-1.0 caterwaul; this lets you quote a piece of syntax, just like quote in Lisp. The idea is that qs[something] returns 'something' as a syntax tree. qse[] is a variant
//   that macroexpands the syntax tree before returning it; this used to be there for performance reasons (now irrelevant with the introduction of precompilation) but is also useful for macro
//   reuse.

    qs :  function (  match) {   ; return  new $.expression_ref ($.syntax_to_expression (match._expression), 'qs')} , 
    qse :  function (  match) {   ; return  new $.expression_ref ($.syntax_to_expression (this (match._expression)), 'qse')} , 

  // Macroexpansion control.
//   Sometimes it's useful to request an additional macroexpansion or suppress macroexpansion for a piece of code. The 'reexpand' and 'noexpand' modifiers do these two things, respectively.

    reexpand :  function (  match) {   ; return  this (this (match._expression))} , 
    noexpand :  function (  match) {   ; return  match._expression} ,

  // Error handling.
//   Javascript in particular has clunky error handling constructs. These words provide error handling in expression context.

    raise : $.reexpander ( qs2) , 

  // Evaluation.
//   Caterwaul 1.1.2 introduces the 'eval' modifier, which lets you force certain expressions to be evaluated at compile-time. A reference containing the resulting value is dropped into the code,
//   and any errors are reported as compile-time errors. The expression being evaluated is macroexpanded under the compiling caterwaul function.

  // Caterwaul 1.2.8 introduces a related modifier, 'ahead', which produces an expression ref. The advantage of this approach is that you can precompile code that uses ahead.

    eval :  function (  match) {   ; return  new $.ref ($.compile (this (match._expression)), 'eval')} , 
    ahead :  function (  match) {   ; return  new $.expression_ref (this (match._expression), 'ahead')} ,

  // Object construction.
//   This is similar to where[], but constructs a hash object instead of binding local variables. The idea is to be able to use the f(x) = x + 1 function notation but end up with an object. You
//   can also use regular assignments, each of which will be converted into a key/value pair:

  // | var o = capture [f(x) = 10, g(x)(y) = x + y];
//     o.g(10)(20)         // -> 30

  // A variant, wcapture, provides local 'where'-style bindings as well as returning the object. This allows the definitions to refer to one another.

    capture : function (match) {for (var comma = new $.syntax (','), bindings = match._expression.flatten (','), i = 0, l = bindings.length; i < l; ++i)
                                   comma.push (this (bindings [i]).with_data (':'));
                                 return new $.syntax ('{', comma.unflatten ( ))} ,

    wcapture : function (match) {for (var e = this (match._expression), comma = new $.syntax (','), bindings = e.flatten (','), node, i = 0, l = bindings.length; i < l; ++i)
                                   (node = this (bindings [i])) [1] = node [0], comma.push (node.with_data (':'));
                                 return scope_template.replace ({_variables: e, _expression: new $.syntax ('{', comma.unflatten ( ))})}},

// Parameterized modifiers.
// These act like binary operators in the sense that they have a left and a right-hand side.

  $.words.parameterized_modifiers = {

  // Function words.
//   These define functions in some form. given[] and bgiven[] are modifiers to turn an expression into a function; given[] creates a regular closure while bgiven[] preserves the closure binding.
//   For example:

  // | var f = x + 1 -given [x];
//     var f = x + 1 -given.x;

    given:  $.reexpander ( qs3),
    bgiven: $.reexpander ( qs4),

  // Error handling.
//   Provides expression-context catching of errors, similar to Ruby's 'rescue' postfix operator.

    rescue: $.reexpander ( qs5),

  // Side-effecting.
//   The goal here is to take an existing value, modify it somehow, and then return it without allocating an actual variable. This can be done using the /se[] adverb. Older versions of caterwaul
//   bound the variable as _; version 1.0 changes this convention to bind the variable to 'it'. For example:

  // | hash(k, v) = {} /se[it[k] = v];
//     compose(f, g)(x) = g(x) -re- f(it);                 // <- you shouldn't ever write it this way, at least not until V8 is better at inlining fictitious closures.

  // Version 1.2 adds the word 'then', which is equivalent to 'se' but doesn't bind 'it'. This removes the overhead associated with creating a closure.

    se:   $.reexpander ( qs6),
    re:   $.reexpander ( qs7),
    then: $.reexpander ( qs8),

  // Assignment.
//   These provide higher-level assignment patterns and allow you to change the precedence of assignment operations. For example, it's common to write something like (x || (x = y)) because
//   Javascript has no ||= operator. Caterwaul provides several modifiers for this:

  // | x -eq- y            -> x = y                                // assign unconditionally
//     x -ocq- y           -> x ? x : x = y                        // cache assign if falsy
//     x -acq- y           -> !x ? x : x = y                       // cache assign if truthy
//     x -dcq- y           -> x !== void 0 ? x : x = y             // cache assign if undefined
//     x -ncq- y           -> x !=  void 0 ? x : x = y             // cache assign if null or undefined

  // I've removed the -oeq-, -aeq-, and related modifiers because they were implicated in so many bugs. They were not intuitive to use because their return value was always cast to a boolean;
//   this is different from what you would expect to happen with something like ||= in Ruby or Perl.

    eq:  $.reexpander ( qs9),

    ocq: $.reexpander ( qsa),  dcq: $.reexpander ( qsb),
    acq: $.reexpander ( qsc),  ncq: $.reexpander ( qsd),

  // Scoping.
//   You can create local variables by using the where[] modifier. If you do this, the locals can all see each other since they're placed into a 'var' statement. For example:

  // | where[x = 10][alert(x)]
//     alert(x), where[x = 10]

    where: $.reexpander ( qsf),

  // Importation.
//   This is a fun one. Caterwaul 1.1.2 introduces the 'using' modifier, which lets you statically import an object. For example:

  // | log(x) -using- console              // -> (function () {var log = console.log; return log(x)}).call(this)

  // Variables are computed at compile-time, not at runtime. This is much better than using the 'with' keyword, which degrades performance ('using' has no significant performance impact).
//   However, the calling context is incomplete, as shown above. In particular, methods of the object that you're using will be called with a global 'this' rather than being bound to the object.

    using: $.reexpander (function (match) {var m = this (match._parameters), o = $.compile (m), comma = new $.syntax (','), expression_ref = new $.expression_ref (m);
                                          for (var k in o) Object.prototype.hasOwnProperty.call (o, k) && /^[_$a-zA-Z][_$0-9a-zA-Z]*$/.test (k) &&
                                                           !this.modifiers.hasOwnProperty (k) && !this.parameterized_modifiers.hasOwnProperty (k) &&
                                                           comma.push (new $.syntax ('=', k, new $.syntax ('.', expression_ref, k)));
                                          return scope_template.replace ({_variables: comma.unflatten ( ), _expression: match._expression})}),

  // Conditionals.
//   These impact whether an expression gets evaluated. x /when.y evaluates to x when y is true, and y when y is false. Similarly, x /unless[y] evaluates to x when y is false, and !y when y is
//   truthy. 'and' and 'or' are provided so that you can change the syntax of short-circuit && and ||.

    when:   $.reexpander ( qsg),    and: $.reexpander ( qsh),
    unless: $.reexpander ( qsi),  or:  $.reexpander ( qsj)}}) . call ( this)});result.caterwaul_expression_ref_table =  { qs1 : ( "new caterwaul.syntax ( \"()\", new caterwaul.syntax ( \".\", new caterwaul.syntax ( \"(\",  new caterwaul.syntax ( \"function\", new caterwaul.syntax ( \"(\",  new caterwaul.syntax ( \"\").prefix ( \" \")).prefix ( \" \") ,new caterwaul.syntax ( \"{\",  new caterwaul.syntax ( \";\", new caterwaul.syntax ( \"var\",  new caterwaul.syntax ( \"_variables\").prefix ( \" \")) ,new caterwaul.syntax ( \"return\",  new caterwaul.syntax ( \"_expression\").prefix ( \" \")).prefix ( \" \"))).prefix ( \" \"))) ,new caterwaul.syntax ( \"call\")) ,new caterwaul.syntax ( \"this\")).prefix ( \" \")") , qs2 : ( "new caterwaul.syntax ( \"()\", new caterwaul.syntax ( \".\", new caterwaul.syntax ( \"(\",  new caterwaul.syntax ( \"function\", new caterwaul.syntax ( \"(\",  new caterwaul.syntax ( \"\").prefix ( \" \")).prefix ( \" \") ,new caterwaul.syntax ( \"{\",  new caterwaul.syntax ( \"throw\",  new caterwaul.syntax ( \"_expression\").prefix ( \" \"))).prefix ( \" \"))) ,new caterwaul.syntax ( \"call\")) ,new caterwaul.syntax ( \"this\")).prefix ( \" \")") , qs3 : ( "new caterwaul.syntax ( \"(\",  new caterwaul.syntax ( \"function\", new caterwaul.syntax ( \"(\",  new caterwaul.syntax ( \"_parameters\")).prefix ( \" \") ,new caterwaul.syntax ( \"{\",  new caterwaul.syntax ( \"return\",  new caterwaul.syntax ( \"_expression\").prefix ( \" \"))).prefix ( \" \")))") , qs4 : ( "new caterwaul.syntax ( \"()\", new caterwaul.syntax ( \"(\",  new caterwaul.syntax ( \"function\", new caterwaul.syntax ( \"(\",  new caterwaul.syntax ( \",\", new caterwaul.syntax ( \"t\") ,new caterwaul.syntax ( \"f\").prefix ( \" \"))).prefix ( \" \") ,new caterwaul.syntax ( \"{\",  new caterwaul.syntax ( \"return\",  new caterwaul.syntax ( \"function\", new caterwaul.syntax ( \"(\",  new caterwaul.syntax ( \"\").prefix ( \" \")).prefix ( \" \") ,new caterwaul.syntax ( \"{\",  new caterwaul.syntax ( \"return\",  new caterwaul.syntax ( \"()\", new caterwaul.syntax ( \".\", new caterwaul.syntax ( \"f\").prefix ( \" \") ,new caterwaul.syntax ( \"apply\")) ,new caterwaul.syntax ( \",\", new caterwaul.syntax ( \"t\") ,new caterwaul.syntax ( \"arguments\").prefix ( \" \"))).prefix ( \" \"))).prefix ( \" \")).prefix ( \" \"))).prefix ( \" \"))) ,new caterwaul.syntax ( \",\", new caterwaul.syntax ( \"this\") ,new caterwaul.syntax ( \"function\", new caterwaul.syntax ( \"(\",  new caterwaul.syntax ( \"_parameters\")).prefix ( \" \") ,new caterwaul.syntax ( \"{\",  new caterwaul.syntax ( \"return\",  new caterwaul.syntax ( \"_expression\").prefix ( \" \"))).prefix ( \" \")).prefix ( \" \"))).prefix ( \" \")") , qs5 : ( "new caterwaul.syntax ( \"()\", new caterwaul.syntax ( \".\", new caterwaul.syntax ( \"(\",  new caterwaul.syntax ( \"function\", new caterwaul.syntax ( \"(\",  new caterwaul.syntax ( \"\").prefix ( \" \")).prefix ( \" \") ,new caterwaul.syntax ( \"{\",  new caterwaul.syntax ( \"try\", new caterwaul.syntax ( \"{\",  new caterwaul.syntax ( \"return\",  new caterwaul.syntax ( \"_expression\").prefix ( \" \"))).prefix ( \" \") ,new caterwaul.syntax ( \"catch\", new caterwaul.syntax ( \"(\",  new caterwaul.syntax ( \"e\")).prefix ( \" \") ,new caterwaul.syntax ( \"{\",  new caterwaul.syntax ( \"return\",  new caterwaul.syntax ( \"_parameters\").prefix ( \" \"))).prefix ( \" \")).prefix ( \" \"))).prefix ( \" \"))) ,new caterwaul.syntax ( \"call\")) ,new caterwaul.syntax ( \"this\")).prefix ( \" \")") , qs6 : ( "new caterwaul.syntax ( \"()\", new caterwaul.syntax ( \".\", new caterwaul.syntax ( \"(\",  new caterwaul.syntax ( \"function\", new caterwaul.syntax ( \"(\",  new caterwaul.syntax ( \"it\")).prefix ( \" \") ,new caterwaul.syntax ( \"{\",  new caterwaul.syntax ( \"return\",  new caterwaul.syntax ( \",\", new caterwaul.syntax ( \"_parameters\").prefix ( \" \") ,new caterwaul.syntax ( \"it\").prefix ( \" \")))).prefix ( \" \"))) ,new caterwaul.syntax ( \"call\")) ,new caterwaul.syntax ( \",\", new caterwaul.syntax ( \"this\") ,new caterwaul.syntax ( \"(\",  new caterwaul.syntax ( \"_expression\")).prefix ( \" \"))).prefix ( \" \")") , qs7 : ( "new caterwaul.syntax ( \"()\", new caterwaul.syntax ( \".\", new caterwaul.syntax ( \"(\",  new caterwaul.syntax ( \"function\", new caterwaul.syntax ( \"(\",  new caterwaul.syntax ( \"it\")).prefix ( \" \") ,new caterwaul.syntax ( \"{\",  new caterwaul.syntax ( \"return\",  new caterwaul.syntax ( \"_parameters\").prefix ( \" \"))).prefix ( \" \"))) ,new caterwaul.syntax ( \"call\")) ,new caterwaul.syntax ( \",\", new caterwaul.syntax ( \"this\") ,new caterwaul.syntax ( \"(\",  new caterwaul.syntax ( \"_expression\")).prefix ( \" \"))).prefix ( \" \")") , qs8 : ( "new caterwaul.syntax ( \"(\",  new caterwaul.syntax ( \",\", new caterwaul.syntax ( \"_expression\") ,new caterwaul.syntax ( \"_parameters\").prefix ( \" \")))") , qs9 : ( "new caterwaul.syntax ( \"=\", new caterwaul.syntax ( \"_expression\") ,new caterwaul.syntax ( \"_parameters\").prefix ( \" \")).prefix ( \" \")") , qsa : ( "new caterwaul.syntax ( \"?\", new caterwaul.syntax ( \"_expression\") ,new caterwaul.syntax ( \"_expression\").prefix ( \" \").infix ( \" \") ,new caterwaul.syntax ( \"=\", new caterwaul.syntax ( \"_expression\").prefix ( \" \") ,new caterwaul.syntax ( \"_parameters\").prefix ( \" \")).prefix ( \" \")).prefix ( \" \")") , qsb : ( "new caterwaul.syntax ( \"?\", new caterwaul.syntax ( \"!==\", new caterwaul.syntax ( \"_expression\") ,new caterwaul.syntax ( \"void\",  new caterwaul.syntax ( \"0\").prefix ( \" \")).prefix ( \" \")).prefix ( \" \") ,new caterwaul.syntax ( \"_expression\").prefix ( \" \").infix ( \" \") ,new caterwaul.syntax ( \"=\", new caterwaul.syntax ( \"_expression\").prefix ( \" \") ,new caterwaul.syntax ( \"_parameters\").prefix ( \" \")).prefix ( \" \")).prefix ( \" \")") , qsc : ( "new caterwaul.syntax ( \"?\", new caterwaul.syntax ( \"u!\",  new caterwaul.syntax ( \"_expression\")) ,new caterwaul.syntax ( \"_expression\").prefix ( \" \").infix ( \" \") ,new caterwaul.syntax ( \"=\", new caterwaul.syntax ( \"_expression\").prefix ( \" \") ,new caterwaul.syntax ( \"_parameters\").prefix ( \" \")).prefix ( \" \")).prefix ( \" \")") , qsd : ( "new caterwaul.syntax ( \"?\", new caterwaul.syntax ( \"!=\", new caterwaul.syntax ( \"_expression\") ,new caterwaul.syntax ( \"void\",  new caterwaul.syntax ( \"0\").prefix ( \" \")).prefix ( \"  \")).prefix ( \" \") ,new caterwaul.syntax ( \"_expression\").prefix ( \" \").infix ( \" \") ,new caterwaul.syntax ( \"=\", new caterwaul.syntax ( \"_expression\").prefix ( \" \") ,new caterwaul.syntax ( \"_parameters\").prefix ( \" \")).prefix ( \" \")).prefix ( \" \")") , qsf : ( "new caterwaul.syntax ( \"()\", new caterwaul.syntax ( \".\", new caterwaul.syntax ( \"(\",  new caterwaul.syntax ( \"function\", new caterwaul.syntax ( \"(\",  new caterwaul.syntax ( \"\").prefix ( \" \")).prefix ( \" \") ,new caterwaul.syntax ( \"{\",  new caterwaul.syntax ( \";\", new caterwaul.syntax ( \"var\",  new caterwaul.syntax ( \"_parameters\").prefix ( \" \")) ,new caterwaul.syntax ( \"return\",  new caterwaul.syntax ( \"_expression\").prefix ( \" \")).prefix ( \" \"))).prefix ( \" \"))) ,new caterwaul.syntax ( \"call\")) ,new caterwaul.syntax ( \"this\")).prefix ( \" \")") , qsg : ( "new caterwaul.syntax ( \"&&\", new caterwaul.syntax ( \"_parameters\") ,new caterwaul.syntax ( \"_expression\").prefix ( \" \")).prefix ( \" \")") , qsh : ( "new caterwaul.syntax ( \"&&\", new caterwaul.syntax ( \"_expression\") ,new caterwaul.syntax ( \"_parameters\").prefix ( \" \")).prefix ( \" \")") , qsi : ( "new caterwaul.syntax ( \"&&\", new caterwaul.syntax ( \"u!\",  new caterwaul.syntax ( \"_parameters\").prefix ( \" \")) ,new caterwaul.syntax ( \"_expression\").prefix ( \" \")).prefix ( \" \")") , qsj : ( "new caterwaul.syntax ( \"||\", new caterwaul.syntax ( \"_expression\") ,new caterwaul.syntax ( \"_parameters\").prefix ( \" \")).prefix ( \" \")")};return(result)}).call (this, new caterwaul.syntax ( "()", new caterwaul.syntax ( ".", new caterwaul.syntax ( "(",  new caterwaul.syntax ( "function", new caterwaul.syntax ( "(",  new caterwaul.syntax ( "").prefix ( " ")).prefix ( " ") ,new caterwaul.syntax ( "{",  new caterwaul.syntax ( ";", new caterwaul.syntax ( "var",  new caterwaul.syntax ( "_variables").prefix ( " ")) ,new caterwaul.syntax ( "return",  new caterwaul.syntax ( "_expression").prefix ( " ")).prefix ( " "))).prefix ( " "))) ,new caterwaul.syntax ( "call")) ,new caterwaul.syntax ( "this")).prefix ( " ") ,new caterwaul.syntax ( "()", new caterwaul.syntax ( ".", new caterwaul.syntax ( "(",  new caterwaul.syntax ( "function", new caterwaul.syntax ( "(",  new caterwaul.syntax ( "").prefix ( " ")).prefix ( " ") ,new caterwaul.syntax ( "{",  new caterwaul.syntax ( "throw",  new caterwaul.syntax ( "_expression").prefix ( " "))).prefix ( " "))) ,new caterwaul.syntax ( "call")) ,new caterwaul.syntax ( "this")).prefix ( " ") ,new caterwaul.syntax ( "(",  new caterwaul.syntax ( "function", new caterwaul.syntax ( "(",  new caterwaul.syntax ( "_parameters")).prefix ( " ") ,new caterwaul.syntax ( "{",  new caterwaul.syntax ( "return",  new caterwaul.syntax ( "_expression").prefix ( " "))).prefix ( " "))) ,new caterwaul.syntax ( "()", new caterwaul.syntax ( "(",  new caterwaul.syntax ( "function", new caterwaul.syntax ( "(",  new caterwaul.syntax ( ",", new caterwaul.syntax ( "t") ,new caterwaul.syntax ( "f").prefix ( " "))).prefix ( " ") ,new caterwaul.syntax ( "{",  new caterwaul.syntax ( "return",  new caterwaul.syntax ( "function", new caterwaul.syntax ( "(",  new caterwaul.syntax ( "").prefix ( " ")).prefix ( " ") ,new caterwaul.syntax ( "{",  new caterwaul.syntax ( "return",  new caterwaul.syntax ( "()", new caterwaul.syntax ( ".", new caterwaul.syntax ( "f").prefix ( " ") ,new caterwaul.syntax ( "apply")) ,new caterwaul.syntax ( ",", new caterwaul.syntax ( "t") ,new caterwaul.syntax ( "arguments").prefix ( " "))).prefix ( " "))).prefix ( " ")).prefix ( " "))).prefix ( " "))) ,new caterwaul.syntax ( ",", new caterwaul.syntax ( "this") ,new caterwaul.syntax ( "function", new caterwaul.syntax ( "(",  new caterwaul.syntax ( "_parameters")).prefix ( " ") ,new caterwaul.syntax ( "{",  new caterwaul.syntax ( "return",  new caterwaul.syntax ( "_expression").prefix ( " "))).prefix ( " ")).prefix ( " "))).prefix ( " ") ,new caterwaul.syntax ( "()", new caterwaul.syntax ( ".", new caterwaul.syntax ( "(",  new caterwaul.syntax ( "function", new caterwaul.syntax ( "(",  new caterwaul.syntax ( "").prefix ( " ")).prefix ( " ") ,new caterwaul.syntax ( "{",  new caterwaul.syntax ( "try", new caterwaul.syntax ( "{",  new caterwaul.syntax ( "return",  new caterwaul.syntax ( "_expression").prefix ( " "))).prefix ( " ") ,new caterwaul.syntax ( "catch", new caterwaul.syntax ( "(",  new caterwaul.syntax ( "e")).prefix ( " ") ,new caterwaul.syntax ( "{",  new caterwaul.syntax ( "return",  new caterwaul.syntax ( "_parameters").prefix ( " "))).prefix ( " ")).prefix ( " "))).prefix ( " "))) ,new caterwaul.syntax ( "call")) ,new caterwaul.syntax ( "this")).prefix ( " ") ,new caterwaul.syntax ( "()", new caterwaul.syntax ( ".", new caterwaul.syntax ( "(",  new caterwaul.syntax ( "function", new caterwaul.syntax ( "(",  new caterwaul.syntax ( "it")).prefix ( " ") ,new caterwaul.syntax ( "{",  new caterwaul.syntax ( "return",  new caterwaul.syntax ( ",", new caterwaul.syntax ( "_parameters").prefix ( " ") ,new caterwaul.syntax ( "it").prefix ( " ")))).prefix ( " "))) ,new caterwaul.syntax ( "call")) ,new caterwaul.syntax ( ",", new caterwaul.syntax ( "this") ,new caterwaul.syntax ( "(",  new caterwaul.syntax ( "_expression")).prefix ( " "))).prefix ( " ") ,new caterwaul.syntax ( "()", new caterwaul.syntax ( ".", new caterwaul.syntax ( "(",  new caterwaul.syntax ( "function", new caterwaul.syntax ( "(",  new caterwaul.syntax ( "it")).prefix ( " ") ,new caterwaul.syntax ( "{",  new caterwaul.syntax ( "return",  new caterwaul.syntax ( "_parameters").prefix ( " "))).prefix ( " "))) ,new caterwaul.syntax ( "call")) ,new caterwaul.syntax ( ",", new caterwaul.syntax ( "this") ,new caterwaul.syntax ( "(",  new caterwaul.syntax ( "_expression")).prefix ( " "))).prefix ( " ") ,new caterwaul.syntax ( "(",  new caterwaul.syntax ( ",", new caterwaul.syntax ( "_expression") ,new caterwaul.syntax ( "_parameters").prefix ( " "))) ,new caterwaul.syntax ( "=", new caterwaul.syntax ( "_expression") ,new caterwaul.syntax ( "_parameters").prefix ( " ")).prefix ( " ") ,new caterwaul.syntax ( "?", new caterwaul.syntax ( "_expression") ,new caterwaul.syntax ( "_expression").prefix ( " ").infix ( " ") ,new caterwaul.syntax ( "=", new caterwaul.syntax ( "_expression").prefix ( " ") ,new caterwaul.syntax ( "_parameters").prefix ( " ")).prefix ( " ")).prefix ( " ") ,new caterwaul.syntax ( "?", new caterwaul.syntax ( "!==", new caterwaul.syntax ( "_expression") ,new caterwaul.syntax ( "void",  new caterwaul.syntax ( "0").prefix ( " ")).prefix ( " ")).prefix ( " ") ,new caterwaul.syntax ( "_expression").prefix ( " ").infix ( " ") ,new caterwaul.syntax ( "=", new caterwaul.syntax ( "_expression").prefix ( " ") ,new caterwaul.syntax ( "_parameters").prefix ( " ")).prefix ( " ")).prefix ( " ") ,new caterwaul.syntax ( "?", new caterwaul.syntax ( "u!",  new caterwaul.syntax ( "_expression")) ,new caterwaul.syntax ( "_expression").prefix ( " ").infix ( " ") ,new caterwaul.syntax ( "=", new caterwaul.syntax ( "_expression").prefix ( " ") ,new caterwaul.syntax ( "_parameters").prefix ( " ")).prefix ( " ")).prefix ( " ") ,new caterwaul.syntax ( "?", new caterwaul.syntax ( "!=", new caterwaul.syntax ( "_expression") ,new caterwaul.syntax ( "void",  new caterwaul.syntax ( "0").prefix ( " ")).prefix ( "  ")).prefix ( " ") ,new caterwaul.syntax ( "_expression").prefix ( " ").infix ( " ") ,new caterwaul.syntax ( "=", new caterwaul.syntax ( "_expression").prefix ( " ") ,new caterwaul.syntax ( "_parameters").prefix ( " ")).prefix ( " ")).prefix ( " ") ,new caterwaul.syntax ( "()", new caterwaul.syntax ( ".", new caterwaul.syntax ( "(",  new caterwaul.syntax ( "function", new caterwaul.syntax ( "(",  new caterwaul.syntax ( "").prefix ( " ")).prefix ( " ") ,new caterwaul.syntax ( "{",  new caterwaul.syntax ( ";", new caterwaul.syntax ( "var",  new caterwaul.syntax ( "_parameters").prefix ( " ")) ,new caterwaul.syntax ( "return",  new caterwaul.syntax ( "_expression").prefix ( " ")).prefix ( " "))).prefix ( " "))) ,new caterwaul.syntax ( "call")) ,new caterwaul.syntax ( "this")).prefix ( " ") ,new caterwaul.syntax ( "&&", new caterwaul.syntax ( "_parameters") ,new caterwaul.syntax ( "_expression").prefix ( " ")).prefix ( " ") ,new caterwaul.syntax ( "&&", new caterwaul.syntax ( "_expression") ,new caterwaul.syntax ( "_parameters").prefix ( " ")).prefix ( " ") ,new caterwaul.syntax ( "&&", new caterwaul.syntax ( "u!",  new caterwaul.syntax ( "_parameters").prefix ( " ")) ,new caterwaul.syntax ( "_expression").prefix ( " ")).prefix ( " ") ,new caterwaul.syntax ( "||", new caterwaul.syntax ( "_expression") ,new caterwaul.syntax ( "_parameters").prefix ( " ")).prefix ( " "))) ; 