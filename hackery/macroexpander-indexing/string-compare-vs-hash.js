var bench=function(n,f){var s=+new Date(),c=f?n+1:2,f=f||n;while(--c)f();return +new Date()-s};

var object = {};
var total  = 0;
var count  = 100000000;

var iterations = 3000000;

var to_i   = bench(iterations, function () {total += ++count});
var to_s   = bench(iterations, function () {total += (++count).toString().length});

var l      = typeof console === 'undefined' ? print : function (x) {console.log(x)};

l('to_s adjustment:           ' + to_s);
l('to_i adjustment:           ' + to_i);

l('index with integers: (adj) ' + (bench(iterations, function () {if (object[++count]) ++total}) - to_i));
l('index with strings: (adj)  ' + (bench(iterations, function () {if (object[(++count).toString()]) ++total}) - to_s));
l('index with integers:       ' + (bench(iterations, function () {if (object[++count]) ++total}) - 0));
l('index with strings:        ' + (bench(iterations, function () {if (object[(++count).toString()]) ++total}) - 0));
l('integer compare ===:       ' + (bench(iterations, function () {if (count === ++count) ++total}) - 0));
l('string compare ===:        ' + (bench(iterations, function () {if (count.toString() === (++count).toString()) ++total}) - 0 * 2));
l('integer compare <=:        ' + (bench(iterations, function () {if (count <= ++count) ++total}) - 0));
l('string compare <=:         ' + (bench(iterations, function () {if (count.toString() <= (++count).toString()) ++total}) - 0 * 2));
l('integer compare ==:        ' + (bench(iterations, function () {if (count == ++count) ++total}) - 0));
l('string compare ==:         ' + (bench(iterations, function () {if (count.toString() == (++count).toString()) ++total}) - 0 * 2));

l(total);
