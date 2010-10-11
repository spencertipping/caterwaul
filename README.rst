Caterwaul JS
============

A Lisp for JavaScript
---------------------

Caterwaul is the replacement for Divergence. It fixes a number of issues (see the source for details) and takes a more direct approach towards extending JavaScript by encoding quotation and
destructuring-bind syntactic macros. It also, unlike Divergence, has a proper test suite and runs on IE6. (Please visit the `test page <http://spencertipping.com/caterwaul/test>`_, and let me
know if anything fails. My goal is to make this project completely cross-browser, at least starting with IE6.)

Online documentation is available at `http://spencertipping.com/caterwaul/caterwaul.html`_.

Using Caterwaul
---------------

Caterwaul's API is much like jQuery's. After including the script::

    <script src='http://spencertipping.com/caterwaul/caterwaul.js'></script>

you can refer to a global ``caterwaul`` function. Since Caterwaul lets you define new macros in a stateful way, you should create a copy of the global function to customize. Here's what that
looks like::

    // The block is optional, but it lets you do the customization all in one place.
    var copy = caterwaul.clone(function () {
      this.macro(...);
      this.other_customization();
    });

Then you can use the copy to introduce macro support into functions.

Defining Macros
---------------

Macros are specified by a pattern and an expansion function. For example, let's define a macro that introduces the syntax ``let (x = y) in z`` into JavaScript::

    var with_let = caterwaul.clone('qs', function () {
      this.macro(qs[let(_ = _) in _], function (variable, value, expression) {
        return qs[(function (_) {return _}).call(this, _)].s('_', [variable, expression, value]);
      });
    });

    with_let(function () {
      let(x = 5) in alert(x);           // alerts 5
    });

The ``qs[]`` macro lets you quote syntax, and returns a syntax tree (we need to include ``'qs'`` to enable it). ``_`` is used as a wildcard for pattern matching; the matched fragments of
syntax are passed into the expander function in the order that they were listed in the pattern, and the function returns a new syntax tree to replace the old one. In this case, I templated it
out using ``qs[]`` again, but filled it in using the ``s()`` method (`s` stands for substitute -- inspired by ``s//`` in Perl). ``s`` takes a node type and an array of replacements, filling in
the template to be ``(function (variable) {return expression}).call(this, value)``.

Standard Macro Library
----------------------

Caterwaul comes with some standard macro libraries. To get access to them::

    var with_fn = caterwaul.clone('fn');
    with_fn(function () {
      // Function creation:
      var x = fn[y][y + 1](6);          // Now x is 7

      // Let-bindings:
      let [z = 10, t = 1] in z + t;     // Returns 11

      // Where-bindings (Haskell-style, sort of)
      q + w, where[q = 15, w = 5];      // Returns 20

      // When and unless:
      console.log(10), when[true];
      console.log(10), unless[false];
    });

    var with_string = caterwaul.clone('string');
    with_string(function () {
      // String interpolation with #{} blocks:
      var s = '3 + 5 is #{3 + 5}';      // Now s is '3 + 5 is 8'
    });

    var with_dfn = caterwaul.clone('dfn');
    with_dfn(function () {
      // Divergence-style inline functions:
      var f = x >$> x + 1;
      f(5);                             // Returns 6
    });

Another library enables the ``defmacro[][]`` command::

    var with_defmacro = caterwaul.clone('qs', 'fn', 'defmacro');
    with_defmacro(function () {
      // Defining inline macros:
      defmacro[foo[_]][fn[thing][qs[console.log(_)].s('_', thing)]];
      foo[5];
      foo[7];

      // Using gensyms:
      defmacro[forEach[_][_]]
              [fn[array, body]
                 [with_gensyms[i, l, xs][(function () {
                  for (var i = 0, xs = _, l = xs.length, it; it = xs[i], i < l; ++i) {
                    _
                  }})()].s('_', [array, body])]];

      // Logs 1, then 2, then 3:
      forEach[[1, 2, 3]][console.log(it)];
    });

Generally you should use the ``'std'`` library, which includes all of the ones that ship with Caterwaul.

The Caterwaul source code and tests cover the uses of ``defmacro`` and ``with_gensyms`` in more detail.
