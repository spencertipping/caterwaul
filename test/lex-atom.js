// Atom lexing unit tests

test(function () {
  var t = function (s) {return aeq(caterwaul.lex(s), Array.prototype.slice.call(arguments, 1))},
      s = function (s) {return t(s, s)};

//   Identifiers

  s('foo');
  t('foo bar', 'foo', 'bar');
  t('foo bar bif', 'foo', 'bar', 'bif');

//   Strings

  s('"foo"');
  s('"foo bar"');
  t('"foo bar", "bif baz"', '"foo bar"', ',', '"bif baz"');

  s('"foo"');
  s("'foo bar'");
  t('"foo bar", \'bif baz\'', '"foo bar"', ',', "'bif baz'");

//   Escaped strings

  s('"foo\\"bar"');
  s('"foo\\"\\"bar\\"\\"bif"');
  s('"\\"foo\\"\\"bar\\"\\"bif"');
  s('"\\"foo\\"\\"bar\\"\\"bif\\""');
  s('"\\"foo\\\\bar\\\\bif\\""');

//   Regular expressions

  s('/foo/');
  s('/foo bar/');
  s('/foo bar bif/');

  s('/foo/gi');
  s('/foo/gsim');
  s('/foo bar bif/gim');

//   Escaped regular expressions

  s('/foo\\/bar/');
  s('/foo\\/bar\\/bif/');
  s('/foo\\/bar\\/bif/gi');
  s('/foo\\/bar\\/bif/gims');
  s('/foo\\/bar\\/bif\\\\/gims');
  s('/foo\\/bar\\/bif\\\\\\//gims');

//   Numeric literals

  s('3');
  s('3.');
  s('.3');
  s('3.0');
  s('3.014');
  s('3.141592653589793238462643383279502884197');

  s('3e10');
  s('3e3');
  s('3.0e10');
  s('3.0e+10');
  s('3.0e-10');
  s('3.0E+10');
  s('3.0E-10');
  s('3.0E-1');
  s('3.0E1');

//   Regular expressions and parens

  t('(/foo/g)', '(', '/foo/g', ')');
  t('[/foo/g]', '[', '/foo/g', ']');
  t('{/foo/g}', '{', '/foo/g', '}');

  t('(foo)/foo/g', '(', 'foo', ')', '/', 'foo', '/', 'g');
  t('[foo]/foo/g', '[', 'foo', ']', '/', 'foo', '/', 'g');
  t('{foo}/foo/g', '{', 'foo', '}', '/', 'foo', '/', 'g');
});

// Generated by SDoc 