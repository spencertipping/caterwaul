// Arithmetic/expression tests for the parser.

test(function () {
  var p = function (s, i) {return eq(caterwaul.parse(s).inspect(), i)};

//   Basic precedence

  p('3+5', '(+ (3) (5))');
  p('3*5+6', '(+ (* (3) (5)) (6))');
  p('3+5*6', '(+ (3) (* (5) (6)))');

//   Associativity

  p('3+4+5', '(+ (+ (3) (4)) (5))');
  p('3*4*5', '(* (* (3) (4)) (5))');
  p('3-4-5', '(- (- (3) (4)) (5))');
  p('3/4/5', '(/ (/ (3) (4)) (5))');

  p('3=4=5', '(= (3) (= (4) (5)))');
  p('3+=4+=5', '(+= (3) (+= (4) (5)))');
  p('3-=4+=5', '(-= (3) (+= (4) (5)))');
  p('3*=4+=5', '(*= (3) (+= (4) (5)))');
  p('3/=4+=5', '(/= (3) (+= (4) (5)))');

//   Parentheses/invocation

  p('(3+5)*6', '(* (( (+ (3) (5))) (6))');
  p('6*(3+5)', '(* (6) (( (+ (3) (5))))');
  p('((3))+((5))', '(+ (( (( (3))) (( (( (5))))');
  p('((3+5))', '(( (( (+ (3) (5))))');

  p('(3)(4)', '(() (( (3)) (4))');
  p('(3)(4)(5)', '(() (() (( (3)) (4)) (5))');
  p('3(4)', '(() (3) (4))');
  p('(3)[4]', '([] (( (3)) (4))');
  p('3[4]', '([] (3) (4))');

//   Array literals/dereferencing

  p('[1, 2, 3]', '([ (, (, (1) (2)) (3)))');
  p('[1, 2][0]', '([] ([ (, (1) (2))) (0))');
  p('[1][2, 3]', '([] ([ (1)) (, (2) (3)))');
  p('[1][2][3]', '([] ([] ([ (1)) (2)) (3))');

  p('foo.bar[bif]', '([] (. (foo) (bar)) (bif))');
  p('foo.bar[3[bif]]', '([] (. (foo) (bar)) ([] (3) (bif)))');
  p('foo.bar[3[4[bif]]]', '([] (. (foo) (bar)) ([] (3) ([] (4) (bif))))');

//   Object notation

  p('foo.bar', '(. (foo) (bar))');
  p('foo.bar.bif', '(. (. (foo) (bar)) (bif))');
  p('foo().bar.bif', '(. (. (() (foo) (<>)) (bar)) (bif))');
  p('foo().bar().bif', '(. (() (. (() (foo) (<>)) (bar)) (<>)) (bif))');
  p('foo().bar().bif()', '(() (. (() (. (() (foo) (<>)) (bar)) (<>)) (bif)) (<>))');
  p('foo().bar().bif()()', '(() (() (. (() (. (() (foo) (<>)) (bar)) (<>)) (bif)) (<>)) (<>))');
});

// Generated by SDoc 
