var result = divergence.clone (function (d) {
  d.foo = 'bar';
  return 5;
});
result                    // => 5