// JavaScript syntactic constructs.

test(function () {
  var p = function (s, i) {return eq(caterwaul.parse(s).inspect(), i)};

//   Lone block-level statements

  p('if (foo) {bar}', '(if (( (foo)) ({ (bar)))');
  p('if (foo) bar', '(if (( (foo)) (bar))');
  p('if (foo) bar()', '(if (( (foo)) (() (bar) (<>)))');
  p('if (foo) bar;', '(; (if (( (foo)) (bar)) (<>))');
  p('if (foo);', '(; (if (( (foo))) (<>))');

  p('for (var i = 0; i < 10; ++i) total += i;', '(; (for (( (; (; (var (= (i) (0))) (< (i) (10))) (u++ (i)))) (+= (total) (i))) (<>))');
  p('for (var i = 0; i < 10; ++i);', '(; (for (( (; (; (var (= (i) (0))) (< (i) (10))) (u++ (i))))) (<>))');
  p('for (var k in foo) console.log(k);', '(; (for (( (var (in (k) (foo)))) (() (. (console) (log)) (k))) (<>))');
  p('for (var k in foo) for (var j in k) k + j;', '(; (for (( (var (in (k) (foo)))) (for (( (var (in (j) (k)))) (+ (k) (j)))) (<>))');
  p('if(foo)for(bar);', '(; (if (( (foo)) (for (( (bar)))) (<>))');

  p('while(foo)bar;', '(; (while (( (foo)) (bar)) (<>))');
  p('while(bif)while(foo)bar;', '(; (while (( (bif)) (while (( (foo)) (bar))) (<>))');
  p('for(var i = 0; i < 10; ++i) while(foo) bar;', '(; (for (( (; (; (var (= (i) (0))) (< (i) (10))) (u++ (i)))) (while (( (foo)) (bar))) (<>))');

//   Nested block-level statements

  p('if(foo)if(bar)bif', '(if (( (foo)) (if (( (bar)) (bif)))');
  p('if(foo);if(bar)bif', '(; (if (( (foo))) (if (( (bar)) (bif)))');

  p('if(foo) {bar} else bif;', '(; (if (( (foo)) ({ (bar)) (else (bif))) (<>))');
  p('if(foo) bar; else bif;', '(; (if (( (foo)) (bar) (else (bif))) (<>))');

  p('if(x)y; else if(z) a; else if(w) q;', '(; (if (( (x)) (y) (else (if (( (z)) (a) (else (if (( (w)) (q)))))) (<>))');

  p('for(var i = 0, l = 10; i < l; ++i) while (i) while (j) foo;', '(; (for (( (; (; (var (, (= (i) (0)) (= (l) (10)))) (< (i) (l))) (u++ (i)))) (while (( (i)) (while (( (j)) (foo)))) (<>))');

//   Functions

  p('function foo (bar) {bif} function bar (bif) {baz}', '(i; (function (foo) (( (bar)) ({ (bif))) (function (bar) (( (bif)) ({ (baz))))');
  p('var f = function (x) {return x}', '(var (= (f) (function (( (x)) ({ (return (x))))))');
});

// Generated by SDoc 
