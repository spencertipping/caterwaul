// Anamorphism tests.

test(function () {
  var c = caterwaul.clone('seq.ana');
  
  c(function (eq) {
    var xs = x + 1 <sa< [0];
    eq(xs.at(0), 0);
    eq(xs.finite_bound, 1);
    eq(xs[0], 0);
    eq(xs.length, Infinity);
    eq(xs.size(), Infinity);
    eq(xs.at(1), 1);
    eq(xs.finite_bound, 2);
    eq(xs.at(2), 2);
    eq(xs.finite_bound, 3);
    eq(xs.at(5), 5);
    eq(xs.finite_bound, 6);
  })(eq);
});

// Generated by SDoc 
