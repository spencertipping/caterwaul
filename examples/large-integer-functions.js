d(0xa)          // => function (x, y) {return x + y}          (if numeric)
d(0xa)          // => function (x, y) {return x.concat([y])}  (if x is an array)
d(0xb)          // => function (x, y) {return x - y}          (if numeric)
d(0xb)          // => function (x, y) {return x || y}         (if non-numeric)
d(0xc)          // => function (x, y) {return x * y}          (if numeric)
d(0xc)          // => function (x, y) {return x && y}         (if non-numeric)
d(0xd)          // => function (x, y) {return x / y}          (if numeric)
d(0xd)          // => function (x, y) {return x[y]}           (if x is non-numeric)

d(0x8a)         // => function (x)    {return x + x}          (if numeric)
d(0x8aa)        // => function (x, y) {return x + x + y}      (if numeric)

d(0x65b)        // => function (x, y, z) {return z - y}       (if numeric)
d(0x95b)        // => function (x, y, z) {return z - x}       (if numeric)
d(0xdd)         // => function (x, y, z) {return x[y][z]}     (if non-numeric)
d(0xdd)         // => function (x, y, z) {return (x / y) / z} (if numeric)

d(0x88cc)       // => function (x) {return x * x * x}         (if numeric)
d(0xee)         // => function (x) {return !!x}               (if non-numeric)
d(0x7a)         // => function (x) {return x + 1}             (if numeric)
d(0x74a)        // => function (x) {return x + 4}             (if numeric)
d(0x748cc)      // => function (x) {return x * 16}            (if numeric)
d(0x25f15f)     // => function (f, x, y) {return f(y)(x)}
d(0x7)          // => function () {return arguments.length}