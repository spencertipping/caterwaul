d(0x6a, /(.)foo(.)/)('afoob')             // => 'ab'
d(0xd, /foobar(length)/)('foobarlength')  // => 12
d(0xee, /foobar/)('foo')                  // => null