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