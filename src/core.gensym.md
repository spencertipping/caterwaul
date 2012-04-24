## Symbol generation

Gensyms are identifiers that contain at least 128 bits of pseudorandom data, in this case encoded as base-62. Each base-62 digit contains ~ 5.95 bits of entropy, so a length of 22 digits is
sufficient. Gensyms are associated with generators, each of which has its own entropy.

    caterwaul.module('core.gensym', ':all', function ($) {
      $.entropy()                                            = n[22] *['ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'.charCodeAt(Math.random() * 62 >>> 0)] -seq |~join| '',
      $.gensym_generator(entropy = $.entropy(), i = 0)(name) = '#{name || ""}_#{++i}_#{entropy}',
      $.gensym                                               = $.gensym_generator()}),