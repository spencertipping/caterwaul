d({foo: 0x71a})(5)                  // => {foo: 6}
d({two: 0x8ab, four: 0x74cb})(6, 7) // => {two: 5, four: 17}
d({foo: '||@'}).call(5)             // => 5