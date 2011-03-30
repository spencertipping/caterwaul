var bench=function(n,f){var s=+new Date(),c=f?n+1:2,f=f||n;while(--c)f();return +new Date()-s};

var total = 0;
var count = 100000000;

var iterations = 30000000;

var integers = [];
var strings  = [];
var strings2 = [];

for (var i = 0; i < 1024; ++i) {
  integers.push(i * 3341029187 % 1000000 >>> 0);
  strings.push((i * 3341029187 % 1000000 >>> 0).toString());
  strings2.push((i * 3341029187 % 1000000 >>> 0).toString());
}

var l = typeof console === 'undefined' ? print : function (x) {console.log(x)};

l('integer compare ===: ' + (bench(iterations, function () {if (integers[count & 0x3ff] === integers[++count & 0x3ff]) ++total}) - 0));
l('string compare ===:  ' + (bench(iterations, function () {if (strings[count & 0x3ff]  === strings2[count++ & 0x3ff]) ++total}) - 0 * 2));
l('string compare ===:  ' + (bench(iterations, function () {if (strings[count & 0x3ff]  === strings2[++count & 0x3ff]) ++total}) - 0 * 2));
l('integer compare <=:  ' + (bench(iterations, function () {if (integers[count & 0x3ff] <=  integers[++count & 0x3ff]) ++total}) - 0));
l('string compare <=:   ' + (bench(iterations, function () {if (strings[count & 0x3ff]  <=  strings2[count++ & 0x3ff]) ++total}) - 0 * 2));
l('string compare <=:   ' + (bench(iterations, function () {if (strings[count & 0x3ff]  <=  strings2[++count & 0x3ff]) ++total}) - 0 * 2));
l('integer compare ==:  ' + (bench(iterations, function () {if (integers[count & 0x3ff] ==  integers[++count & 0x3ff]) ++total}) - 0));
l('string compare ==:   ' + (bench(iterations, function () {if (strings[count & 0x3ff]  ==  strings2[count++ & 0x3ff]) ++total}) - 0 * 2));
l('string compare ==:   ' + (bench(iterations, function () {if (strings[count & 0x3ff]  ==  strings2[++count & 0x3ff]) ++total}) - 0 * 2));

l(total);
