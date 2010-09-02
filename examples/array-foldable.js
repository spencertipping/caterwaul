d.instance(Array, 'foldable', {
  zero:  '||[]',
  merge: '|x, y| x.concat(y)',
  ret:   -0x77,
  fold:  function (f) {
    var args = arguments;
    return function (xs) {
      var start   = args.length === 2;
      var initial = start ? args[1] : xs[0];
      for (var i = start, l = xs.length; i < l; ++i)
        initial = f(initial, xs[i]);
      return initial;
    };
  }});