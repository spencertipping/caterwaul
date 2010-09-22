var assert = function (condition, message) {
  if (condition) return condition;
  else throw new Error (message);
};

var eq = function (xs, ys, message) {
  assert(xs.length === ys.length, message + ' (length !==)');

};
