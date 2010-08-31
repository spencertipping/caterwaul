new divergence (function (d) {
  // Code in here can access d, which is a copy of the global divergence.
  // To create a copy of d:
  new d (function (new_d) {
    // new_d is a copy of d, and will inherit any d-specific customizations
    // specified earlier.
  });

  // Another way to do it:
  d.clone (function (new_d) {
    // This is exactly the same as above, except that its return value is
    // intact.
  });

  // To grab the copy for later:
  var new_d = d.clone();
});