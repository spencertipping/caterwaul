d('.foo.bar')({foo: {bar: 5}})          // => 5
d('.foo.bar')({foo: {bif: 5}})          // => undefined
d('.foo.bar')({bif: {baz: 5}})          // => undefined