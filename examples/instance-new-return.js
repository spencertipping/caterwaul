var result = new divergence (function (d) {
  d.foo = 'bar';
  return 5;
});
result.result             // => 5
result.divergence.foo     // => 'bar'