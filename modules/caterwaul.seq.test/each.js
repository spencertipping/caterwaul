// Tests for the .each() method and <se<

test(function () {
  var c = caterwaul.clone('std continuation seq');
  
  c(function (eq) {
    var s = sa<< [1, 2, 3];
    var j = 0;

    j++ <se< s;
    eq(j, 3);

    j = 0;
    (j += x) <se< s;
    eq(j, 6);
  })(eq);

  c(function (eq) {
    var naturals = x + 1 <sa< [1];
    var j = 0;
    naturals.first(100).each(fn[x][j += x]);
    eq(j, 5050);
  })(eq);
});

// Generated by SDoc 
