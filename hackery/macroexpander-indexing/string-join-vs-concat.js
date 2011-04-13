var bench=function(n,f){var s=+new Date(),c=f?n+1:2,f=f||n;while(--c)f();return +new Date()-s};

var total = 0;
var count = 100000000;

var iterations = 300000;

var strings = [];
var longs = [];

for (var i = 0; i < 100; ++i) strings.push((i * 3341029187 % 1000000 >>> 0).toString());
for (var i = 0; i < 100; ++i) longs.push(i + strings.join('|') + i);

var l = typeof console === 'undefined' ? print : function (x) {console.log(x)};

l('join two shorts:     ' + bench(iterations, function () {total += [strings[++count], strings[++count]].join('').length}));
l('concat two shorts:   ' + bench(iterations, function () {total += (strings[++count] + strings[++count]).length}));
l('join 10 shorts:      ' + bench(iterations, function () {total += [strings[++count], strings[++count], strings[++count], strings[++count], strings[++count],
                                                                     strings[++count], strings[++count], strings[++count], strings[++count], strings[++count]].join('').length}));
l('concat 10 shorts:    ' + bench(iterations, function () {total += (strings[++count] + strings[++count] + strings[++count] + strings[++count] + strings[++count] +
                                                                     strings[++count] + strings[++count] + strings[++count] + strings[++count] + strings[++count]).length}));

l('join two longs:      ' + bench(iterations, function () {total += [longs[++count], longs[++count]].join('').length}));
l('concat two longs:    ' + bench(iterations, function () {total += (longs[++count] + longs[++count]).length}));
l('join 10 longs:       ' + bench(iterations, function () {total += [longs[++count], longs[++count], longs[++count], longs[++count], longs[++count],
                                                                     longs[++count], longs[++count], longs[++count], longs[++count], longs[++count]].join('').length}));
l('concat 10 longs:     ' + bench(iterations, function () {total += (longs[++count] + longs[++count] + longs[++count] + longs[++count] + longs[++count] +
                                                                     longs[++count] + longs[++count] + longs[++count] + longs[++count] + longs[++count]).length}));

l(total);
