$(caterwaul.js_all()(function () {
  $('body').text(primes.join(', '))
  -where [
    composite(n) = ni[2, Math.sqrt(n)] |[n % x === 0] |seq,
    primes       = n[2, 10000] %!composite -seq];
}));