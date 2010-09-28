Caterwaul JS
============

A Lisp for JavaScript
---------------------

Caterwaul is the replacement for Divergence. It fixes a number of issues (see the source for details) and takes a more direct approach towards extending JavaScript by encoding quotation and
destructuring-bind syntactic macros. It also, unlike Divergence, has a proper test suite and runs on IE6.

Using Caterwaul
---------------

Caterwaul's API is much like jQuery's. After including the script::

    <script src='http://spencertipping.com/caterwaul/caterwaul.js'></script>

you can refer to a global `caterwaul` function. Since Caterwaul lets you define new macros in a stateful way, you should create a copy of the global function to customize. Here's what that
looks like::

    // The block is optional, but it lets you do the customization all in one place.
    var copy = caterwaul.clone(function () {
      this.macro(...);
      this.other_customization();
    });

Then you can use the copy to introduce macro support into functions.

Defining Macros
---------------

Macros are specified by a pattern and an expansion function. For example, let's define a macro that introduces the syntax `let (x = y) in z` into JavaScript::

    var with_let = caterwaul.clone(function () {
      this.macro(qs[let(_ = _) in _], function (variable, value, expression) {
        return qs[(function (_) {return _}).call(this, _)].s('_', [variable, expression, value]);
      });
    });

    with_let(function () {
      let(x = 5) in alert(x);           // alerts 5
    });

The `qs[]` macro lets you **q**uote **s**yntax, and returns a syntax tree. `_` is used as a wildcard for pattern matching; the matched fragments of syntax are passed into the expander function
in the order that they were listed in the pattern, and the function returns a new syntax tree to replace the old one. In this case, I templated it out using `qs[]` again, but filled it in
using the `s()` method (`s` stands for **s**usbstitute -- inspired by `s//` in Perl). `s` takes a node type and an array of replacements, filling in the template to be `(function (variable)
{return expression}).call(this, value)`.
