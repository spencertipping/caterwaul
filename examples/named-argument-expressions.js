d('|foo| foo + 1')      // => function (foo) {return foo + 1}
d('|x, y| x + y * 2')   // => function (x, y) {return x + y * 2}
d('|x| (|y| x + y)')    // => function (x) {return function (y) {return x + y}}