// Module framework | Spencer Tipping
// Licensed under the terms of the MIT source code license

// Introduction.
// Caterwaul often uses classes, but Javascript doesn't specify much in the way of object-oriented development. (No complaints from me about this by the way.) This behavior is an attempt to
// provide a standard basis for caterwaul's extension modules.

//   Implementing multiple inheritance.
//   Constructor functions contain links to their parents. When one of the parents is updated, its children lazily (!) pull updates from it and recompile their prototypes. This means that the
//   prototype chain is in fact flat; all updating is done in a 'soft' way:

//   | var c1 = caterwaul.module();
//     var c2 = caterwaul.module().parent(c1);
//     c1.method('say', given.x in console.log(x));
//     c2.prototype.say                    // undefined
//     c2().say('hi');                     // logs 'hi'
//     c2.prototype.say                    // [function]

//   If you want to immediately pull updates, you can use the compile() method:

//   | c2.prototype.say                    // undefined
//     c2.compile().prototype.say          // [function]

//   There's a very important reason that updates are lazy. If they were eager, then the parent class would have to keep track of its children. But in an environment where classes can be
//   generated from functions, this would create a space leak. So back-linking is the only thing that makes sense in this case.

//   Because classes are themselves instances of classes (it's a circular relationship), you can access the class of a class:

//   | c2.object_compile()                 // recompiles parent classes and the present object

//   Dynamic extension.
//   Sometimes you want to assign a module's behavior to an object that already exists. This can't be done within the prototype system, but it's simple enough to use manual attribute assignment
//   to do it (which is what happens here internally). Here's an example:

//   | var i1 = c1(document.createElement('div'));
//     i1.say('hi')                        // logs 'hi'

//   In this case, c1 sees the object passed in and knows to extend it with members from its prototype. i1 won't really be a c1 as far as instanceof is concerned, but we don't have much choice
//   about that considering that we're working around Javascript's object model. If you want to have accurate runtime type information about things, you can use the 'object' class:

//   | var i1 = caterwaul.object(document.createElement('div'), c1);
//     i1.object_is(c1)                    // -> c1
//     i1.object_is(HTMLDivElement)        // -> HTMLDivElement
//     i1.object_is(Object)                // -> Object
//     i1.object_is(c2)                    // -> false
//     i1.constructor                      // -> HTMLDivElement (hopefully)
//     i1.object_classes()                 // -> [caterwaul.object, (maybe others), c1]
//     i1.object_mode()                    // -> 'instance' (if the object hadn't come from dynamic extension then this would be 'prototype')
//     i1.object_compile()                 // -> updates from parent classes, returns i1

//   This class contains methods that keep track of where the object came from and how to rebuild it if one of the base classes changes. It doesn't come with every new module you create, but
//   you'll probably need it if you intend to build usable classes.

//   Collision security.
//   Caterwaul's module system uses a gensym attribute to store all private class data, so accidental collisions with existing properties are very unlikely to happen. The only downside is that
//   property lookups take marginally longer to complete.

// Core class hierarchy.
// Caterwaul defines a few builtin classes that you will probably end up using. The object system is based on Ruby's classes, but tries to avoid the restrictions of (1) no subclassing Class, and
// (2) single inheritance. There aren't singleton classes because Javascript instances make it very easy to extend an object at runtime without them. This system also avoids the two-sided
// perspective of class-vs-instance context; instance context is immediate, and class context is provided by the module class.

//   Object class.
//   This is the base of the object system and provides methods that know how to manipulate an object's state.

//   | .object_classes()                   -> array of references to class objects that this object inherits from -- you can modify this and then call .object_compile()
//     .object_compile()                   -> return this, rebuild from each parent class's instance methods
//     .object_mode()                      -> 'prototype' or 'instance' -- tells you what kind of inheritance we have
//     .object_is(x, y, z)                 -> truthy if the object has all of x, y, and z as classes; false otherwise

//   Module class.
//   This represents something that can be instantiated or mixed in. Mixing in always uses extension, and instantiation always uses prototype inheritance. Module inherits from object, above.
//   These are the methods it provides (or expects you to provide). All of them return the receiver unless they are mentioned to return something else.

//   | .alias(old, new1, new2, ...)        -> just like Ruby, but variadic and in the opposite order
//     .attr(x, y, z)                      -> not like Ruby; creates a .x() and .x(new_x) method for each of x, y, and z (basically jQuery-style accessors)
//     .attr_ro(x, y, z)                   -> creates a .x() method for each of x, y, and z (jQuery-style accessors, but with no write support)
//     .compile()                          -> reconstructs the prototype using the instance methods that are defined
//     .create()                           -> returns a new instance using prototype inheritance
//     .def(name1, name2, ..., def)        -> alias for '.method()'
//     .extend(o1, o2, ..., on)            -> adds this module as a parent to each object
//     .method(name1, name2, ..., def)     -> defines an instance method under one or more names
//     .methods()                          -> returns an array of instance methods defined on this class
//     .parent(p1, p2, ..., pn)            -> adds p1, p2, etc as parent classes
//     .parents()                          -> returns an array of parent classes

//   Classes also have event hooks. Each event hook is invoked with 'this' bound to the module that created the event.

//   | compile: f()        [before/after]  -> around the compile() method
//     create:  f(object)  [after]         -> after create() is called
//     extend:  f(object)  [before/after]  -> around the extend() method
//     method:  f(name, f) [before/after]  -> around the method() method
//     parent:  f(parent)  [before/after]  -> around the parent() method
// Generated by SDoc 
