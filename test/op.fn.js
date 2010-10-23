// Op-fn promotion tests.

test(function () {
  var f = caterwaul.clone('std')(function (eq) {
    var test = fn_[$<<$];

    var f = $+$;
    eq(f(3, 4), 7);

    var g = $<$;
    eq(g(3, 4), true);
    eq(g(4, 3), false);

    var h = $[$];
    eq(h({foo: 'bar'}, 'foo'), 'bar');

    var i = $($);
    eq(i(fn[x][x + 1], 5), 6);
  });
  
  f(eq);
});

// Generated by SDoc 
