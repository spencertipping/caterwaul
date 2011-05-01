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

//     Another method, 'generator', builds a function that is a constructor but doesn't behave like one. If you use the constructor function as an actual constructor, you're expected to pass it
//     an array or arguments object rather than n separate parameters. The reason for this is a bit bizarre, but it has to do with the restriction that Javascript doesn't allow constructor
//     argument forwarding (since constructors have no equivalent of the .apply() method). So the expected case is that you'll use the constructor function as a regular function, not as a
//     constructor.

//     The 'compile' function takes an optional function to use as the constructor for new instances. If you invoke the function produced by compile() as a regular function (not as a
//     constructor), then the function you passed into compile() will be called for each new instance. This is important to use, since the instance_data field of the new object will be a
//     prototype member, not a direct member -- lots of stuff will break if this isn't changed.

      se(module.methods(), function () {this.compile   = function (construct) {var f = function () {construct && construct.apply(this, arguments)}; this.extend(f.prototype); return f};
                                        this.generator = function (construct) {var f = function (args) {if (this.constructor === f) construct && construct.apply(this, args);
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
    module.extend(module).attr('extension_stages').attr_lazy('methods',           Object).
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

    module.attr_lazy('identity', gensym).attr_lazy('parents', Array).class_eval(function (def) {
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
