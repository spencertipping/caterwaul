// Core caterwaul build with version ID | Spencer Tipping
// Licensed under the terms of the MIT source code license



// Introduction.
// Caterwaul is a Javascript-to-Javascript compiler. Visit http://spencertipping.com/caterwaul/caterwaul.html for information about how and why you might use it.

(function (f) {return f(f, (function (x) {return function () {return ++x}})(0))})(function (initializer, unique, undefined) {



// Utility methods.
// Gensym is used to support qs[]. When we quote syntax, what we really intend to do is grab a syntax tree representing something; this entails creating a let-binding with the already-evaluated
// tree. (Note: Don't go and modify these qs[]-generated trees; you only get one for each qs[].) The ultimate code ends up looking like this (see 'Environment-dependent compilation' some distance
// below):

// | (function (a_gensym) {
//     var v1 = a_gensym.gensym_1;
//     var v2 = a_gensym.gensym_2;
//     ...
//     return <your macroexpanded function>;
//   }) ({gensym_1: v1, gensym_2: v2, ..., gensym_n: vn});

// A note about gensym uniqueness. Gensyms are astronomically unlikely to collide, but there are some compromises made to make sure of this. First, gensyms are not predictable; the first one is
// randomized. This means that if you do have a collision, it may be intermittent (and that is probably a non-feature). Second, and this is a good thing, you can load Caterwaul multiple times
// without worrying about gensyms colliding between them. Each instance of Caterwaul uses its own system time and random number to seed the gensym generation, and the system time remains stable
// while the random number gets incremented. It is very unlikely that any collisions would happen.

// Bind() is the usual 'bind this function to some value' function. The only difference is that it supports rebinding; that is, if you have a function you've already bound to X, you can call bind
// on that function and some new value Y and get the original function bound to Y. The bound function has two attributes, 'original' and 'binding', that let bind() achieve this rebinding.

// Map() is an array map function, fairly standard really. I include it because IE doesn't provide Array.prototype.map. hash() takes a string, splits it on whitespace, and returns an object that
// maps each element to true. It's useful for defining sets. extend() takes a constructor function and zero or more extension objects, merging each extension object into the constructor
// function's prototype. The constructor function is then returned. It's a shorthand for defining classes.

// Se() stands for 'side-effect', and its purpose is to take a value and a function, pass the value into the function, and return either whatever the function returned or the value you gave it.
// It's used to initialize things statefully; for example:

// | return se(function () {return 5}, function (f) {
//     f.sourceCode = 'return 5';
//   });

// The Caterwaul standard library gives you an equivalent but much more refined form of se() called /se[].

    var qw = function (x) {return x.split(/\s+/)},  id = function (x) {return x},  se = function (x, f) {return f && f.call(x, x) || x},
    genval = (function (n, m, u) {return function () {return [u, n, ++m]}})(+new Date(), Math.random() * (1 << 30) >>> 0, unique()),

    genint = function () {var v = genval(); return (v[0] << 2) + v[0] + (v[1] << 1) + v[1] + v[2]},
    gensym = function () {var v = genval(); return ['gensym', v[0].toString(36), v[1].toString(36), v[2].toString(36)].join('_')},

      fail = function (m) {throw new Error(m)},

      bind = function (f, t) {return f.binding === t ? f : f.original ? bind(f.original, t) : merge(function () {return f.apply(t, arguments)}, {original: f, binding: t})},
       map = function (f, xs) {for (var i = 0, ys = [], l = xs.length; i < l; ++i) ys.push(f(xs[i], i)); return ys},
      hash = function (s) {for (var i = 0, xs = qw(s), o = {}, l = xs.length; i < l; ++i) o[xs[i]] = true; return annotate_keys(o)},
     merge = function (o) {for (var i = 1, l = arguments.length, _; i < l; ++i) if (_ = arguments[i]) for (var k in _) has(_, k) && (o[k] = _[k]); return o},
    extend = function (f) {merge.apply(null, [f.prototype].concat(Array.prototype.slice.call(arguments, 1))); return f},

//   Caterwaul identification.
//   Caterwaul functions agree on a secret value to identify themselves. This needs to happen because there isn't another particularly good way to identify them. This ends up being installed as
//   the is_caterwaul property on every caterwaul function.

    is_caterwaul = gensym(),

//   Optimizations.
//   The parser and lexer each assume valid input and do no validation. This is possible because any function passed in to caterwaul will already have been parsed by the Javascript interpreter;
//   syntax errors would have caused an error there. This enables a bunch of optimization opportunities in the parser, ultimately making it not in any way recursive and requiring only three
//   linear-time passes over the token stream. (An approximate figure; it actually does about 19 fractional passes, but not all nodes are reached.)

//   Also, I'm not confident that all Javascript interpreters are smart about hash indexing. Particularly, suppose a hashtable has 10 entries, the longest of whose keys is 5 characters. If we
//   throw a 2K string at it, it might very well hash that whole thing just to find that, surprise, the entry doesn't exist. That's a big performance hit if it happens very often. To prevent this
//   kind of thing, I'm keeping track of the longest string in the hashtable by using the 'annotate_keys' function. 'has()' knows how to look up the maximum length of a hashtable to verify that
//   the candidate is in it, resulting in the key lookup being only O(n) in the longest key (generally this ends up being nearly O(1), since I don't like to type long keys), and average-case O(1)
//   regardless of the length of the candidate.

//   As of Caterwaul 0.7.0 the _max_length property has been replaced by a gensym. This basically guarantees uniqueness, so the various hacks associated with working around the existence of the
//   special _max_length key are no longer necessary.

   max_length_key = gensym(),
    annotate_keys = function (o)    {var max = 0; for (var k in o) own.call(o, k) && (max = k.length > max ? k.length : max); o[max_length_key] = max; return o},
              has = function (o, p) {return p != null && ! (p.length > o[max_length_key]) && own.call(o, p)},  own = Object.prototype.hasOwnProperty;
// Generated by SDoc 





// Configurations.
// Caterwaul is stateful in some ways, most particularly with macro definitions and compiler options. To prevent you from having to modify the global caterwaul() function, I've enabled
// replication. This works by giving you access to copies of caterwaul() (and copies of those copies, if you so choose) that you can customize independently. So, for example:

// | var copy = caterwaul.clone (function () {
//     // This function is for customizations. Totally optional; can also customize at the toplevel.
//     this.macro(qs[foo], fn_[qs[bar]]);
//   });

// | copy(function () {
//     var bar = 6;
//     return foo;
//   }) ();                // returns 6

// Related to this is a configure() method that modifies and returns the original function:

// | caterwaul.configure (function () {
//     // Global configuration using 'this'
//   });

  var configurable = (function () {

//   Attributes and methods.
//   Function copying doesn't involve copying over every attribute indiscriminately, since different behaviors are required for different properties. For example, the macro table should be copied
//   so that clones append to their local copies, methods should be rebound to the new function, and some attributes should just be referenced. These behaviors are encoded by way of an attribute
//   table that keeps track of what to do with each. Attributes show up in this table when you call one of the attribute-association methods:

//   | .field('attribute', value)          Creates a reference-copying attribute. No copying is done at all; the attribute is cross-referenced between copies of the Caterwaul function.
//     .shallow('attribute', value)        Creates an attribute whose value is copied shallowly; for hashes or arrays.
//     .method('name', f)                  Creates a method bound to the Caterwaul function. f will be bound to any copies on those copies.

//   Naturally, attributes that don't appear in the table are left alone. You can add more of these attribute behaviors using the behavior() method:

//   | .behavior('name', definition)       Creates a new attribute behavior. definition() should take an original attribute value and return a new one, where 'this' is the new Caterwaul function.

//   Underlying this mechanism is the associate() method:

//   | .associate('attribute', 'behavior', value)          Creates an attribute with the given behavior and assigns it a value.

//   A couple of notes. First, these functions are bound to the function they modify; that is, you can eta-reduce them freely. Second, this is not a general purpose function replicator. All of
//   the functions returned here call their own init() method rather than sharing a function body somewhere. (To be fair, the init() method gets referenced -- so it's almost as good I suppose.) A
//   general-purpose way to do this would be to have g call f instead of g.init in the copy_of() function below. I'm not doing this in order to save stack frames; I want the function call
//   performance to be constant-time in the number of copies.

//   Another thing to be aware of is that this isn't a general-purpose metaclassing framework. I made a compromise by discouraging side-effecting initialization in the behavior-association
//   methods -- these should just copy things, reference them, or transform them in some nondestructive way. This makes it easier to have extensional copies of objects, since there are fewer
//   unknowns about the internal state. (e.g. we know that if 'foo' appears in the attribute table, we'll have something called 'foo' on the object itself and we can call its behavior -- we don't
//   have to wonder about anything else.)

  var associator_for = function (f) {return function (name, behavior, value) {return f[name] = (f.behaviors[f.attributes[name] = behavior] || id).call(f, value), f}},
        shallow_copy = function (x) {return x && (x.constructor === Array ? x.slice() : x.clone ? x.clone() : merge({}, x))},
             copy_of = function (f) {var g = merge(function () {return g.init.apply(g, arguments)}, {behaviors: shallow_copy(f.behaviors), attributes: {}});
                                     return se(g, function (g) {(g.associate = associator_for(g))('behavior', 'method', function (name, definition) {this.behaviors[name] = definition;
                                                                  return this.associate(name, 'method', function (attribute, value) {return this.associate(attribute, name, value)})}).
                                                                behavior('method', g.behaviors.method);

                                                                for (var k in f.attributes) has(f.attributes, k) && g.associate(k, f.attributes[k], f[k])})},

//   Bootstrapping method behavior.
//   Setting up the behavior(), method(), field(), and shallow() methods. The behavior() and method() methods are codependent and are initialized in the copy_of function above, whereas the
//   field() and shallow() methods are not core and are defined here. I'm also defining a 'configuration' function to allow quick definition of new configurations. (These are loadable by their
//   names when calling clone() or configure() -- see 'Configuration and cloning' below.) A complement method, 'tconfiguration', is also available. This transforms the configuration function
//   before storing it in the table, enabling you to use things like 'qs[]' without manually transforming stuff. The downside is that you lose closure state and can't bind variables.

//   There's a convenience method called 'namespace', which is used when you have a shallow hash shared among different modules. It goes only one level deep.

    replica = se(function () {return copy_of({behaviors: {method: function (v) {return bind(v, this)}}}).behavior('field').behavior('shallow', shallow_copy).
                                                                                                         behavior('self_reference', function () {return this})}, function (f) {f.init = f});

//   Configuration and cloning.
//   Caterwaul ships with a standard library of useful macros, though they aren't activated by default. To activate them, you say something like this:

//   | caterwaul.configure('core.words');
//     // Longhand access to the actual configuration function:
//     caterwaul.configurations['core.words']

//   You generally pass these names into a clone() call, which first clones caterwaul and then configures the clone:

//   | var copy = caterwaul.clone('core.words', 'some_other_library', function () {
//       ...
//     });

//   Note that functions passed to clone() and configure() are transformed using the existing caterwaul instance. This means that closure state is lost, so configuration at the toplevel is a good
//   idea. Named configurations, on the other hand, are not explicitly transformed; so when you define a custom configuration in a named way, you will want to manually transform it. (The reason
//   for this is that we don't want to force the configuration author to lose closure state, since it's arguably more important in a library setting than an end-user setting.) Alternatively you
//   can use tconfigure(), which takes a series of configurations to use to transform your configuration function.

//   Named configurations are made idempotent; that is, they cannot be applied twice. This is done through the 'has' hash, which can be manually reset if you actually do need to apply a
//   configuration multiple times (though you're probably doing something wrong if you do need to do that).

    return function () {return replica().
      shallow('configurations', {}).shallow('has', {}).method('configuration', function (name, f) {this.configurations[name] = f; return this}).
       method('tconfiguration', function (configs, name, f, bindings) {this.configurations[name] = this.clone(configs)(f, bindings); return this}).

       method('namespace',  function (s) {return this[s] || this.shallow(s, {})[s]}).
       method('alias',      function (from, to) {return this.method(to, function () {return this[from].apply(this, arguments)})}).

       method('once',       function (name, f) {var k = gensym(); return this.method(name, function () {return this[k] || (this[k] = f.apply(this, arguments))})}).

       method('clone',      function () {return arguments.length ? this.clone().configure.apply(null, arguments) : copy_of(this)}).
       method('tconfigure', function (cs, f) {return this.configure(this.clone(cs)(f))}).
       method('configure',  function () {for (var i = 0, l = arguments.length, _; _ = arguments[i], i < l; ++i)
                                           if (_.constructor === String) for (var cs = qw(arguments[i]), j = 0, lj = cs.length; _ = cs[j], j < lj; ++j)
                                                                           if (this.configurations[_]) this.has[_] || (this.has[_] = this.configurations[_].call(this, this) || this);
                                                                           else                        throw new Error('error: configuration "' + _ + '" does not exist');
                                           else _ instanceof Array ? this.configure.apply(this, _.slice()) : _.call(this, this); return this})}})();
// Generated by SDoc 





// Caterwaul object system.
// Caterwaul often uses classes, but Javascript doesn't specify much in the way of object-oriented development. (No complaints from me about this by the way.) This behavior is an attempt to
// provide a standard basis for caterwaul's internal and external modules.

//   Two roles for classes.
//   The goal of caterwaul classes is to provide a useful abstraction for building constructor functions. But in addition to setting up the prototype and managing the existence of constructors,
//   classes are also able to extend existing objects without owning their prototypes.

//   Prototypes are flattened automatically. This divorces the object model from Javascript's single-inheritance prototype chain and reduces method lookup times. (Also, it doesn't impose much of
//   a performance overhead provided that class updates are relatively rare.) Note that a single instance doesn't generally inherit from multiple classes, but a class might have several parents.
//   For instance, if A < B and A < C, then you can still create a prototype instance of A. A.parents() will return [B, C].

//   Behavior of instanceof.
//   Instanceof and .constructor will behave the way you'd expect: for any class C, C().constructor === C and C() instanceof C. The only interesting thing here is that you don't normally use
//   'new' when instantiating things in caterwaul's object system. Instead, you just call the function normally and it will handle the new invocation under the covers. The reason for this is that
//   constructor invocations can't be proxied; it's much more convenient to proxy a standard function call. It also disambiguates the role of the function as a class; whether or not you use 'new'
//   it will do roughly the same thing. (Though you should never use 'new', as this could change at some point.)

//   Creating non-objects.
//   This class system is very willing to go around the standard prototype inheritance pattern and let you create instances of things that aren't objects. For example, you could create a class
//   that generates HTML nodes by doing this:

//   | var c = caterwaul.module().def('create', function () {return document.createElement('div')});
//     c()         // -> a new <div>

//   If you do it this way, you should be aware of a couple of things. First, the instanceof and .constructor relationship won't hold up anymore. I could fix up the .constructor property, but
//   this might break stuff that depends on it being accurate as far as Javascript is concerned. The other thing is that havung a custom create() function makes constructor invocation much
//   slower: O(n) in the number of members in the prototype rather than O(1). For most classes this won't be terrible, since there usually aren't that many members and the prototypes are
//   pre-flattened. (V8, for one, caches the list of attributes on an object, so this is roughly just a regular array traversal.)

//   Note that you can create unboxed things, but they won't do what you want. For example:

//   | var c = caterwaul.module().def('create', function () {return 5}).
//                                def('foo',    function () {return 'bar'});
//     c().foo()           // TypeError: 5 has no method 'foo'

//   The reason has to do with the way Javascript handles unboxed values (explained in github.com/spencertipping/js-in-ten-minutes and other similar guides).

//   Storing instance data.
//   I really like the way Ruby handles instance data; that is, it's private to the instance and methods are always used to access it. This library behaves similarly; by convention all instance
//   data is stored in a separate gensym-named object. The instance data is accessible as a hash by using the caterwaul.module.instance_data(object) method.

    var module = (function () {
      var constructor_function = function () {var f = function () {if (this.constructor !== f) {var instance = f.create ? f.extend(f.create()) : new f();
                                                                                                return f.initialize && f.initialize.apply(instance, arguments) || instance}}; return f},
          module               = constructor_function(),
          private_key          = module.private_key = 'gensym_1_gn1ujnay_b8iwkt',       // Never change this
          create_method        = module.create      = module.prototype.create = constructor_function,
          extend_method        = module.extend      = module.prototype.extend = function (o) {var p = this.prototype; for (var k in p) if (p.hasOwnProperty(k)) o[k] = p[k]; return o};

      merge((module = module()).prototype, {
        extend:          extend_method,

        inherit_from:    function ()     {return this.parents(this.parents().concat(Array.prototype.slice.call(arguments))).compile()},
        instance_data:   function (o)    {return o[private_key] || (o[private_key] = {})},
        compile:         function ()     {for (var ps = this.parents(), proto = this.prototype, i = 0, l = ps.length, p; i < l; ++i) for (var k in (p = ps[i]))
                                            if (p.hasOwnProperty(k)) proto[k] = p[k]; return this},

        def:             function ()     {for (var i = 0, l = arguments.length - 1, f = arguments[l]; i < l; ++i) this.prototype[arguments[i]] = f; return this},
        attr:            function ()     {for (var i = 0, l = arguments.length; i < l; ++i) this.prototype[arguments[i]] = this.attr_method_for(arguments[i]); return this},
        attr_method_for: function (name) {return function (x) {var d = module.instance_data(this); if (arguments.length) return d[name] = x, this;
                                                                                                   else                  return d[name]}}});
      module.initialize = function () {this.parents([]).inherit_from.apply(this, arguments)};
      return module.extend(module).attr('parents').extend(module)})();
// Generated by SDoc 





// Global management.
// Caterwaul creates a global symbol, caterwaul. Like jQuery, there's a mechanism to get the original one back if you don't want to replace it. You can call caterwaul.deglobalize() to return
// caterwaul and restore the global that was there when Caterwaul was loaded (might be useful in the unlikely event that someone else named their library Caterwaul). Note that deglobalize() is
// available only on the global caterwaul() function. It wouldn't make much sense for clones to inherit it.

// There's an interesting case that comes up when loading a global caterwaul. If we detect that the caterwaul we just loaded has the same version as the one that's already there, we revert back
// to the original. This is very important for precompilation and the reason for it is subtle. Precompilation relies on tracing to determine the compiled form of each function handed to
// caterwaul, so if that caterwaul is replaced for any reason then the traces won't happen. A very common setup is something like this:

// | <script src='caterwaul.js'></script>
//   <script src='some-caterwaul-extension.js'></script>
//   <script src='my-script.js'></script>

// Often you'll want to precompile the whole bundle, since caterwaul.js includes behaviors that aren't necessarily precompiled. To do this, it's tempting to precompile the whole bundle of
// caterwaul, the extensions, and your code. Without version checking, however, the traces would be lost and nothing would happen.

  var original_global  = typeof caterwaul === 'undefined' ? undefined : caterwaul,
      caterwaul_global = caterwaul = se(configurable(), function () {this.deglobalize = function () {caterwaul = original_global; return this}});

//   Uniqueness and identification.
//   Caterwaul has a number of features that require it to be able to identify caterwaul functions and easily distinguish between them. These methods provide a way to do that. Also, I'm using
//   this section as an excuse to stash some useful utility methods onto caterwaul.

//   Finally, the 'caterwaul' property of any caterwaul function will refer to the caterwaul function. This makes the node.js API more systematic.

  caterwaul_global.method('global', function () {return caterwaul_global}).self_reference('caterwaul').
                    field('is_caterwaul', is_caterwaul).field('initializer', initializer).field('unique', unique).field('gensym', gensym).field('genint', genint).once('id', gensym).

                    field('module', module).

                   method('toString', function () {return '[caterwaul instance ' + this.id() + ']'}).field('merge', merge).
                   method('check_version', function () {if (original_global && this.version === original_global.version) this.deglobalize(); return this}).

                   method('reinitialize', function (transform, erase_configurations) {var c = (transform || id)(this.initializer), result = c(c, this.unique).deglobalize();
                                                                                      erase_configurations || (result.configurations = this.configurations); return result}).

//   Magic.
//   Sometimes you need to grab a unique value that is unlikely to exist elsewhere. Caterwaul gives you such a value given a string. These values are shared across all Caterwaul instances and are
//   considered to be opaque. Because of the possibility of namespace collisions, you should name your magic after a configuration or otherwise prefix it somehow.

                   method('magic', (function (table) {return function (name) {return table[name] || (table[name] = {})}}));
// Generated by SDoc 






// Variadic methods.
// A lot of the time we'll want some kind of variadic behavior for methods. These meta-methods define such behavior. There are a few templates that occur commonly in the caterwaul source, and you
// can define your own meta-methods to handle other possibilities.

  caterwaul_global.method('variadic', function (name, f) {return this.method(name, function () {for (var i = 0, l = arguments.length; i < l; ++i) f.call(this, arguments[i]); return this})}).
                   method('right_variadic_binary', function (name, f) {return this.method(name, function () {
                                                     for (var i = 0, l = arguments.length - 1, x = arguments[l]; i < l; ++i) f.call(this, arguments[i], x); return this})});
// Generated by SDoc 






// Shared parser data.
// This data is used both for parsing and for serialization, so it's made available to all pieces of caterwaul.

//   Precomputed table values.
//   The lexer uses several character lookups, which I've optimized by using integer->boolean arrays. The idea is that instead of using string membership checking or a hash lookup, we use the
//   character codes and index into a numerical array. This is guaranteed to be O(1) for any sensible implementation, and is probably the fastest JS way we can do this. For space efficiency,
//   only the low 256 characters are indexed. High characters will trigger sparse arrays, which may degrade performance. (I'm aware that the arrays are power-of-two-sized and that there are
//   enough of them, plus the right usage patterns, to cause cache line contention on most Pentium-class processors. If we are so lucky to have a Javascript JIT capable enough to have this
//   problem, I think we'll be OK.)

//   The lex_op table indicates which elements trigger regular expression mode. Elements that trigger this mode cause a following / to delimit a regular expression, whereas other elements would
//   cause a following / to indicate division. By the way, the operator ! must be in the table even though it is never used. The reason is that it is a substring of !==; without it, !== would
//   fail to parse. (See test/lex-neq-failure for examples.)

   var lex_op = hash('. new ++ -- u++ u-- u+ u- typeof u~ u! ! * / % + - << >> >>> < > <= >= instanceof in == != === !== & ^ | && || ? = += -= *= /= %= &= |= ^= <<= >>= >>>= : , ' +
                     'return throw case var const break continue void else u; ;'),

    lex_table = function (s) {for (var i = 0, xs = [false]; i < 8; ++i) xs.push.apply(xs, xs); for (var i = 0, l = s.length; i < l; ++i) xs[s.charCodeAt(i)] = true; return xs},
    lex_float = lex_table('.0123456789'),    lex_decimal = lex_table('0123456789'),  lex_integer = lex_table('0123456789abcdefABCDEFx'),  lex_exp = lex_table('eE'),
    lex_space = lex_table(' \n\r\t'),        lex_bracket = lex_table('()[]{}'),       lex_opener = lex_table('([{'),                    lex_punct = lex_table('+-*/%&|^!~=<>?:;.,'),
      lex_eol = lex_table('\n\r'),     lex_regexp_suffix = lex_table('gims'),          lex_quote = lex_table('\'"/'),                   lex_slash = '/'.charCodeAt(0),
     lex_star = '*'.charCodeAt(0),              lex_back = '\\'.charCodeAt(0),             lex_x = 'x'.charCodeAt(0),                     lex_dot = '.'.charCodeAt(0),
     lex_zero = '0'.charCodeAt(0),     lex_postfix_unary = hash('++ --'),              lex_ident = lex_table('$_abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'),

//   Parse data.
//   The lexer and parser aren't entirely separate, nor can they be considering the complexity of Javascript's grammar. The lexer ends up grouping parens and identifying block constructs such
//   as 'if', 'for', 'while', and 'with'. The parser then folds operators and ends by folding these block-level constructs.

    parse_reduce_order = map(hash, ['function', '( [ . [] ()', 'new delete', 'u++ u-- ++ -- typeof u~ u! u+ u-', '* / %', '+ -', '<< >> >>>', '< > <= >= instanceof in', '== != === !==', '&',
                                    '^', '|', '&&', '||', 'case', '?', '= += -= *= /= %= &= |= ^= <<= >>= >>>=', ':', ',', 'return throw break continue void', 'var const',
                                    'if else try catch finally for switch with while do', ';']),

parse_associates_right = hash('= += -= *= /= %= &= ^= |= <<= >>= >>>= ~ ! new typeof u+ u- -- ++ u-- u++ ? if else function try catch finally for switch case with while do'),
   parse_inverse_order = (function (xs) {for (var  o = {}, i = 0, l = xs.length; i < l; ++i) for (var k in xs[i]) has(xs[i], k) && (o[k] = i); return annotate_keys(o)}) (parse_reduce_order),
   parse_index_forward = (function (rs) {for (var xs = [], i = 0, l = rs.length, _ = null; _ = rs[i], xs[i] = true, i < l; ++i)
                                           for (var k in _) if (has(_, k) && (xs[i] = xs[i] && ! has(parse_associates_right, k))) break; return xs}) (parse_reduce_order),

              parse_lr = hash('[] . () * / % + - << >> >>> < > <= >= instanceof in == != === !== & ^ | && || = += -= *= /= %= &= |= ^= <<= >>= >>>= , : ;'),
   parse_r_until_block = annotate_keys({'function':2, 'if':1, 'do':1, 'catch':1, 'try':1, 'for':1, 'while':1, 'with':1, 'switch':1}),
         parse_accepts = annotate_keys({'if':'else', 'do':'while', 'catch':'finally', 'try':'catch'}),  parse_invocation = hash('[] ()'),
      parse_r_optional = hash('return throw break continue else'),              parse_r = hash('u+ u- u! u~ u++ u-- new typeof finally case var const void delete'),
           parse_block = hash('; {'),  parse_invisible = hash('i;'),            parse_l = hash('++ --'),     parse_group = annotate_keys({'(':')', '[':']', '{':'}', '?':':'}),
 parse_ambiguous_group = hash('[ ('),    parse_ternary = hash('?'),   parse_not_a_value = hash('function if for while catch'), parse_also_expression = hash('function');
// Generated by SDoc 






// Syntax data structures.
// There are two data structures used for syntax trees. At first, paren-groups are linked into doubly-linked lists, described below. These are then folded into immutable array-based specific
// nodes. At the end of folding there is only one child per paren-group.

  (function () {

//   Doubly-linked paren-group lists.
//   When the token stream is grouped into paren groups it has a hierarchical linked structure that conceptually has these pointers:

//   |                       +--------+
//                  +------  |  node  |  ------+
//                  |   +->  |        |  <--+  |
//           first  |   |    +--------+     |  |  last
//                  |   | parent     parent |  |
//                  V   |                   |  V
//               +--------+               +--------+
//               |  node  |   --- r -->   |  node  |  --- r ---/
//    /--- l --- |        |   <-- l ---   |        |
//               +--------+               +--------+

//   The primary operation performed on this tree, at least initially, is repeated folding. So we have a chain of linear nodes, and one by one certain nodes fold their siblings underneath them,
//   breaking the children's links and linking instead to the siblings' neighbors. For example, if we fold node (3) as a binary operator:

//   |     (1) <-> (2) <-> (3) <-> (4) <-> (5)             (1) <--> (3) <--> (5)
//         / \     / \     / \     / \     / \     -->     / \     /   \     / \
//                                                                /     \
//                                                              (2)     (4)        <- No link between children
//                                                              / \     / \           (see 'Fold nodes', below)

//   Fold nodes.
//   Once a node has been folded (e.g. (3) in the diagram above), none of its children will change and it will gain no more children. The fact that none of its children will change can be shown
//   inductively: suppose you've decided to fold the '+' in 'x + y' (here x and y are arbitrary expressions). This means that x and y are comprised of higher-precedence operators. Since there is
//   no second pass back to high-precedence operators, x and y will not change nor will they interact with one another. The fact that a folded node never gains more children arrives from the fact
//   that it is folded only once; this is by virtue of folding by index instead of by tree structure. (Though a good tree traversal algorithm also wouldn't hit the same node twice -- it's just
//   less obvious when the tree is changing.)

//   Anyway, the important thing about fold nodes is that their children don't change. This means that an array is a completely reasonable data structure to use for the children; it certainly
//   makes the structure simpler. It also means that the only new links that must be added to nodes as they are folded are links to new children (via the array), and links to the new siblings.
//   Once we have the array-form of fold nodes, we can build a query interface similar to jQuery, but designed for syntactic traversal. This will make routine operations such as macro
//   transformation and quasiquoting far simpler later on.

//   Both grouping and fold nodes are represented by the same data structure. In the case of grouping, the 'first' pointer is encoded as [0] -- that is, the first array element. It doesn't
//   contain pointers to siblings of [0]; these are still accessed by their 'l' and 'r' pointers. As the structure is folded, the number of children of each paren group should be reduced to just
//   one. At this point the remaining element's 'l' and 'r' pointers will both be null, which means that it is in hierarchical form instead of linked form.

//   After the tree has been fully generated and we have the root node, we have no further use for the parent pointers. This means that we can use subtree sharing to save memory. Once we're past
//   the fold stage, push() should be used instead of append(). append() works in a bidirectionally-linked tree context (much like the HTML DOM), whereas push() works like it does for arrays
//   (i.e. no parent pointer).

    var syntax_node_inspect = function (x) {return x ? x.inspect() : '(<>)'},  syntax_node_tostring = function (x) {return x ? x.serialize ? x.serialize() : x.toString() : ''},

//   Syntax node functions.
//   These functions are common to various pieces of syntax nodes. Not all of them will always make sense, but the prototypes of the constructors can be modified independently later on if it
//   turns out to be an issue.

    syntax_common = {

//     Mutability.
//     These functions let you modify nodes in-place. They're used during syntax folding and shouldn't really be used after that (hence the underscores).

       _replace: function (n) {return (n.l = this.l) && (this.l.r = n), (n.r = this.r) && (this.r.l = n), this},  _append_to: function (n) {return n && n._append(this), this},
      _reparent: function (n) {return this.p && this.p[0] === this && (this.p[0] = n), this},  _fold_l: function (n) {return this._append(this.l && this.l._unlink(this))},
        _append: function (n) {return (this[this.length++] = n) && (n.p = this), this},        _fold_r: function (n) {return this._append(this.r && this.r._unlink(this))},
       _sibling: function (n) {return n.p = this.p, (this.r = n).l = this},                                                            _fold_lr: function () {return this._fold_l()._fold_r()},
          _wrap: function (n) {return n.p = this._replace(n).p, this._reparent(n), delete this.l, delete this.r, this._append_to(n)},  _fold_rr: function () {return this._fold_r()._fold_r()},
        _unlink: function (n) {return this.l && (this.l.r = this.r), this.r && (this.r.l = this.l), delete this.l, delete this.r, this._reparent(n)},

//     These methods are OK for use after the syntax folding stage is over (though because syntax nodes are shared it's generally dangerous to go modifying them):

            pop: function () {return --this.length, this},  push: function (x) {return this[this.length++] = x, this},

//     Identification.
//     You can request that a syntax node identify itself, in which case it will give you an identifier if it hasn't already. The identity is not determined until the first time it is requested,
//     and after that it is stable. As of Caterwaul 0.7.0 the mechanism works differently (i.e. isn't borked) in that it replaces the prototype definition with an instance-specific closure the
//     first time it gets called. This may reduce the number of decisions in the case that the node's ID has already been computed.

      id: function () {var id = genint(); return (this.id = function () {return id})()},

//     Traversal functions.
//     each() is the usual side-effecting shallow traversal that returns 'this'. map() distributes a function over a node's children and returns the array of results, also as usual. Two variants,
//     reach and rmap, perform the process recursively. reach is non-consing; it returns the original as a reference. rmap, on the other hand, follows some rules to cons a new tree. If the
//     function passed to rmap() returns the node verbatim then its children are traversed. If it returns a distinct node, however, then traversal doesn't descend into the children of the newly
//     returned tree but rather continues as if the original node had been a leaf. For example:

//     |           parent          Let's suppose that a function f() has these mappings:
//                /      \
//            node1      node2       f(parent) = parent   f(node1) = q
//            /   \        |                              f(node2) = node2
//          c1     c2      c3

//     In this example, f() would be called on parent, node1, node2, and c3 in that order. c1 and c2 are omitted because node1 was replaced by q -- and there is hardly any point in going through
//     the replaced node's previous children. (Nor is there much point in forcibly iterating over the new node's children, since presumably they are already processed.) If a mapping function
//     returns something falsy, it will have exactly the same effect as returning the node without modification.

//     Using the old s() to do gensym-safe replacement requires that you invoke it only once, and this means that for complex macroexpansion you'll have a long array of values. This isn't ideal,
//     so syntax trees provide a replace() function that handles replacement more gracefully:

//     | qs[(foo(_foo), _before_bar + bar(_bar))].replace({_foo: qs[x], _before_bar: qs[3 + 5], _bar: qs[foo.bar]})

//     There is a map() variant called nmap() (and a corresponding rnmap()) that lets you insert falsy nodes into the syntax tree. This is used by replace(), which lets you replace named nodes
//     with falsy things if you want them to go away. (The exact behavior is that falsy nodes are not added to the syntax tree at all, rather than remaining in their original state.)

      each: function (f) {for (var i = 0, l = this.length; i < l; ++i) f(this[i], i); return this},
       map: function (f) {for (var n = new this.constructor(this), i = 0, l = this.length;    i < l; ++i) n.push(f(this[i], i) || this[i]); return n},
      nmap: function (f) {for (var n = new this.constructor(this), i = 0, l = this.length, r; i < l; ++i) (r = f(this[i], i)) && n.push(r); return n},
     reach: function (f) {f(this); this.each(function (n) {n && n.reach(f)}); return this},
      rmap: function (f) {var r = f(this); return ! r || r === this ? this. map(function (n) {return n && n. rmap(f)}) :      r.data === undefined ? new this.constructor(r) : r},
     rnmap: function (f) {var r = f(this); return        r === this ? this.nmap(function (n) {return n && n.rnmap(f)}) : r && r.data === undefined ? new this.constructor(r) : r},

     clone: function () {return this.rmap(function () {return false})},

   collect: function (p)  {var ns = []; this.reach(function (n) {p(n) && ns.push(n)}); return ns},
   replace: function (rs) {return this.rnmap(function (n) {if (! own.call(rs, n.data)) return n;
                                                           var replacement = rs[n.data];
                                                           return replacement && replacement.constructor === String ? new n.constructor(replacement, Array.prototype.slice.call(n)) :
                                                                                                                      replacement})},

//     Alteration.
//     These functions let you make "changes" to a node by returning a modified copy.

      repopulated_with: function (xs)   {return new this.constructor(this.data, xs)},
                change: function (i, x) {return se(new this.constructor(this.data, Array.prototype.slice.call(this)), function (n) {n[i] = x})},
        compose_single: function (i, f) {return this.change(i, f(this[i]))},

//     General-purpose traversal.
//     This is a SAX-style traversal model, useful for analytical or scope-oriented tree traversal. You specify a callback function that is invoked in pre-post-order on the tree (you get events
//     for entering and exiting each node, including leaves). Each time a node is entered, the callback is invoked with an object of the form {entering: node}, where 'node' is the syntax node
//     being entered. Each time a node is left, the callback is invoked with an object of the form {exiting: node}. The return value of the function is not used. Any null nodes are not traversed,
//     since they would fail any standard truthiness tests for 'entering' or 'exiting'.

//     I used to have a method to perform scope-annotated traversal, but I removed it for two reasons. First, I had no use for it (and no tests, so I had no reason to believe that it worked).
//     Second, Caterwaul is too low-level to need such a method. That would be more appropriate for an analysis extension.

      traverse: function (f) {f({entering: this}); f({exiting: this.each(function (n) {n && n.traverse(f)})}); return this},

//     Structural transformation.
//     Having nested syntax trees can be troublesome. For example, suppose you're writing a macro that needs a comma-separated list of terms. It's a lot of work to dig through the comma nodes,
//     each of which is binary. Javascript is better suited to using a single comma node with an arbitrary number of children. (This also helps with the syntax tree API -- we can use .map() and
//     .each() much more effectively.) Any binary operator can be transformed this way, and that is exactly what the flatten() method does. (flatten() returns a new tree; it doesn't modify the
//     original.)

//     The tree flattening operation looks like this for a left-associative binary operator:

//     |        (+)
//             /   \              (+)
//          (+)     z     ->     / | \
//         /   \                x  y  z
//        x     y

//     This flatten() method returns the nodes along the chain of associativity, always from left to right. It is shallow, since generally you only need a localized flat tree. That is, it doesn't
//     descend into the nodes beyond the one specified by the flatten() call. It takes an optional parameter indicating the operator to flatten over; if the operator in the tree differs, then the
//     original node is wrapped in a unary node of the specified operator. The transformation looks like this:

//     |                                  (,)
//            (+)                          |
//           /   \   .flatten(',')  ->    (+)
//          x     y                      /   \
//                                      x     y

//     Because ',' is a binary operator, a ',' tree with just one operand will be serialized exactly as its lone operand would be. This means that plurality over a binary operator such as comma
//     or semicolon degrades gracefully for the unary case (this sentence makes more sense in the context of macro definitions; see in particular 'let' and 'where' in std.bind).

//     The unflatten() method performs the inverse transformation. It doesn't delete a converted unary operator in the tree case, but if called on a node with more than two children it will nest
//     according to associativity.

      flatten:   function (d) {d = d || this.data; return d !== this.data ? this.as(d) : ! (has(parse_lr, d) && this.length) ? this : has(parse_associates_right, d) ?
                                                     se(new this.constructor(d), bind(function (n) {for (var i = this;     i && i.data === d; i = i[1]) n.push(i[0]); n.push(i)}, this)) :
                                                     se(new this.constructor(d), bind(function (n) {for (var i = this, ns = []; i.data === d; i = i[0]) i[1] && ns.push(i[1]); ns.push(i);
                                                                                                    for (i = ns.length - 1; i >= 0; --i) n.push(ns[i])}, this))},

      unflatten: function  () {var right = has(parse_associates_right, this.data); return this.length <= 2 ? this : se(new this.constructor(this.data), bind(function (n) {
                                 if (right) for (var i = 0, l = this.length - 1; i  < l; ++i) n = n.push(this[i]).push(i < l - 2 ? new this.constructor(this.data) : this[i])[1];
                                 else       for (var i = this.length - 1;        i >= 1; --i) n = n.push(i > 1 ? new this.constructor(this.data) : this[0]).push(this[i])[0]}, this))},

//     Wrapping.
//     Sometimes you want your syntax tree to have a particular operator, and if it doesn't have that operator you want to wrap it in a node that does. Perhaps the most common case of this is
//     when you have a possibly-plural node representing a variable or expression -- often the case when you're dealing with argument lists -- and you want to be able to assume that it's wrapped
//     in a comma node. Calling node.as(',') will return the node if it's a comma, and will return a new comma node containing the original one if it isn't.

      as: function (d) {return this.data === d ? this : new this.constructor(d).push(this)},

//     Type detection and retrieval.
//     These methods are used to detect the literal type of a node and to extract that value if it exists. You should use the as_x methods only once you know that the node does represent an x;
//     otherwise you will get misleading results. (For example, calling as_boolean on a non-boolean will always return false.)

//     Other methods are provided to tell you higher-level things about what this node does. For example, is_contextualized_invocation() tells you whether the node represents a call that can't be
//     eta-reduced (if it were, then the 'this' binding would be lost).

//     Wildcards are used for pattern matching and are identified by beginning with an underscore. This is a very frequently-called method, so I'm using a very inexpensive numeric check rather
//     than a string comparison. The ASCII value for underscore is 95.

               is_string: function () {return /['"]/.test(this.data.charAt(0))},           as_escaped_string: function () {return this.data.substr(1, this.data.length - 2)}, 
               is_number: function () {return /^-?(0x|\d|\.\d+)/.test(this.data)},                 as_number: function () {return Number(this.data)},
              is_boolean: function () {return this.data === 'true' || this.data === 'false'},     as_boolean: function () {return this.data === 'true'},
               is_regexp: function () {return /^\/./.test(this.data)},                     as_escaped_regexp: function () {return this.data.substring(1, this.data.lastIndexOf('/'))},

             is_wildcard: function () {return this.data.charCodeAt(0) === 95},

       has_grouped_block: function () {return has(parse_r_until_block, this.data)},                 is_block: function () {return has(parse_block, this.data)},
    is_blockless_keyword: function () {return has(parse_r_optional, this.data)},        is_null_or_undefined: function () {return this.data === 'null' || this.data === 'undefined'},

             is_constant: function () {return this.is_number() || this.is_string() || this.is_boolean() || this.is_regexp() || this.is_null_or_undefined()},
          left_is_lvalue: function () {return /=$/.test(this.data) || /\+\+$/.test(this.data) || /--$/.test(this.data)},
                is_empty: function () {return !this.length},                              has_parameter_list: function () {return this.data === 'function' || this.data === 'catch'},
         has_lvalue_list: function () {return this.data === 'var' || this.data === 'const'},  is_dereference: function () {return this.data === '.' || this.data === '[]'},
           is_invocation: function () {return this.data === '()'},              is_contextualized_invocation: function () {return this.is_invocation() && this[0] && this[0].is_dereference()},

            is_invisible: function () {return has(parse_invisible, this.data)},           is_binary_operator: function () {return has(parse_lr, this.data)},
is_prefix_unary_operator: function () {return has(parse_r, this.data)},            is_postfix_unary_operator: function () {return has(parse_l,  this.data)},
       is_unary_operator: function () {return this.is_prefix_unary_operator() || this.is_postfix_unary_operator()},

                 accepts: function (e) {return parse_accepts[this.data] && this.accepts[parse.data] === (e.data || e)},

//     Value construction.
//     Syntax nodes sometimes represent hard references to values instead of just syntax. (See 'References' for more information.) In order to compile a syntax tree in the right environment you
//     need a mapping of symbols to these references, which is what the bindings() method returns. (It also collects references for all descendant nodes.) It takes an optional argument to
//     populate, in case you already had a hash set aside for bindings -- though it always returns the hash.

//     A bug in Caterwaul 0.5 and earlier failed to bind falsy values. This is no longer the case; nodes which bind values should indicate that they do so by setting a binds_a_value attribute
//     (ref nodes do this on the prototype), indicating that their value should be read from the 'value' property. (This allows other uses of a 'value' property while making it unambiguous
//     whether a particular node intends to bind something.)

      bindings: function (hash) {var result = hash || {}; this.reach(function (n) {if (n.binds_a_value) result[n.data] = n.value}); return result},

//     Matching.
//     Any syntax tree can act as a matching pattern to destructure another one. It's often much more fun to do things this way than it is to try to pick it apart by hand. For example, suppose
//     you wanted to determine whether a node represents a function that immediately returns, and to know what it returns. The simplest way to do it is like this:

//     | var tree = ...
//       var match = caterwaul.parse('function (_) {return _value}').match(tree);
//       if (match) {
//         var value = match._value;
//         ...
//       }

//     The second parameter 'variables' stores a running total of match data. You don't provide this; match() creates it for you on the toplevel invocation. The entire original tree is available
//     as a match variable called '_'; for example: t.match(u)._ === u if u matches t.

         match: function (target, variables) {variables || (variables = {_: target});
                                              if (this.is_wildcard())                                          return variables[this.data] = target, variables;
                                         else if (this.length === target.length && this.data === target.data) {for (var i = 0, l = this.length; i < l; ++i)
                                                                                                                 if (! this[i].match(target[i], variables)) return null;
                                                                                                               return variables}},

//     Inspection and syntactic serialization.
//     Syntax nodes can be both inspected (producing a Lisp-like structural representation) and serialized (producing valid Javascript code). Each representation captures stray links via the 'r'
//     pointer. In the serialized representation, it is shown as a comment /* -> */ containing the serialization of whatever is to the right. This has the property that it will break tests but
//     won't necessarily break code (though if it happens in the field then it's certainly a bug).

//     Block detection is required for multi-level if/else statements. Consider this code:

//     | if (foo) for (...) {}
//       else bif;

//     A naive approach (the one I was using before version 0.6) would miss the fact that the 'for' was trailed by a block, and insert a spurious semicolon, which would break compilation:

//     | if (foo) for (...) {};    // <- note!
//       else bif;

//     What we do instead is dig through the tree and find out whether the last thing in the 'if' case ends with a block. If so, then no semicolon is inserted; otherwise we insert one. This
//     algorithm makes serialization technically O(n^2), but nobody nests if/else blocks to such an extent that it would matter.

 ends_with_block: function () {var block = this[parse_r_until_block[this.data]];
                               return this.data === '{' || has(parse_r_until_block, this.data) && (this.data !== 'function' || this.length === 3) && block && block.ends_with_block()},

//     There's a hack here for single-statement if-else statements. (See 'Grab-until-block behavior' in the parsing code below.) Basically, for various reasons the syntax tree won't munch the
//     semicolon and connect it to the expression, so we insert one automatically whenever the second node in an if, else, while, etc. isn't a block.

//     Update for Caterawul 0.6.6: I had removed mandatory spacing for unary prefix operators, but now it's back. The reason is to help out the host Javascript lexer, which can misinterpret
//     postfix increment/decrement: x + +y will be serialized as x++y, which is invalid Javascript. The fix is to introduce a space in front of the second plus: x+ +y, which is unambiguous.

        toString: function ()   {return 'qs[' + this.serialize() + ']'},
         inspect: function ()   {return this.toString()},
       structure: function ()   {return (this.l ? '(left) <- ' : '') + '(' + this.data + (this.length ? ' ' + map(syntax_node_inspect, this).join(' ') : '') + ')' +
                                        (this.r ? ' -> ' + this.r.inspect() : '')},

//     An improvement that could be made to serialize() is to use one big array that is then join()ed for serialization, rather than appending all of these little strings. Based on the
//     benchmarking I've done, the compilation phase is fairly zippy; but if it ever ends up being a problem then I'll look into optimizations like this.

       serialize: function (xs) {var op = this.data, space = op && /\w/.test(op.charAt(op.length - 1)) ? ' ' : '';
                                 return op === ';' ? this.length ? map(syntax_node_tostring, this).join(';\n') : ';' :
                          has(parse_invisible, op) ? map(syntax_node_tostring, this).join(space) :
                         has(parse_invocation, op) ? map(syntax_node_tostring, [this[0], op.charAt(0), this[1], op.charAt(1)]).join(space) :
                            has(parse_ternary, op) ? map(syntax_node_tostring, [this[0], op, this[1], parse_group[op], this[2]]).join(space) :
                              has(parse_group, op) ? op + map(syntax_node_tostring, this).join(space) + parse_group[op] :
                                 has(parse_lr, op) ? this.length ? map(syntax_node_tostring, this).join(space + op + space) : op :
     has(parse_r, op) || has(parse_r_optional, op) ? op.replace(/^u/, ' ') + space + (this[0] ? this[0].serialize() : '') :
                      has(parse_r_until_block, op) ? has(parse_accepts, op) && this[1] && this[2] && parse_accepts[op] === this[2].data && ! this[1].ends_with_block() ?
                                                       op + space + map(syntax_node_tostring, [this[0], this[1], ';\n', this[2]]).join('') :
                                                       op + space + map(syntax_node_tostring, this).join('') :
                                  has(parse_l, op) ? (this[0] ? this[0].serialize() : '') + space + op : op}};

    caterwaul_global.method('define_syntax', function (name, ctor) {return this.field(name, extend.apply(this, [ctor, syntax_common].concat(Array.prototype.slice.call(arguments, 2))))}).
                     method('ensure_syntax', function (thing)      {return thing && thing.constructor === String ? this.parse(thing) : thing}).
                      field('syntax_common', syntax_common).

//   References.
//   You can drop references into code that you're compiling. This is basically variable closure, but a bit more fun. For example:

//   | caterwaul.compile(qs[fn_[_ + 1]].replace({_: new caterwaul.ref(3)})()    // -> 4

//   What actually happens is that caterwaul.compile runs through the code replacing refs with gensyms, and the function is evaluated in a scope where those gensyms are bound to the values they
//   represent. This gives you the ability to use a ref even as an lvalue, since it's really just a variable. References are always leaves on the syntax tree, so the prototype has a length of 0.

    define_syntax('ref', function (value) {if (value instanceof this.constructor) {this.value = value.value; this.data = value.data}
                                           else                                   {this.value = value;       this.data = gensym()}}, {length: 0, binds_a_value: true}).

//   Syntax node constructor.
//   Here's where we combine all of the pieces above into a single function with a large prototype. Note that the 'data' property is converted from a variety of types; so far we support strings,
//   numbers, and booleans. Any of these can be added as children. Also, I'm using an instanceof check rather than (.constructor ===) to allow array subclasses such as Caterwaul finite sequences
//   to be used.

    define_syntax('syntax', function (data) {if (data instanceof this.constructor) this.data = data.data, this.length = 0;
                                             else {this.data = data && data.toString(); this.length = 0;
                                               for (var i = 1, l = arguments.length, _; _ = arguments[i], i < l; ++i)
                                                 for (var j = 0, lj = _.length, it, itc; _ instanceof Array ? (it = _[j], j < lj) : (it = _, ! j); ++j)
                                                   this._append((itc = it.constructor) === String || itc === Number || itc === Boolean ? new this.constructor(it) : it)}})})();
// Generated by SDoc 





// Parsing.
// There are two distinct parts to parsing Javascript. One is parsing the irregular statement-mode expressions such as 'if (condition) {...}' and 'function f(x) {...}'; the other is parsing
// expression-mode stuff like arithmetic operators. In Rebase I tried to model everything as an expression, but that failed sometimes because it required that each operator have fixed arity. In
// particular this was infeasible for keywords such as 'break', 'continue', 'return', and some others (any of these can be nullary or unary). It also involved creating a bizarre hack for 'case
// x:' inside a switch block. This hack made the expression passed in to 'case' unavailable, as it would be buried in a ':' node.

// Caterwaul fixes these problems by using a proper context-free grammar. However, it's much looser than most grammars because it doesn't need to validate anything. Correspondingly, it can be
// much faster as well. Instead of guessing and backtracking as a recursive-descent parser would, it classifies many different branches into the same basic structure and fills in the blanks. One
// example of this is the () {} pair, which occurs in a bunch of different constructs, including function () {}, if () {}, for () {}, etc. In fact, any time a () group is followed by a {} group
// we can grab the token that precedes () (along with perhaps one more in the case of function f () {}), and group that under whichever keyword is responsible.

  caterwaul_global.alias('parse', 'decompile').
                  method('parse', (function () {

//   Syntax folding.
//   The first thing to happen is that parenthetical, square bracket, and braced groups are folded up. This happens in a single pass that is linear in the number of tokens, and other foldable
//   tokens (including unary and binary operators) are indexed by associativity. The following pass runs through these indexes from high to low precedence and folds tokens into trees. By this
//   point all of the parentheticals have been replaced by proper nodes (here I include ?: groups in parentheticals, since they behave the same way). Finally, high-level rules are applied to the
//   remaining keywords, which are bound last. This forms a complete parse tree.

//   Doing all of this efficiently requires a linked list rather than an array. This gets built during the initial paren grouping stage. Arrays are used for the indexes, which are left-to-right
//   and are later processed in the order indicated by the operator associativity. That is, left-associative operators are processed 0 .. n and right associative are processed n .. 0. Keywords
//   are categorized by behavior and folded after all of the other operators. Semicolons are folded last, from left to right.

//   There are some corner cases due to Javascript's questionable heritage from C-style syntax. For example, most constructs take either syntax blocks or semicolon-delimited statements. Ideally,
//   else, while, and catch are associated with their containing if, do, and try blocks, respectively. This can be done easily, as the syntax is folded right-to-left. Another corner case would
//   come up if there were any binary operators with equal precedence and different associativity. Javascript doesn't have them however, and it wouldn't make much sense to; it would render
//   expressions such as 'a op1 b op2 c' ambiguous if op1 and op2 shared precedence but each wanted to bind first. (I mention this because at first I was worried about it, but now I realize it
//   isn't an issue.)

//   Notationally (for easier processing later on), a distinction is made between invocation and grouping, and between dereferencing and array literals. Dereferencing and function invocation are
//   placed into their own operators, where the left-hand side is the thing being invoked or dereferenced and the right-hand side is the paren-group or bracket-group that is responsible for the
//   operation. Also, commas inside these groups are flattened into a single variadic (possibly nullary) comma node so that you don't have to worry about the tree structure. This is the case for
//   all left-associative operators; right-associative operators preserve their hierarchical folding.

//   Parse/lex shared logic.
//   Lexing Javascript is not entirely straightforward, primarily because of regular expression literals. The first implementation of the lexer got things right 99% of the time by inferring the
//   role of a / by its preceding token. The problem comes in when you have a case like this:

//   | if (condition) /foo/.test(x)

//   In this case, (condition) will be incorrectly inferred to be a regular expression (since the close-paren terminates an expression, usually), and /foo/ will be interpreted as division by foo. 

//   We mark the position before a token and then just increment the position. The token, then, can be retrieved by taking a substring from the mark to the position. This eliminates the need for
//   intermediate concatenations. In a couple of cases I've gone ahead and done them anyway -- these are for operators, where we grab the longest contiguous substring that is defined. I'm not too
//   worried about the O(n^2) complexity due to concatenation; they're bounded by four characters.

//   OK, so why use charAt() instead of regular expressions? It's a matter of asymptotic performance. V8 implements great regular expressions (O(1) in the match length for the (.*)$ pattern), but
//   the substring() method is O(n) in the number of characters returned. Firefox implements O(1) substring() but O(n) regular expression matching. Since there are O(n) tokens per document of n
//   characters, any O(n) step makes lexing quadratic. So I have to use the only reliably constant-time method provided by strings, charAt() (or in this case, charCodeAt()).

//   Of course, building strings via concatenation is also O(n^2), so I also avoid that for any strings that could be long. This is achieved by using a mark to indicate where the substring
//   begins, and advancing i independently. The span between mark and i is the substring that will be selected, and since each substring both requires O(n) time and consumes n characters, the
//   lexer as a whole is O(n). (Though perhaps with a large constant.)

//   Parse function.
//   As mentioned earlier, the parser and lexer aren't distinct. The lexer does most of the heavy lifting; it matches parens and brackets, arranges tokens into a hierarchical linked list, and
//   provides an index of those tokens by their fold order. It does all of this by streaming tokens into a micro-parser whose language is grouping and that knows about the oddities required to
//   handle regular expression cases. In the same function, though as a distinct case, the operators are folded and the syntax is compiled into a coherent tree form.

//   The input to the parse function can be anything whose toString() produces valid Javascript code.

      return function (input) {

//     Lex variables.
//     s, obviously, is the string being lexed. mark indicates the position of the stream, while i is used for lookahead. The difference is later read into a token and pushed onto the result. c
//     is a temporary value used to store the current character code. re is true iff a slash would begin a regular expression. esc is a flag indicating whether the next character in a string or
//     regular expression literal is escaped. exp indicates whether we've seen the exponent marker in a number. close is used for parsing single and double quoted strings; it contains the
//     character code of the closing quotation mark. t is the token to be processed.

//     Parse variables.
//     grouping_stack and gs_top are used for paren/brace/etc. matching. head and parent mark two locations in the linked syntax tree; when a new group is created, parent points to the opener
//     (i.e. (, [, ?, or {), while head points to the most recently added child. (Hence the somewhat complex logic in push().) indexes[] determines reduction order, and contains references to the
//     nodes in the order in which they should be folded. invocation_nodes is an index of the nodes that will later need to be flattened.

//     The push() function manages the mechanics of adding a node to the initial linked structure. There are a few cases here; one is when we've just created a paren group and have no 'head'
//     node; in this case we append the node as 'head'. Another case is when 'head' exists; in that case we update head to be the new node, which gets added as a sibling of the old head.

        var s = input.toString(), mark = 0, c = 0, re = true, esc = false, dot = false, exp = false, close = 0, t = '', i = 0, l = s.length, cs = function (i) {return s.charCodeAt(i)},
            grouping_stack = [], gs_top = null, head = null, parent = null, indexes = map(function () {return []}, parse_reduce_order), invocation_nodes = [], all_nodes = [],
            new_node = function (n) {return all_nodes.push(n), n}, push = function (n) {return head ? head._sibling(head = n) : (head = n._append_to(parent)), new_node(n)},
            syntax_node = caterwaul_global.syntax;

//     Main lex loop.
//     This loop takes care of reading all of the tokens in the input stream. At the end, we'll have a linked node structure with paren groups. At the beginning, we set the mark to the current
//     position (we'll be incrementing i as we read characters), munch whitespace, and reset flags.

        while ((mark = i) < l) {
          while (lex_space[c = cs(i)] && i < l) mark = ++i;
          esc = exp = dot = t = false;

//       Miscellaneous lexing.
//       This includes bracket resetting (the top case, where an open-bracket of any sort triggers regexp mode) and comment removal. Both line and block comments are removed by comparing against
//       lex_slash, which represents /, and lex_star, which represents *.

            if                                        (lex_bracket[c])                                                                    {t = !! ++i; re = lex_opener[c]}
       else if (c === lex_slash && cs(i + 1) === lex_star && (i += 2)) {while (++i < l && cs(i) !== lex_slash || cs(i - 1) !== lex_star);  t = !  ++i}
       else if            (c === lex_slash && cs(i + 1) === lex_slash) {while                              (++i < l && ! lex_eol[cs(i)]);  t = false}

//       Regexp and string literal lexing.
//       These both take more or less the same form. The idea is that we have an opening delimiter, which can be ", ', or /; and we look for a closing delimiter that follows. It is syntactically
//       illegal for a string to occur anywhere that a slash would indicate division (and it is also illegal to follow a string literal with extra characters), so reusing the regular expression
//       logic for strings is not a problem. (This follows because we know ahead of time that the Javascript is valid.)

       else if (lex_quote[c] && (close = c) && re && ! (re = ! (t = s.charAt(i)))) {while (++i < l && (c = cs(i)) !== close || esc)  esc = ! esc && c === lex_back;
                                                                                    while     (++i < l && lex_regexp_suffix[cs(i)])                               ; t = true}

//       Numeric literal lexing.
//       This is far more complex than the above cases. Numbers have several different formats, each of which requires some custom logic. The reason we need to parse numbers so exactly is that it
//       influences how the rest of the stream is lexed. One example is '0.5.toString()', which is perfectly valid Javascript. What must be output here, though, is '0.5', '.', 'toString', '(',
//       ')'; so we have to keep track of the fact that we've seen one dot and stop lexing the number on the second.

//       Another case is exponent-notation: 3.0e10. The hard part here is that it's legal to put a + or - on the exponent, which normally terminates a number. Luckily we can safely skip over any
//       character that comes directly after an E or e (so long as we're really in exponent mode, which I'll get to momentarily), since there must be at least one digit after an exponent.

//       The final case, which restricts the logic somewhat, is hexadecimal numbers. These also contain the characters 'e' and 'E', but we cannot safely skip over the following character, and any
//       decimal point terminates the number (since '0x5.toString()' is also valid Javascript). The same follows for octal numbers; the leading zero indicates that there will be no decimal point,
//       which changes the lex mode (for example, '0644.toString()' is valid).

//       So, all this said, there are different logic branches here. One handles guaranteed integer cases such as hex/octal, and the other handles regular numbers. The first branch is triggered
//       whenever a number starts with zero and is followed by 'x' or a digit (for conciseness I call 'x' a digit), and the second case is triggered when '.' is followed by a digit, or when a
//       digit starts.

//       A trivial change, using regular expressions, would reduce this logic significantly. I chose to write it out longhand because (1) it's more fun that way, and (2) the regular expression
//       approach has theoretically quadratic time in the length of the numbers, whereas this approach keeps things linear. Whether or not that actually makes a difference I have no idea.

//       Finally, in response to a recently discovered failure case, a period must be followed by a digit if it starts a number. The failure is the string '.end', which will be lexed as '.en',
//       'd' if it is assumed to be a floating-point number. (In fact, any method or property beginning with 'e' will cause this problem.)

       else if                  (c === lex_zero && lex_integer[cs(i + 1)]) {while (++i < l && lex_integer[cs(i)]); re = ! (t = true)}
       else if (lex_float[c] && (c !== lex_dot || lex_decimal[cs(i + 1)])) {while (++i < l && (lex_decimal[c = cs(i)] || (dot ^ (dot |= c === lex_dot)) || (exp ^ (exp |= lex_exp[c] && ++i))));
                                                                            while (i < l && lex_decimal[cs(i)]) ++i; re = ! (t = true)}

//       Operator lexing.
//       The 're' flag is reused here. Some operators have both unary and binary modes, and as a heuristic (which happens to be accurate) we can assume that anytime we expect a regular
//       expression, a unary operator is intended. The only exception are ++ and --, which are always unary but sometimes are prefix and other times are postfix. If re is true, then the prefix
//       form is intended; otherwise, it is postfix. For this reason I've listed both '++' and 'u++' (same for --) in the operator tables; the lexer is actually doing more than its job here by
//       identifying the variants of these operators.

//       The only exception to the regular logic happens if the operator is postfix-unary. (e.g. ++, --.) If so, then the re flag must remain false, since expressions like 'x++ / 4' can be valid.

       else if (lex_punct[c] && (t = re ? 'u' : '', re = true)) {while (i < l && lex_punct[cs(i)] && has(lex_op, t + s.charAt(i)))  t += s.charAt(i++); re = ! has(lex_postfix_unary, t)}

//       Identifier lexing.
//       If nothing else matches, then the token is lexed as a regular identifier or Javascript keyword. The 're' flag is set depending on whether the keyword expects a value. The nuance here is
//       that you could write 'x / 5', and it is obvious that the / means division. But if you wrote 'return / 5', the / would be a regexp delimiter because return is an operator, not a value. So
//       at the very end, in addition to assigning t, we also set the re flag if the word turns out to be an operator.

       else {while (++i < l && lex_ident[cs(i)]); re = has(lex_op, t = s.substring(mark, i))}

//       Token unification.
//       t will contain true, false, or a string. If false, no token was lexed; this happens when we read a comment, for example. If true, the substring method should be used. (It's a shorthand to
//       avoid duplicated logic.) For reasons that are not entirely intuitive, the lexer sometimes produces the artifact 'u;'. This is never useful, so I have a case dedicated to removing it.

        if (i === mark) throw new Error('Caterwaul lex error at "' + s.substr(mark, 40) + '" with leading context "' + s.substr(mark - 40, 40) + '" (probably a Caterwaul bug)');
        if (t === false) continue;
        t = t === true ? s.substring(mark, i) : t === 'u;' ? ';' : t;

//       Grouping and operator indexing.
//       Now that we have a token, we need to see whether it affects grouping status. There are a couple of possibilities. If it's an opener, then we create a new group; if it's a matching closer
//       then we close the current group and pop out one layer. (We don't check for matching here. Any code provided to Caterwaul will already have been parsed by the host Javascript interpreter,
//       so we know that it is valid.)

//       All operator indexing is done uniformly, left-to-right. Note that the indexing isn't strictly by operator. It's by reduction order, which is arguably more important. That's what the
//       parse_inverse_order table does: it maps operator names to parse_reduce_order subscripts. (e.g. 'new' -> 2.)

        t === gs_top ? (grouping_stack.pop(), gs_top = grouping_stack[grouping_stack.length - 1], head = head ? head.p : parent, parent = null) :
                       (has(parse_group, t) ? (grouping_stack.push(gs_top = parse_group[t]), parent = push(new_node(new syntax_node(t))), head = null) : push(new_node(new syntax_node(t))),
                        has(parse_inverse_order, t) && indexes[parse_inverse_order[t]].push(head || parent));

//       Regexp flag special cases.
//       Normally a () group wraps an expression, so a following / would indicate division. The only exception to this is when we have a block construct; in this case, the next token appears in
//       statement-mode, which means that it begins, not modifies, a value. We'll know that we have such a case if (1) the immediately-preceding token is a close-paren, and (2) a block-accepting
//       syntactic form occurs to its left.

//       With all this trouble over regular expressions, I had to wonder whether it was possible to do it more cleanly. I don't think it is, unfortunately. Even lexing the stream backwards fails
//       to resolve the ambiguity:

//       | for (var k in foo) /foo/g.test(k) && bar();

//       In this case we won't know it's a regexp until we hit the 'for' keyword (or perhaps 'var', if we're being clever -- but a 'with' or 'if' would require complete lookahead). A perfectly
//       valid alternative parse, minus the 'for' and 'var', is this:

//       | ((k in foo) / (foo) / (g.test(k))) && bar();

//       The only case where reverse-lexing is useful is when the regexp has no modifiers.

        re |= t === ')' && head.l && has(parse_r_until_block, head.l.data)}

//     Operator fold loop.
//     This is the second major part of the parser. Now that we've completed the lex process, we can fold operators and syntax, and take care of some exception cases.

//     First step: fold function literals, function calls, dots, and dereferences.
//     I'm treating this differently from the generalized operator folding because of the syntactic inference required for call and dereference detection. Nothing has been folded at this point
//     (with the exception of paren groups, which is appropriate), so if the node to the left of any ( or [ group is an operator, then the ( or [ is really a paren group or array literal. If, on
//     the other hand, it is another value, then the group is a function call or a dereference. This folding goes left-to-right. The reason we also process dot operators is that they share the same
//     precedence as calls and dereferences. Here's what a () or [] transform looks like:

//     |   quux <--> foo <--> ( <--> bar                              quux <--> () <--> bar
//                             \                                               /  \                  <-- This can be done by saying _.l.wrap(new node('()')).p.fold_r().
//                              bif <--> , <--> baz       -->               foo    (                     _.l.wrap() returns l again, .p gets the wrapping node, and fold_r adds a child to it.
//                                                                                  \
//                                                                                   bif <--> , <--> baz

//     This is actually merged into the for loop below, even though it happens before other steps do (see 'Ambiguous parse groups').

//     Second step: fold operators.
//     Now we can go through the list of operators, folding each according to precedence and associativity. Highest to lowest precedence here, which is just going forwards through the indexes[]
//     array. The parse_index_forward[] array indicates which indexes should be run left-to-right and which should go right-to-left.

        for (var i = 0, l = indexes.length, forward, _; _ = indexes[i], forward = parse_index_forward[i], i < l; ++i)  
          for (var j = forward ? 0 : _.length - 1, lj = _.length, inc = forward ? 1 : -1, node, data; node = _[j], data = node && node.data, forward ? j < lj : j >= 0; j += inc)

//       Binary node behavior.
//       The most common behavior is binary binding. This is the usual case for operators such as '+' or ',' -- they grab one or both of their immediate siblings regardless of what they are.
//       Operators in this class are considered to be 'fold_lr'; that is, they fold first their left sibling, then their right.

            if (has(parse_lr, data)) node._fold_lr();

//       Ambiguous parse groups.
//       As mentioned above, we need to determine whether grouping constructs are invocations or real groups. This happens to take place before other operators are parsed (which is good -- that way
//       it reflects the precedence of dereferencing and invocation). The only change we need to make is to discard the explicit parenthetical or square-bracket grouping for invocations or
//       dereferences, respectively. It doesn't make much sense to have a doubly-nested structure, where we have a node for invocation and another for the group on the right-hand side of that
//       invocation. Better is to modify the group in-place to represent an invocation.

//       We can't solve this problem here, but we can solve it after the parse has finished. I'm pushing these invocation nodes onto an index for the end.

       else if (has(parse_ambiguous_group, data) && node.l && (node.l.data === '.' ||
                     ! (has(lex_op, node.l.data) || has(parse_not_a_value, node.l.data))))  invocation_nodes.push(node.l._wrap(new_node(new syntax_node(data + parse_group[data]))).p._fold_r());

//       Unary left and right-fold behavior.
//       Unary nodes have different fold directions. In this case, it just determines which side we grab the node from. I'm glad that Javascript doesn't allow stuff like '++x++', which would make
//       the logic here actually matter. Because there isn't that pathological case, exact rigidity isn't required.

       else if (has(parse_l, data))  node._fold_l();
       else if (has(parse_r, data))  node._fold_r();

//       Ternary operator behavior.
//       This is kind of interesting. If we have a ternary operator, then it will be treated first as a group; just like parentheses, for example. This is the case because the ternary syntax is
//       unambiguous for things in the middle. So, for example, '3 ? 4 : 5' initially parses out as a '?' node whose child is '4'. Its siblings are '3' and '5', so folding left and right is an
//       obvious requirement. The only problem is that the children will be in the wrong order. Instead of (3) (4) (5), we'll have (4) (3) (5). So after folding, we do a quick swap of the first two
//       to set the ordering straight.

       else if (has(parse_ternary, data)) {node._fold_lr(); var temp = node[1]; node[1] = node[0]; node[0] = temp}

//       Grab-until-block behavior.
//       Not quite as simple as it sounds. This is used for constructs such as 'if', 'function', etc. Each of these constructs takes the form '<construct> [identifier] () {}', but they can also
//       have variants that include '<construct> () {}', '<construct> () statement;', and most problematically '<construct> () ;'. Some of these constructs also have optional child components; for
//       example, 'if () {} else {}' should be represented by an 'if' whose children are '()', '{}', and 'else' (whose child is '{}'). The tricky part is that 'if' doesn't accept another 'if' as a
//       child (e.g. 'if () {} if () {}'), nor does it accept 'for' or any number of other things. This discrimination is encoded in the parse_accepts table.

//       There are some weird edge cases, as always. The most notable is what happens when we have nesting without blocks:

//       | if (foo) bar; else bif;

//       In this case we want to preserve the semicolon on the 'then' block -- that is, 'bar;' should be its child; so the semicolon is required. But the 'bif' in the 'else' case shouldn't have a
//       semicolon, since that separates top-level statements. Because desperate situations call for desperate measures, there's a hack specifically for this in the syntax tree serialization.

//       One more thing. Firefox rewrites syntax trees, and one of the optimizations it performs on object literals is removing quotation marks from regular words. This means that it will take the
//       object {'if': 4, 'for': 1, etc.} and render it as {if: 4, for: 1, etc.}. As you can imagine, this becomes a big problem as soon as the word 'function' is present in an object literal. To
//       prevent this from causing problems, I only collapse a node if it is not followed by a colon. (And the only case where any of these would legally be followed by a colon is as an object
//       key.)

       else if (has(parse_r_until_block, data) && node.r && node.r.data !== ':')
                                                 {for (var count = 0, limit = parse_r_until_block[data]; count < limit && node.r && ! has(parse_block, node.r.data); ++count) node._fold_r();
                                                  node.r && node.r.data !== ';' && node._fold_r();
                                                  if (has(parse_accepts, data) && parse_accepts[data] === (node.r && node.r.r && node.r.r.data)) node._fold_r().pop()._fold_r();
                                             else if (has(parse_accepts, data) && parse_accepts[data] === (node.r && node.r.data))               node._fold_r()}

//       Optional right-fold behavior.
//       The return, throw, break, and continue keywords can each optionally take an expression. If the token to the right is an expression, then we take it, but if the token to the right is a
//       semicolon then the keyword should be nullary.

       else if (has(parse_r_optional, data))  node.r && node.r.data !== ';' && node._fold_r();

//     Third step.
//     Find all elements with right-pointers and wrap them with semicolon nodes. This is necessary because of certain constructs at the statement-level don't use semicolons; they use brace syntax
//     instead. (e.g. 'if (foo) {bar} baz()' is valid, even though no semicolon precedes 'baz()'.) By this point everything else will already be folded. Note that this does some weird things to
//     associativity; in general, you can't make assumptions about the exact layout of semicolon nodes. Fortunately semicolon is associative, so it doesn't matter in practice. And just in case,
//     these nodes are 'i;' rather than ';', meaning 'inferred semicolon' -- that way it's clear that they aren't original. (They also won't appear when you call toString() on the syntax tree.)

        for (var i = all_nodes.length - 1, _; _ = all_nodes[i], i >= 0; --i)  _.r && _._wrap(new syntax_node('i;')).p._fold_r();

//     Fourth step.
//     Flatten out all of the invocation nodes. As explained earlier, they are nested such that the useful data on the right is two levels down. We need to grab the grouping construct on the
//     right-hand side and remove it so that only the invocation or dereference node exists. During the parse phase we built an index of all of these invocation nodes, so we can iterate through
//     just those now. I'm preserving the 'p' pointers, though they're probably not useful beyond here.

        for (var i = 0, l = invocation_nodes.length, _, child; _ = invocation_nodes[i], i < l; ++i) (child = _[1] = _[1][0]) && (child.p = _);

        while (head.p) head = head.p;

//     Fifth step.
//     Prevent a space leak by clearing out all of the 'p' pointers.

        for (var i = all_nodes.length - 1; i >= 0; --i)  delete all_nodes[i].p;
        return head}})());
// Generated by SDoc 





// Environment-dependent compilation.
// It's possible to bind variables from 'here' (i.e. this runtime environment) inside a compiled function. The way we do it is to create a closure using a gensym. (Another reason that gensyms
// must really be unique.) Here's the idea. We use the Function constructor to create an outer function, bind a bunch of variables directly within that scope, and return the function we're
// compiling. The variables correspond to gensyms placed in the code, so the code will have closure over those variables.

// An optional second parameter 'environment' can contain a hash of variable->value bindings. These will be defined as locals within the compiled function.

// New in caterwaul 0.6.5 is the ability to specify a 'this' binding to set the context of the expression being evaluated.

// Caterwaul 1.0 introduces the 'globals' attribute, which lets you set global variables that will automatically be present when compiling syntax trees. Note that using this feature can prevent
// precompilation, since the global references may not be serializable (and they are included in precompiled code).

  caterwaul_global.shallow('globals', {}).method('compile',
    function (tree, environment) {var vars = [], values = [], bindings = merge({}, this.globals, environment || {}, tree.bindings()), s = gensym();
                                  for (var k in bindings) if (own.call(bindings, k)) vars.push(k), values.push(bindings[k]);
                                  var code = map(function (v) {return v === 'this' ? '' : 'var ' + v + '=' + s + '.' + v}, vars).join(';') + ';return(' + tree.serialize() + ')';
                                  try {return (new Function(s, code)).call(bindings['this'], bindings)} catch (e) {throw new Error('caught ' + e + ' while compiling ' + code)}});
// Generated by SDoc 






// Event listening API.
// Caterwaul can create pairs of listener/broadcast interfaces for events. For example, suppose we wanted to provide a facility for macros to issue compile-time warnings; one way to do this would
// be to create a 'warning' event and allow interested parties to listen for it. Here's how that might look:

// | caterwaul.event('warning');   // Sets up the interface
//   caterwaul.on_warning(function (w) {console.log('Warning: ' + w)});    // Adds a listener
//   caterwaul.warning('this is a test');                                  // Triggers all listeners with the given parameter

// The context (i.e. 'this') of each event listener is the caterwaul object.

  caterwaul_global.variadic('event', function (name) {
    var listeners = name + '_listeners', new_listener = 'on_' + name;
    return this.shallow(listeners, []).variadic(new_listener, function (l) {this[listeners].push(l); return this}).
                                         method(name,         function ()  {for (var ls = this[listeners], i = 0, l = ls.length; i < l; ++i) ls[i].apply(this, arguments); return this})});
// Generated by SDoc 






// Macroexpansion.
// Caterwaul's main purpose is to transform code, and the way it does this is by using macroexpansion. Macroexpansion involves finding pieces of the syntax tree that have a particular form and
// changing them somehow. Normally this is done by first defining a pattern and then defining a function that returns something to replace occurrences of that pattern. For example:

// | caterwaul.macro('_a + _b', '_a * _b');

// This macro finds binary addition and replaces it with multiplication. In previous versions of caterwaul the macro would have been written using anonymous wildcards and a macroexpansion
// function, but caterwaul 1.0 now supports named pattern matching. If you write a function to generate the expansion, it will receive an object containing the match data:

// | var tree = caterwaul.parse('foo + bar');
//   caterwaul.macro('_a + _b', function (match) {
//     console.log(match);                                 // logs {_a: (foo), _b: (bar)}
//   });

// Inside the macroexpander 'this' is bound to the instance of caterwaul that is performing macroexpansion.

  (function () {

//   Pitfalls of macroexpansion.
//   Macroexpansion as described here can encode a lambda-calculus. The whole point of having macros is to make them capable, so I can't complain about that. But there are limits to how far I'm
//   willing to go down the pattern-matching path. Let's suppose the existence of the let-macro, for instance:

//   | let (x = y) in z   ->   (function (x) {return z}) (y)

//   If you write these macros:

//   | foo[x, y]   ->   let (x = y)
//     bar[x, y]   ->   x in y

//   Caterwaul is not required to expand bar[foo[x, y], z] into (function (x) {return z}) (y). It might just leave it at let (x = y) in z instead. The reason is that while the individual
//   macroexpansion outputs are macroexpanded, a fixed point is not run on macroexpansion in general. To get the extra macroexpansion you would have to wrap the whole expression in another macro,
//   in this case called 'expand':

//   | caterwaul.configure(function () {
//       this.rmacro('expand[_x]', fn[match][caterwaul.macroexpand(match._x)]);
//     });

//   This is an eager macro; by outputting the already-expanded contents, it gets another free pass through the macroexpander.

//   Things that are not guaranteed:

//   | 1. Reassembly of different pieces (see above).
//     2. Anything at all, if your macroexpansion function destructively modifies its syntax trees. Returning a replacement is one thing, but modifying one will break things.
//     3. Performance bounds.

// Macroexpansion behavior.
// Caterwaul exposes macroexpansion as a contained interface. This lets you write your own compilers with macroexpansion functionality, even if the syntax trees weren't created by Caterwaul.
// (Though you won't be able to precompile these.) In order for this to work, your syntax trees must:

// | 1. Look like arrays -- that is, have a .length property and be indexable by number (e.g. x[0], x[1], ..., x[x.length - 1])
//   2. Implement an rmap() method. This should perform a depth-first traversal of the syntax tree, invoking a callback function on each node. If the callback returns a value, that value should
//      be subsituted for the node passed in and traversal should continue on the next node (not the one that was grafted in). Otherwise traversal should descend into the unmodified node. The
//      rmap() method defined for Caterwaul syntax trees can be used as a reference implementation. (It's fairly straightforward.)
//   3. Implement a .data property. This represents an equivalence class for syntax nodes under ===. Right now there is no support for using other equivalence relations.
//   4. Implement an .is_wildcard() method. This should return a truthy value if your node represents a wildcard when used in a pattern.

// As of version 0.7.0 this compatibility may change without notice. The reason is that the macroexpansion logic used by Caterwaul is becoming more sophisticated to increase performance, which
// means that it may become arbitrarily optimized. (See sdoc::js::core/caterwaul.macroexpand-jit for information about additional features your nodes should support.)

//   Macro vs. final_macro.
//   Normally you want the output of a macro to be re-macroexpanded. For example, suppose you're mapping _a + _b to (_a).plus(_b). If you didn't re-expand the output of this macro, then applying
//   it to the expression 'x + y + z' would yield (x + y).plus(z), since macros are applied outside-in. Fortunately macro() takes care of this for you and re-expands output automatically.

//   There are some cases where you wouldn't want re-expansion. One of them is when you're assigning context-specific meaning to operators or other syntax nodes; in this case you want to control
//   the traversal process manually. Another case is if you were to define a literal macro:

//   | caterwaul.final_macro('literal(_x)', '_x')          // final_macro says "don't re-expand the output"

//   Under the hood the macro() method ultimately uses final_macro(), but wraps your macroexpander in a function that knows how to re-expand output. All re-expansion is done by the compiler that
//   is macroexpanding in the first place.

    caterwaul_global.shallow('macro_patterns',  []).
                     shallow('macro_expanders', []).

                      method('with_gensyms', function (t) {var gensyms = {}; return this.ensure_syntax(t).rmap(function (n) {
                                                             return /^gensym/.test(n.data) && new this.constructor(gensyms[n.data] || (gensyms[n.data] = gensym()), this)})}).

                      method('macroexpand',        function (t) {return this.ensure_syntax(t).rmap(this.macroexpand_single)}).
                      method('macroexpand_single', function (t) {return this.macro_expand_naive(t, this.macro_patterns, this.macro_expanders)}).

                      method('expander_from_string', function (expander) {var tree = this.parse(expander); return function (match) {return tree.replace(match)}}).
                      method('ensure_expander',      function (expander) {return expander.constructor === String      ? this.expander_from_string(expander) :
                                                                                 expander.constructor === this.syntax ? function (match) {return expander.replace(match)} :
                                                                                 expander.constructor === Function    ? expander : fail('unknown macroexpander format: ' + expander)}).
       right_variadic_binary('final_macro',
         function (pattern, expander) {return this.macro_patterns.push(this.ensure_syntax(pattern)), this.macro_expanders.push(this.ensure_expander(expander)), this}).

       right_variadic_binary('macro',
         function (pattern, expander) {expander = this.ensure_expander(expander);
                                       return this.final_macro(pattern, function () {var t = expander.apply(this, arguments); return t && this.macroexpand(t)})})})();
// Generated by SDoc 





// Naive macroexpander implementation.
// This is the macroexpander used in Caterwaul 0.6.x and prior. It offers reasonable performance when there are few macros, but for high-macro cases it becomes prohibitive. Version 0.7.0 and
// forward use the optimizing JIT macroexpander defined in sdoc::js::core/caterwaul.macroexpander.jit. (Note that this macroexpander is still here to reduce the amount of compilation overhead for
// small macroexpansions.)

//   Expansion.
//   Uses the straightforward brute-force algorithm to go through the source tree and expand macros. At first I tried to use indexes, but found that I couldn't think of a particularly good way to
//   avoid double-expansion -- that is, problems like qs[qs[foo]] -- the outer must be expanded without the inner one. Most indexing strategies would not reliably (or if reliably, not profitably)
//   index the tree in such a way as to encode containment. Perhaps at some point I'll find a faster macroexpander, especially if this one proves to be slow. At this point macroexpansion is by
//   far the most complex part of this system, at O(nki) where n is the number of parse tree nodes, k is the number of macros, and i is the number of nodes in the macro pattern tree. (Though in
//   practice it's generally not quite so bad.)

//   Note! This function by default does not re-macroexpand the output of macros. That is handled at a higher level by Caterwaul's macro definition facility (see the 'rmacro' method).

//   Note that as of version 0.5, macroexpansion proceeds backwards. This means that the /last/ matching macro is used, not the first. It's an important feature, as it lets you write new macros
//   to override previous definitions. This ultimately lets you define sub-caterwaul functions for DSLs, and each can define a default case by matching on qs[_] (thus preventing access to other
//   macro definitions that may exist).

//   As of caterwaul 1.0 we delegate pattern matching to the tree implementation rather than having a static function to do it. The expected behavior is that x.match(y) returns null or another
//   falsy value if y doesn't match the pattern x, and it returns an object containing wildcard data if y does match x. Wildcards begin with an underscore; for example:

//   | qs[_a + _b].match(qs[3 + x])        // -> {_a: 3, _b: x}
//     qs[_a + _b].match(qs[3 / x])        // -> null

  caterwaul_global.method('macro_expand_naive', function (t, macros, expanders) {
                           var self = this;
                           return t.rmap(function (n) {for (var i = macros.length - 1, match, replacement; i >= 0; --i)
                                                         if ((match = macros[i].match(n)) && (replacement = expanders[i].call(self, match))) return replacement})});
// Generated by SDoc 











// Composition behavior.
// New in 0.6.4 is the ability to compose caterwaul functions. This allows you to write distinct macroexpanders that might not be idempotent (as is the case for the Figment translator, for
// example: http://github.com/spencertipping/figment). Composition is achieved by invoking after(), which governs the behavior of the macroexpand() function. The list of functions to be invoked
// after a caterwaul function can be inspected by invoking after() with no arguments.

// | var f = caterwaul.clone(), g = caterwaul.clone();
//   f.after(g);           // Causes g to be run on f's output; that is, g is an after-effect of f.
//   f.after(h);           // Adds another after function, to be run after all of the others.
//   f.after();            // -> [g, h]

// The design for this feature is different in 0.6.5. The problem with the original design, in which after() returned a clone of the original function, was that you couldn't set up
// after-composition from within a configuration (since, reasonably enough, configuration is closed over the caterwaul instance).

// New in caterwaul 1.0 is the ability to define before-methods. Use this carefully. Also, before and after functions are now executed in the context of the caterwaul function that they are
// running on.

  caterwaul_global.method('define_list', function (name, list_name) {
    return this.shallow(list_name || (list_name = name + 's'), []).
                 method(name, function () {return arguments.length ? this.shallow(list_name, this[list_name].concat(Array.prototype.slice.call(arguments))) : this[list_name]})}).

    define_list('before', 'before_functions').
    define_list('after',  'after_functions').

    method('apply_before_functions', function (x) {for (var xs = this.before_functions, i = 0, l = xs.length; i < l; ++i) x = xs[i].call(this, x); return x}).
    method('apply_after_functions',  function (x) {for (var xs = this.after_functions,  i = 0, l = xs.length; i < l; ++i) x = xs[i].call(this, x); return x});
// Generated by SDoc 






// Init method.
// This is the main entry point of caterwaul when you use it as a function. As of version 0.6.4, the init() property is polymorphic in semantics as well as structure. There are two cases:

// | 1. You invoke caterwaul on a syntax node. In this case only macroexpansion is performed.
//   2. You invoke caterwaul on anything else. In this case the object is decompiled, macroexpanded, and then compiled.

// This pattern is then closed under intent; that is, caterwaul functions compose both in the context of function -> function compilers (though composition here isn't advisable), and in the
// context of tree -> tree compilers (macroexpansion). Having such an arrangement is important for before() and after() to work properly.

// Even though the caterwaul core doesn't support precompilation, I've built in mechanisms here to support it. The reason is that the precompiler will begin referencing the
// internal_precompiled() function possibly before it is loaded, and in that situation the function needs to be ready.

  caterwaul_global.field('precompiled_internal_table', {}).
                  method('precompiled_internal', function (f) {var k = gensym(); return this.precompiled_internal_table[k] = f, k}).
                  method('is_precompiled',       function (f) {return f.constructor === String && this.precompiled_internal_table[f]}).

                  method('init',                 function (f, environment) {return this.is_precompiled(f) || this.init_not_precompiled(f, environment)}).
                  method('init_not_precompiled', function (f, environment) {
                                                   var result = f.constructor === this.syntax ? this.apply_before_functions(f) : f;
                                                       result = f.constructor === this.syntax ? this.macroexpand(result) : this.compile(this(this.decompile(result)), environment);
                                                       result = f.constructor === this.syntax ? this.apply_after_functions(result) : result;
                                                   return result});
// Generated by SDoc 




  return caterwaul_global});
// Generated by SDoc 




caterwaul.field('version', '3822c336c9620cbfbbd16be683477351').check_version();
// Generated by SDoc 
