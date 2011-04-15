// Utility methods.
// Gensym is used to support qs[]. When we quote syntax, what we really intend to do is grab a syntax tree representing something; this entails creating a let-binding with the already-evaluated
// tree. (Note: Don't go and modify these qs[]-generated trees; you only get one for each qs[].) The ultimate code ends up looking like this (see 'Environment-dependent compilation' some distance
// below):

// | (function (a_gensym) {
//     var v1 = a_gensym.gensym_1;
//     var v2 = a_gensym.gensym_2;
//     ...
//     return <your macroexpanded function>;
//   }) ({gensym_1: v1, gensym_2: v2, ..., gensym_n: vn});

// A note about gensym uniqueness. Gensyms are astronomically unlikely to collide, but there are some compromises made to make sure of this. First, gensyms are not predictable; the first one is
// randomized. This means that if you do have a collision, it may be intermittent (and that is probably a non-feature). Second, and this is a good thing, you can load Caterwaul multiple times
// without worrying about gensyms colliding between them. Each instance of Caterwaul uses its own system time and random number to seed the gensym generation, and the system time remains stable
// while the random number gets incremented. It is very unlikely that any collisions would happen.

// Bind() is the usual 'bind this function to some value' function. The only difference is that it supports rebinding; that is, if you have a function you've already bound to X, you can call bind
// on that function and some new value Y and get the original function bound to Y. The bound function has two attributes, 'original' and 'binding', that let bind() achieve this rebinding.

// Map() is an array map function, fairly standard really. I include it because IE doesn't provide Array.prototype.map. hash() takes a string, splits it on whitespace, and returns an object that
// maps each element to true. It's useful for defining sets. extend() takes a constructor function and zero or more extension objects, merging each extension object into the constructor
// function's prototype. The constructor function is then returned. It's a shorthand for defining classes.

// Se() stands for 'side-effect', and its purpose is to take a value and a function, pass the value into the function, and return either whatever the function returned or the value you gave it.
// It's used to initialize things statefully; for example:

// | return se(function () {return 5}, function (f) {
//     f.sourceCode = 'return 5';
//   });

// The Caterwaul standard library gives you an equivalent but much more refined form of se() called /se[].

    var qw = function (x) {return x.split(/\s+/)},  id = function (x) {return x},  se = function (x, f) {return f && f.call(x, x) || x},
    genval = (function (n, m, u) {return function () {return [u, n, ++m]}})(+new Date(), Math.random() * (1 << 30) >>> 0, unique()),

    genint = function () {var v = genval(); return (v[0] << 2) + v[0] + (v[1] << 1) + v[1] + v[2]},
    gensym = function () {var v = genval(); return ['gensym', v[0].toString(36), v[1].toString(36), v[2].toString(36)].join('_')},

      bind = function (f, t) {return f.binding === t ? f : f.original ? bind(f.original, t) : merge(function () {return f.apply(t, arguments)}, {original: f, binding: t})},
       map = function (f, xs) {for (var i = 0, ys = [], l = xs.length; i < l; ++i) ys.push(f(xs[i], i)); return ys},
      hash = function (s) {for (var i = 0, xs = qw(s), o = {}, l = xs.length; i < l; ++i) o[xs[i]] = true; return annotate_keys(o)},
     merge = function (o) {for (var i = 1, l = arguments.length, _; i < l; ++i) if (_ = arguments[i]) for (var k in _) has(_, k) && (o[k] = _[k]); return o},
    extend = function (f) {merge.apply(null, [f.prototype].concat(Array.prototype.slice.call(arguments, 1))); return f},

//   Caterwaul identification.
//   Caterwaul functions agree on a secret value to identify themselves. This needs to happen because there isn't another particularly good way to identify them. This ends up being installed as
//   the is_caterwaul property on every caterwaul function.

    is_caterwaul = gensym(),

//   Optimizations.
//   The parser and lexer each assume valid input and do no validation. This is possible because any function passed in to caterwaul will already have been parsed by the Javascript interpreter;
//   syntax errors would have caused an error there. This enables a bunch of optimization opportunities in the parser, ultimately making it not in any way recursive and requiring only three
//   linear-time passes over the token stream. (An approximate figure; it actually does about 19 fractional passes, but not all nodes are reached.)

//   Also, I'm not confident that all Javascript interpreters are smart about hash indexing. Particularly, suppose a hashtable has 10 entries, the longest of whose keys is 5 characters. If we
//   throw a 2K string at it, it might very well hash that whole thing just to find that, surprise, the entry doesn't exist. That's a big performance hit if it happens very often. To prevent this
//   kind of thing, I'm keeping track of the longest string in the hashtable by using the 'annotate_keys' function. 'has()' knows how to look up the maximum length of a hashtable to verify that
//   the candidate is in it, resulting in the key lookup being only O(n) in the longest key (generally this ends up being nearly O(1), since I don't like to type long keys), and average-case O(1)
//   regardless of the length of the candidate.

//   As of Caterwaul 0.7.0 the _max_length property has been replaced by a gensym. This basically guarantees uniqueness, so the various hacks associated with working around the existence of the
//   special _max_length key are no longer necessary.

   max_length_key = gensym(),
    annotate_keys = function (o)    {var max = 0; for (var k in o) own.call(o, k) && (max = k.length > max ? k.length : max); o[max_length_key] = max; return o},
              has = function (o, p) {return p != null && ! (p.length > o[max_length_key]) && own.call(o, p)},  own = Object.prototype.hasOwnProperty;
// Generated by SDoc 
