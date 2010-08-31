d('^3')                 // => function () {return 3}
d('^$0 + $1')           // => function (x, y) {return x + y}
d('^"foo"')             // => function () {return "foo"}
d('^$0.foo($1)')        // => function (x, y) {return x.foo(y)}