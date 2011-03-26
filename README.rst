Caterwaul JS
============

A Lisp for JavaScript
---------------------

Caterwaul is the replacement for Divergence. It fixes a number of issues (see the source for details) and takes a more direct approach towards extending JavaScript by encoding quotation and
destructuring-bind syntactic macros. It also, unlike Divergence, has a proper test suite and runs on IE6. (Please visit the `test page <http://spencertipping.com/caterwaul/test>`_ and let me
know if anything fails. My goal is to make this project completely cross-browser, at least starting with IE6.)

As of version 0.5.4, all of the standard library works IE6, IE7, IE8, Google Chrome, Firefox 3.5, and Safari. The sequence library didn't work on IE7 before this version.

Documentation is in the doc/ directory (in the form of applied guides; these should be a great place to start), and the annotated source is up at
http://spencertipping.com/caterwaul/caterwaul.html. Another way to learn Caterwaul is to experiment with the `live compiler <http://spencertipping.com/caterwaul/compiler>`_.

Using Caterwaul
---------------

Caterwaul's API is much like jQuery's. After including the script (there's a regular ``caterwaul.js``, but it doesn't have any modules)::

    <script src='http://spencertipping.com/caterwaul/caterwaul.all.js'></script>

you can refer to a global ``caterwaul`` function. The global ``caterwaul`` has no macros defined, but you can get a new Caterwaul compiler with a standard set of macros by doing this::

    var c = caterwaul.clone('std');     // For all of the examples below, change 'std' to 'std seq continuation'

Then you can start compiling functions::

    c(function () {                                                                     // c(f) decompiles f and returns a new function
      let[x = 6, y = 10] in alert(x + y);                                               // expands into (function (x, y) {return alert(x + y)}).call(this, 6, 10)
      some_array.map(fn[x][x + k]), where[k = 10];                                      // fn[x][x + k] expands into function (x) {return x + k}, and
                                                                                        // ..., where[k = 10] is the same as let[k = 10] in ...

      var point = fc[x, y][this.x = x, this.y = y]                                      // fc[...][...] builds a constructor function (one without a return)
        /se[_.prototype.distance() = Math.sqrt(this.x * this.x + this.y * this.y),      // x /se[...] evaluates ... with _ bound to x, then returns x
            _.prototype.toString() = '<#{this.x}, #{this.y}>'];                         // f(...) = y is the same as f = fn[...][y]

      console.log('The distance is #{new point(3, 4).distance()}');                     // #{} blocks in strings are interpolated as they are in Ruby

      defsubst[log < _x][console.log(_x)];                                              // defines a substitution macro (you can use defmacro for Turing completeness)
      log < 'Macro!';                                                                   // expands into console.log('Macro!')

      var f = console/mb/log;                                                           // retrieves console.log as a bound method
      f('This will work');                                                              // f doesn't require explicit 'this'-binding; it's persistently bound to console

      // Using the 'continuation' module:
      var factorial = fn[n, acc, k][n > 0 ? call/tail[factorial(n - 1, acc * n, k)] : k(acc)];
      console.log('5! = #{call/cc[fn[k][factorial(5, 1, k)]]}');                        // call/cc creates a delimited continuation

      // Using the 'seq' module:
      // Note that there's some macro-magic going on here. modules/caterwaul.seq.js.sdoc
      // contains an explanation of the notation. You can also write it longhand (see the
      // example in modules/caterwaul.seq.test/finite.quantifiers.js.sdoc).
      var from_two         = seq[2 >>>[_ + 1]];                                                 // Infinite stream of naturals starting with 2
      var primes           = seq[from_two %~n[from_two <<[_ <= Math.sqrt(n)] &[n % _]]];        // Infinite stream of prime numbers
      var primes_below_100 = seq[primes <<[_ < 100]];                                           // Finite sequence of prime numbers

      console.log('The primes below 100 are #{primes_below_100.join(", ")}');
    })();

Documentation
-------------

This README isn't intended to document Caterwaul; to learn how to use it, I recommend starting off with `Client-Side Caterwaul
<http://spencertipping.com/caterwaul/doc/client-side-caterwaul.pdf>`_. If you're feeling adventurous, you might also want to check out the `annotated source code
<http://spencertipping.com/caterwaul/caterwaul.html>`_.

Hacking Caterwaul
-----------------

All of the SDoc-wrapped Javascript is now bundled into the ``caterwaul`` file, which is a `self-modifying Perl script <http://github.com/spencertipping/perl-objects>`_ that knows how to run
unit tests and compile the regular Javascript files. It's not hard to hack on Caterwaul though::

    $ ./caterwaul
    caterwaul4012 ls-a sdoc::js
    <a bunch of attributes>
    caterwaul4012 edit sdoc::js::caterwaul      # To edit the caterwaul core
    caterwaul4012 e                             # An alias (run ls-a alias:: to see all of them)
    caterwaul4012 test                          # Run all of the unit tests
    caterwaul4012 render                        # Render all of the files, including minified ones
    caterwaul4012 ^D                            # Exit, saving changes
    $

If you haven't used self-modifying Perl before, then you should definitely read `writing self-modifying Perl <http://github.com/spencertipping/writing-self-modifying-perl>`_, which covers the
concept in depth.
