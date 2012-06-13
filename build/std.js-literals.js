 caterwaul . module ('std.js-literals' ,(function ( qs1 , qs2) {var result=( function ($) {
  $.js_literals = function (caterwaul_function) {

    var function_template = qs1;

  // Regular expression literals.
//   Right now we just support the 'x' flag, which causes all whitespace within the regular expression to be ignored. This is a straightforward preprocessing transformation, since we have access
//   to the regexp in string form anyway.

  // To make Javascript's regular expressions more useful I've also included the 'qf' modifier. This turns a regular expression into a matching function; for example, /foo/.qf becomes (function
//   (s) {return /foo/.exec(s)}).

    (function (r) {r.x  = $.reexpander (function (node) {return node.with_data (node.data.replace (/\s+/g, ''))});

                   var call_exec_template = qs2;
                   r.qf = function (node) {return function_template.replace ({_body: call_exec_template.replace ({_regexp: node})})}}) (caterwaul_function.literal_modifiers.regexp);

  // String literals.
//   There are a couple of things we can do with strings. First, there's the 'qw' modifier, which causes a string to be split into an array of words at compile-time. So, for instance, the
//   expression 'foo bar bif'.qw would be compiled into ['foo', 'bar', 'bif']. Another modifier is 'qh', which is like 'qw' but creates a hash instead. So 'foo bar bif baz'.qh would result in
//   {foo: 'bar', bif: 'baz'}. There's also qr, which converts from a string to a regular expression and does all of the appropriate escape conversions. Some care should be taken with this,
//   however, because not all regexp escapes are valid in strings. In particular, you can't do things like 'foo\[bar\]'.qr because \[ isn't recognized in strings.

  // Another modifier is 'qs', which is rarely used outside of the context of writing macros. The idea here is to have Caterwaul parse the string and return a reference to the parse tree. So, for
//   example, 'foo.bar'.qs is compiled into a reference to the parse tree for foo.bar. A caveat here is that the parse happens only once, so any mutations that happen to the syntax tree are
//   persisted across invocations. (Unlike the way that array and object literals are interpreted, which is to create a new array or object each time that node is evaluated.)

  // Functions can be written concisely using qf. This causes the string to be interpreted as the body of a function whose sole argument is called _. This may change at some point in the future.

    (function (s) {s.qw  = $.reexpander (function (node) {for (var array_node = new $.syntax ('['), comma = new $.syntax (','), delimiter = node.data.charAt (0),
                                                                  pieces = node.as_escaped_string ( ).split (/\s+/), i = 0, l = pieces.length; i < l; ++i)
                                                           comma.push (new $.syntax (delimiter + pieces [i] + delimiter));
                                                         return array_node.push (comma.unflatten ( ))});

                   s.qh  = $.reexpander (function (node) {for (var hash_node = new $.syntax ('{'), comma = new $.syntax (','), delimiter = node.data.charAt (0),
                                                                  pieces = node.as_escaped_string ( ).split (/\s+/), i = 0, l = pieces.length; i < l; i += 2)
                                                           comma.push (new $.syntax (':', new $.syntax (delimiter + pieces [i] + delimiter), new $.syntax (delimiter + pieces [i + 1] + delimiter)));
                                                         return hash_node.push (comma.unflatten ( ))});

                   s.qr  = $.reexpander (function (node) {return node.with_data ('/' + node.as_escaped_string ( ).replace (/\//g, '\\/') + '/')});

                   s.qs  = function (node) {return new $.expression_ref ($.syntax_to_expression ($.parse (node.as_unescaped_string ( ))), 'qs')};
                   s.qse = function (node) {return new $.expression_ref ($.syntax_to_expression (this.call (this, $.parse (node.as_unescaped_string ( )))), 'qse')};

                   s.qf  = $.reexpander (function (node) {return function_template.replace ({_body: $.parse (node.as_unescaped_string ( ))})})}) (caterwaul_function.literal_modifiers.string);

    return caterwaul_function}});result.caterwaul_expression_ref_table =  { qs1 : ( "new caterwaul.syntax ( \"function\", new caterwaul.syntax ( \"(\",  new caterwaul.syntax ( \"_\")).prefix ( \" \") ,new caterwaul.syntax ( \"{\",  new caterwaul.syntax ( \"return\",  new caterwaul.syntax ( \"_body\").prefix ( \" \"))).prefix ( \" \"))") , qs2 : ( "new caterwaul.syntax ( \"()\", new caterwaul.syntax ( \".\", new caterwaul.syntax ( \"_regexp\") ,new caterwaul.syntax ( \"exec\")) ,new caterwaul.syntax ( \"_\")).prefix ( \" \")")};return(result)}).call (this, new caterwaul.syntax ( "function", new caterwaul.syntax ( "(",  new caterwaul.syntax ( "_")).prefix ( " ") ,new caterwaul.syntax ( "{",  new caterwaul.syntax ( "return",  new caterwaul.syntax ( "_body").prefix ( " "))).prefix ( " ")) ,new caterwaul.syntax ( "()", new caterwaul.syntax ( ".", new caterwaul.syntax ( "_regexp") ,new caterwaul.syntax ( "exec")) ,new caterwaul.syntax ( "_")).prefix ( " "))) ; 