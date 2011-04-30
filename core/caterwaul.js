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

    var qw = function (x) {return x.split(/\s+/)},  se = function (x, f) {return f && f.call(x, x) || x},  fail = function (m) {throw new Error(m)},
    genval = (function (n, m, u) {return function () {return [u, n, ++m]}})(+new Date(), Math.random() * (1 << 30) >>> 0, unique()),
    gensym = function () {var v = genval(); return ['gensym', v[0].toString(36), v[1].toString(36), v[2].toString(36)].join('_')},

       map = function (f, xs) {for (var i = 0, ys = [], l = xs.length; i < l; ++i) ys.push(f(xs[i], i)); return ys},
      hash = function (s) {for (var i = 0, xs = qw(s), o = {}, l = xs.length; i < l; ++i) o[xs[i]] = true; return annotate_keys(o)},
     merge = function (o) {for (var i = 1, l = arguments.length, _; i < l; ++i) if (_ = arguments[i]) for (var k in _) has(_, k) && (o[k] = _[k]); return o},

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





// Caterwaul object system.
// Caterwaul often uses classes, but Javascript doesn't specify much in the way of object-oriented development. (No complaints from me about this by the way.) This behavior is an attempt to
// provide a standard basis for caterwaul's internal and external modules.

//   Two roles for classes.
//   The goal of caterwaul classes is to provide a useful abstraction for building constructor functions. But in addition to setting up the prototype and managing the existence of constructors,
//   classes are also able to extend existing objects without owning their prototypes.

//   Prototypes are flattened automatically. This divorces the object model from Javascript's single-inheritance prototype chain and reduces method lookup times. (Also, it doesn't impose much of
//   a performance overhead provided that class updates are relatively rare.) Note that a single instance doesn't generally inherit from multiple classes, but a class might have several parents.
//   For instance, if A < B and A < C, then you can still create a prototype instance of A. A.parents() will return [B, C].

//   Storing instance data.
//   I really like the way Ruby handles instance data; that is, it's private to the instance and methods are always used to access it. This library behaves similarly; by convention all instance
//   state is stored in an attribute called instance_data, which is a hash.

//   Behaviors.
//   Earlier I mentioned that classes have two roles. One is as a standard Javascript constructor, the other is as an add-on for an object. After spending too long trying to figure out what the
//   implementation should look like (along with obligatory confusing metacircularity), I've come up with the following mechanism:

//   | 1. The central thing that I'm calling a 'module' is in fact a behavior. It knows how to add itself to other objects.
//     2. Each module/behavior has a method that returns a constructor for that module/behavior. The constructor is a snapshot of its immediate state and isn't updated automatically if you add
//        new methods.

//   If you're familiar with my questionably-named github.com/spencertipping/js-typeclasses project, behaviors correspond to typeclasses. They're called 'modules' here to appeal to Ruby parlance,
//   even though they're actually a bit different.

    var calls_init = function () {var f = function () {return f.init.apply(f, arguments)}; return f},
        module     = calls_init();

//   Module bootstrapping.
//   We need to get the module to a point where its methods can be added to things. At that point we can use it to add its own methods to itself, thus forming the circular relationship required
//   to appropriately confuse users who seek to find the bottom turtle in our object-oriented metahierarchy.

    se(module.instance_data = {}, function () {

//     Object extension.
//     The primary purpose of a module is to extend an object. To this end, a module specifies one or more named extenders, each of which is run on the object to be extended. These are
//     responsible for handling different types of initializations that the module might want to perform. (Providing methods for the object is only one of many possibilities.)

//     Note that extending an object overrides any methods that are already defined and doesn't back up the original values. If you don't want this behavior then you'll need to write a new method
//     similar to extend_methods and replace extend() to call that one instead.

      se(this.methods = {}, function () {this.extend_methods       = function (o) {var ms = this.methods(); for (var k in ms) if (ms.hasOwnProperty(k)) o[k] = ms[k]; return o};
                                         this.extend_instance_data = function (o) {o.instance_data || (o.instance_data = {}); return o};

                                         this.extension_stages = function ()  {return this.instance_data.extension_stages};
                                         this.methods          = function ()  {return this.instance_data.methods};
                                         this.extend           = function (o) {for (var es = this.extension_stages(), i = 0, l = es.length; i < l; ++i) this[es[i]].apply(this, arguments);
                                                                               return o}})});

//     At this point our module is sufficiently functional to extend itself:

    module.extend_methods       = module.instance_data.methods.extend_methods;
    module.extend_instance_data = module.instance_data.methods.extend_instance_data;
    module.methods              = module.instance_data.methods.methods;
    module.extension_stages     = module.instance_data.methods.extension_stages;

    module.instance_data.extension_stages = ['extend_methods', 'extend_instance_data'];
    module.instance_data.methods.extend.call(module, module);

//   Module methods.
//   These are instance methods on 'module' (which will be an instance of itself) and any modules you get by instantiating it. They're used to define class methods, instance methods, and compile
//   a constructor function from the module. There are also functions to perform inheritance and mixing in.

//     Instance evaluation.
//     Just like in Ruby, 'module' and its instances provide an instance_eval function. (Unlike in Ruby, this method isn't present on all objects.) It expects a function that can accept a 'def'
//     parameter, which is aliased to a bound form of a variadic method definition function. 'def' is extended with the module's 'instance_eval_def' module. For example:

//     | my_module.instance_eval(function (def) {
//         def('foo', function () {return 'bar'});
//         def('bar', 'bif', function () {return 'baz'});
//       });
//       my_module.foo()           // -> 'bar'
//       my_module.bar()           // -> 'baz'
//       my_module.bif()           // -> 'baz'

//     To extend 'def' for the purposes of instance_eval:

//     | my_module.instance_eval_def().class_eval(function (def) {
//         def('bork', function (name, f) {
//           this.method(name, f);         // 'this' refers to the module
//         });
//       });

//     Now this will work:

//     | my_module.instance_eval(function (def) {
//         def.bork('hi', function () {
//           return 'this is a method';
//         });
//       });

      se(module.methods(), function () {this.create_instance_eval_def = function ()  {var t = this; return this.instance_eval_def().extend(function (name, value) {return t[name] = value, t})};
                                        this.instance_eval_def        = function ()  {return this.instance_data.instance_eval_def || module.default_instance_eval_def};
                                        this.instance_eval            = function (f) {return f.call(this, this.create_instance_eval_def()) || this}});

//     Class evaluation.
//     Also swiped from Ruby is the class_eval method, which you'll probably use much more often. For example:

//     | my_module.class_eval(function (def) {
//         def('foo', function () {
//           return 'bar';
//         });
//       });
//       new (my_module.compile())().foo()         // -> 'bar'

//     Like instance_eval, class_eval has a corresponding (but separate) 'def' behavior module.

      se(module.methods(), function () {this.create_class_eval_def = function ()  {var t = this; return this.class_eval_def().extend(function () {return t.method.apply(t, arguments)})};
                                        this.class_eval_def        = function ()  {return this.instance_data.class_eval_def || module.default_class_eval_def};
                                        this.class_eval            = function (f) {return f.call(this, this.create_class_eval_def()) || this}});

//     Method creation.
//     The most common thing we'll want to do with a module is add methods to it. The lowest-level way to do this is to use the .method() method, which lets you define a method under one or more
//     names. (It also is used by the class_eval def() function.)

      se(module.methods(), function () {this.method = function () {for (var ms = this.methods(), i = 0, l = arguments.length - 1, f = arguments[l]; i < l; ++i) ms[arguments[i]] = f;
                                                                   return this}});

//     Constructor creation.
//     Most of the time in OOP we'll be working with actual constructors rather than this behavior stuff, if for no other reason than the fact that Javascript's prototype inheritance is much
//     faster. To quickly convert a module to a constructor function, you can use the 'compile' method. This will take a snapshot of the module state and give you a constructor to generate those
//     objects. (Note that it doesn't behave quite like you might expect; constructors defined on the module won't be called on instances created by the constructor function.)

//     If you use the constructor function as an actual constructor, you're expected to pass it an array or arguments object rather than n separate parameters. The reason for this is a bit
//     bizarre, but it has to do with the restriction that Javascript doesn't allow constructor argument forwarding (since constructors have no equivalent of the .apply() method). So the expected
//     case is that you'll use the constructor function as a regular function, not as a constructor.

//     The 'compile' function takes an optional function to use as the constructor for new instances. If you invoke the function produced by compile() as a regular function (not as a
//     constructor), then the function you passed into compile() will be called for each new instance. This is important to use, since the instance_data field of the new object will be a
//     prototype member, not a direct member -- lots of stuff will break if this isn't changed.

      se(module.methods(), function () {this.compile = function (construct) {var f = function (args) {if (this.constructor === f) construct && construct.apply(this, args);
                                                                                                      else                        return new f(arguments)};
                                                                             this.extend(f.prototype); return f}});

//     Circularity.
//     At this point our module basically works, so we can add it to itself again to get the functionality built above. I'm also using it to create the modules for instance_eval and class_eval
//     'def' functions, which are from this point forward upgraded independently of the 'module' module itself. (Don't worry if this is confusing.)

      module.extend(module);
      se(module.default_class_eval_def    = module.extend({}), function () {this.instance_data.extension_stages = module.instance_data.extension_stages});
      se(module.default_instance_eval_def = module.extend({}), function () {this.instance_data.extension_stages = module.instance_data.extension_stages});

//   Common design patterns.
//   From here we add methods to make 'module' easier to use.

    module.class_eval(function (def) {
      def('attr', 'attrs', function ()     {for (var i = 0, l = arguments.length; i < l; ++i) this.method(arguments[i], this.accessor_for(arguments[i])); return this});
      def('accessor_for',  function (name) {return function (x) {if (arguments.length) return this.instance_data[name] = x, this;
                                                                 else                  return this.instance_data[name]}});

      def('attr_null',              function (name, f) {return this.method(name, function () {return name in this.instance_data ? this.instance_data[name] : f.apply(this, arguments)})});
      def('attr_once', 'attr_lazy', function (name, f) {return this.method(name, function () {return name in this.instance_data ? this.instance_data[name] :
                                                                                                                                  (this.instance_data[name] = f.apply(this, arguments))})})});
    module.extend(module).attr('extension_stages').attr_lazy('methods',           function () {return {}}).
                                                   attr_null('instance_eval_def', function () {return module.default_instance_eval_def}).
                                                   attr_null('class_eval_def',    function () {return module.default_class_eval_def}).extend(module);

//   Instantiation.
//   Modules can provide an instance constructor called 'create_instance'. This will be called automatically when you invoke the 'create' method, and the object returned by 'create_instance' is
//   extended and used as the instance. So, for example:

//   | my_module.instance_eval(function (def) {
//       def('create_instance', function () {return function () {return 10}});
//       def('foo', function () {return 'bar'});
//     });
//     my_module.create()          // -> [function]
//     my_module.create()()        // -> 10
//     my_module.create().foo()    // -> 'bar'

    module.class_eval(function (def) {def('create', 'init', function () {return this.extend(this.create_instance && this.create_instance.apply(this, arguments) || {})})}).
        instance_eval(function (def) {def('create_instance', calls_init)});

//   Constructor invocation.
//   If a module provides an initialize() method, this will be called on the instance when the module is added to that instance. This behavior is governed by the extend_initialize() method on
//   modules. (Though since it's an extensible behavior, extend() might not end up calling it if you've got a custom setup.)

    module.class_eval(function (def) {def('extend_initialize', function (o) {var i = this.methods().initialize; i && i.apply(o, Array.prototype.slice.call(arguments, 1)); return o});
                                      def('initialize',        function ()  {this.extension_stages(['extend_methods', 'extend_instance_data', 'extend_parents', 'extend_initialize'])})});

//   Inheritance.
//   Each module has a list of parents that it uses during extension. Because a module might inherit from itself the implementation knows how to avoid infinite-looping from cyclical inheritance
//   structures. This is done by using the 'identity' method.

//   The 'extend' method is redefined to include parent extension. By default parent extension happens first, then method extension, then instance data creation, then invocation of the
//   'initialize' method if it exists.

    module.attr_lazy('identity', gensym).attr_lazy('parents', function () {return []}).class_eval(function (def) {
      def('include', function () {var ps = this.parents(); ps.push.apply(ps, arguments); return this});
      def('extend_parents', function (o, seen) {
        seen || (seen = {}); for (var ps = this.parents(), i = 0, l = ps.length, p, id; i < l; ++i) seen[id = (p = ps[i]).identity()] || (seen[id] = true, p.extend(o, seen)); return o})});

//   Constructing the final 'module' object.
//   Now all we have to do is extend 'module' with itself and make sure its constructor ends up being invoked. Because its instance data doesn't have the full list of extension stages, we have to
//   explicitly invoke its constructor on itself for this to work.

    module.extend(module).methods().initialize.call(module), module.extend(module);
    module.extend(module.default_instance_eval_def);
    module.extend(module.default_class_eval_def);
// Generated by SDoc 





// Configurations.
// Caterwaul prior to version 1.0 relied on an ad-hoc cloning/configuration system tailored for the use of managing multiple customized compiler instances. Version 1.0 changes this a little bit.
// Instead of cloning compilers, we now instantiate the core 'caterwaul' class:

// | var compiler = caterwaul('core');
//   compiler(function () {...});

// The global 'caterwaul' function takes configurations and returns compilers. This breaks the original symmetry that existed between the global caterwaul function and instances of it, but the
// new model is certainly more straightforward from a traditional object-oriented perspective.

  var configurable = module().class_eval(function (def) {
    this.attr_lazy('configurations',        function () {return {}}).
         attr_lazy('active_configurations', function () {return {}});

    def('configuration', function (name, f) {this.configurations()[name] = f; return this});
    def('configure',     function ()        {for (var cs = this.individual_configurations(arguments), i = 0, l = cs.length; i < l; ++i) this.apply_configuration(cs[i]); return this});

    def('individual_configurations', function (xs) {
      for (var result = [], i = 0, l = xs.length, x; i < l; ++i) if ((x = xs[i]) instanceof Array) result.push.apply(result, this.individual_configurations(x));
                                                                 else                              result.push(x);
      return result});

    def('apply_configuration', function (c) {
      if (c.constructor === String) {var active = this.active_configurations();
                                     return active[c] || (active[c] = this.apply_configuration(this.configurations()[c] || fail('nonexistent configuration ' + c)) || this)}
      else return c.call(this), this})});

//   Global management.
//   Caterwaul creates a global symbol, caterwaul. Like jQuery, there's a mechanism to get the original one back if you don't want to replace it. You can call caterwaul.deglobalize() to return
//   caterwaul and restore the global that was there when Caterwaul was loaded (might be useful in the unlikely event that someone else named their library Caterwaul). Note that deglobalize() is
//   available only on the global caterwaul() function.

    var original_global  = typeof caterwaul === 'undefined' ? undefined : caterwaul,
        caterwaul_global = caterwaul = module.extend(calls_init());

//   Static utilities.
//   These are available on the caterwaul global.

    caterwaul_global.instance_eval(function (def) {def('deglobalize', function () {caterwaul = original_global; return caterwaul_global});
                                                   def('module', module); def('gensym', gensym); def('initializer', initializer); def('unique', unique)});

//   Instance methods.
//   These will be available on every caterwaul compiler function.

    caterwaul_global.attr_lazy('id', gensym).class_eval(function (def) {def('toString', function () {return '[caterwaul instance ' + this.id() + ']'})});

//   Version management and reinitialization.
//   There's an interesting case that comes up when loading a global caterwaul. If we detect that the caterwaul we just loaded has the same version as the one that's already there, we revert back
//   to the original. This is very important for precompilation and the reason for it is subtle. Precompilation relies on tracing to determine the compiled form of each function handed to
//   caterwaul, so if that caterwaul is replaced for any reason then the traces won't happen. A very common setup is something like this:

//   | <script src='caterwaul.js'></script>
//     <script src='some-caterwaul-extension.js'></script>
//     <script src='my-script.js'></script>

//   Often you'll want to precompile the whole bundle, since caterwaul.js includes behaviors that aren't necessarily precompiled and you might get better minification. To do this, it's tempting
//   to precompile the whole bundle of caterwaul, the extensions, and your code. Without version checking, however, the traces would be lost and nothing would happen.

    module().attr('version').extend(caterwaul_global);
    caterwaul_global.instance_eval(function (def) {
      def('check_version', function () {if (original_global && this.version() === original_global.version()) this.deglobalize(); return this});
      def('reinitialize',  function (transform, erase_configurations) {var c = (transform || function (x) {return x})(this.initializer), result = c(c, this.unique).deglobalize();
                                                                       erase_configurations || (result.instance_data.configurations = this.configurations()); return result})});

//   Variadic methods.
//   A lot of the time we'll want some kind of variadic behavior for methods. These meta-methods define such behavior. There are a few templates that occur commonly in the caterwaul source, and
//   you can define your own meta-methods to handle other possibilities.

    caterwaul_global.instance_eval(function (def) {
      def('variadic',              function (f) {return function () {for (var i = 0, l = arguments.length;                       i < l; ++i) f.call(this, arguments[i]);    return this}});
      def('right_variadic_binary', function (f) {return function () {for (var i = 0, l = arguments.length - 1, x = arguments[l]; i < l; ++i) f.call(this, arguments[i], x); return this}})});
// Generated by SDoc 






// Shared parser data.
// This data is used both for parsing and for serialization, so it's made available to all pieces of caterwaul.

//   Precomputed table values.
//   The lexer uses several character lookups, which I've optimized by using integer->boolean arrays. The idea is that instead of using string membership checking or a hash lookup, we use the
//   character codes and index into a numerical array. This is guaranteed to be O(1) for any sensible implementation, and is probably the fastest JS way we can do this. For space efficiency,
//   only the low 256 characters are indexed. High characters will trigger sparse arrays, which may degrade performance. Also, this parser doesn't handle Unicode characters properly; it assumes
//   lower ASCII only.

//   The lex_op table indicates which elements trigger regular expression mode. Elements that trigger this mode cause a following / to delimit a regular expression, whereas other elements would
//   cause a following / to indicate division. By the way, the operator ! must be in the table even though it is never used. The reason is that it is a substring of !==; without it, !== would
//   fail to parse.

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
   parse_inverse_order = (function (xs) {for (var  o = {}, i = 0, l = xs.length; i < l; ++i) for (var k in xs[i]) has(xs[i], k) && (o[k] = i); return annotate_keys(o)})(parse_reduce_order),
   parse_index_forward = (function (rs) {for (var xs = [], i = 0, l = rs.length, _ = null; _ = rs[i], xs[i] = true, i < l; ++i)
                                           for (var k in _) if (has(_, k) && (xs[i] = xs[i] && ! has(parse_associates_right, k))) break; return xs})(parse_reduce_order),

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

  caterwaul_global.instance_eval(function (def) {

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

//   Syntax node functions.
//   These functions are common to various pieces of syntax nodes. Not all of them will always make sense, but the prototypes of the constructors can be modified independently later on if it
//   turns out to be an issue.

    def('syntax_common', module().class_eval(function (def) {

//     Mutability.
//     These functions let you modify nodes in-place. They're used during syntax folding and shouldn't really be used after that (hence the underscores).

      def('_replace',  function (n) {return (n.l = this.l) && (this.l.r = n), (n.r = this.r) && (this.r.l = n), this});  def('_append_to', function (n) {return n && n._append(this), this});
      def('_reparent', function (n) {return this.p && this.p[0] === this && (this.p[0] = n), this});  def('_fold_l', function (n) {return this._append(this.l && this.l._unlink(this))});
      def('_append',   function (n) {return (this[this.length++] = n) && (n.p = this), this});        def('_fold_r', function (n) {return this._append(this.r && this.r._unlink(this))});
      def('_sibling',  function (n) {return n.p = this.p, (this.r = n).l = this});                    def('_fold_lr', function () {return this._fold_l()._fold_r()});
                                                                                                      def('_fold_rr', function () {return this._fold_r()._fold_r()});
      def('_wrap',     function (n) {return n.p = this._replace(n).p, this._reparent(n), delete this.l, delete this.r, this._append_to(n)});
      def('_unlink',   function (n) {return this.l && (this.l.r = this.r), this.r && (this.r.l = this.l), delete this.l, delete this.r, this._reparent(n)});

//     These methods are OK for use after the syntax folding stage is over (though because syntax nodes are shared it's generally dangerous to go modifying them):

      def('pop', function () {return --this.length, this});  def('push', function (x) {return this[this.length++] = x, this});

//     Identification.
//     You can request that a syntax node identify itself, in which case it will give you an identifier if it hasn't already. The identity is not determined until the first time it is requested,
//     and after that it is stable. As of Caterwaul 0.7.0 the mechanism works differently (i.e. isn't borked) in that it replaces the prototype definition with an instance-specific closure the
//     first time it gets called. This may reduce the number of decisions in the case that the node's ID has already been computed.

      def('id', function () {var id = gensym(); return (this.id = function () {return id})()});

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

      def('each',  function (f) {for (var i = 0, l = this.length; i < l; ++i) f(this[i], i); return this});
      def('map',   function (f) {for (var n = new this.constructor(this), i = 0, l = this.length; i < l; ++i) n.push(f(this[i], i) || this[i]); return n});

      def('reach', function (f) {f(this); this.each(function (n) {n && n.reach(f)}); return this});
      def('rmap',  function (f) {var r = f(this); return ! r || r === this ? this.map(function (n) {return n && n. rmap(f)}) : r.data === undefined ? new this.constructor(r) : r});

      def('clone', function () {return this.rmap(function () {return false})});

      def('collect', function (p)  {var ns = []; this.reach(function (n) {p(n) && ns.push(n)}); return ns});
      def('replace', function (rs) {return this.rnmap(function (n) {if (! own.call(rs, n.data)) return n;
                                                                    var replacement = rs[n.data];
                                                                    return replacement && replacement.constructor === String ? new n.constructor(replacement, Array.prototype.slice.call(n)) :
                                                                                                                               replacement})});

//     Alteration.
//     These functions let you make "changes" to a node by returning a modified copy.

      def('repopulated_with', function (xs)   {return new this.constructor(this.data, xs)});
      def('change',           function (i, x) {return se(new this.constructor(this.data, Array.prototype.slice.call(this)), function (n) {n[i] = x})});
      def('compose_single',   function (i, f) {return this.change(i, f(this[i]))});

//     General-purpose traversal.
//     This is a SAX-style traversal model, useful for analytical or scope-oriented tree traversal. You specify a callback function that is invoked in pre-post-order on the tree (you get events
//     for entering and exiting each node, including leaves). Each time a node is entered, the callback is invoked with an object of the form {entering: node}, where 'node' is the syntax node
//     being entered. Each time a node is left, the callback is invoked with an object of the form {exiting: node}. The return value of the function is not used. Any null nodes are not traversed,
//     since they would fail any standard truthiness tests for 'entering' or 'exiting'.

//     I used to have a method to perform scope-annotated traversal, but I removed it for two reasons. First, I had no use for it (and no tests, so I had no reason to believe that it worked).
//     Second, Caterwaul is too low-level to need such a method. That would be more appropriate for an analysis extension.

      def('traverse', function (f) {f({entering: this}); f({exiting: this.each(function (n) {n && n.traverse(f)})}); return this});

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

      def('flatten',   function (d) {d = d || this.data; return d !== this.data ? this.as(d) : ! (has(parse_lr, d) && this.length) ? this : has(parse_associates_right, d) ?
                                                           se(new this.constructor(d), bind(function (n) {for (var i = this;     i && i.data === d; i = i[1]) n.push(i[0]); n.push(i)}, this)) :
                                                           se(new this.constructor(d), bind(function (n) {for (var i = this, ns = []; i.data === d; i = i[0]) i[1] && ns.push(i[1]); ns.push(i);
                                                                                                          for (i = ns.length - 1; i >= 0; --i) n.push(ns[i])}, this))});

      def('unflatten', function  () {var right = has(parse_associates_right, this.data); return this.length <= 2 ? this : se(new this.constructor(this.data), bind(function (n) {
                                       if (right) for (var i = 0, l = this.length - 1; i  < l; ++i) n = n.push(this[i]).push(i < l - 2 ? new this.constructor(this.data) : this[i])[1];
                                       else       for (var i = this.length - 1;        i >= 1; --i) n = n.push(i > 1 ? new this.constructor(this.data) : this[0]).push(this[i])[0]}, this))});

//     Wrapping.
//     Sometimes you want your syntax tree to have a particular operator, and if it doesn't have that operator you want to wrap it in a node that does. Perhaps the most common case of this is
//     when you have a possibly-plural node representing a variable or expression -- often the case when you're dealing with argument lists -- and you want to be able to assume that it's wrapped
//     in a comma node. Calling node.as(',') will return the node if it's a comma, and will return a new comma node containing the original one if it isn't.

      def('as', function (d) {return this.data === d ? this : new this.constructor(d).push(this)});

//     Type detection and retrieval.
//     These methods are used to detect the literal type of a node and to extract that value if it exists. You should use the as_x methods only once you know that the node does represent an x;
//     otherwise you will get misleading results. (For example, calling as_boolean on a non-boolean will always return false.)

//     Other methods are provided to tell you higher-level things about what this node does. For example, is_contextualized_invocation() tells you whether the node represents a call that can't be
//     eta-reduced (if it were, then the 'this' binding would be lost).

//     Wildcards are used for pattern matching and are identified by beginning with an underscore. This is a very frequently-called method, so I'm using a very inexpensive numeric check rather
//     than a string comparison. The ASCII value for underscore is 95.

      merge(this.methods(), {
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
           is_invocation: function () {return this.data === '()'},              is_contextualized_invocation: function () {return this.is_invocation() && this[0].is_dereference()},

            is_invisible: function () {return has(parse_invisible, this.data)},           is_binary_operator: function () {return has(parse_lr, this.data)},
is_prefix_unary_operator: function () {return has(parse_r, this.data)},            is_postfix_unary_operator: function () {return has(parse_l,  this.data)},
       is_unary_operator: function () {return this.is_prefix_unary_operator() || this.is_postfix_unary_operator()},

                 accepts: function (e) {return has(parse_accepts, this.data) && parse_accepts[this.data] === (e.data || e)}});

//     Value construction.
//     Syntax nodes sometimes represent hard references to values instead of just syntax. (See 'References' for more information.) In order to compile a syntax tree in the right environment you
//     need a mapping of symbols to these references, which is what the bindings() method returns. (It also collects references for all descendant nodes.) It takes an optional argument to
//     populate, in case you already had a hash set aside for bindings -- though it always returns the hash.

//     A bug in Caterwaul 0.5 and earlier failed to bind falsy values. This is no longer the case; nodes which bind values should indicate that they do so by setting a binds_a_value attribute
//     (ref nodes do this on the prototype), indicating that their value should be read from the 'value' property. (This allows other uses of a 'value' property while making it unambiguous
//     whether a particular node intends to bind something.)

      def('bindings', function (hash) {var result = hash || {}; this.reach(function (n) {if (n.binds_a_value) result[n.data] = n.value}); return result});

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

      def('match', function (target, variables) {variables || (variables = {_: target});
                                                 if (this.is_wildcard())                                          return variables[this.data] = target, variables;
                                            else if (this.length === target.length && this.data === target.data) {for (var i = 0, l = this.length; i < l; ++i)
                                                                                                                    if (! this[i].match(target[i], variables)) return null;
                                                                                                                  return variables}});

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

      def('ends_with_block', function () {var block = this[parse_r_until_block[this.data]];
                                          return this.data === '{' || has(parse_r_until_block, this.data) &&
                                                 (this.data !== 'function' || this.length === 3) && block && block.ends_with_block()});

//     There's a hack here for single-statement if-else statements. (See 'Grab-until-block behavior' in the parsing code below.) Basically, for various reasons the syntax tree won't munch the
//     semicolon and connect it to the expression, so we insert one automatically whenever the second node in an if, else, while, etc. isn't a block.

//     Update for Caterwaul 0.6.6: I had removed mandatory spacing for unary prefix operators, but now it's back. The reason is to help out the host Javascript lexer, which can misinterpret
//     postfix increment/decrement: x + +y will be serialized as x++y, which is invalid Javascript. The fix is to introduce a space in front of the second plus: x+ +y, which is unambiguous.

//     Update for caterwaul 1.0: The serialize() method is now aggressively optimized for common cases. It also uses a flattened array-based concatenation strategy rather than the deeply nested
//     approach from before.

//     Optimized serialization cases.
//     We can tell a lot about how to serialize a node based on just a few properties. For example, if the node has zero length then its serialization is simply its data. This is the leaf case,
//     which is likely to be half of the total number of nodes in the whole syntax tree. If a node has length 1, then we assume a prefix operator unless we identify it as postfix. Otherwise we
//     break it down by the kind of operator that it is.

//     Nodes might be flattened, so we can't assume any upper bound on the arity regardless of what kind of operator it is. Realistically you shouldn't hand flattened nodes over to the compile()
//     function, but it isn't the end of the world if you do.

      def('toString',  function ()   {var xs = []; this.serialize(xs); return xs.join('')});
      def('serialize', function (xs) {var l = this.length, d = this.data, semi = ';\n';
                                      switch (l) {case 0: if (has(parse_r_optional, d)) return xs.push(d.replace(/^u/, ''));
                                                     else                               return xs.push(d);

                                                  case 1: if (has(parse_r,  d) || has(parse_r_optional, d)) return xs.push(d.replace(/^u/, '')), this[0].serialize(xs);
                                                     else if (has(parse_lr, d))                             return xs.push(d);
                                                     else if (has(parse_group, d))                          return xs.push(d), this[0].serialize(xs), xs.push(parse_group[d]);
                                                     else                                                   return this[0].serialize(xs), xs.push(d);

                                                  case 2: if (has(parse_invocation, d))    return this[0].serialize(xs), xs.push(d.charAt(0)), this[1].serialize(xs), xs.push(d.charAt(1));
                                                     else if (has(parse_r_until_block, d)) return xs.push(d), this[0].serialize(xs), this[1].serialize(xs);
                                                     else                                  return this[0].serialize(xs), xs.push(d), this[1].serialize(xs);

                                                 default: if (has(parse_ternary, d))       return this[0].serialize(xs), xs.push(d), this[1].serialize(xs), xs.push(':'), this[2].serialize(xs);
                                                     else if (has(parse_r_until_block, d)) return this.accepts(this[2]) && ! this[1].ends_with_block() ?
                                                                                             (xs.push(d), this[0].serialize(xs), this[1].serialize(xs), xs.push(semi), this[2].serialize(xs)) :
                                                                                             (xs.push(d), this[0].serialize(xs), this[1].serialize(xs), this[2].serialize(xs));
                                                     else                                  return this.unflatten().serialize(xs)}})}));

//   Syntax promotion.
//   Sometimes you want to accept a string rather than a fully constructed syntax node, but your function is designed to work with syntax nodes. If this is the case then you want to use the
//   ensure_syntax() method, which takes either a string or a syntax node and returns a syntax node.

    def('ensure_syntax', function (thing) {return thing && thing.constructor === String ? this.parse(thing) : thing});

//   References.
//   You can drop references into code that you're compiling. This is basically variable closure, but a bit more fun. For example:

//   | caterwaul.compile(qs[fn_[_ + 1]].replace({_: new caterwaul.ref(3)}))()    // -> 4

//   What actually happens is that caterwaul.compile runs through the code replacing refs with gensyms, and the function is evaluated in a scope where those gensyms are bound to the values they
//   represent. This gives you the ability to use a ref even as an lvalue, since it's really just a variable. References are always leaves on the syntax tree, so the prototype has a length of 0.

    def('ref_module', module(this.syntax_common).class_eval(function (def) {def('length',        0);
                                                                            def('binds_a_value', true)}));

    def('ref', this.ref_module.compile(function (value) {if (value instanceof this.constructor) {this.value = value.value; this.data = value.data}
                                                         else                                   {this.value = value;       this.data = gensym()}}));

//   Syntax node constructor.
//   Here's where we combine all of the pieces above into a single function with a large prototype. Note that the 'data' property is converted from a variety of types; so far we support strings,
//   numbers, and booleans. Any of these can be added as children. Also, I'm using an instanceof check rather than (.constructor ===) to allow array subclasses such as Caterwaul finite sequences
//   to be used.

    def('syntax_module', module(this.syntax_common));
    def('syntax', this.syntax_module.compile(function (data) {if (data instanceof this.constructor) this.data = data.data, this.length = 0;
                                                              else {this.data = data && data.toString(); this.length = 0;
                                                                for (var i = 1, l = arguments.length, _; _ = arguments[i], i < l; ++i)
                                                                  for (var j = 0, lj = _.length, it, itc; _ instanceof Array ? (it = _[j], j < lj) : (it = _, ! j); ++j)
                                                                    this._append((itc = it.constructor) === String || itc === Number || itc === Boolean ? new this.constructor(it) : it)}}))});
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

  caterwaul_global.instance_eval(function (def) {

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

    def('parse', function (input) {

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
        return head})});
// Generated by SDoc 





// Environment-dependent compilation.
// It's possible to bind variables from 'here' (i.e. this runtime environment) inside a compiled function. The way we do it is to create a closure using a gensym. (Another reason that gensyms
// must really be unique.) Here's the idea. We use the Function constructor to create an outer function, bind a bunch of variables directly within that scope, and return the function we're
// compiling. The variables correspond to gensyms placed in the code, so the code will have closure over those variables.

// An optional second parameter 'environment' can contain a hash of variable->value bindings. These will be defined as locals within the compiled function.

// New in caterwaul 0.6.5 is the ability to specify a 'this' binding to set the context of the expression being evaluated.

// Caterwaul 1.0 introduces the 'globals' attribute, which lets you set global variables that will automatically be present when compiling syntax trees. Note that using this feature with
// non-serializable values (see sdoc::js::behaviors/core/precompile) can prevent precompilation, since the global references may not be serializable (and they are included in precompiled code).

  caterwaul_global.attr_lazy('globals', function () {return {}}).instance_eval(function (def) {
    def('compile', function (tree, environment) {var vars = [], values = [], bindings = merge({}, this.globals, environment || {}, tree.bindings()), s = gensym();
                                                 for (var k in bindings) if (own.call(bindings, k)) vars.push(k), values.push(bindings[k]);
                                                 var code = map(function (v) {return v === 'this' ? '' : 'var ' + v + '=' + s + '.' + v}, vars).join(';') + ';return(' + tree.toString() + ')';
                                                 try {return (new Function(s, code)).call(bindings['this'], bindings)} catch (e) {throw new Error(e + ' while compiling ' + code)}})});
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

    caterwaul_global.attr_lazy('macro_patterns',  function () {return []}).
                     attr_lazy('macro_expanders', function () {return []}).class_eval(function (def) {

      def('final_macro', this.right_variadic_binary(function (pattern, expander) {return this.macro_patterns().push(this.ensure_syntax(pattern)),
                                                                                         this.macro_expanders().push(this.ensure_expander(expander)), this}));

      def('macro',       this.right_variadic_binary(function (pattern, expander) {expander = this.ensure_expander(expander);
                                                                                  return this.final_macro(pattern, function () {
                                                                                    var t = expander.apply(this, arguments); return t && this.macroexpand(t)})}))});

    caterwaul_global.instance_eval(function (def) {
      def('with_gensyms', function (t) {var gensyms = {}; return this.ensure_syntax(t).rmap(function (n) {
                                          return /^gensym/.test(n.data) && new this.constructor(gensyms[n.data] || (gensyms[n.data] = gensym()), this)})});

      def('expander_from_string', function (expander) {var tree = this.parse(expander); return function (match) {return tree.replace(match)}});
      def('ensure_expander',      function (expander) {return expander.constructor === String      ? this.expander_from_string(expander) :
                                                              expander.constructor === this.syntax ? function (match) {return expander.replace(match)} :
                                                              expander.constructor === Function    ? expander : fail('unknown macroexpander format: ' + expander)})

//   Naive macroexpander implementation.
//   This is the macroexpander used in Caterwaul 0.6.x and prior. It offers reasonable performance when there are few macros, but for high-macro cases it becomes prohibitive. The 0.7.x series
//   used an optimizing half-precompiled macroexpander, but because the compilation overhead was prohitibitive version 1.0 uses the naive macroexpander and full offline precompilation for
//   performance-sensitive code.

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

    def('macroexpand', function (t) {var self = this, macros = this.macro_patterns(), expanders = this.macro_expanders();
                                     return caterwaul_global.ensure_syntax(t).rmap(function (n) {
                                       for (var i = macros.length - 1, match, replacement; i >= 0; --i)
                                         if ((match = macros[i].match(n)) && (replacement = expanders[i].call(self, match))) return replacement})})});
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

  caterwaul_global.class_eval(function (def) {
    this.attr_lazy('before_functions', function () {return []}).
         attr_lazy('after_functions',  function () {return []});

    def('before', function () {return arguments.length ? this.before_functions(this.before_functions.concat(Array.prototype.slice.call(arguments))) : this.before_functions()});
    def('after',  function () {return arguments.length ? this. after_functions(this. after_functions.concat(Array.prototype.slice.call(arguments))) : this. after_functions()});

    def('apply_before_functions', function (x) {for (var xs = this.before_functions(), i = 0, l = xs.length; i < l; ++i) x = xs[i].call(this, x); return x});
    def('apply_after_functions',  function (x) {for (var xs = this.after_functions(),  i = 0, l = xs.length; i < l; ++i) x = xs[i].call(this, x); return x})});
// Generated by SDoc 






// Init method.
// This is the main entry point of caterwaul when you use it as a function. As of version 0.6.4, the init() property is polymorphic in semantics as well as structure. There are two cases:

// | 1. You invoke caterwaul on a syntax node. In this case only macroexpansion is performed.
//   2. You invoke caterwaul on anything else. In this case the object is decompiled, macroexpanded, and then compiled.

// This pattern is then closed under intent; that is, caterwaul functions compose both in the context of function -> function compilers (though composition here isn't advisable), and in the
// context of tree -> tree compilers (macroexpansion). Having such an arrangement is important for before() and after() to work properly.

// Even though the caterwaul core doesn't support precompilation, I've built in mechanisms here to support it. The reason is that the precompiler will begin referencing the
// internal_precompiled() function possibly before it is loaded, and in that situation the function needs to be ready.

// Somewhat unrelated to the rest of this stuff is the 'create_instance' definition on caterwaul_global. This tells the caterwaul module to create instances that call their own 'init' methods,
// and we add the 'init' method in the class_eval section below.

  caterwaul_global.instance_eval(function (def) {
    def('create_instance', calls_init);

    def('precompiled_internal_table', {});
    def('precompiled_internal', function (f) {var k = gensym(); return this.precompiled_internal_table[k] = f, k});
    def('is_precompiled',       function (f) {return f.constructor === String && this.precompiled_internal_table[f]})});

  caterwaul_global.class_eval(function (def) {
    def('init',                 function (f, environment) {return caterwaul_global.is_precompiled(f) || this.init_not_precompiled(f, environment)});
    def('init_not_precompiled', function (f, environment) {
      var result = f.constructor === caterwaul_global.syntax ? this.apply_before_functions(f) : f;
          result = f.constructor === caterwaul_global.syntax ? this.macroexpand(result) : caterwaul_global.compile(this(caterwaul_global.decompile(result)), environment);
            return f.constructor === caterwaul_global.syntax ? this.apply_after_functions(result) : result})});
// Generated by SDoc 




  return caterwaul_global});
// Generated by SDoc 
