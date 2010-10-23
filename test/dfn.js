// Divergence-style function literal tests

test(function () {
  caterwaul.clone('dfn')(function (eq) {
    eq((x >$> x + 1)(5), 6);
    eq((x >$> (y >$> x + y))(6)(7), 13);
    eq(((x, y) >$> x + y)(6, 7), 13);
  }) (eq);
});

// Generated by SDoc 
