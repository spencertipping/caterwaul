var bench=function(n,f){var s=+new Date(),c=f?n+1:2,f=f||n;while(--c)f();return +new Date()-s};

var array = [];
var total = 0;
var count = 100000000;

for (var i = 0; i < 1000; ++i) {
  array.push(i);
  array.push(i.toString());
}

var iterations = 300000;

var l = typeof console === 'undefined' ? print : function (x) {console.log(x)};

l('integer keys (hit):  ' + (bench(iterations, function () {for (var i = 0; i < 100; ++i) if (array[array[++count % 1000 << 1]])            ++total})));
l('string keys (hit):   ' + (bench(iterations, function () {for (var i = 0; i < 100; ++i) if (array[array[++count % 1000 << 1 | 1]])        ++total})));
l('integer keys (miss): ' + (bench(iterations, function () {for (var i = 0; i < 100; ++i) if (array[array[++count % 1000 + 1000 << 1]])     ++total})));
l('string keys (miss):  ' + (bench(iterations, function () {for (var i = 0; i < 100; ++i) if (array[array[++count % 1000 + 1000 << 1 | 1]]) ++total})));

l(total);
