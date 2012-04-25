Caterwaul compiler | Spencer Tipping
Licensed under the terms of the MIT source code license

# Introduction

Caterwaul is a programming language that compiles into Javascript. Visit http://caterwauljs.org and http://github.com/spencertipping/caterwaul for more information about it. You can also find
a lot of technical information in the comments inside this file.

    caterwaul.offline(':all')(function () {
      initializer(initializer),

# Core modules

These provide basic functionality that is needed by other modules inside caterwaul. They need to be loaded first, and probably in this order.

## Symbol generation

Gensyms are identifiers that contain at least 128 bits of pseudorandom data, in this case encoded as base-62. Each base-62 digit contains ~ 5.95 bits of entropy, so a length of 22 digits is
sufficient. Gensyms are associated with generators, each of which has its own entropy.

    caterwaul.module('core.gensym', ':all', function ($) {
      $.entropy()                                            = n[22] *['ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'.charCodeAt(Math.random() * 62 >>> 0)] -seq |~join| '',
      $.gensym_generator(entropy = $.entropy(), i = 0)(name) = '#{name || ""}_#{++i}_#{entropy}',
      $.gensym                                               = $.gensym_generator()}),

# Compiler modules

These define caterwaul's compiler internals and are bootstrapped. That is, the current Javascript and regexp parsers are used to build the next ones.

# Language implementation

These modules implement the caterwaul programming language. Unlike before, this is baked into caterwaul.js. I'm doing it this way because caterwaul now bootstrap-compiles itself, so it should
contain all required dependencies.

## Expression inversion

Many expressions in Javascript are invertible; that is, if you consider the expression to be a function over its free variables, you can take the output and rebind those variables. Sometimes
you can do this ambiguously, but some information is lost. This module gives you operators that allow you to invert expressions.

### Invertible functions

  Most simple functions can be inverted in some way, though some information may be lost. Generally this information is lost in the initial projection; that is, fi(f(x)) may not be x, but
  f(fi(f(x))) === f(x). For example:

    f(x) = x + 'foo'          <-> f.unapply(t, result) = [result.replace(/foo$/, '')] -when- /foo$/.test(x)
    f(x) = x + 1              <-> f.unapply(t, result) = [result - 1]                                                         // not correct for strings; + is a hard operator this way
    f(x) = 'foo' + x + 'bar'  <-> f.unapply(t, result) = [result.replace(/^foo(.*)bar$/, '$1')] -when- /^foo.*bar$/.test(x)
    f(x) = Math.sin(x)        <-> f.unapply(t, result) = [Math.sin.unapply(Math, result)]

In general, functions are invertible when they specify an unapply() method with the property that f.unapply(receiver, f.apply(receiver, xs)) is roughly equivalent to xs or a falsy value.
Because xs must be an array or arguments object, each of which is truthy, the true/false distinction suffices to indicate whether a function could be successfully unapplied. It also has
the convenient property that || is semi-distributive across inversion:

    f(x)                   = g(x) || h(x) || i(x)
    f.unapply(receiver, x) = g.unapply(receiver, x) || h.unapply(receiver, x) || i.unapply(receiver, x)

This is a lossy inversion if 'g' accepts values produced by 'h' or 'i'. The lossiness comes from the fact that the original function's decision tree was not recorded; all we can do from
the inverse function is observe properties of its output. One way to prevent this is to use constructors.

### Constructor inversion

This is another case where inversion is not technically possible due to lossy transformations that happen inside constructor functions. However, we can define a lossy unnew() that tracks
field assignments and remaps them into constructor arguments:

    f(x, y, z)        = this.x -eq.x <then> this.y -eq.y <then> this.z -eq.z <then> this
    f.unnew(receiver) = [receiver.x, receiver.y, receiver.z] -when [receiver && receiver.constructor === f]

# Global initialization

This tracks the code that was used to create the caterwaul global. If you run this again, you'll get a new global with no modules defined. Storing this is necessary for replication, defined in
the core.replication module.

      where [initializer(initializer, undefined) = $.merge   /eq.merge -then- $.deglobalize /eq.deglobalize -then- $.initializer /eq.initializer
                                            -then- $.modules /eq.[]    -then- $.module      /eq.module      -then- caterwaul     /eq.$

          -where [original_caterwaul             = typeof caterwaul === 'undefined' ? undefined : caterwaul,
                  $(configuration, options)      = $.init(configuration, options),
                  merge(o, xs = arguments)       = Array.prototype.slice.call(xs, 1) *![x %k*!k[o[k] = x[k]] -seq -when.x] -seq -then- o,
                  deglobalize()                  = caterwaul -eq.original_caterwaul -then- $,
                  module(name, configuration, f) = arguments.length === 1 ? $['#{name}_initializer']
                                                                          : $.modules /~push/ name /unless [$['#{name}_initializer']] -then- $['#{name}_initializer'] -eq- $(configuration)(f)
                                                                                                                                      -then- $['#{name}_initializer']($)]]});