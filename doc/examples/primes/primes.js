$(caterwaul.js_all()(function () {
  $('body').append(primes.join(', '))
  -where [
    composite(n) = n[2, Math.sqrt(n) + 1] |[n % x === 0] |seq,
    primes       = n[2, 10000] %[! composite(x)] -seq];
}));