# Global caterwaul variable

Caterwaul creates a global symbol, caterwaul. Like jQuery, there's a mechanism to get the original one back if you don't want to replace it. You can call caterwaul.deglobalize() to return
caterwaul and restore the global that was there when Caterwaul was loaded (might be useful in the unlikely event that someone else named their library Caterwaul). Note that deglobalize() is
available only on the global caterwaul() function.

    (function (f) {return f(f)})(function (initializer) {
      var calls_init       = function () {var f = function () {return f.init.apply(f, arguments)}; return f},
          original_global  = typeof caterwaul === 'undefined' ? undefined : caterwaul,
          caterwaul_global = calls_init();

      caterwaul_global.deglobalize      = function () {caterwaul = original_global; return caterwaul_global};
      caterwaul_global.core_initializer = initializer;
      caterwaul_global.context          = this;

The merge() function is compromised for the sake of Internet Explorer, which contains a bug-ridden and otherwise horrible implementation of Javascript. The problem is that, due to a bug in
hasOwnProperty and DontEnum within JScript, these two expressions are evaluated incorrectly:

    for (var k in {toString: 5}) alert(k);        // no alert on IE
    ({toString: 5}).hasOwnProperty('toString')    // false on IE

To compensate, merge() manually copies toString if it is present on the extension object.

      caterwaul_global.merge = (function (o) {for (var k in o) if (o.hasOwnProperty(k)) return true})({toString: true}) ?
        // hasOwnProperty, and presumably iteration, both work, so we use the sensible implementation of merge():
        function (o) {for (var i = 1, l = arguments.length, _; i < l; ++i) if (_ = arguments[i]) for (var k in _) if (Object.prototype.hasOwnProperty.call(_, k)) o[k] = _[k]; return o} :

        // hasOwnProperty, and possibly iteration, both fail, so we hack around the problem with this gem:
        function (o) {for (var i = 1, l = arguments.length, _; i < l; ++i)
                        if (_ = arguments[i]) {for (var k in _) if (Object.prototype.hasOwnProperty.call(_, k)) o[k] = _[k];
                                               if (_.toString && ! /\[native code\]/.test(_.toString.toString())) o.toString = _.toString} return o},

# Modules

Caterwaul 1.1.7 adds support for a structured form for defining modules. This isn't particularly interesting or revolutionary by itself; it's just a slightly more structured way to do what
most Caterwaul extensions have been doing with toplevel functions. For example, a typical extension looks something like this:

    caterwaul('js_all')(function ($) {
      $.something(...) = ...,
      where [...]})(caterwaul);

Here's what the equivalent module syntax looks like:

    caterwaul.module('foo', 'js_all', function ($) {      // equivalent to caterwaul.module('foo', caterwaul('js_all')(function ($) {...}))
      $.something(...) = ...,
      where [...]});

Note that the module name has absolutely nothing to do with what the module does. I'm adding modules for a different reason entirely. When you bind a module like this, Caterwaul stores the
initialization function onto the global object. So, for example, when you run caterwaul.module('foo', f), you have the property that caterwaul.foo_initializer === f. This is significant
because you can later reuse this function on a different Caterwaul object. In particular, you can do things like sending modules from the server to the client, since the Caterwaul global is
supplied as a parameter rather than being closed over.

You can invoke module() with just a name to get the initializer function for that module. This ultimately means that, given only a runtime instance of a Caterwaul function configured with one
or modules, you can construct a string of Javascript code sufficient to recreate an equivalent Caterwaul function elsewhere. (The replicator() method does this by returning a syntax tree.)

      caterwaul_global.modules = [];
      caterwaul_global.module = function (name, transform, f) {
        if (arguments.length === 1) return caterwaul_global[name + '_initializer'];
        name + '_initializer' in caterwaul_global || caterwaul_global.modules.push(name);
        f || (f = transform, transform = null);
        (caterwaul_global[name + '_initializer'] = transform ? caterwaul_global(transform)(f) : f)(caterwaul_global);
        return caterwaul_global};

      return caterwaul = caterwaul_global});