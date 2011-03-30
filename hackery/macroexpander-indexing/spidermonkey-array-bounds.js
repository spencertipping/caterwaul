var bench=function(n,f){var s=+new Date(),c=f?n+1:2,f=f||n;while(--c)f();return +new Date()-s};

var array = [];
for (var i = 0; i < 1024; ++i) array.push(i);

var total = 0;
var count = 100000000;

var iterations = 3000000;

var l = typeof console === 'undefined' ? print : function (x) {console.log(x)};

bench(iterations, function () {array[Math.random() * array.length]});   // Warm-up

l('in-bounds index with integers:       ' + (bench(iterations, function () {if (array[++count & 0x3ff]) ++total; else ++total}) - 0));
l('in-bounds index with strings:        ' + (bench(iterations, function () {if (array[(++count & 0x3ff).toString()]) ++total; else ++total}) - 0));

l('out-of-bounds index with integers:   ' + (bench(iterations, function () {if (array[++count & 0x7ffff]) ++total; else ++total}) - 0));
l('out-of-bounds index with strings:    ' + (bench(iterations, function () {if (array[(++count & 0x7ffff).toString()]) ++total; else ++total}) - 0));

l(total);
