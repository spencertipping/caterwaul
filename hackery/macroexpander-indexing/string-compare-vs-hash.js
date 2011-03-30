var bench=function(n,f){var s=+new Date(),c=f?n+1:2,f=f||n;while(--c)f();return +new Date()-s};

var object = {};
var total  = 0;
var count  = 100000000;

var log    = typeof console === 'undefined' ? print : function (x) {console.log(x)};

log('index with integers: ' + bench(10000000, function () {if (object[++count]) ++total}));
log('index with strings:  ' + bench(10000000, function () {if (object[(++count).toString()]) ++total}));
log('integer compare ===: ' + bench(10000000, function () {if (count === ++count) ++total}));
log('string compare ===:  ' + bench(10000000, function () {if (count.toString() === (++count).toString()) ++total}));
log('integer compare ==:  ' + bench(10000000, function () {if (count == ++count) ++total}));
log('string compare ==:   ' + bench(10000000, function () {if (count.toString() == (++count).toString()) ++total}));

log(total);
