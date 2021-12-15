Javascript literal notation | Spencer Tipping
Licensed under the terms of the MIT source code license

# Introduction

These macros provide some convenient literal notation for various Javascript literals. For obvious reasons they have names that are unlikely to collide with methods.

```.waul
caterwaul.module('std.js-literals', 'js js_literals', function ($) {
  $.js_literals = function (caterwaul_function) {
```

```.waul
    var function_template = 'function (_) {return _body}'.qs;
```

## Regular expression literals

Right now we just support the 'x' flag, which causes all whitespace within the regular expression to be ignored. This is a straightforward preprocessing transformation, since we have access
to the regexp in string form anyway.

To make Javascript's regular expressions more useful I've also included the 'qf' modifier. This turns a regular expression into a matching function; for example, /foo/.qf becomes (function
(s) {return /foo/.exec(s)}).

```.waul
  (function (r) {r.x  = $.reexpander(function (node) {return node.with_data(node.data.replace(/\s+/g, ''))});
```

```.waul
                 var call_exec_template = '_regexp.exec(_)'.qs;
                 r.qf = function (node) {return function_template.replace({_body: call_exec_template.replace({_regexp: node})})}})(caterwaul_function.literal_modifiers.regexp);
```

## String literals

There are a couple of things we can do with strings. First, there's the 'qw' modifier, which causes a string to be split into an array of words at compile-time. So, for instance, the
expression 'foo bar bif'.qw would be compiled into ['foo', 'bar', 'bif']. Another modifier is 'qh', which is like 'qw' but creates a hash instead. So 'foo bar bif baz'.qh would result in
{foo: 'bar', bif: 'baz'}. There's also qr, which converts from a string to a regular expression and does all of the appropriate escape conversions. Some care should be taken with this,
however, because not all regexp escapes are valid in strings. In particular, you can't do things like 'foo\[bar\]'.qr because \[ isn't recognized in strings.

Another modifier is 'qs', which is rarely used outside of the context of writing macros. The idea here is to have Caterwaul parse the string and return a reference to the parse tree. So, for
example, 'foo.bar'.qs is compiled into a reference to the parse tree for foo.bar. A caveat here is that the parse happens only once, so any mutations that happen to the syntax tree are
persisted across invocations. (Unlike the way that array and object literals are interpreted, which is to create a new array or object each time that node is evaluated.)

Functions can be written concisely using qf. This causes the string to be interpreted as the body of a function whose sole argument is called _. This may change at some point in the future.

```.waul
  (function (s) {s.qw  = $.reexpander(function (node) {for (var array_node = new $.syntax('['), comma = new $.syntax(','), delimiter = node.data.charAt(0),
                                                                pieces = node.as_escaped_string().split(/\s+/), i = 0, l = pieces.length; i < l; ++i)
                                                         comma.push(new $.syntax(delimiter + pieces[i] + delimiter));
                                                       return array_node.push(comma.unflatten())});
```

```.waul
                 s.qh  = $.reexpander(function (node) {for (var hash_node = new $.syntax('{'), comma = new $.syntax(','), delimiter = node.data.charAt(0),
                                                                pieces = node.as_escaped_string().split(/\s+/), i = 0, l = pieces.length; i < l; i += 2)
                                                         comma.push(new $.syntax(':', new $.syntax(delimiter + pieces[i] + delimiter), new $.syntax(delimiter + pieces[i + 1] + delimiter)));
                                                       return hash_node.push(comma.unflatten())});
```

```.waul
                 s.qr  = $.reexpander(function (node) {return node.with_data('/' + node.as_escaped_string().replace(/\//g, '\\/') + '/')});
```

```.waul
                 s.qs  = function (node) {return new $.expression_ref($.syntax_to_expression($.parse(node.as_unescaped_string())), 'qs')};
                 s.qse = function (node) {return new $.expression_ref($.syntax_to_expression(this.call(this, $.parse(node.as_unescaped_string()))), 'qse')};
```

```.waul
                 s.qf  = $.reexpander(function (node) {return function_template.replace({_body: $.parse(node.as_unescaped_string())})})})(caterwaul_function.literal_modifiers.string);
```

```.waul
  return caterwaul_function}});

```