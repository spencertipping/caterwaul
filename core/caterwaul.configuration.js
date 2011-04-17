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

         replica = se(function () {return copy_of({behaviors: {method: function (v) {return bind(v, this)}}}).behavior('field').behavior('shallow', shallow_copy)}, function (f) {f.init = f});

//   Configuration and cloning.
//   Caterwaul ships with a standard library of useful macros, though they aren't activated by default. To activate them, you say something like this:

//   | caterwaul.configure('std.fn');
//     // Longhand access to the function:
//     caterwaul.configurations['std.fn']

//   You can also pass these libraries into a clone() call:

//   | var copy = caterwaul.clone('std.fn', 'some_other_library', function () {
//       ...
//     });

//   Generally you will just configure with 'std', which includes all of the standard configurations (see caterwaul.std.js.sdoc in the modules/ directory).

//   Note that functions passed to clone() and configure() are transformed using the existing caterwaul instance. This means that closure state is lost, so configuration at the toplevel is a good
//   idea. Named configurations, on the other hand, are not explicitly transformed; so when you define a custom configuration in a named way, you will want to manually transform it. (The reason
//   for this is that we don't want to force the configuration author to lose closure state, since it's arguably more important in a library setting than an end-user setting.) Alternatively you
//   can use tconfigure(), which takes a series of configurations to use to transform your configuration function. (This makes more sense in code than in English; see how the configurations below
//   are written...)

//   Named configurations are made idempotent; that is, they cannot be applied twice. This is done through the 'has' hash, which can be manually reset if you actually do need to apply a
//   configuration multiple times (though you're probably doing something wrong if you do need to do that).

    return function () {return replica().
      shallow('configurations', {}).shallow('has', {}).method('configuration', function (name, f) {this.configurations[name] = f; return this}).
       method('tconfiguration', function (configs, name, f, bindings) {this.configurations[name] = this.clone(configs)(f, bindings); return this}).

       method('namespace', function (s) {return this[s] || this.shallow(s, {})[s]}).
       method('alias',     function (from, to) {return this.method(to, function () {return this[from].apply(this, arguments)})}).

       method('clone',     function () {return arguments.length ? this.clone().configure.apply(null, arguments) : copy_of(this)}).
       method('configure', function () {for (var i = 0, l = arguments.length, _; _ = arguments[i], i < l; ++i)
                                          if (_.constructor === String) for (var cs = qw(arguments[i]), j = 0, lj = cs.length; _ = cs[j], j < lj; ++j)
                                                                          if (this.configurations[_]) this.has[_] || (this.has[_] = this.configurations[_].call(this, this) || this);
                                                                          else                        throw new Error('error: configuration "' + _ + '" does not exist');
                                          else _ instanceof Array ? this.configure.apply(this, _.slice()) : _.call(this, this); return this})}})();
// Generated by SDoc 
