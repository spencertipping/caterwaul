// Javascript-specific macros | Spencer Tipping
// Licensed under the terms of the MIT source code license

(function ($) {

// Structured forms in Javascript.
// These aren't macros, but forms. Each language has its own ways of expressing certain idioms; in Javascript we can set up some sensible defaults to make macros more consistent. For example,
// caterwaul pre-1.0 had the problem of wildly divergent macros. The fn[] macro was always prefix and required parameters, whereas /se[] was always postfix and had a single optional parameter.
// /cps[] was similarly postfix, which was especially inappropriate considering that it could theoretically handle multiple parameters.

// In caterwaul 1.0, the macro author's job is reduced to specifying which words have which behavior; the language driver takes care of the rest. For instance, rather than specifying the full
// pattern syntax, you just specify a word and its definition with respect to an opaque expression and perhaps set of modifiers. Here are the standard Javascript macro forms:

  $.js = function () {
    var macro  = function (name, expander) {return function (template) {return $.macro        ($.parse(template).replace({_modifiers: $.parse(name)}), expander)}};
    var macros = function (name, expander) {return function (template) {return result.modifier($.parse(template).replace({_modifiers: $.parse(name)}), expander)}};

    var result = {modifier:               this.right_variadic(function (name, expander) {
                                            return $.map(macro(name, expander), ['_expression /_modifiers', '_expression -_modifiers', '_expression |_modifiers', '_expression._modifiers',
                                                                                 '_modifiers[_expression]', '_modifiers in _expression', '_expression, _modifiers'])}),

                  parameterized_modifier: this.right_variadic(function (name, expander) {
                                            return [$.map(macros(name, expander), ['_modifiers[_parameters]', '_modifiers._parameters']),
                                                    $.map(macro(name, expander),  ['_expression <_modifiers> _parameters', '_expression -_modifiers- _parameters'])]}),

// Javascript-specific shorthands.
// Javascript has some syntactic weaknesses that it's worth correcting. These don't relate to any structured macros, but are hacks designed to make JS easier to use.

                  macros: [

//   Javascript intrinsic verbs.
//   These are things that you can do in statement mode but not expression mode.

    this.macro('wobbly[_x]', '(function () {throw _x}).call(this)'),
    this.macro('safely[_x][_catch]', '(function () {try {return (_x)} catch (e) {return (_catch)}}).call(this)'),

//   String interpolation.
//   Javascript normally doesn't have this, but it's straightforward enough to add. This macro implements Ruby-style interpolation; that is, "foo#{bar}" becomes "foo" + bar. A caveat (though not
//   bad one in my experience) is that single and double-quoted strings are treated identically. This is because Spidermonkey rewrites all strings to double-quoted form.

//   This version of string interpolation is considerably more sophisticated than the one implemented in prior versions of caterwaul. It still isn't possible to reuse the same quotation marks
//   used on the string itself, but you can now include balanced braces in the interpolated text. For example, this is now valid:

//   | 'foo #{{bar: "bif"}.bar}'

//   There are some caveats; if you have unbalanced braces (even in substrings), it will get confused and misread the boundary of your text. So stuff like this won't work properly:

//   | 'foo #{"{" + bar}'          // won't find the ending properly and will try to compile the closing brace

    function (node) {
      var s = node.data, q = s.charAt(0), syntax = $.syntax;
      if (q !== '\'' && q !== '"' || ! /#\{[^\}]+\}/.test(s)) return false;             // DeMorgan's applied to (! ((q === ' || q === ") && /.../test(s)))

      for (var pieces = [], i = 1, l = s.length - 1, brace_depth = 0, got_hash = false, start = 1, c; i < l; ++i)
        if (brace_depth) if ((c = s.charAt(i)) === '}') --brace_depth || pieces.push(s.substring(start, i)) && (start = i + 1), got_hash = false;
                    else                                brace_depth += c === '{';
   else                  if ((c = s.charAt(i)) === '#') got_hash = true;
                    else if (c === '{' && got_hash)     pieces.push(s.substring(start, i - 1)), start = i + 1, ++brace_depth;
                    else                                got_hash = false;

      pieces.push(s.substring(start, l));

      for (var quoted = new RegExp('\\\\' + q, 'g'), i = 0, l = pieces.length; i < l; ++i) pieces[i] = i & 1 ? this.expand($.parse(pieces[i].replace(quoted, q)).as('(')) :
                                                                                                               new syntax(q + pieces[i] + q);
      return new syntax('+', pieces).unflatten().as('(')},

//   Destructuring function creation.
//   This is a beautiful hack made possible by Internet Explorer. We can intercept cases of assigning into a function and rewrite them to create a function body. For example, f(x) = y becomes the
//   regular assignment f = function (x) {return y}. Because this macro is repeatedly applied we get currying for free.

//   There's a special case. You can grab the whole arguments array by setting something equal to it. For example, f(xs = arguments) = xs[0] + xs[1]. This makes it easy to use binding constructs
//   inside the body of the function without worrying whether you'll lose the function context.

    this.macro('_left(_args) = _right',            '_left = (function (_args) {return _right})'),
    this.macro('_left(_var = arguments) = _right', '_left = (function () {var _var = arguments; return _right})')]};

    return result}})(caterwaul);
// Generated by SDoc 
