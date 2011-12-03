$(caterwaul('js_all')(function () {
  var is_prime = function (x) {
    for (var i = 2; i * i <= x; ++i)
      if (x % i === 0)
        return false;
    return true;
  };

  var list = [];
  for (var i = 2; i < 10000; ++i)
    if (is_prime(i))
      list.push(i);

  $('body').text(list.join(', '));
}));