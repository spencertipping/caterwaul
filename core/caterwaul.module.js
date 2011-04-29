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

    var calls_init = function () {var f = function () {return f.init.apply(this, arguments)}; return f},
        module     = calls_init();

//   Module bootstrapping.
//   We need to get the module to a point where its methods can be added to things. At that point we can use it to add its own methods to itself, thus forming the circular relationship required
//   to appropriately confuse users who seek to find the bottom turtle in our object-oriented metahierarchy.

    se(module.instance_data = {}, function () {

//     Object extension.
//     The primary purpose of a module is to extend an object. To this end, a module specifies one or more named extenders, each of which is run on the object to be extended. These are
//     responsible for handling different types of initializations that the module might want to perform. (Providing methods for the object is only one of many possibilities.)

      se(this.extenders = {}, function () {this.methods   = function (object) {var ms = this.methods(); for (var k in ms) if (ms.hasOwnProperty(k)) object[k] = ms[k]}});
      se(this.methods   = {}, function () {this.methods   = function ()       {return this.instance_data.methods};
                                           this.extenders = function ()       {return this.instance_data.extenders};
                                           this.extend    = function (object) {var es = this.extenders(); for (var k in es) if (es.hasOwnProperty(k)) es[k].call(this, object)}})});

//     At this point our module is sufficiently functional to extend itself:

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

      se(module.methods(), function () {this.compile = function (construct) {var t = this, f = se(function (args) {if (this.constructor === f) construct.apply(f, args);
                                                                                                                   else                        return new f(arguments)},
                                                                                                  function () {t.extend(this.prototype)}); return f}});

//     Circularity.
//     At this point our module basically works, so we can add it to itself again to get the functionality built above. I'm also using it to create the modules for instance_eval and class_eval
//     'def' functions, which are from this point forward upgraded independently of the 'module' module itself. (Don't worry if this is confusing.)

      module.extend(module);
      module.default_class_eval_def    = module.extend({});
      module.default_instance_eval_def = module.extend({});

//   Common design patterns.
//   From here we add methods to make 'module' easier to use.

    module.class_eval(function (def) {
      def('accessor_for', function (name) {return function (x) {if (arguments.length) return this.instance_data[name] = x, this;
                                                                else                  return this.instance_data[name]}});

      def('attr', function () {
        
      });
    });
// Generated by SDoc 
