// Sequence DSL tests.

test(function () {
  var c = caterwaul.clone('std seq');

  c(function (eq) {
    var from_two    = seq[2 >>>[_ + 1]];
    var primes      = seq[from_two %~n[from_two <<[_ <= Math.sqrt(n)] &[n % _]]];
    var under_100   = seq[(primes <<[_ < 100]).join(',')];
    var under_100_2 = seq[(~(primes <<[_ < 100])).join(',')];

    var primes2   = seq[2 >>>[_ + 1]] /re[seq[_ %~n[_ <<[_ <= Math.sqrt(n)] &[n % _]]]];

    eq(seq[(primes2 <<[_ < 100]).join(',')], under_100);
    eq(under_100, '2,3,5,7,11,13,17,19,23,29,31,37,41,43,47,53,59,61,67,71,73,79,83,89,97');
    eq(under_100_2, under_100);

    // There are fewer primes below 100 than below 1000:
    eq(seq[primes <<[_ < 100] < primes <<[_ < 1000]], true);

    var keys = seq[sk[{foo: 'bar'}]];
    eq(keys[0], 'foo');
    eq(keys.length, 1);

    var object = seq[!(sp[{foo: 'bar'}])];
    eq(object.constructor, Object);
    eq(object.foo, 'bar');
    eq(caterwaul.seq.finite.keys(object).length, 1);
  })(eq);
});

// Generated by SDoc 
