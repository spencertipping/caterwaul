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
        extend:            extend_method,

        instance_data_key: function ()     {return private_key},

        inherit_from_self: function ()     {return this.inherit_from(this)},
        inherit_from:      function ()     {return this.parents(this.parents().concat(Array.prototype.slice.call(arguments))).compile()},
        instance_data:     function (o)    {return o[private_key] || (o[private_key] = {})},
        compile:           function ()     {for (var ps = this.parents(), proto = this.prototype, i = 0, l = ps.length, p; i < l; ++i) for (var k in (p = ps[i]))
                                              if (p.hasOwnProperty(k)) proto[k] = p[k]; return this},

        def:               function ()     {for (var p = this.prototype, ms = this.methods(), i = 0, l = arguments.length - 1, f = arguments[l], name; i < l; ++i)
                                              ms[name = arguments[i]] = p[name] = f; return this},

        attr:              function ()     {for (var i = 0, l = arguments.length; i < l; ++i) this.prototype[arguments[i]] = this.attr_method_for(arguments[i]); return this},
        attr_method_for:   function (name) {return function (x) {var d = module.instance_data(this); if (arguments.length) return d[name] = x, this;
                                                                                                     else                  return d[name]}}});

      module.initialize = function () {this.parents([]).methods({}).inherit_from.apply(this, arguments)};
      return module.extend(module).attr('parents', 'methods').extend(module)})();

  var object = module();
// Generated by SDoc 
