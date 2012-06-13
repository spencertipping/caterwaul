 caterwaul . module ('std.js' ,(function ( qs , qs1 , qs2 , qs3 , qs4 , qs5 , qs6 , qs7 , qs8 , qs9 , qsa , qsb , qsc , qsd , qse , qsf , qsg , qsh , qsi , qsj , qsk , qsl , qsm , qsn) {var result1=( function ($) {

// Structured forms in Javascript.
// These aren't macros, but forms. Each language has its own ways of expressing certain idioms; in Javascript we can set up some sensible defaults to make macros more consistent. For example,
// caterwaul pre-1.0 had the problem of wildly divergent macros. The fn[] macro was always prefix and required parameters, whereas /se[] was always postfix and had a single optional parameter.
// /cps[] was similarly postfix, which was especially inappropriate considering that it could theoretically handle multiple parameters.

// In caterwaul 1.0, the macro author's job is reduced to specifying which words have which behavior; the language driver takes care of the rest. For instance, rather than specifying the full
// pattern syntax, you just specify a word and its definition with respect to an opaque expression and perhaps set of modifiers. Here are the standard Javascript macro forms:

  $.js = function (macroexpander) {

// Javascript-specific shorthands.
// Javascript has some syntactic weaknesses that it's worth correcting. These don't relate to any structured macros, but are hacks designed to make JS easier to use.

  // String interpolation.
//   Javascript normally doesn't have this, but it's straightforward enough to add. This macro implements Ruby-style interpolation; that is, "foo#{bar}" becomes "foo" + bar. A caveat (though not
//   bad one in my experience) is that single and double-quoted strings are treated identically. This is because Spidermonkey rewrites all strings to double-quoted form.

  // This version of string interpolation is considerably more sophisticated than the one implemented in prior versions of caterwaul. It still isn't possible to reuse the same quotation marks
//   used on the string itself, but you can now include balanced braces in the interpolated text. For example, this is now valid:

  // | 'foo #{{bar: "bif"}.bar}'

  // There are some caveats; if you have unbalanced braces (even in substrings), it will get confused and misread the boundary of your text. So stuff like this won't work properly:

  // | 'foo #{"{" + bar}'          // won't find the ending properly and will try to compile the closing brace

    var string_interpolator = function (node) {
      var s = node.data, q = s.charAt (0), syntax = $.syntax;
      if (q !== '\'' && q !== '"' || ! /#\{[^\}]+\}/.test (s)) return false;             // DeMorgan's applied to (! ((q === ' || q === ") && /.../test(s)))

      for (var pieces = [ ], is_code = [ ], i = 1, l = s.length - 1, brace_depth = 0, got_hash = false, start = 1, c; i < l; ++i)
        if (brace_depth) if ((c = s.charAt (i)) === '}') --brace_depth || (pieces.push (s.substring (start, i)), is_code.push (true)) && (start = i + 1), got_hash = false;
                    else                                brace_depth += c === '{';
   else                  if ((c = s.charAt (i)) === '#') got_hash = true;
                    else if (c === '{' && got_hash)     pieces.push (s.substring (start, i - 1)), is_code.push (false), start = i + 1, ++brace_depth;
                    else                                got_hash = false;

      pieces.push (s.substring (start, l)), is_code.push (false);

      for (var quoted = new RegExp ('\\\\' + q, 'g'), i = 0, l = pieces.length; i < l; ++i) pieces [i] = is_code [i] ? this ($.parse (pieces [i].replace (quoted, q)).as ('(')):
                                                                                                                    new syntax (q + pieces [i] + q);
      return new syntax ('+', pieces).unflatten ( ).as ('(')};

  // Destructuring function creation.
//   This is a beautiful hack made possible by Internet Explorer. We can intercept cases of assigning into a function and rewrite them to create a function body. For example, f(x) = y becomes the
//   regular assignment f = function (x) {return y}. Because this macro is repeatedly applied we get currying for free.

  // You can put non-formal expressions into the argument list. There are, in fact, three kinds of things you can use:

  // | 1. Formal parameters -- these are transcribed literally into the compiled function's argument list.
//     2. Before-result side effects -- these are compiled into local variables or statements prior to executing the function body.
//     3. After-result side effects -- these are compiled into statements after executing the function body; the function's result is in scope as a variable called 'result'.

  // The general form of destructuring function definitions is:

  // | f(formals, [before], [after]) = ...

  // This is the compiled output (dependent on whether 'before' and 'after' are specified):

  // | // general case                     // no 'before' cases                  // no 'after' cases                     // neither
//     f = function(formals) {             f = function (formals) {              f = function (formals) {                f = function (formals) {
//       before;                             var result = ...;                     before;                                 ;               // <- I'm too lazy to fix this
//       var result = ...;                   after;                                return ...;                             return ...;
//       after;                              return result;                      };                                      };
//       return result;                    };
//     };

  // There are some rules governing how 'before' and 'after' statements are detected and compiled. They are:

  // | 1. Everything is assumed to be a formal until the first parameter that is not a simple identifier.
//     2. Everything that isn't a formal is assumed to be a 'before' expression until the first expression that mentions 'result'.
//     3. Everything after that is assumed to be an 'after' expression.
//     4. Any 'before' or 'after' expression of the form '_variable = ...' is compiled into a local variable definition rather than a simple assignment. This prevents global scope contention.

  // This notation doesn't preclude the possibility of some form of destructuring binds in the future, since there wouldn't be much point to writing a toplevel array or object literal and
//   intending it to be used as a side-effect. (Doing that would just put the value into void context; at that point you might as well leave it out.)

    var function_local_template = qs,  function_bind_pattern = qs1,  function_result_pattern  = qs2,

        function_with_afters         = qs3,
        function_without_afters      = qs4,
        function_assignment_template = qs5,

        function_is_result           = function (n) {return n.is_empty ( ) && n.data === 'result'},

        function_destructure = $.rereplacer ( qs6,
                                            function (match) {for (var formals = [ ], befores = [ ], afters = [ ], ps = match._xs.flatten (','), i = 0, l = ps.length; i < l; ++i)
                                                                (afters.length  || ps [i].contains (function_is_result) ? afters:
                                                                 befores.length || ps [i].length                       ? befores: formals).push (ps [i]);

                                                              // Convert simple assignments into 'var' definitions in-place. Other 'before' and 'after' statements are coerced
                                                              // into expression context by wrapping them in parentheses.
                                                              for (var contains_locals = [befores, afters], i = 0, l = contains_locals.length; i < l; ++i)
                                                                for (var xs = contains_locals [i], j = 0, lj = xs.length, m; j < lj; ++j)
                                                                  xs [j] = (m = function_bind_pattern.match (xs [j])) && m._x.is_empty ( ) ? function_local_template.replace (m):
                                                                                                                                        xs [j].as ('(');
                                                              var new_formals = formals.length ? new $.syntax (',', formals).unflatten ( ): $.empty,
                                                                  new_befores = befores.length ? new $.syntax (';', befores).unflatten ( ): $.empty,
                                                                  new_afters  = afters.length  ? new $.syntax (';', afters) .unflatten ( ): $.empty,

                                                                  template    = function_assignment_template.replace (
                                                                                  {_f: match._f, _x: afters.length ? function_with_afters: function_without_afters});

                                                              return template.replace ({_formals: new_formals, _befores: new_befores, _afters: new_afters, _result: match._y})});

  // Tuple binding.
//   Tuples can be created just like functions but using *= instead of =. The right-hand side is an expression that produces a prototype. This is useful for defining container classes with a few
//   minimal methods without doing all of the setup. Note that the prototype you specify will be referenced, not copied (!) and that its .constructor property will be set to the function.

    var tuple_template    = qs7,
        tuple_constructor = qs8,
        tuple_assignment  = qs9,
        tuple_destructure = $.rereplacer ( qsa,
                                         function (match) {for (var formals = match._xs.flatten (','), assignments = new $.syntax (';'), i = 0, l = formals.length; i < l; ++i)
                                                             assignments.push (tuple_assignment.replace ({_name: formals [i]}));
                                                           return tuple_template.replace ({_f: match._f,  _g: $.gensym ('tuple_ctor'),
                                                                                       _ctor: tuple_constructor.replace ({_formals: formals, _assignments: assignments.unflatten ( )}),
                                                                                  _prototype: match._y})});

  // Infix function application.
//   Caterwaul 1.1.2 introduces infix function notation, which lets the user avoid grouping constructs. x /y /... /-f/z becomes f(x, y, ..., z). The same goes for vertical bar syntax; that is, x
//   |y |... |-f| z also becomes f(x, y, ..., z). This macro respects associativity, so you can do this:

  // | x /!f /-g/ y                // -> g(f(x), y)

  // There used to be two different syntaxes depending on whether you wanted binary or n-ary function application. I realized this was probably overkill since the macro now distributes across
//   parse trees appropriately.

    var infix_function = function (node) {var d = node.data, left, fn;
                                          if ((d === '/' || d === '|') && (left = node [0]).data === d && left [1] && left [1].data === 'u-' && (fn = left [1] [0]))
                                            return new $.syntax ('()', fn, this (left [0]).flatten (d).push (this (node [1])).with_data (',').unflatten ( ))};

  // Infix method application.
//   This is subtly different from infix function application in that a method is called. You might want this when dealing with lots of nested methods, which can otherwise become hard to manage.
//   Like infix function application, this macro respects precedence and associativity.

  // | f /g /~a/ h /~b/ i          // -> ((f).a(g, h)).b(i)

    var infix_method = function (node) {var d = node.data, left, fn;
                                        if ((d === '/' || d === '|') && (left = node [0]).data === d && left [1] && left [1].data === 'u~' && (fn = left [1] [0])) {
                                          var xs = [ ].slice.call (this (node [0] [0]).flatten (d)), object = xs.shift ( );
                                          return new $.syntax ('()', new $.syntax ('.', new $.syntax ('(', object), fn), new $.syntax (',', xs, this (node [1])).unflatten ( ))}};

  // Postfix function application.
//   This is a bit simpler than infix function application and is used when you have a unary function. Sometimes it's simpler to think of a function as a filter than as a wrapper, and this macro
//   makes it easier to do that. This is particularly useful when you have many nested function calls, for instance if you're defining multi-level function composition:

  // | compose(f, g, h)(x) = x /!h /!g /!f         // -> f(g(h(x)))
//     x /y /z /!f                                 // -> f(x, y, z)

    var postfix_function_template = qsb,
        postfix_function          = $.rereplacer ( qsc, function (match) {return postfix_function_template.replace ({_f: match._f,
                                                                                                                           _x: this (match._x).flatten ('/').with_data (',').unflatten ( )})});

  // Literal modification.
//   Caterwaul 1.1.2 introduces literal modification, which provides ways to reinterpret various types of literals at compile-time. These are always written as postfix property accesses, e.g.
//   /foo bar/.x -- here, 'x' is the modifier. Cool as it would be to be able to stack modifiers up, right now Caterwaul doesn't support this. Part of the reason is that I'm too lazy/uninsightful
//   to know how to do it performantly considering the present architecture, but another part of it is that the bugs would become strange and subtle. My goal is to keep the compilation process
//   reasonably transparent, and you can imagine the bizarre chain of events that would occur if someone wrote a modifier that, for instance, returned a different type of literal. It would be
//   utter chaos (though a really cool form of it).

  // Sadly, you can't modify object literals. The reason has to do with syntactic ambiguity. Suppose you've got a function like this:

  // | function () {
//       {foo: 'bar'}.modifier
//       return true;
//     }

  // This function fails to parse under SpiderMonkey, since it assumes that {foo: 'bar'} is a statement-level block with a label 'foo' and a discarded string literal 'bar'. Rather than open this
//   can of worms, I'm just nixing the whole idea of modifying object literals (besides, it doesn't seem particularly useful anyway, though perhaps I'm being myopic about it).

    var modified_literal_form   = $.pattern ( qsd),

        lookup_literal_modifier = function (caterwaul, type, modifier) {var hash = caterwaul.literal_modifiers [type];
                                                                        return hash.hasOwnProperty (modifier) && hash [modifier]},

        literal_modifier        = function (node) {var modified_literal = modified_literal_form.call (this, node), literal, expander;
                                                   if (modified_literal && (literal  = modified_literal._literal) &&
                                                                           (expander = literal.is_identifier ( ) ? lookup_literal_modifier (this, 'identifier', modified_literal._modifier.data):
                                                                                       literal.is_array ( )      ? lookup_literal_modifier (this, 'array',      modified_literal._modifier.data):
                                                                                       literal.is_regexp ( )     ? lookup_literal_modifier (this, 'regexp',     modified_literal._modifier.data):
                                                                                       literal.is_number ( )     ? lookup_literal_modifier (this, 'number',     modified_literal._modifier.data):
                                                                                       literal.is_string ( )     ? lookup_literal_modifier (this, 'string',     modified_literal._modifier.data):
                                                                                                                 null))
                                                     return expander.call (this, literal)};

  // Modifier syntax.
//   These are the 'structured forms' I was talking about above. Prior to caterwaul 1.1 these were stored as individual pre-expanded macros. This had a number of problems, perhaps most notably
//   that it was extremely inefficient. I loaded up caterwaul in the REPL and found that caterwaul.js_ui(caterwaul.js_all()) had 329 macros installed. This meant 329 tree-match tests for every
//   function.

  // Now modifiers are stored on the compiler function directly. Some modifiers take parameters, so there is always some degree of overhead involved in determining whether a modifier case does in
//   fact match. However, there are only a few checks that need to happen before determining whether a modifier match is possible, unlike before.

    var bracket_modifier_form = $.pattern ( qse),               slash_modifier_form = $.pattern ( qsf),
        minus_modifier_form   = $.pattern ( qsg),               in_modifier_form    = $.pattern ( qsh),
        pipe_modifier_form    = $.pattern ( qsi),               comma_modifier_form = $.pattern ( qsj),

        dot_parameters        = $.pattern ( qsk),                bracket_parameters  = $.pattern ( qsl),

        parameterized_wickets = $.pattern ( qsm),  parameterized_minus = $.pattern ( qsn),

        modifier = function (node) {var modifier, parameterized_match = parameterized_wickets.call (this, node) || parameterized_minus.call (this, node);
                                    if (parameterized_match && this.parameterized_modifiers.hasOwnProperty (modifier = parameterized_match._modifier.data)) {
                                      var r = this.parameterized_modifiers [modifier].call (this, parameterized_match);
                                      if (r) return r}

                                    var regular_match = bracket_modifier_form.call (this, node) || slash_modifier_form.call (this, node) ||
                                                        minus_modifier_form  .call (this, node) || in_modifier_form   .call (this, node) ||
                                                        pipe_modifier_form   .call (this, node) || comma_modifier_form.call (this, node);

                                    if (regular_match) {
                                      // Could still be a parameterized function; try to match one of the parameter forms against the modifier.
                                      var parameter_match = dot_parameters    .call (this, regular_match._modifier) ||
                                                            bracket_parameters.call (this, regular_match._modifier);

                                      if (parameter_match) {
                                        regular_match._modifier   = parameter_match._modifier;
                                        regular_match._parameters = parameter_match._parameters;

                                        return this.parameterized_modifiers.hasOwnProperty (modifier = regular_match._modifier.data) &&
                                               this.parameterized_modifiers [modifier].call (this, regular_match)}
                                      else
                                        return this.modifiers.hasOwnProperty (modifier = regular_match._modifier.data) && this.modifiers [modifier].call (this, regular_match)}};

  // Tying it all together.
//   This is where we write a big macroexpander to perform all of the tasks mentioned above. It just falls through cases, which is now a fairly standard pattern for macros. There is a high-level
//   optimization that we can perform: leaf nodes can only be expanded by the string interpolator, so we try this one first and reject any further matching attempts if the node has no children.
//   Because roughly half of the nodes will have no children, this saves on average 5 matching attempts per node.

  // I've got two closures here to avoid putting a conditional in either one of them. In particular, we know already whether we got a macroexpander, so there's no need to test it inside the
//   function (which will be called lots of times).

  // Version 1.3.1 removes any hash-comment prefixes, since these are illegal in Javascript. Normal Javascript comment prefixes are preserved.

    var each_node = function (node) {if (node.prefixes) {
                                     var p =   node.prefixes ( ) |/^#/.test, i =   node.infixes ( ) |/^#/.test, s =   node.suffixes ( ) |/^#/.test; p || i || s &&  

                                     node =  node.thin_clone ( ), p &&  
                                     node.prefix_data =    node.prefix_data %!/^#/.test, i &&  
                                     node.infix_data =    node.infix_data  %!/^#/.test, s &&  
                                     node.suffix_data =    node.suffix_data %!/^#/.test; }

                                     return string_interpolator.call (this, node) || literal_modifier.call (this, node) ||
                                            node.length && (modifier.call (this, node) || function_destructure.call (this, node) || tuple_destructure.call (this, node) ||
                                                            infix_function.call (this, node) || infix_method.call (this, node) || postfix_function.call (this, node))},

        result    = macroexpander ? $ (function (node) {return macroexpander.call (this, node) || each_node.call (this, node)}): $ (each_node);

    result.modifiers               = { };
    result.parameterized_modifiers = { };

    result.literal_modifiers = {regexp: { }, array: { }, string: { }, number: { }, identifier: { }};

    return result}});result1.caterwaul_expression_ref_table =  { qs : ( "new caterwaul.syntax ( \"var\",  new caterwaul.syntax ( \"=\", new caterwaul.syntax ( \"_x\").prefix ( \" \") ,new caterwaul.syntax ( \"_y\").prefix ( \" \")).prefix ( \" \"))") , qs1 : ( "new caterwaul.syntax ( \"=\", new caterwaul.syntax ( \"_x\") ,new caterwaul.syntax ( \"_y\").prefix ( \" \")).prefix ( \" \")") , qs2 : ( "new caterwaul.syntax ( \"result\")") , qs3 : ( "new caterwaul.syntax ( \"function\", new caterwaul.syntax ( \"(\",  new caterwaul.syntax ( \"_formals\")).prefix ( \" \") ,new caterwaul.syntax ( \"{\",  new caterwaul.syntax ( \";\", new caterwaul.syntax ( \";\", new caterwaul.syntax ( \";\", new caterwaul.syntax ( \"_befores\") ,new caterwaul.syntax ( \"var\",  new caterwaul.syntax ( \"=\", new caterwaul.syntax ( \"result\").prefix ( \" \") ,new caterwaul.syntax ( \"_result\").prefix ( \" \")).prefix ( \" \")).prefix ( \" \")) ,new caterwaul.syntax ( \"_afters\").prefix ( \" \")) ,new caterwaul.syntax ( \"return\",  new caterwaul.syntax ( \"result\").prefix ( \" \")).prefix ( \" \"))).prefix ( \" \"))") , qs4 : ( "new caterwaul.syntax ( \"function\", new caterwaul.syntax ( \"(\",  new caterwaul.syntax ( \"_formals\")).prefix ( \" \") ,new caterwaul.syntax ( \"{\",  new caterwaul.syntax ( \";\", new caterwaul.syntax ( \"_befores\") ,new caterwaul.syntax ( \"return\",  new caterwaul.syntax ( \"_result\").prefix ( \" \")).prefix ( \" \"))).prefix ( \" \"))") , qs5 : ( "new caterwaul.syntax ( \"=\", new caterwaul.syntax ( \"_f\") ,new caterwaul.syntax ( \"_x\").prefix ( \" \")).prefix ( \" \")") , qs6 : ( "new caterwaul.syntax ( \"=\", new caterwaul.syntax ( \"()\", new caterwaul.syntax ( \"_f\") ,new caterwaul.syntax ( \"_xs\")).prefix ( \" \") ,new caterwaul.syntax ( \"_y\").prefix ( \" \")).prefix ( \" \")") , qs7 : ( "new caterwaul.syntax ( \"=\", new caterwaul.syntax ( \"_f\") ,new caterwaul.syntax ( \"()\", new caterwaul.syntax ( \".\", new caterwaul.syntax ( \"(\",  new caterwaul.syntax ( \"function\", new caterwaul.syntax ( \"(\",  new caterwaul.syntax ( \"\").prefix ( \" \")).prefix ( \" \") ,new caterwaul.syntax ( \"{\",  new caterwaul.syntax ( \";\", new caterwaul.syntax ( \";\", new caterwaul.syntax ( \";\", new caterwaul.syntax ( \"var\",  new caterwaul.syntax ( \"=\", new caterwaul.syntax ( \"_g\").prefix ( \" \") ,new caterwaul.syntax ( \"_ctor\").prefix ( \" \")).prefix ( \" \")) ,new caterwaul.syntax ( \"=\", new caterwaul.syntax ( \".\", new caterwaul.syntax ( \"_g\").prefix ( \" \") ,new caterwaul.syntax ( \"prototype\")) ,new caterwaul.syntax ( \"_prototype\").prefix ( \" \")).prefix ( \" \")) ,new caterwaul.syntax ( \"=\", new caterwaul.syntax ( \".\", new caterwaul.syntax ( \".\", new caterwaul.syntax ( \"_g\").prefix ( \" \") ,new caterwaul.syntax ( \"prototype\")) ,new caterwaul.syntax ( \"constructor\")) ,new caterwaul.syntax ( \"_g\").prefix ( \" \")).prefix ( \" \")) ,new caterwaul.syntax ( \"return\",  new caterwaul.syntax ( \"_g\").prefix ( \" \")).prefix ( \" \"))).prefix ( \" \"))).prefix ( \" \") ,new caterwaul.syntax ( \"call\")) ,new caterwaul.syntax ( \"this\")).prefix ( \" \")).prefix ( \" \")") , qs8 : ( "new caterwaul.syntax ( \"function\", new caterwaul.syntax ( \"(\",  new caterwaul.syntax ( \"_formals\")).prefix ( \" \") ,new caterwaul.syntax ( \"{\",  new caterwaul.syntax ( \"_assignments\")).prefix ( \" \"))") , qs9 : ( "new caterwaul.syntax ( \"=\", new caterwaul.syntax ( \".\", new caterwaul.syntax ( \"this\") ,new caterwaul.syntax ( \"_name\")) ,new caterwaul.syntax ( \"_name\").prefix ( \" \")).prefix ( \" \")") , qsa : ( "new caterwaul.syntax ( \"*=\", new caterwaul.syntax ( \"()\", new caterwaul.syntax ( \"_f\") ,new caterwaul.syntax ( \"_xs\")).prefix ( \" \") ,new caterwaul.syntax ( \"_y\").prefix ( \" \")).prefix ( \" \")") , qsb : ( "new caterwaul.syntax ( \"()\", new caterwaul.syntax ( \"_f\") ,new caterwaul.syntax ( \"_x\")).prefix ( \" \")") , qsc : ( "new caterwaul.syntax ( \"/\", new caterwaul.syntax ( \"_x\") ,new caterwaul.syntax ( \"u!\",  new caterwaul.syntax ( \"_f\"))).prefix ( \" \")") , qsd : ( "new caterwaul.syntax ( \".\", new caterwaul.syntax ( \"_literal\") ,new caterwaul.syntax ( \"_modifier\"))") , qse : ( "new caterwaul.syntax ( \"[]\", new caterwaul.syntax ( \"_modifier\") ,new caterwaul.syntax ( \"_expression\")).prefix ( \" \")") , qsf : ( "new caterwaul.syntax ( \"/\", new caterwaul.syntax ( \"_expression\") ,new caterwaul.syntax ( \"_modifier\")).prefix ( \" \")") , qsg : ( "new caterwaul.syntax ( \"-\", new caterwaul.syntax ( \"_expression\") ,new caterwaul.syntax ( \"_modifier\")).prefix ( \" \")") , qsh : ( "new caterwaul.syntax ( \"in\", new caterwaul.syntax ( \"_modifier\") ,new caterwaul.syntax ( \"_expression\").prefix ( \" \")).prefix ( \" \")") , qsi : ( "new caterwaul.syntax ( \"|\", new caterwaul.syntax ( \"_expression\") ,new caterwaul.syntax ( \"_modifier\")).prefix ( \" \")") , qsj : ( "new caterwaul.syntax ( \",\", new caterwaul.syntax ( \"_expression\") ,new caterwaul.syntax ( \"_modifier\").prefix ( \" \"))") , qsk : ( "new caterwaul.syntax ( \".\", new caterwaul.syntax ( \"_modifier\") ,new caterwaul.syntax ( \"_parameters\"))") , qsl : ( "new caterwaul.syntax ( \"[]\", new caterwaul.syntax ( \"_modifier\") ,new caterwaul.syntax ( \"_parameters\")).prefix ( \" \")") , qsm : ( "new caterwaul.syntax ( \">\", new caterwaul.syntax ( \"<\", new caterwaul.syntax ( \"_expression\") ,new caterwaul.syntax ( \"_modifier\")).prefix ( \" \") ,new caterwaul.syntax ( \"_parameters\").prefix ( \" \"))") , qsn : ( "new caterwaul.syntax ( \"-\", new caterwaul.syntax ( \"-\", new caterwaul.syntax ( \"_expression\") ,new caterwaul.syntax ( \"_modifier\")).prefix ( \" \") ,new caterwaul.syntax ( \"_parameters\").prefix ( \" \"))")};return(result1)}).call (this, new caterwaul.syntax ( "var",  new caterwaul.syntax ( "=", new caterwaul.syntax ( "_x").prefix ( " ") ,new caterwaul.syntax ( "_y").prefix ( " ")).prefix ( " ")) ,new caterwaul.syntax ( "=", new caterwaul.syntax ( "_x") ,new caterwaul.syntax ( "_y").prefix ( " ")).prefix ( " ") ,new caterwaul.syntax ( "result") ,new caterwaul.syntax ( "function", new caterwaul.syntax ( "(",  new caterwaul.syntax ( "_formals")).prefix ( " ") ,new caterwaul.syntax ( "{",  new caterwaul.syntax ( ";", new caterwaul.syntax ( ";", new caterwaul.syntax ( ";", new caterwaul.syntax ( "_befores") ,new caterwaul.syntax ( "var",  new caterwaul.syntax ( "=", new caterwaul.syntax ( "result").prefix ( " ") ,new caterwaul.syntax ( "_result").prefix ( " ")).prefix ( " ")).prefix ( " ")) ,new caterwaul.syntax ( "_afters").prefix ( " ")) ,new caterwaul.syntax ( "return",  new caterwaul.syntax ( "result").prefix ( " ")).prefix ( " "))).prefix ( " ")) ,new caterwaul.syntax ( "function", new caterwaul.syntax ( "(",  new caterwaul.syntax ( "_formals")).prefix ( " ") ,new caterwaul.syntax ( "{",  new caterwaul.syntax ( ";", new caterwaul.syntax ( "_befores") ,new caterwaul.syntax ( "return",  new caterwaul.syntax ( "_result").prefix ( " ")).prefix ( " "))).prefix ( " ")) ,new caterwaul.syntax ( "=", new caterwaul.syntax ( "_f") ,new caterwaul.syntax ( "_x").prefix ( " ")).prefix ( " ") ,new caterwaul.syntax ( "=", new caterwaul.syntax ( "()", new caterwaul.syntax ( "_f") ,new caterwaul.syntax ( "_xs")).prefix ( " ") ,new caterwaul.syntax ( "_y").prefix ( " ")).prefix ( " ") ,new caterwaul.syntax ( "=", new caterwaul.syntax ( "_f") ,new caterwaul.syntax ( "()", new caterwaul.syntax ( ".", new caterwaul.syntax ( "(",  new caterwaul.syntax ( "function", new caterwaul.syntax ( "(",  new caterwaul.syntax ( "").prefix ( " ")).prefix ( " ") ,new caterwaul.syntax ( "{",  new caterwaul.syntax ( ";", new caterwaul.syntax ( ";", new caterwaul.syntax ( ";", new caterwaul.syntax ( "var",  new caterwaul.syntax ( "=", new caterwaul.syntax ( "_g").prefix ( " ") ,new caterwaul.syntax ( "_ctor").prefix ( " ")).prefix ( " ")) ,new caterwaul.syntax ( "=", new caterwaul.syntax ( ".", new caterwaul.syntax ( "_g").prefix ( " ") ,new caterwaul.syntax ( "prototype")) ,new caterwaul.syntax ( "_prototype").prefix ( " ")).prefix ( " ")) ,new caterwaul.syntax ( "=", new caterwaul.syntax ( ".", new caterwaul.syntax ( ".", new caterwaul.syntax ( "_g").prefix ( " ") ,new caterwaul.syntax ( "prototype")) ,new caterwaul.syntax ( "constructor")) ,new caterwaul.syntax ( "_g").prefix ( " ")).prefix ( " ")) ,new caterwaul.syntax ( "return",  new caterwaul.syntax ( "_g").prefix ( " ")).prefix ( " "))).prefix ( " "))).prefix ( " ") ,new caterwaul.syntax ( "call")) ,new caterwaul.syntax ( "this")).prefix ( " ")).prefix ( " ") ,new caterwaul.syntax ( "function", new caterwaul.syntax ( "(",  new caterwaul.syntax ( "_formals")).prefix ( " ") ,new caterwaul.syntax ( "{",  new caterwaul.syntax ( "_assignments")).prefix ( " ")) ,new caterwaul.syntax ( "=", new caterwaul.syntax ( ".", new caterwaul.syntax ( "this") ,new caterwaul.syntax ( "_name")) ,new caterwaul.syntax ( "_name").prefix ( " ")).prefix ( " ") ,new caterwaul.syntax ( "*=", new caterwaul.syntax ( "()", new caterwaul.syntax ( "_f") ,new caterwaul.syntax ( "_xs")).prefix ( " ") ,new caterwaul.syntax ( "_y").prefix ( " ")).prefix ( " ") ,new caterwaul.syntax ( "()", new caterwaul.syntax ( "_f") ,new caterwaul.syntax ( "_x")).prefix ( " ") ,new caterwaul.syntax ( "/", new caterwaul.syntax ( "_x") ,new caterwaul.syntax ( "u!",  new caterwaul.syntax ( "_f"))).prefix ( " ") ,new caterwaul.syntax ( ".", new caterwaul.syntax ( "_literal") ,new caterwaul.syntax ( "_modifier")) ,new caterwaul.syntax ( "[]", new caterwaul.syntax ( "_modifier") ,new caterwaul.syntax ( "_expression")).prefix ( " ") ,new caterwaul.syntax ( "/", new caterwaul.syntax ( "_expression") ,new caterwaul.syntax ( "_modifier")).prefix ( " ") ,new caterwaul.syntax ( "-", new caterwaul.syntax ( "_expression") ,new caterwaul.syntax ( "_modifier")).prefix ( " ") ,new caterwaul.syntax ( "in", new caterwaul.syntax ( "_modifier") ,new caterwaul.syntax ( "_expression").prefix ( " ")).prefix ( " ") ,new caterwaul.syntax ( "|", new caterwaul.syntax ( "_expression") ,new caterwaul.syntax ( "_modifier")).prefix ( " ") ,new caterwaul.syntax ( ",", new caterwaul.syntax ( "_expression") ,new caterwaul.syntax ( "_modifier").prefix ( " ")) ,new caterwaul.syntax ( ".", new caterwaul.syntax ( "_modifier") ,new caterwaul.syntax ( "_parameters")) ,new caterwaul.syntax ( "[]", new caterwaul.syntax ( "_modifier") ,new caterwaul.syntax ( "_parameters")).prefix ( " ") ,new caterwaul.syntax ( ">", new caterwaul.syntax ( "<", new caterwaul.syntax ( "_expression") ,new caterwaul.syntax ( "_modifier")).prefix ( " ") ,new caterwaul.syntax ( "_parameters").prefix ( " ")) ,new caterwaul.syntax ( "-", new caterwaul.syntax ( "-", new caterwaul.syntax ( "_expression") ,new caterwaul.syntax ( "_modifier")).prefix ( " ") ,new caterwaul.syntax ( "_parameters").prefix ( " ")))) ; 