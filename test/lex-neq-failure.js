test(function () {
  var t = function (s)    {return aeq(caterwaul.lex(s), Array.prototype.slice.call(arguments, 1))},
      s = function (s)    {return t(s, s)},
      q = function (s, e) {return aeq(caterwaul.lex(s), e.split(/\s+/))},
      Q = function (s)    {return q(s, s)};

//   Proper parsing of != and !== (in response to a failure)

  q('foo[1] !== 5', 'foo [ 1 ] !== 5');
  q('foo[1] != 5', 'foo [ 1 ] != 5');
});

// Generated by SDoc 