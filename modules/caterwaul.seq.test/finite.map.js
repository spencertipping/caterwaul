// Finite sequence mapping tests.

test(function () {
  var c = caterwaul.clone('std seq');
  c(function (eq) {
    var xs = new caterwaul.seq.finite([1, 2, 3, 4, 5]);
    var ys = xs.map(fn[x][x + 1]);

    eq(xs.length, 5);
    eq(xs[0], 1);
    eq(xs[1], 2);
    eq(xs[4], 5);

    eq(ys.length, 5);
    eq(ys[0], 2);
    eq(ys[1], 3);
    eq(ys[4], 6);

    var zs = xs.map(fn[x, i][i]);

    eq(zs.length, 5);
    eq(zs[0], 0);
    eq(zs[1], 1);
    eq(zs[4], 4);
  })(eq);
});

// Generated by SDoc 