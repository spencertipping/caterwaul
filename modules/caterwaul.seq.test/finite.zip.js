// Finite sequence zip tests.

test(function () {
  var c = caterwaul.clone('std seq');

  c(function (eq) {
    var xs = new caterwaul.seq.finite([1, 2, 3, 4, 5]);
    var ys = xs.map(fn[x][x * 2]);
    var zs = xs.map(fn[x][x * 3]);

    var triples = xs.zip(ys, zs);
    eq(triples.length, 5);
    eq(triples[0].length, 3);

    eq(triples[0][0], 1);
    eq(triples[0][1], 2);
    eq(triples[0][2], 3);

    eq(triples[0].join(','), '1,2,3');
    eq(triples[1].join(','), '2,4,6');
    eq(triples[4].join(','), '5,10,15');

    var sums = xs.zip(ys, zs, {f: fn[x, y, z][x + y + z]});

    eq(sums.length, 5);
    eq(sums[0], 6);
    eq(sums[1], 12);
    eq(sums[4], 30);

    var inner = xs.zip([1, 2, 3]);

    eq(inner.length, 3);
    eq(inner[0].length, 2);
    eq(inner[0].join(','), '1,1');
    eq(inner[1].join(','), '2,2');
    eq(inner[2].join(','), '3,3');

    var outer = xs.zip([1, 2, 3], {outer: true});

    eq(outer.length, 5);
    eq(outer[0].join(','), '1,1');
    eq(outer[1].join(','), '2,2');
    eq(outer[2].join(','), '3,3');
    eq(outer[3][0], 4);
    eq(outer[3][1], undefined);
    eq(outer[4][0], 5);
    eq(outer[4][1], undefined);
  })(eq);
});

// Generated by SDoc 
