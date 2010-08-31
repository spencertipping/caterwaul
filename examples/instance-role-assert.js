divergence.role.create ('assert', function (d) {
  d.assert = function (what, message) {
    if (! what) throw new Error ('Assertion failed: ' + message);
    return what;
  };
});

d.assert          // => undefined