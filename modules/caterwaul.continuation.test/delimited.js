// Delimited continuation tests.

test(function () {
  var c = caterwaul.clone('std continuation');

  c(function (eq) {
    eq(call/cc[fn[cc][cc(4)]], 4);
    eq(call/cc[fn[cc][cc(4), 5]], 4);
    eq(call/cc[fn[cc][5]], 5);
  })(eq);

  c(function (eq) {
    // This will fail if tail calls aren't being optimized.
    var successor_cps = fn[n, acc, cc][n > 0 ? call/tail[successor_cps(n - 1, acc + 1, cc)] : cc(acc)];
    eq(call/cc[fn[cc][successor_cps(5, 0, cc)]], 5);
    eq(call/cc[fn[cc][successor_cps(100000, 0, cc)]], 100000);
  })(eq);
});

// Generated by SDoc 
