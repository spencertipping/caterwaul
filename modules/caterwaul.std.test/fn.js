// Caterwaul fn, bind, and cond standard library tests

test('caterwaul.std.fn', function () {
  var fn = caterwaul.clone('std.fn std.bind std.cond');

  fn(function (eq) {
    eq(fn[x][x + 1](6), 7);
    eq(fn[x, y][x + y](6, 7), 13);
    eq(fn_[10](), 10);

    eq(l[y = 5] in y + 1, 6);
    eq(l[y = 5, a = 6] in y + a, 11);

    eq(l*[x = 4, y = x] in x + y, 8);
    eq(l*[fact = fn[n][n > 1 ? n * fact(n - 1) : 1]] in fact(5), 120);

    eq(z + 1, where[z = 5], 6);
    eq(q + w, where[q = 10, w = 100], 110);

    eq(x + y,   where*[x = 4, y = x], 8);
    eq(fact(5), where*[fact = fn[n][n > 1 ? n * fact(n - 1) : 1]], 120);

    eq(5, when[true], 5);
    eq(5, when[false], false);

    eq(5, unless[true], false);
    eq(5, unless[false], 5);
  }) (eq);
});
// Generated by SDoc 
