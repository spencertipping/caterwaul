Caterwaul JS
============

A Lisp for JavaScript
---------------------

Caterwaul is the replacement for Divergence. It fixes a number of issues (see the source for details) and takes a more direct approach towards extending JavaScript by encoding quotation and
destructuring-bind syntactic macros. It also, unlike Divergence, has a proper test suite and runs on IE6. (Please visit the `test page <http://spencertipping.com/caterwaul/test>`_ and let me
know if anything fails. My goal is to make this project completely cross-browser, at least starting with IE6.)

Documentation is in the doc/ directory (in the form of applied guides; these should be a great place to start), and the annotated source is up at
http://spencertipping.com/caterwaul/caterwaul.html. Another way to learn Caterwaul is to experiment with the `live compiler <http://spencertipping.com/caterwaul/compiler>`_.

Using Caterwaul
---------------

Caterwaul's API is much like jQuery's. After including the script::

    <script src='http://spencertipping.com/caterwaul/caterwaul.js'></script>

you can refer to a global ``caterwaul`` function. The global ``caterwaul`` has no macros defined, but you can get a new Caterwaul compiler with a standard set of macros by doing this::

    var c = caterwaul.clone('std');

Then you can start compiling functions::

    c(function () {
      let[x = 6, y = 10] in alert(x + y);
      some_array.map(fn[x][x + 1]);
    })();

If you plan on using modules, I recommend including the full script instead (it takes care of module-to-module dependencies by loading things in the right order)::

    <script src='http://spencertipping.com/caterwaul/caterwaul.all.js'></script>

Documentation
-------------

This README isn't intended to document Caterwaul; to learn how to use it, I recommend starting off with `Client-Side Caterwaul
<http://spencertipping.com/caterwaul/doc/client-side-caterwaul.pdf>`_ and, then, if you're feeling adventurous, reading the `annotated source code
<http://spencertipping.com/caterwaul/caterwaul.html>`_. 
