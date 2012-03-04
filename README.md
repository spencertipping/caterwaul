# Caterwaul

Caterwaul is two different things. First, and most importantly, it is a powerful low-level Javascript code manipulation library with a Javascript parser, AST, in-process compiler, and
replication. Second, it is a programming language implementation that uses this library to transform your code in various arcane ways that I happen to find useful.

The whole project is MIT-licensed, and in the unlikely event that you want to use it you are free to [email me](mailto:spencer@spencertipping.com) with any questions/issues.

What follows is a ten-minute introduction to caterwaul's core concepts. It covers about 5% of what caterwaul does.

## Caterwaul as a library

Caterwaul is implemented in pure Javascript, so you can use it to live-compile your code in a browser, or you can use the `waul` precompiler to compile your code up-front. You can see the
live compiler in action by going to [the caterwaul website](http://caterwauljs.org). This site embeds a caterwaul compiler configured to use the standard macro library; this causes it to
compile what I refer to as the caterwaul programming language. The website documents this language in some detail, as does [Caterwaul by
Example](http://caterwauljs.org/doc/caterwaul-by-example.pdf) - though some of the examples will fail since Caterwaul 1.2.3, which introduces [a breaking
change](https://github.com/spencertipping/caterwaul/commit/05a5e317336e751cbf90a7f574070d3eca4f69a4) to the `seq` library.

If you're interested in using caterwaul as a compiler library, I recommend reading the [caterwaul reference manual](http://caterwauljs.org/doc/caterwaul-reference-manual.pdf), which covers
its core API in significantly more detail than this readme. You can also read through the caterwaul source code, which contains copious documentation, some of which is up to date.

### Parsing things



    var tree = caterwaul.parse('3 + 4');
    tree.toString()           // '3 + 4'
    tree.data                 // '+'
    tree.length               // 2
    tree[0].data              // '3'
    tree[1].data              // '4'

### Detecting patterns




    var pattern = caterwaul.parse('_x + _y');
    var match   = pattern.match(tree);
    match._x.data             // '3'
    match._y.data             // '4'
    var template = caterwaul.parse('f(_x, _y)');
    var new_tree = template.replace(match);
    new_tree.toString()       // 'f(3, 4)'

### Compiling things



    var f = function (x, y) {return x * y};
    caterwaul.compile(new_tree)       // 12

You can also bind variables from the compiling environment:

    var new_f = function (x, y) {return x + y};
    caterwaul.compile(new_tree, {f: new_f})   // 7

You can only compile things that return values (technically, things which are expressions; the litmus test is whether you could legally wrap it in parentheses), so stuff like `var x = 10`
won't work. This is different from Javascript's `eval` function. If you want to execute imperative code, you should wrap it in a function:

    var function_wrapper = caterwaul.parse('(function() {_body})');
    var code = caterwaul.parse('if (x) {console.log(x)}');
    var new_function = caterwaul.compile(function_wrapper.replace({_body: code}));
    new_function();

## Caterwaul as a programming language

I wrote a set of macros that use the above API to modify Javascript code; this macro set has been refined over the past year to become a programming language that I find useful. You can
learn this language on the caterwaul website, which goes through it by example and provides an interactive shell so you can see what the compilation process looks like.

### Using caterwaul this way




    var compiler = caterwaul(':all');         // :all means 'every macro you know about'
    var compiled = compiler(function () {
      console.log(x) -where [x = 10];
    });
    compiled();               // logs 10

The other way to use the programming language is by using the `waul` precompiler. This compiles your code to straight Javascript, eliminating the runtime overhead imposed by caterwaul's
parser, macroexpander, and compiler. Waul files typically end in `.waul` or `.waul.sdoc` (if you're using [SDoc](http://github.com/spencertipping/sdoc), which waul will transparently
parse) and contain code like this:

    caterwaul(':all')(function () {
      n[10] *console.log -seq;
      console.log('done #{message}')
        -where [message = 'iterating through numbers'];
    })();

You can compile this by running `waul file.waul`, which will generate `file.js`. `file.js` may contain references to the `caterwaul` global if you use certain macros, but there will be no
compilation overhead.

## Caterwaul as a self-replicating monstrosity

This is the coolest part of caterwaul in my opinion. Both `caterwaul` as a Javascript object and `waul` can give you string expressions that reproduce them. This is very useful for library
bundling; for example:

    var r = caterwaul.replicator();
    var code = r.toString();

If you do this, someone else can `eval` 'code' and they will end up with a global called `caterwaul` that is configured exactly as your `caterwaul` is configured. The only requirement is
that configurations be declared as modules, which is done like this:

    // caterwaul.module(name, [compiler_configuration], function)
    caterwaul.module('my-configuration', ':all', function ($) {
      // $ is the global caterwaul object
      $.foo = 'bar';
    });

The output of `replicator` is a function that recreates all modules by re-running their initializers. Note that `replicator` rewrites the module functions into their post-compilation
equivalents; in other words, the body of each function has already been compiled into normal Javascript. This reduces total compilation overhead.

### Waul replication



    $ ./waul -r -e extension.waul > new-waul
    $ chmod u+x new-waul
    $ ./new-waul my-file.waul

This is especially useful for setting up shebang lines for scripts that require custom waul extensions:

    #!./new-waul
    caterwaul(':all')(function () {
      // custom code
    })();

The `waul` in caterwaul's root directory is preloaded with `build/caterwaul.std.js` and `build/caterwaul.ui.js`. As you might guess, `waul` wasn't written specially to contain these;
rather, it was generated by `waul-core` (which doesn't have any libraries built-in) by this process:

    $ ./waul-core --replicate -e build/caterwaul.std.min.js -e build/caterwaul.ui.min.js > waul
    $ chmod 0700 waul