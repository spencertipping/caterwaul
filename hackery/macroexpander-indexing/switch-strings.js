var bench=function(n,f){var s=+new Date(),c=f?n+1:2,f=f||n;while(--c)f();return +new Date()-s};

var total = 0;
var count = 100000000;

var short_strings = ['foo', 'bar', 'bif', 'baz'];
var long_strings  = ['foofoofoofoofoofoofoofoofoofoofoofoofoofoofoofoofoofoofoofoofoofoofoo',
                     'barbarbarbarbarbarbarbarbarbarbarbarbarbarbarbarbarbarbarbarbarbarbar',
                     'bifbifbifbifbifbifbifbifbifbifbifbifbifbifbifbifbifbifbifbifbifbifbif',
                     'bazbazbazbazbazbazbazbazbazbazbazbazbazbazbazbazbazbazbazbazbazbazbaz'];

var iterations = 10000000;

var l = typeof console === 'undefined' ? print : function (x) {console.log(x)};

l('switching on a short string against short strings (no default): ' + bench(iterations, function () {
  switch(short_strings[++count & 0x3]) {
    case 'foo': return total += count + 1;
    case 'bar': return total += count + 2;
    case 'bif': return total += count + 3;
    case 'baz': return total += count + 4;
  }
}));

l('switching on a short string against short strings (default): ' + bench(iterations, function () {
  switch(short_strings[++count & 0x3]) {
    case 'foo': return total += count + 1;
    case 'bar': return total += count + 2;
    case 'bif': return total += count + 3;
    default:    return total += count + 4;
  }
}));

l('switching on a long string against short strings (no default): ' + bench(iterations, function () {
  switch(long_strings[++count & 0x3]) {
    case 'foo': return total += count + 1;
    case 'bar': return total += count + 2;
    case 'bif': return total += count + 3;
    case 'baz': return total += count + 4;
  }
}));

l('switching on a long string against short strings (default): ' + bench(iterations, function () {
  switch(long_strings[++count & 0x3]) {
    case 'foo': return total += count + 1;
    case 'bar': return total += count + 2;
    case 'bif': return total += count + 3;
    default:    return total += count + 4;
  }
}));

l('switching on a short string against short strings (many cases): ' + bench(iterations, function () {
  switch(short_strings[++count & 0x3]) {
    case 'foo': return total += count + 1;
    case 'bar': return total += count + 2;
    case 'bif': return total += count + 3;
    case 'baz': return total += count + 4;
    case 'food': return total += count + 1;
    case 'bard': return total += count + 2;
    case 'bifd': return total += count + 3;
    case 'bazd': return total += count + 4;
    case 'foor': return total += count + 1;
    case 'barr': return total += count + 2;
    case 'bifr': return total += count + 3;
    case 'bazr': return total += count + 4;
    case 'fooz': return total += count + 1;
    case 'barz': return total += count + 2;
    case 'bifz': return total += count + 3;
    case 'bazz': return total += count + 4;
  }
}));

l('switching on a long string against short strings (many cases): ' + bench(iterations, function () {
  switch(long_strings[++count & 0x3]) {
    case 'foo': return total += count + 1;
    case 'bar': return total += count + 2;
    case 'bif': return total += count + 3;
    case 'baz': return total += count + 4;
    case 'food': return total += count + 1;
    case 'bard': return total += count + 2;
    case 'bifd': return total += count + 3;
    case 'bazd': return total += count + 4;
    case 'foor': return total += count + 1;
    case 'barr': return total += count + 2;
    case 'bifr': return total += count + 3;
    case 'bazr': return total += count + 4;
    case 'fooz': return total += count + 1;
    case 'barz': return total += count + 2;
    case 'bifz': return total += count + 3;
    case 'bazz': return total += count + 4;
  }
}));

l('switching on a short string against long strings (no default): ' + bench(iterations, function () {
  switch(short_strings[++count & 0x3]) {
    case 'foofoofoofoofoofoofoofoofoofoofoofoofoofoofoofoofoofoofoofoofoofoofoo': return total += count + 1;
    case 'barbarbarbarbarbarbarbarbarbarbarbarbarbarbarbarbarbarbarbarbarbarbar': return total += count + 2;
    case 'bifbifbifbifbifbifbifbifbifbifbifbifbifbifbifbifbifbifbifbifbifbifbif': return total += count + 3;
    case 'bazbazbazbazbazbazbazbazbazbazbazbazbazbazbazbazbazbazbazbazbazbazbaz': return total += count + 4;
  }
}));

l('switching on a short string against long strings (default): ' + bench(iterations, function () {
  switch(short_strings[++count & 0x3]) {
    case 'foofoofoofoofoofoofoofoofoofoofoofoofoofoofoofoofoofoofoofoofoofoofoo': return total += count + 1;
    case 'barbarbarbarbarbarbarbarbarbarbarbarbarbarbarbarbarbarbarbarbarbarbar': return total += count + 2;
    case 'bifbifbifbifbifbifbifbifbifbifbifbifbifbifbifbifbifbifbifbifbifbifbif': return total += count + 3;
    default:    return total += count + 4;
  }
}));

l('switching on a long string against long strings (no default): ' + bench(iterations, function () {
  switch(long_strings[++count & 0x3]) {
    case 'foofoofoofoofoofoofoofoofoofoofoofoofoofoofoofoofoofoofoofoofoofoofoo': return total += count + 1;
    case 'barbarbarbarbarbarbarbarbarbarbarbarbarbarbarbarbarbarbarbarbarbarbar': return total += count + 2;
    case 'bifbifbifbifbifbifbifbifbifbifbifbifbifbifbifbifbifbifbifbifbifbifbif': return total += count + 3;
    case 'bazbazbazbazbazbazbazbazbazbazbazbazbazbazbazbazbazbazbazbazbazbazbaz': return total += count + 4;
  }
}));

l('switching on a long string against long strings (default): ' + bench(iterations, function () {
  switch(long_strings[++count & 0x3]) {
    case 'foofoofoofoofoofoofoofoofoofoofoofoofoofoofoofoofoofoofoofoofoofoofoo': return total += count + 1;
    case 'barbarbarbarbarbarbarbarbarbarbarbarbarbarbarbarbarbarbarbarbarbarbar': return total += count + 2;
    case 'bifbifbifbifbifbifbifbifbifbifbifbifbifbifbifbifbifbifbifbifbifbifbif': return total += count + 3;
    default:    return total += count + 4;
  }
}));

l(total);
