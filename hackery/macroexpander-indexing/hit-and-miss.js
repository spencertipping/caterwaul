var bench=function(n,f){var s=+new Date(),c=f?n+1:2,f=f||n;while(--c)f();return +new Date()-s};

var object = {};
var total  = 0;
var count  = 100000000;

for (var i = 0; i < 1000; ++i)
  object['property' + i] = object['p' + i] = true;

var iterations = 3000000;

var l = typeof console === 'undefined' ? print : function (x) {console.log(x)};

l('100% hit ratio (long):  ' + (bench(iterations, function () {if (object['property' + ++count % 1000]) ++total})));
l('50% hit ratio (long):   ' + (bench(iterations, function () {if (object['property' + ++count % 2000]) ++total})));
l('25% hit ratio (long):   ' + (bench(iterations, function () {if (object['property' + ++count % 4000]) ++total})));
l('0% hit ratio (long):    ' + (bench(iterations, function () {if (object['projerty' + ++count % 1000]) ++total})));

l('100% hit ratio (short): ' + (bench(iterations, function () {if (object['p' + ++count % 1000]) ++total})));
l('50% hit ratio (short):  ' + (bench(iterations, function () {if (object['p' + ++count % 2000]) ++total})));
l('25% hit ratio (short):  ' + (bench(iterations, function () {if (object['p' + ++count % 4000]) ++total})));
l('0% hit ratio (short):   ' + (bench(iterations, function () {if (object['j' + ++count % 1000]) ++total})));

l(total);
