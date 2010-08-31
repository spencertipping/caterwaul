new divergence (function (d) {
  d.role.use ('assert');                  // Adds 'assert' to d in-place
  d.assert (3 === 3, 'basic math');       // => true
});

new divergence ('assert', function (d) {
  // d is a clone of divergence, but also with 'assert'
  d.assert (true, 'should pass');         // => true
});

divergence.role.use ('assert');           // Not a great idea; see next paragraph
divergence.assert (1, 'truthy 1');        // => 1