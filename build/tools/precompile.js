// Caterwaul precompiler | Spencer Tipping
// Licensed under the terms of the MIT source code license

// Usage: node precompile.js file.js
// This will produce a precompiled file called 'file.pre.js'.

// Core caterwaul build with version ID | Spencer Tipping
// Licensed under the terms of the MIT source code license



// Introduction.
// Caterwaul is a Javascript-to-Javascript compiler. Visit http://spencertipping.com/caterwaul/caterwaul.html for information about how and why you might use it.

(function (f) {return f(f, (function (x) {return function () {return ++x}})(0))})(function (initializer, unique, undefined) {



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

    var qw = function (x) {return x.split(/\s+/)},  se = function (x, f) {return f && f.call(x, x) || x},  fail = function (m) {throw new Error(m)},
    genval = (function (n, m, u) {return function () {return [u, n, ++m]}})(+new Date(), Math.random() * (1 << 30) >>> 0, unique()),
    gensym = function () {var v = genval(); return ['gensym', v[0].toString(36), v[1].toString(36), v[2].toString(36)].join('_')},

   flatten = function () {for (var r = [], i = 0, l = arguments.length, x; i < l; ++i) (x = arguments[i]) instanceof Array ? r = r.concat(flatten.apply(this, x)) : r.push(x); return r},

       map = function (f, xs) {for (var i = 0, ys = [], l = xs.length; i < l; ++i) ys.push(f(xs[i], i)); return ys},
      rmap = function (f, xs) {return map(function (x) {return x instanceof Array ? rmap(f, x) : f(x)})},
      hash = function (s) {for (var i = 0, xs = qw(s), o = {}, l = xs.length; i < l; ++i) o[xs[i]] = true; return annotate_keys(o)},
     merge = function (o) {for (var i = 1, l = arguments.length, _; i < l; ++i) if (_ = arguments[i]) for (var k in _) has(_, k) && (o[k] = _[k]); return o},

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





// Global caterwaul variable.
// Caterwaul creates a global symbol, caterwaul. Like jQuery, there's a mechanism to get the original one back if you don't want to replace it. You can call caterwaul.deglobalize() to return
// caterwaul and restore the global that was there when Caterwaul was loaded (might be useful in the unlikely event that someone else named their library Caterwaul). Note that deglobalize() is
// available only on the global caterwaul() function.

  var calls_init       = function () {var f = function () {return f.init.apply(f, arguments)}; return f},
      original_global  = typeof caterwaul === 'undefined' ? undefined : caterwaul,
      caterwaul_global = calls_init();

  caterwaul_global.deglobalize = function () {caterwaul = original_global; return caterwaul_global};

//   Version management and reinitialization.
//   There's an interesting case that comes up when loading a global caterwaul. If we detect that the caterwaul we just loaded has the same version as the one that's already there, we revert back
//   to the original. This is very important for precompilation and the reason for it is subtle. Precompilation relies on tracing to determine the compiled form of each function handed to
//   caterwaul, so if that caterwaul is replaced for any reason then the traces won't happen. A very common setup is something like this:

//   | <script src='caterwaul.js'></script>
//     <script src='some-caterwaul-extension.js'></script>
//     <script src='my-script.js'></script>

//   Often you'll want to precompile the whole bundle, since caterwaul.js includes behaviors that aren't necessarily precompiled and you might get better minification. To do this, it's tempting
//   to precompile the whole bundle of caterwaul, the extensions, and your code. Without version checking, however, the traces would be lost and nothing would happen.

//   There is, of course, a pathological failure case in all of this. If you load three caterwauls [why?] and the second of the three has a different version than the other two, then you'll still
//   get precompiled erasure. I personally don't care about this case. You'd have to be insane to do crazy stuff like this and expect precompilation to work.

    caterwaul_global.version      = function (v) {return v ? (this._version = v, original_global && original_global.version() === v ? this.deglobalize() : this) : this._version};
    caterwaul_global.reinitialize = function (transform) {var c = (transform || function (x) {return x})(this.initializer);
                                                          return c(c, this.unique).version(this.version())};

//   Utility methods.
//   These are available for use by compiler functions or the end user.

    merge(caterwaul_global, {
      merge:          merge,
      map:            map,
      rmap:           rmap,
      flatten:        flatten,
      gensym:         gensym,
      unique:         unique,
      initializer:    initializer,

      variadic:       function (f) {return function () {for (var r = [], i = 0, l = arguments.length;                       i < l; ++i) r.push(f.call(this, arguments[i]));    return r}},
      right_variadic: function (f) {return function () {for (var r = [], i = 0, l = arguments.length - 1, x = arguments[l]; i < l; ++i) r.push(f.call(this, arguments[i], x)); return r}}});
// Generated by SDoc 






// Shared parser data.
// This data is used both for parsing and for serialization, so it's made available to all pieces of caterwaul.

//   Precomputed table values.
//   The lexer uses several character lookups, which I've optimized by using integer->boolean arrays. The idea is that instead of using string membership checking or a hash lookup, we use the
//   character codes and index into a numerical array. This is guaranteed to be O(1) for any sensible implementation, and is probably the fastest JS way we can do this. For space efficiency,
//   only the low 256 characters are indexed. High characters will trigger sparse arrays, which may degrade performance. Also, this parser doesn't handle Unicode characters properly; it assumes
//   lower ASCII only.

//   The lex_op table indicates which elements trigger regular expression mode. Elements that trigger this mode cause a following / to delimit a regular expression, whereas other elements would
//   cause a following / to indicate division. By the way, the operator ! must be in the table even though it is never used. The reason is that it is a substring of !==; without it, !== would
//   fail to parse.

   var lex_op = hash('. new ++ -- u++ u-- u+ u- typeof u~ u! ! * / % + - << >> >>> < > <= >= instanceof in == != === !== & ^ | && || ? = += -= *= /= %= &= |= ^= <<= >>= >>>= : , ' +
                     'return throw case var const break continue void else u; ;'),

    lex_table = function (s) {for (var i = 0, xs = [false]; i < 8; ++i) xs.push.apply(xs, xs); for (var i = 0, l = s.length; i < l; ++i) xs[s.charCodeAt(i)] = true; return xs},
    lex_float = lex_table('.0123456789'),    lex_decimal = lex_table('0123456789'),  lex_integer = lex_table('0123456789abcdefABCDEFx'),  lex_exp = lex_table('eE'),
    lex_space = lex_table(' \n\r\t'),        lex_bracket = lex_table('()[]{}'),       lex_opener = lex_table('([{'),                    lex_punct = lex_table('+-*/%&|^!~=<>?:;.,'),
      lex_eol = lex_table('\n\r'),     lex_regexp_suffix = lex_table('gims'),          lex_quote = lex_table('\'"/'),                   lex_slash = '/'.charCodeAt(0),
     lex_star = '*'.charCodeAt(0),              lex_back = '\\'.charCodeAt(0),             lex_x = 'x'.charCodeAt(0),                     lex_dot = '.'.charCodeAt(0),
     lex_zero = '0'.charCodeAt(0),     lex_postfix_unary = hash('++ --'),              lex_ident = lex_table('$_abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'),

//   Parse data.
//   The lexer and parser aren't entirely separate, nor can they be considering the complexity of Javascript's grammar. The lexer ends up grouping parens and identifying block constructs such
//   as 'if', 'for', 'while', and 'with'. The parser then folds operators and ends by folding these block-level constructs.

    parse_reduce_order = map(hash, ['function', '( [ . [] ()', 'new delete', 'u++ u-- ++ -- typeof u~ u! u+ u-', '* / %', '+ -', '<< >> >>>', '< > <= >= instanceof in', '== != === !==', '&',
                                    '^', '|', '&&', '||', 'case', '?', '= += -= *= /= %= &= |= ^= <<= >>= >>>=', ':', ',', 'return throw break continue void', 'var const',
                                    'if else try catch finally for switch with while do', ';']),

parse_associates_right = hash('= += -= *= /= %= &= ^= |= <<= >>= >>>= ~ ! new typeof u+ u- -- ++ u-- u++ ? if else function try catch finally for switch case with while do'),
   parse_inverse_order = (function (xs) {for (var  o = {}, i = 0, l = xs.length; i < l; ++i) for (var k in xs[i]) has(xs[i], k) && (o[k] = i); return annotate_keys(o)})(parse_reduce_order),
   parse_index_forward = (function (rs) {for (var xs = [], i = 0, l = rs.length, _ = null; _ = rs[i], xs[i] = true, i < l; ++i)
                                           for (var k in _) if (has(_, k) && (xs[i] = xs[i] && ! has(parse_associates_right, k))) break; return xs})(parse_reduce_order),

              parse_lr = hash('[] . () * / % + - << >> >>> < > <= >= instanceof in == != === !== & ^ | && || = += -= *= /= %= &= |= ^= <<= >>= >>>= , : ;'),
   parse_r_until_block = annotate_keys({'function':2, 'if':1, 'do':1, 'catch':1, 'try':1, 'for':1, 'while':1, 'with':1, 'switch':1}),
         parse_accepts = annotate_keys({'if':'else', 'do':'while', 'catch':'finally', 'try':'catch'}),  parse_invocation = hash('[] ()'),
      parse_r_optional = hash('return throw break continue else'),              parse_r = hash('u+ u- u! u~ u++ u-- new typeof finally case var const void delete'),
           parse_block = hash('; {'),  parse_invisible = hash('i;'),            parse_l = hash('++ --'),     parse_group = annotate_keys({'(':')', '[':']', '{':'}', '?':':'}),
 parse_ambiguous_group = hash('[ ('),    parse_ternary = hash('?'),   parse_not_a_value = hash('function if for while catch'), parse_also_expression = hash('function');
// Generated by SDoc 





// Syntax data structures.
// There are two data structures used for syntax trees. At first, paren-groups are linked into doubly-linked lists, described below. These are then folded into immutable array-based specific
// nodes. At the end of folding there is only one child per paren-group.

//   Doubly-linked paren-group lists.
//   When the token stream is grouped into paren groups it has a hierarchical linked structure that conceptually has these pointers:

//   |                       +--------+
//                  +------  |  node  |  ------+
//                  |   +->  |        |  <--+  |
//           first  |   |    +--------+     |  |  last
//                  |   | parent     parent |  |
//                  V   |                   |  V
//               +--------+               +--------+
//               |  node  |   --- r -->   |  node  |  --- r ---/
//    /--- l --- |        |   <-- l ---   |        |
//               +--------+               +--------+

//   The primary operation performed on this tree, at least initially, is repeated folding. So we have a chain of linear nodes, and one by one certain nodes fold their siblings underneath them,
//   breaking the children's links and linking instead to the siblings' neighbors. For example, if we fold node (3) as a binary operator:

//   |     (1) <-> (2) <-> (3) <-> (4) <-> (5)             (1) <--> (3) <--> (5)
//         / \     / \     / \     / \     / \     -->     / \     /   \     / \
//                                                                /     \
//                                                              (2)     (4)        <- No link between children
//                                                              / \     / \           (see 'Fold nodes', below)

//   Fold nodes.
//   Once a node has been folded (e.g. (3) in the diagram above), none of its children will change and it will gain no more children. The fact that none of its children will change can be shown
//   inductively: suppose you've decided to fold the '+' in 'x + y' (here x and y are arbitrary expressions). This means that x and y are comprised of higher-precedence operators. Since there is
//   no second pass back to high-precedence operators, x and y will not change nor will they interact with one another. The fact that a folded node never gains more children arrives from the fact
//   that it is folded only once; this is by virtue of folding by index instead of by tree structure. (Though a good tree traversal algorithm also wouldn't hit the same node twice -- it's just
//   less obvious when the tree is changing.)

//   Anyway, the important thing about fold nodes is that their children don't change. This means that an array is a completely reasonable data structure to use for the children; it certainly
//   makes the structure simpler. It also means that the only new links that must be added to nodes as they are folded are links to new children (via the array), and links to the new siblings.
//   Once we have the array-form of fold nodes, we can build a query interface similar to jQuery, but designed for syntactic traversal. This will make routine operations such as macro
//   transformation and quasiquoting far simpler later on.

//   Both grouping and fold nodes are represented by the same data structure. In the case of grouping, the 'first' pointer is encoded as [0] -- that is, the first array element. It doesn't
//   contain pointers to siblings of [0]; these are still accessed by their 'l' and 'r' pointers. As the structure is folded, the number of children of each paren group should be reduced to just
//   one. At this point the remaining element's 'l' and 'r' pointers will both be null, which means that it is in hierarchical form instead of linked form.

//   After the tree has been fully generated and we have the root node, we have no further use for the parent pointers. This means that we can use subtree sharing to save memory. Once we're past
//   the fold stage, push() should be used instead of append(). append() works in a bidirectionally-linked tree context (much like the HTML DOM), whereas push() works like it does for arrays
//   (i.e. no parent pointer).

//   Syntax node functions.
//   These functions are common to various pieces of syntax nodes. Not all of them will always make sense, but the prototypes of the constructors can be modified independently later on if it
//   turns out to be an issue.

    var syntax_common = caterwaul_global.syntax_common = {

//     Mutability.
//     These functions let you modify nodes in-place. They're used during syntax folding and shouldn't really be used after that (hence the underscores).

      _replace:  function (n) {return (n.l = this.l) && (this.l.r = n), (n.r = this.r) && (this.r.l = n), this},  _append_to: function (n) {return n && n._append(this), this},
      _reparent: function (n) {return this.p && this.p[0] === this && (this.p[0] = n), this},  _fold_l: function (n) {return this._append(this.l && this.l._unlink(this) || empty)},
      _append:   function (n) {return (this[this.length++] = n) && (n.p = this), this},        _fold_r: function (n) {return this._append(this.r && this.r._unlink(this) || empty)},
      _sibling:  function (n) {return n.p = this.p, (this.r = n).l = this},                    _fold_lr: function () {return this._fold_l()._fold_r()},
                                                                                               _fold_rr: function () {return this._fold_r()._fold_r()},

      _wrap:     function (n) {return n.p = this._replace(n).p, this._reparent(n), delete this.l, delete this.r, this._append_to(n)},
      _unlink:   function (n) {return this.l && (this.l.r = this.r), this.r && (this.r.l = this.l), delete this.l, delete this.r, this._reparent(n)},

//     These methods are OK for use after the syntax folding stage is over (though because syntax nodes are shared it's generally dangerous to go modifying them):

      pop: function () {return --this.length, this},  push: function (x) {return this[this.length++] = x || empty, this},

//     Identification.
//     You can request that a syntax node identify itself, in which case it will give you an identifier if it hasn't already. The identity is not determined until the first time it is requested,
//     and after that it is stable. As of Caterwaul 0.7.0 the mechanism works differently (i.e. isn't borked) in that it replaces the prototype definition with an instance-specific closure the
//     first time it gets called. This may reduce the number of decisions in the case that the node's ID has already been computed.

      id: function () {var id = gensym(); return (this.id = function () {return id})()},

//     Traversal functions.
//     each() is the usual side-effecting shallow traversal that returns 'this'. map() distributes a function over a node's children and returns the array of results, also as usual. Two variants,
//     reach and rmap, perform the process recursively. reach is non-consing; it returns the original as a reference. rmap, on the other hand, follows some rules to cons a new tree. If the
//     function passed to rmap() returns the node verbatim then its children are traversed. If it returns a distinct node, however, then traversal doesn't descend into the children of the newly
//     returned tree but rather continues as if the original node had been a leaf. For example:

//     |           parent          Let's suppose that a function f() has these mappings:
//                /      \
//            node1      node2       f(parent) = parent   f(node1) = q
//            /   \        |                              f(node2) = node2
//          c1     c2      c3

//     In this example, f() would be called on parent, node1, node2, and c3 in that order. c1 and c2 are omitted because node1 was replaced by q -- and there is hardly any point in going through
//     the replaced node's previous children. (Nor is there much point in forcibly iterating over the new node's children, since presumably they are already processed.) If a mapping function
//     returns something falsy, it will have exactly the same effect as returning the node without modification.

//     Using the old s() to do gensym-safe replacement requires that you invoke it only once, and this means that for complex macroexpansion you'll have a long array of values. This isn't ideal,
//     so syntax trees provide a replace() function that handles replacement more gracefully:

//     | qs[(foo(_foo), _before_bar + bar(_bar))].replace({_foo: qs[x], _before_bar: qs[3 + 5], _bar: qs[foo.bar]})

      each:  function (f) {for (var i = 0, l = this.length; i < l; ++i) f(this[i], i); return this},
      map:   function (f) {for (var n = new this.constructor(this), i = 0, l = this.length; i < l; ++i) n.push(f(this[i], i) || this[i]); return n},

      reach: function (f) {f(this); this.each(function (n) {n.reach(f)}); return this},
      rmap:  function (f) {var r = f(this); return ! r || r === this ? this.map(function (n) {return n.rmap(f)}) : r.data === undefined ? new this.constructor(r) : r},

      clone: function () {return this.rmap(function () {return false})},

      collect: function (p)  {var ns = []; this.reach(function (n) {p(n) && ns.push(n)}); return ns},
      replace: function (rs) {return this.rmap(function (n) {if (! own.call(rs, n.data)) return n;
                                                             var replacement = rs[n.data];
                                                             return replacement && replacement.constructor === String ? new n.constructor(replacement, Array.prototype.slice.call(n)) :
                                                                                                                        replacement})},

//     Alteration.
//     These functions let you make "changes" to a node by returning a modified copy.

      repopulated_with: function (xs)   {return new this.constructor(this.data, xs)},
      change:           function (i, x) {return se(new this.constructor(this.data, Array.prototype.slice.call(this)), function (n) {n[i] = x})},
      compose_single:   function (i, f) {return this.change(i, f(this[i]))},

//     General-purpose traversal.
//     This is a SAX-style traversal model, useful for analytical or scope-oriented tree traversal. You specify a callback function that is invoked in pre-post-order on the tree (you get events
//     for entering and exiting each node, including leaves). Each time a node is entered, the callback is invoked with an object of the form {entering: node}, where 'node' is the syntax node
//     being entered. Each time a node is left, the callback is invoked with an object of the form {exiting: node}. The return value of the function is not used. Any null nodes are not traversed,
//     since they would fail any standard truthiness tests for 'entering' or 'exiting'.

//     I used to have a method to perform scope-annotated traversal, but I removed it for two reasons. First, I had no use for it (and no tests, so I had no reason to believe that it worked).
//     Second, Caterwaul is too low-level to need such a method. That would be more appropriate for an analysis extension.

      traverse: function (f) {f({entering: this}); f({exiting: this.each(function (n) {n.traverse(f)})}); return this},

//     Structural transformation.
//     Having nested syntax trees can be troublesome. For example, suppose you're writing a macro that needs a comma-separated list of terms. It's a lot of work to dig through the comma nodes,
//     each of which is binary. Javascript is better suited to using a single comma node with an arbitrary number of children. (This also helps with the syntax tree API -- we can use .map() and
//     .each() much more effectively.) Any binary operator can be transformed this way, and that is exactly what the flatten() method does. (flatten() returns a new tree; it doesn't modify the
//     original.)

//     The tree flattening operation looks like this for a left-associative binary operator:

//     |        (+)
//             /   \              (+)
//          (+)     z     ->     / | \
//         /   \                x  y  z
//        x     y

//     This flatten() method returns the nodes along the chain of associativity, always from left to right. It is shallow, since generally you only need a localized flat tree. That is, it doesn't
//     descend into the nodes beyond the one specified by the flatten() call. It takes an optional parameter indicating the operator to flatten over; if the operator in the tree differs, then the
//     original node is wrapped in a unary node of the specified operator. The transformation looks like this:

//     |                                  (,)
//            (+)                          |
//           /   \   .flatten(',')  ->    (+)
//          x     y                      /   \
//                                      x     y

//     Because ',' is a binary operator, a ',' tree with just one operand will be serialized exactly as its lone operand would be. This means that plurality over a binary operator such as comma
//     or semicolon degrades gracefully for the unary case (this sentence makes more sense in the context of macro definitions; see in particular 'let' and 'where' in std.bind).

//     The unflatten() method performs the inverse transformation. It doesn't delete a converted unary operator in the tree case, but if called on a node with more than two children it will nest
//     according to associativity.

      flatten:   function (d) {d = d || this.data; return d !== this.data ? this.as(d) : ! (has(parse_lr, d) && this.length) ? this : has(parse_associates_right, d) ?
                                                     se(new this.constructor(d), bind(function (n) {for (var i = this;     i && i.data === d; i = i[1]) n.push(i[0]); n.push(i)}, this)) :
                                                     se(new this.constructor(d), bind(function (n) {for (var i = this, ns = []; i.data === d; i = i[0]) i[1] && ns.push(i[1]); ns.push(i);
                                                                                                    for (i = ns.length - 1; i >= 0; --i) n.push(ns[i])}, this))},

      unflatten: function  () {var t = this, right = has(parse_associates_right, this.data); return this.length <= 2 ? this : se(new this.constructor(this.data), function (n) {
                                 if (right) for (var i = 0, l = t.length - 1; i  < l; ++i) n = n.push(t[i]).push(i < l - 2 ? new t.constructor(t.data) : t[i])[1];
                                 else       for (var i = t.length - 1;        i >= 1; --i) n = n.push(i > 1 ? new t.constructor(t.data) : t[0]).push(t[i])[0]})},

//     Wrapping.
//     Sometimes you want your syntax tree to have a particular operator, and if it doesn't have that operator you want to wrap it in a node that does. Perhaps the most common case of this is
//     when you have a possibly-plural node representing a variable or expression -- often the case when you're dealing with argument lists -- and you want to be able to assume that it's wrapped
//     in a comma node. Calling node.as(',') will return the node if it's a comma, and will return a new comma node containing the original one if it isn't.

      as: function (d) {return this.data === d ? this : new this.constructor(d).push(this)},

//     Type detection and retrieval.
//     These methods are used to detect the literal type of a node and to extract that value if it exists. You should use the as_x methods only once you know that the node does represent an x;
//     otherwise you will get misleading results. (For example, calling as_boolean on a non-boolean will always return false.)

//     Other methods are provided to tell you higher-level things about what this node does. For example, is_contextualized_invocation() tells you whether the node represents a call that can't be
//     eta-reduced (if it were, then the 'this' binding would be lost).

//     Wildcards are used for pattern matching and are identified by beginning with an underscore. This is a very frequently-called method, so I'm using a very inexpensive numeric check rather
//     than a string comparison. The ASCII value for underscore is 95.

               is_string: function () {return /['"]/.test(this.data.charAt(0))},           as_escaped_string: function () {return this.data.substr(1, this.data.length - 2)}, 
               is_number: function () {return /^-?(0x|\d|\.\d+)/.test(this.data)},                 as_number: function () {return Number(this.data)},
              is_boolean: function () {return this.data === 'true' || this.data === 'false'},     as_boolean: function () {return this.data === 'true'},
               is_regexp: function () {return /^\/./.test(this.data)},                     as_escaped_regexp: function () {return this.data.substring(1, this.data.lastIndexOf('/'))},

             is_wildcard: function () {return this.data.charCodeAt(0) === 95},

       has_grouped_block: function () {return has(parse_r_until_block, this.data)},                 is_block: function () {return has(parse_block, this.data)},
    is_blockless_keyword: function () {return has(parse_r_optional, this.data)},        is_null_or_undefined: function () {return this.data === 'null' || this.data === 'undefined'},

             is_constant: function () {return this.is_number() || this.is_string() || this.is_boolean() || this.is_regexp() || this.is_null_or_undefined()},
          left_is_lvalue: function () {return /=$/.test(this.data) || /\+\+$/.test(this.data) || /--$/.test(this.data)},
                is_empty: function () {return !this.length},                              has_parameter_list: function () {return this.data === 'function' || this.data === 'catch'},
         has_lvalue_list: function () {return this.data === 'var' || this.data === 'const'},  is_dereference: function () {return this.data === '.' || this.data === '[]'},
           is_invocation: function () {return this.data === '()'},              is_contextualized_invocation: function () {return this.is_invocation() && this[0].is_dereference()},

            is_invisible: function () {return has(parse_invisible, this.data)},           is_binary_operator: function () {return has(parse_lr, this.data)},
is_prefix_unary_operator: function () {return has(parse_r, this.data)},            is_postfix_unary_operator: function () {return has(parse_l,  this.data)},
       is_unary_operator: function () {return this.is_prefix_unary_operator() || this.is_postfix_unary_operator()},

                 accepts: function (e) {return has(parse_accepts, this.data) && parse_accepts[this.data] === (e.data || e)},

//     Value construction.
//     Syntax nodes sometimes represent hard references to values instead of just syntax. (See 'References' for more information.) In order to compile a syntax tree in the right environment you
//     need a mapping of symbols to these references, which is what the bindings() method returns. (It also collects references for all descendant nodes.) It takes an optional argument to
//     populate, in case you already had a hash set aside for bindings -- though it always returns the hash.

//     A bug in Caterwaul 0.5 and earlier failed to bind falsy values. This is no longer the case; nodes which bind values should indicate that they do so by setting a binds_a_value attribute
//     (ref nodes do this on the prototype), indicating that their value should be read from the 'value' property. (This allows other uses of a 'value' property while making it unambiguous
//     whether a particular node intends to bind something.)

      bindings: function (hash) {var result = hash || {}; this.reach(function (n) {if (n.binds_a_value) result[n.data] = n.value}); return result},

//     Matching.
//     Any syntax tree can act as a matching pattern to destructure another one. It's often much more fun to do things this way than it is to try to pick it apart by hand. For example, suppose
//     you wanted to determine whether a node represents a function that immediately returns, and to know what it returns. The simplest way to do it is like this:

//     | var tree = ...
//       var match = caterwaul.parse('function (_) {return _value}').match(tree);
//       if (match) {
//         var value = match._value;
//         ...
//       }

//     The second parameter 'variables' stores a running total of match data. You don't provide this; match() creates it for you on the toplevel invocation. The entire original tree is available
//     as a match variable called '_'; for example: t.match(u)._ === u if u matches t.

      match: function (target, variables) {target = caterwaul_global.ensure_syntax(target);
                                           variables || (variables = {_: target});
                                           if (this.is_wildcard())                                          return variables[this.data] = target, variables;
                                      else if (this.length === target.length && this.data === target.data) {for (var i = 0, l = this.length; i < l; ++i)
                                                                                                              if (! this[i].match(target[i], variables)) return null;
                                                                                                            return variables}},

//     Inspection and syntactic serialization.
//     Syntax nodes can be both inspected (producing a Lisp-like structural representation) and serialized (producing valid Javascript code). Each representation captures stray links via the 'r'
//     pointer. In the serialized representation, it is shown as a comment /* -> */ containing the serialization of whatever is to the right. This has the property that it will break tests but
//     won't necessarily break code (though if it happens in the field then it's certainly a bug).

//     Block detection is required for multi-level if/else statements. Consider this code:

//     | if (foo) for (...) {}
//       else bif;

//     A naive approach (the one I was using before version 0.6) would miss the fact that the 'for' was trailed by a block, and insert a spurious semicolon, which would break compilation:

//     | if (foo) for (...) {};    // <- note!
//       else bif;

//     What we do instead is dig through the tree and find out whether the last thing in the 'if' case ends with a block. If so, then no semicolon is inserted; otherwise we insert one. This
//     algorithm makes serialization technically O(n^2), but nobody nests if/else blocks to such an extent that it would matter.

      ends_with_block: function () {var block = this[parse_r_until_block[this.data]];
                                    return this.data === '{' || has(parse_r_until_block, this.data) && (this.data !== 'function' || this.length === 3) && block && block.ends_with_block()},

//     There's a hack here for single-statement if-else statements. (See 'Grab-until-block behavior' in the parsing code below.) Basically, for various reasons the syntax tree won't munch the
//     semicolon and connect it to the expression, so we insert one automatically whenever the second node in an if, else, while, etc. isn't a block.

//     Update for Caterwaul 0.6.6: I had removed mandatory spacing for unary prefix operators, but now it's back. The reason is to help out the host Javascript lexer, which can misinterpret
//     postfix increment/decrement: x + +y will be serialized as x++y, which is invalid Javascript. The fix is to introduce a space in front of the second plus: x+ +y, which is unambiguous.

//     Update for caterwaul 1.0: The serialize() method is now aggressively optimized for common cases. It also uses a flattened array-based concatenation strategy rather than the deeply nested
//     approach from before.

//     Optimized serialization cases.
//     We can tell a lot about how to serialize a node based on just a few properties. For example, if the node has zero length then its serialization is simply its data. This is the leaf case,
//     which is likely to be half of the total number of nodes in the whole syntax tree. If a node has length 1, then we assume a prefix operator unless we identify it as postfix. Otherwise we
//     break it down by the kind of operator that it is.

//     Nodes might be flattened, so we can't assume any upper bound on the arity regardless of what kind of operator it is. Realistically you shouldn't hand flattened nodes over to the compile()
//     function, but it isn't the end of the world if you do.

      toString:  function ()   {var xs = ['']; this.serialize(xs); return xs.join('')},
      serialize: function (xs) {var l = this.length, d = this.data, semi = ';\n',
                                 push = function (x) {if (lex_ident[xs[xs.length - 1].charCodeAt(0)] === lex_ident[x.charCodeAt(0)]) xs.push(' ', x);
                                                      else                                                                           xs.push(x)};

                                switch (l) {case 0: if (has(parse_r_optional, d)) return push(d.replace(/^u/, ''));
                                               else if (has(parse_group, d))      return push(d), push(parse_group[d]);
                                               else                               return push(d);

                                            case 1: if (has(parse_r, d) || has(parse_r_optional, d)) return push(d.replace(/^u/, '')), this[0].serialize(xs);
                                               else if (has(parse_group, d))                         return push(d), this[0].serialize(xs), push(parse_group[d]);
                                               else if (has(parse_lr, d))                            return push('/* unary ' + d + ' node */'), this[0].serialize(xs);
                                               else                                                  return this[0].serialize(xs), push(d);

                                            case 2: if (has(parse_invocation, d))    return this[0].serialize(xs), push(d.charAt(0)), this[1].serialize(xs), push(d.charAt(1));
                                               else if (has(parse_r_until_block, d)) return push(d), this[0].serialize(xs), this[1].serialize(xs);
                                               else if (has(parse_invisible, d))     return this[0].serialize(xs), this[1].serialize(xs);
                                               else if (d === ';')                   return this[0].serialize(xs), push(semi), this[1].serialize(xs);
                                               else                                  return this[0].serialize(xs), push(d), this[1].serialize(xs);

                                           default: if (has(parse_ternary, d))       return this[0].serialize(xs), push(d), this[1].serialize(xs), push(':'), this[2].serialize(xs);
                                               else if (has(parse_r_until_block, d)) return this.accepts(this[2]) && ! this[1].ends_with_block() ?
                                                                                       (push(d), this[0].serialize(xs), this[1].serialize(xs), push(semi), this[2].serialize(xs)) :
                                                                                       (push(d), this[0].serialize(xs), this[1].serialize(xs), this[2].serialize(xs));
                                               else                                  return this.unflatten().serialize(xs)}}};


//   References.
//   You can drop references into code that you're compiling. This is basically variable closure, but a bit more fun. For example:

//   | caterwaul.compile(qs[fn_[_ + 1]].replace({_: caterwaul.ref(3)}))()    // -> 4

//   What actually happens is that caterwaul.compile runs through the code replacing refs with gensyms, and the function is evaluated in a scope where those gensyms are bound to the values they
//   represent. This gives you the ability to use a ref even as an lvalue, since it's really just a variable. References are always leaves on the syntax tree, so the prototype has a length of 0.

    caterwaul_global.ref = function (value) {if (value instanceof this.constructor) this.value = value.value, this.data = value.data;
                                             else                                   this.value = value,       this.data = gensym()};

    merge(caterwaul_global.ref.prototype, syntax_common, {binds_a_value: true, length: 0});

//   Syntax node constructor.
//   Here's where we combine all of the pieces above into a single function with a large prototype. Note that the 'data' property is converted from a variety of types; so far we support strings,
//   numbers, and booleans. Any of these can be added as children. Also, I'm using an instanceof check rather than (.constructor ===) to allow array subclasses such as Caterwaul finite sequences
//   to be used.

    caterwaul_global.syntax = function (data) {if (data instanceof this.constructor) this.data = data.data, this.length = 0;
                                               else {this.data = data && data.toString(); this.length = 0;
                                                 for (var i = 1, l = arguments.length, _; _ = arguments[i], i < l; ++i)
                                                   for (var j = 0, lj = _.length, it, c; _ instanceof Array ? (it = _[j], j < lj) : (it = _, ! j); ++j)
                                                     this._append((c = it.constructor) === String || c === Number || c === Boolean ? new this.constructor(it) : it)}};

    merge(caterwaul_global.syntax.prototype, syntax_common);

    var empty = caterwaul_global.empty = new caterwaul_global.syntax('');
// Generated by SDoc 





// Parsing.
// There are two distinct parts to parsing Javascript. One is parsing the irregular statement-mode expressions such as 'if (condition) {...}' and 'function f(x) {...}'; the other is parsing
// expression-mode stuff like arithmetic operators. In Rebase I tried to model everything as an expression, but that failed sometimes because it required that each operator have fixed arity. In
// particular this was infeasible for keywords such as 'break', 'continue', 'return', and some others (any of these can be nullary or unary). It also involved creating a bizarre hack for 'case
// x:' inside a switch block. This hack made the expression passed in to 'case' unavailable, as it would be buried in a ':' node.

// Caterwaul fixes these problems by using a proper context-free grammar. However, it's much looser than most grammars because it doesn't need to validate anything. Correspondingly, it can be
// much faster as well. Instead of guessing and backtracking as a recursive-descent parser would, it classifies many different branches into the same basic structure and fills in the blanks. One
// example of this is the () {} pair, which occurs in a bunch of different constructs, including function () {}, if () {}, for () {}, etc. In fact, any time a () group is followed by a {} group
// we can grab the token that precedes () (along with perhaps one more in the case of function f () {}), and group that under whichever keyword is responsible.

//   Syntax folding.
//   The first thing to happen is that parenthetical, square bracket, and braced groups are folded up. This happens in a single pass that is linear in the number of tokens, and other foldable
//   tokens (including unary and binary operators) are indexed by associativity. The following pass runs through these indexes from high to low precedence and folds tokens into trees. By this
//   point all of the parentheticals have been replaced by proper nodes (here I include ?: groups in parentheticals, since they behave the same way). Finally, high-level rules are applied to the
//   remaining keywords, which are bound last. This forms a complete parse tree.

//   Doing all of this efficiently requires a linked list rather than an array. This gets built during the initial paren grouping stage. Arrays are used for the indexes, which are left-to-right
//   and are later processed in the order indicated by the operator associativity. That is, left-associative operators are processed 0 .. n and right associative are processed n .. 0. Keywords
//   are categorized by behavior and folded after all of the other operators. Semicolons are folded last, from left to right.

//   There are some corner cases due to Javascript's questionable heritage from C-style syntax. For example, most constructs take either syntax blocks or semicolon-delimited statements. Ideally,
//   else, while, and catch are associated with their containing if, do, and try blocks, respectively. This can be done easily, as the syntax is folded right-to-left. Another corner case would
//   come up if there were any binary operators with equal precedence and different associativity. Javascript doesn't have them however, and it wouldn't make much sense to; it would render
//   expressions such as 'a op1 b op2 c' ambiguous if op1 and op2 shared precedence but each wanted to bind first. (I mention this because at first I was worried about it, but now I realize it
//   isn't an issue.)

//   Notationally (for easier processing later on), a distinction is made between invocation and grouping, and between dereferencing and array literals. Dereferencing and function invocation are
//   placed into their own operators, where the left-hand side is the thing being invoked or dereferenced and the right-hand side is the paren-group or bracket-group that is responsible for the
//   operation. Also, commas inside these groups are flattened into a single variadic (possibly nullary) comma node so that you don't have to worry about the tree structure. This is the case for
//   all left-associative operators; right-associative operators preserve their hierarchical folding.

//   Parse/lex shared logic.
//   Lexing Javascript is not entirely straightforward, primarily because of regular expression literals. The first implementation of the lexer got things right 99% of the time by inferring the
//   role of a / by its preceding token. The problem comes in when you have a case like this:

//   | if (condition) /foo/.test(x)

//   In this case, (condition) will be incorrectly inferred to be a regular expression (since the close-paren terminates an expression, usually), and /foo/ will be interpreted as division by foo. 

//   We mark the position before a token and then just increment the position. The token, then, can be retrieved by taking a substring from the mark to the position. This eliminates the need for
//   intermediate concatenations. In a couple of cases I've gone ahead and done them anyway -- these are for operators, where we grab the longest contiguous substring that is defined. I'm not too
//   worried about the O(n^2) complexity due to concatenation; they're bounded by four characters.

//   OK, so why use charAt() instead of regular expressions? It's a matter of asymptotic performance. V8 implements great regular expressions (O(1) in the match length for the (.*)$ pattern), but
//   the substring() method is O(n) in the number of characters returned. Firefox implements O(1) substring() but O(n) regular expression matching. Since there are O(n) tokens per document of n
//   characters, any O(n) step makes lexing quadratic. So I have to use the only reliably constant-time method provided by strings, charAt() (or in this case, charCodeAt()).

//   Of course, building strings via concatenation is also O(n^2), so I also avoid that for any strings that could be long. This is achieved by using a mark to indicate where the substring
//   begins, and advancing i independently. The span between mark and i is the substring that will be selected, and since each substring both requires O(n) time and consumes n characters, the
//   lexer as a whole is O(n). (Though perhaps with a large constant.)

//   Parse function.
//   As mentioned earlier, the parser and lexer aren't distinct. The lexer does most of the heavy lifting; it matches parens and brackets, arranges tokens into a hierarchical linked list, and
//   provides an index of those tokens by their fold order. It does all of this by streaming tokens into a micro-parser whose language is grouping and that knows about the oddities required to
//   handle regular expression cases. In the same function, though as a distinct case, the operators are folded and the syntax is compiled into a coherent tree form.

//   The input to the parse function can be anything whose toString() produces valid Javascript code.

    caterwaul_global.parse = function (input) {

//     Lex variables.
//     s, obviously, is the string being lexed. mark indicates the position of the stream, while i is used for lookahead. The difference is later read into a token and pushed onto the result. c
//     is a temporary value used to store the current character code. re is true iff a slash would begin a regular expression. esc is a flag indicating whether the next character in a string or
//     regular expression literal is escaped. exp indicates whether we've seen the exponent marker in a number. close is used for parsing single and double quoted strings; it contains the
//     character code of the closing quotation mark. t is the token to be processed.

//     Parse variables.
//     grouping_stack and gs_top are used for paren/brace/etc. matching. head and parent mark two locations in the linked syntax tree; when a new group is created, parent points to the opener
//     (i.e. (, [, ?, or {), while head points to the most recently added child. (Hence the somewhat complex logic in push().) indexes[] determines reduction order, and contains references to the
//     nodes in the order in which they should be folded. invocation_nodes is an index of the nodes that will later need to be flattened.

//     The push() function manages the mechanics of adding a node to the initial linked structure. There are a few cases here; one is when we've just created a paren group and have no 'head'
//     node; in this case we append the node as 'head'. Another case is when 'head' exists; in that case we update head to be the new node, which gets added as a sibling of the old head.

        var s = input.toString(), mark = 0, c = 0, re = true, esc = false, dot = false, exp = false, close = 0, t = '', i = 0, l = s.length, cs = function (i) {return s.charCodeAt(i)},
            grouping_stack = [], gs_top = null, head = null, parent = null, indexes = map(function () {return []}, parse_reduce_order), invocation_nodes = [], all_nodes = [empty],
            new_node = function (n) {return all_nodes.push(n), n}, push = function (n) {return head ? head._sibling(head = n) : (head = n._append_to(parent)), new_node(n)},
            syntax_node = this.syntax;

//     Main lex loop.
//     This loop takes care of reading all of the tokens in the input stream. At the end, we'll have a linked node structure with paren groups. At the beginning, we set the mark to the current
//     position (we'll be incrementing i as we read characters), munch whitespace, and reset flags.

        while ((mark = i) < l) {
          while (lex_space[c = cs(i)] && i < l) mark = ++i;
          esc = exp = dot = t = false;

//       Miscellaneous lexing.
//       This includes bracket resetting (the top case, where an open-bracket of any sort triggers regexp mode) and comment removal. Both line and block comments are removed by comparing against
//       lex_slash, which represents /, and lex_star, which represents *.

            if                                        (lex_bracket[c])                                                                    {t = !! ++i; re = lex_opener[c]}
       else if (c === lex_slash && cs(i + 1) === lex_star && (i += 2)) {while (++i < l && cs(i) !== lex_slash || cs(i - 1) !== lex_star);  t = !  ++i}
       else if            (c === lex_slash && cs(i + 1) === lex_slash) {while                              (++i < l && ! lex_eol[cs(i)]);  t = false}

//       Regexp and string literal lexing.
//       These both take more or less the same form. The idea is that we have an opening delimiter, which can be ", ', or /; and we look for a closing delimiter that follows. It is syntactically
//       illegal for a string to occur anywhere that a slash would indicate division (and it is also illegal to follow a string literal with extra characters), so reusing the regular expression
//       logic for strings is not a problem. (This follows because we know ahead of time that the Javascript is valid.)

       else if (lex_quote[c] && (close = c) && re && ! (re = ! (t = s.charAt(i)))) {while (++i < l && (c = cs(i)) !== close || esc)  esc = ! esc && c === lex_back;
                                                                                    while     (++i < l && lex_regexp_suffix[cs(i)])                               ; t = true}

//       Numeric literal lexing.
//       This is far more complex than the above cases. Numbers have several different formats, each of which requires some custom logic. The reason we need to parse numbers so exactly is that it
//       influences how the rest of the stream is lexed. One example is '0.5.toString()', which is perfectly valid Javascript. What must be output here, though, is '0.5', '.', 'toString', '(',
//       ')'; so we have to keep track of the fact that we've seen one dot and stop lexing the number on the second.

//       Another case is exponent-notation: 3.0e10. The hard part here is that it's legal to put a + or - on the exponent, which normally terminates a number. Luckily we can safely skip over any
//       character that comes directly after an E or e (so long as we're really in exponent mode, which I'll get to momentarily), since there must be at least one digit after an exponent.

//       The final case, which restricts the logic somewhat, is hexadecimal numbers. These also contain the characters 'e' and 'E', but we cannot safely skip over the following character, and any
//       decimal point terminates the number (since '0x5.toString()' is also valid Javascript). The same follows for octal numbers; the leading zero indicates that there will be no decimal point,
//       which changes the lex mode (for example, '0644.toString()' is valid).

//       So, all this said, there are different logic branches here. One handles guaranteed integer cases such as hex/octal, and the other handles regular numbers. The first branch is triggered
//       whenever a number starts with zero and is followed by 'x' or a digit (for conciseness I call 'x' a digit), and the second case is triggered when '.' is followed by a digit, or when a
//       digit starts.

//       A trivial change, using regular expressions, would reduce this logic significantly. I chose to write it out longhand because (1) it's more fun that way, and (2) the regular expression
//       approach has theoretically quadratic time in the length of the numbers, whereas this approach keeps things linear. Whether or not that actually makes a difference I have no idea.

//       Finally, in response to a recently discovered failure case, a period must be followed by a digit if it starts a number. The failure is the string '.end', which will be lexed as '.en',
//       'd' if it is assumed to be a floating-point number. (In fact, any method or property beginning with 'e' will cause this problem.)

       else if                  (c === lex_zero && lex_integer[cs(i + 1)]) {while (++i < l && lex_integer[cs(i)]); re = ! (t = true)}
       else if (lex_float[c] && (c !== lex_dot || lex_decimal[cs(i + 1)])) {while (++i < l && (lex_decimal[c = cs(i)] || (dot ^ (dot |= c === lex_dot)) || (exp ^ (exp |= lex_exp[c] && ++i))));
                                                                            while (i < l && lex_decimal[cs(i)]) ++i; re = ! (t = true)}

//       Operator lexing.
//       The 're' flag is reused here. Some operators have both unary and binary modes, and as a heuristic (which happens to be accurate) we can assume that anytime we expect a regular
//       expression, a unary operator is intended. The only exception are ++ and --, which are always unary but sometimes are prefix and other times are postfix. If re is true, then the prefix
//       form is intended; otherwise, it is postfix. For this reason I've listed both '++' and 'u++' (same for --) in the operator tables; the lexer is actually doing more than its job here by
//       identifying the variants of these operators.

//       The only exception to the regular logic happens if the operator is postfix-unary. (e.g. ++, --.) If so, then the re flag must remain false, since expressions like 'x++ / 4' can be valid.

       else if (lex_punct[c] && (t = re ? 'u' : '', re = true)) {while (i < l && lex_punct[cs(i)] && has(lex_op, t + s.charAt(i)))  t += s.charAt(i++); re = ! has(lex_postfix_unary, t)}

//       Identifier lexing.
//       If nothing else matches, then the token is lexed as a regular identifier or Javascript keyword. The 're' flag is set depending on whether the keyword expects a value. The nuance here is
//       that you could write 'x / 5', and it is obvious that the / means division. But if you wrote 'return / 5', the / would be a regexp delimiter because return is an operator, not a value. So
//       at the very end, in addition to assigning t, we also set the re flag if the word turns out to be an operator.

       else {while (++i < l && lex_ident[cs(i)]); re = has(lex_op, t = s.substring(mark, i))}

//       Token unification.
//       t will contain true, false, or a string. If false, no token was lexed; this happens when we read a comment, for example. If true, the substring method should be used. (It's a shorthand to
//       avoid duplicated logic.) For reasons that are not entirely intuitive, the lexer sometimes produces the artifact 'u;'. This is never useful, so I have a case dedicated to removing it.

        if (i === mark) throw new Error('Caterwaul lex error at "' + s.substr(mark, 40) + '" with leading context "' + s.substr(mark - 40, 40) + '" (probably a Caterwaul bug)');
        if (t === false) continue;
        t = t === true ? s.substring(mark, i) : t === 'u;' ? ';' : t;

//       Grouping and operator indexing.
//       Now that we have a token, we need to see whether it affects grouping status. There are a couple of possibilities. If it's an opener, then we create a new group; if it's a matching closer
//       then we close the current group and pop out one layer. (We don't check for matching here. Any code provided to Caterwaul will already have been parsed by the host Javascript interpreter,
//       so we know that it is valid.)

//       All operator indexing is done uniformly, left-to-right. Note that the indexing isn't strictly by operator. It's by reduction order, which is arguably more important. That's what the
//       parse_inverse_order table does: it maps operator names to parse_reduce_order subscripts. (e.g. 'new' -> 2.)

        t === gs_top ? (grouping_stack.pop(), gs_top = grouping_stack[grouping_stack.length - 1], head = head ? head.p : parent, parent = null) :
                       (has(parse_group, t) ? (grouping_stack.push(gs_top = parse_group[t]), parent = push(new_node(new syntax_node(t))), head = null) : push(new_node(new syntax_node(t))),
                        has(parse_inverse_order, t) && indexes[parse_inverse_order[t]].push(head || parent));           // <- This is where the indexing happens

//       Regexp flag special cases.
//       Normally a () group wraps an expression, so a following / would indicate division. The only exception to this is when we have a block construct; in this case, the next token appears in
//       statement-mode, which means that it begins, not modifies, a value. We'll know that we have such a case if (1) the immediately-preceding token is a close-paren, and (2) a block-accepting
//       syntactic form occurs to its left.

//       With all this trouble over regular expressions, I had to wonder whether it was possible to do it more cleanly. I don't think it is, unfortunately. Even lexing the stream backwards fails
//       to resolve the ambiguity:

//       | for (var k in foo) /foo/g.test(k) && bar();

//       In this case we won't know it's a regexp until we hit the 'for' keyword (or perhaps 'var', if we're being clever -- but a 'with' or 'if' would require complete lookahead). A perfectly
//       valid alternative parse, minus the 'for' and 'var', is this:

//       | ((k in foo) / (foo) / (g.test(k))) && bar();

//       The only case where reverse-lexing is useful is when the regexp has no modifiers.

        re |= t === ')' && head.l && has(parse_r_until_block, head.l.data)}

//     Operator fold loop.
//     This is the second major part of the parser. Now that we've completed the lex process, we can fold operators and syntax, and take care of some exception cases.

//     First step: functions, calls, dots, and dereferences.
//     I'm treating this differently from the generalized operator folding because of the syntactic inference required for call and dereference detection. Nothing has been folded at this point
//     (with the exception of paren groups, which is appropriate), so if the node to the left of any ( or [ group is an operator, then the ( or [ is really a paren group or array literal. If, on
//     the other hand, it is another value, then the group is a function call or a dereference. This folding goes left-to-right. The reason we also process dot operators is that they share the same
//     precedence as calls and dereferences. Here's what a () or [] transform looks like:

//     |   quux <--> foo <--> ( <--> bar                              quux <--> () <--> bar
//                             \                                               /  \                  <-- This can be done by saying _.l.wrap(new node('()')).p.fold_r().
//                              bif <--> , <--> baz       -->               foo    (                     _.l.wrap() returns l again, .p gets the wrapping node, and fold_r adds a child to it.
//                                                                                  \
//                                                                                   bif <--> , <--> baz

//     This is actually merged into the for loop below, even though it happens before other steps do (see 'Ambiguous parse groups').

//     Second step: fold operators.
//     Now we can go through the list of operators, folding each according to precedence and associativity. Highest to lowest precedence here, which is just going forwards through the indexes[]
//     array. The parse_index_forward[] array indicates which indexes should be run left-to-right and which should go right-to-left.

        for (var i = 0, l = indexes.length, forward, _; _ = indexes[i], forward = parse_index_forward[i], i < l; ++i)
          for (var j = forward ? 0 : _.length - 1, lj = _.length, inc = forward ? 1 : -1, node, data; node = _[j], data = node && node.data, forward ? j < lj : j >= 0; j += inc)

//       Binary node behavior.
//       The most common behavior is binary binding. This is the usual case for operators such as '+' or ',' -- they grab one or both of their immediate siblings regardless of what they are.
//       Operators in this class are considered to be 'fold_lr'; that is, they fold first their left sibling, then their right.

            if (has(parse_lr, data))  node._fold_lr();

//       Ambiguous parse groups.
//       As mentioned above, we need to determine whether grouping constructs are invocations or real groups. This happens to take place before other operators are parsed (which is good -- that way
//       it reflects the precedence of dereferencing and invocation). The only change we need to make is to discard the explicit parenthetical or square-bracket grouping for invocations or
//       dereferences, respectively. It doesn't make much sense to have a doubly-nested structure, where we have a node for invocation and another for the group on the right-hand side of that
//       invocation. Better is to modify the group in-place to represent an invocation.

//       We can't solve this problem here, but we can solve it after the parse has finished. I'm pushing these invocation nodes onto an index for the end.

       else if (has(parse_ambiguous_group, data) && node.l && (node.l.data === '.' ||
                     ! (has(lex_op, node.l.data) || has(parse_not_a_value, node.l.data))))  invocation_nodes.push(node.l._wrap(new_node(new syntax_node(data + parse_group[data]))).p._fold_r());

//       Unary left and right-fold behavior.
//       Unary nodes have different fold directions. In this case, it just determines which side we grab the node from. I'm glad that Javascript doesn't allow stuff like '++x++', which would make
//       the logic here actually matter. Because there isn't that pathological case, exact rigidity isn't required.

       else if (has(parse_l, data))  node._fold_l();
       else if (has(parse_r, data))  node._fold_r();

//       Ternary operator behavior.
//       This is kind of interesting. If we have a ternary operator, then it will be treated first as a group; just like parentheses, for example. This is the case because the ternary syntax is
//       unambiguous for things in the middle. So, for example, '3 ? 4 : 5' initially parses out as a '?' node whose child is '4'. Its siblings are '3' and '5', so folding left and right is an
//       obvious requirement. The only problem is that the children will be in the wrong order. Instead of (3) (4) (5), we'll have (4) (3) (5). So after folding, we do a quick swap of the first two
//       to set the ordering straight.

       else if (has(parse_ternary, data))  {node._fold_lr(); var temp = node[1]; node[1] = node[0]; node[0] = temp}

//       Grab-until-block behavior.
//       Not quite as simple as it sounds. This is used for constructs such as 'if', 'function', etc. Each of these constructs takes the form '<construct> [identifier] () {}', but they can also
//       have variants that include '<construct> () {}', '<construct> () statement;', and most problematically '<construct> () ;'. Some of these constructs also have optional child components; for
//       example, 'if () {} else {}' should be represented by an 'if' whose children are '()', '{}', and 'else' (whose child is '{}'). The tricky part is that 'if' doesn't accept another 'if' as a
//       child (e.g. 'if () {} if () {}'), nor does it accept 'for' or any number of other things. This discrimination is encoded in the parse_accepts table.

//       There are some weird edge cases, as always. The most notable is what happens when we have nesting without blocks:

//       | if (foo) bar; else bif;

//       In this case we want to preserve the semicolon on the 'then' block -- that is, 'bar;' should be its child; so the semicolon is required. But the 'bif' in the 'else' case shouldn't have a
//       semicolon, since that separates top-level statements. Because desperate situations call for desperate measures, there's a hack specifically for this in the syntax tree serialization.

//       One more thing. Firefox rewrites syntax trees, and one of the optimizations it performs on object literals is removing quotation marks from regular words. This means that it will take the
//       object {'if': 4, 'for': 1, etc.} and render it as {if: 4, for: 1, etc.}. As you can imagine, this becomes a big problem as soon as the word 'function' is present in an object literal. To
//       prevent this from causing problems, I only collapse a node if it is not followed by a colon. (And the only case where any of these would legally be followed by a colon is as an object
//       key.)

       else if (has(parse_r_until_block, data) && node.r && node.r.data !== ':')
                                                 {for (var count = 0, limit = parse_r_until_block[data]; count < limit && node.r && ! has(parse_block, node.r.data); ++count) node._fold_r();
                                                  node.r && node.r.data !== ';' && node._fold_r();
                                                  if (has(parse_accepts, data) && parse_accepts[data] === (node.r && node.r.r && node.r.r.data)) node._fold_r().pop()._fold_r();
                                             else if (has(parse_accepts, data) && parse_accepts[data] === (node.r && node.r.data))               node._fold_r()}

//       Optional right-fold behavior.
//       The return, throw, break, and continue keywords can each optionally take an expression. If the token to the right is an expression, then we take it, but if the token to the right is a
//       semicolon then the keyword should be nullary.

       else if (has(parse_r_optional, data))  node.r && node.r.data !== ';' && node._fold_r();

//     Third step.
//     Find all elements with right-pointers and wrap them with semicolon nodes. This is necessary because of certain constructs at the statement-level don't use semicolons; they use brace syntax
//     instead. (e.g. 'if (foo) {bar} baz()' is valid, even though no semicolon precedes 'baz()'.) By this point everything else will already be folded. Note that this does some weird things to
//     associativity; in general, you can't make assumptions about the exact layout of semicolon nodes. Fortunately semicolon is associative, so it doesn't matter in practice. And just in case,
//     these nodes are 'i;' rather than ';', meaning 'inferred semicolon' -- that way it's clear that they aren't original. (They also won't appear when you call toString() on the syntax tree.)

        for (var i = all_nodes.length - 1, _; i >= 0; --i)  (_ = all_nodes[i]).r && _._wrap(new_node(new syntax_node('i;'))).p._fold_r();

//     Fourth step.
//     Flatten out all of the invocation nodes. As explained earlier, they are nested such that the useful data on the right is two levels down. We need to grab the grouping construct on the
//     right-hand side and remove it so that only the invocation or dereference node exists. During the parse phase we built an index of all of these invocation nodes, so we can iterate through
//     just those now. I'm preserving the 'p' pointers, though they're probably not useful beyond here.

        for (var i = 0, l = invocation_nodes.length, _, child; i < l; ++i)  (child = (_ = invocation_nodes[i])[1] = _[1][0] || empty) && (child.p = _);

        while (head.p) head = head.p;

//     Fifth step.
//     Prevent a space leak by clearing out all of the 'p', 'l', and 'r' pointers.

        for (var i = all_nodes.length - 1, _; i >= 0; --i)  delete (_ = all_nodes[i]).p, delete _.l, delete _.r;
        return head};
// Generated by SDoc 





// Environment-dependent compilation.
// It's possible to bind variables from 'here' (i.e. this runtime environment) inside a compiled function. The way we do it is to create a closure using a gensym. (Another reason that gensyms
// must really be unique.) Here's the idea. We use the Function constructor to create an outer function, bind a bunch of variables directly within that scope, and return the function we're
// compiling. The variables correspond to gensyms placed in the code, so the code will have closure over those variables.

// An optional second parameter 'environment' can contain a hash of variable->value bindings. These will be defined as locals within the compiled function.

// New in caterwaul 0.6.5 is the ability to specify a 'this' binding to set the context of the expression being evaluated.

  caterwaul_global.compile = function (tree, environment) {
    var vars = [], values = [], bindings = merge({}, this._environment || {}, environment || {}, tree.bindings()), s = gensym();
    for (var k in bindings) if (own.call(bindings, k)) vars.push(k), values.push(bindings[k]);

    var variable_definitions = map(function (v) {return v === 'this' ? '' : 'var ' + v + '=' + s + '.' + v}, vars).join(';'),
        function_body        = 'return(' + tree.toString() + ')';

    try       {return (new Function(s, variable_definitions + ';' + function_body)).call(bindings['this'], bindings)}
    catch (e) {throw new Error(e + ' while compiling ' + code)}};
// Generated by SDoc 






// Macroexpansion.
// Caterwaul's main purpose is to transform your code, and the easiest way to transform things is through macroexpansion. The idea is to locate syntax nodes with a given pattern and rewrite them
// somehow. For example, suppose we wanted to define a macro to enable the postfix /log modifier. Here's how it might look:

// | x /log   ->   (function (it) {console.log(it); return it})(x)

// The macro needs to first identify things of the form '_something /log' and transform them accordingly. Here's a macro to do that:

// | var m = caterwaul.macro('_something /log', '(function (it) {console.log(it); return it})(_something)');

//   Building macros.
//   Caterwaul gives you several ways to build macros. The simplest is to use caterwaul.macro() as shown above. It will parse each string, using the first as a pattern and the second as a
//   template. It then fills in the values on the right from the ones on the left and re-expands the result. In place of each string, caterwaul.macro() can take either a syntax tree or a
//   function. The function on the left should take a syntax tree, try to match the pattern against it, and return either a match object or false. The function on the right should take a match
//   object and return a new syntax tree. (It won't be invoked if the left function returned false.)

//   Macro function internals.
//   Caterwaul's macros are just functions from syntax to syntax. They return false if they don't match a particular node. So, for example, the macro '_x * 2' -> '_x << 1' would return 'a << 1'
//   on 'a * 2', but would return false on 'a * 3'. The macroexpander knows to descend into child nodes when a macroexpander returns false. If a macroexpander returns a value then that value is
//   taken and no further expansion is performed. (This is necessary if we want to implement literal macros -- that is, literal(x) -> x and x isn't macroexpanded further.)

//   If a macro wants to re-expand stuff it should use 'this.expand', which invokes the macroexpander on a tree. Most of the time macros will do this, and it's done automatically by
//   caterwaul.macro() when you use a string or a syntax tree as the expansion. You'll have to call this.expand() if you're using a function as an expander.

    caterwaul_global.ensure_syntax   = function (thing)    {return thing && thing.constructor === String ? this.parse(thing) : thing};

    caterwaul_global.ensure_pattern  = function (pattern)  {return pattern.constructor  === String      ? this.ensure_pattern(this.parse(pattern)) :
                                                                   pattern.constructor  === this.syntax ? function (tree) {return pattern.match(tree)} : pattern};

    caterwaul_global.ensure_expander = function (expander) {return expander.constructor === String      ? this.ensure_expander(this.parse(expander)) :
                                                                   expander.constructor === this.syntax ? function (match) {return this.expand(expander.replace(match))} : expander};

    caterwaul_global.macro = caterwaul_global.right_variadic(function (pattern, expander) {pattern = this.ensure_pattern(pattern), expander = this.ensure_expander(expander);
                                                               return function (tree) {var match = pattern.call(this, tree); return match && expander.call(this, match)}});

//   Macroexpander logic.
//   This behaves just like the pre-1.0 macroexpander, except that the patterns and expanders are now fused. The macro functions are also evaluated under a different context; rather than being
//   bound to the caterwaul function they came from, they are bound to a context object that gives them a way to re-expand stuff under the same set of macros. It also provides the caterwaul
//   function that is performing the expansion. (Though you shouldn't modify the macro list from inside a macro -- this pre-1.0 feature is now removed.)

//   Just like previous versions of caterwaul the macros are matched last-to-first. This means that the /last/ matching macro is used, allowing you to easily override stuff. Also, the
//   macroexpand() function takes optional extra parameters; these are either macros or arrays of macros to be added to the macro list stored on the caterwaul function.

    caterwaul_global.macroexpand = function (tree) {for (var macros = arguments.length ? [].concat(this._macros || []) : this._macros || [], i = 1, l = arguments.length, x; i < l; ++i)
                                                      (x = arguments[i]) instanceof Array ? macros.push.apply(macros, x) : macros.push(x);

                                                    var context = {caterwaul: this, macros: macros, expand: function (tree) {
                                                      return tree.rmap(function (node) {
                                                        for (var new_node = null, i = macros.length - 1; i >= 0; --i) if (new_node = macros[i].call(context, node)) return new_node})}};

                                                    return context.expand(this.ensure_syntax(tree))};
// Generated by SDoc 






// Precompilation support.
// This makes caterwaul precompilation-aware ahead of time. I'm doing this so that you can precompile caterwaul itself, which used to be responsible for a fair amount of loading time.

  var precompiled_internal_table = {};
  caterwaul_global.precompiled_internal = function (f) {var k = gensym(); return precompiled_internal_table[k] = f, k};
  caterwaul_global.is_precompiled       = function (f) {return f.constructor === String && precompiled_internal_table[f]};
// Generated by SDoc 





// Init method.
// This runs a compilation stage. If the input is a function or string, then the function or string is parsed, run through the macroexpander, and compiled.

  caterwaul_global.clone = function (f) {return se(this.merge(calls_init(), this, this.instance_methods(), {constructor: this}), function () {
                                                  delete this._id, delete this._macros, delete this._environment})};

//   Compiler instance methods/attributes.
//   These are installed on each generated compiler function. You can change some of them if you know what you're doing (for instance, you can create a compiler for a different programming
//   language by changing the 'parse' function to handle different input). Unlike caterwaul < 1.0 there is no support for cloning a compiler function. However, you can compose things nicely by
//   doing stuff like this:

//   | var my_caterwaul    = caterwaul(function (code) {...});
//     var other_caterwaul = caterwaul(my_caterwaul);
//     other_caterwaul.parse = function (x) {...};

//   In this example, other_caterwaul delegates its macroexpansion to my_caterwaul, but it uses a custom parse function.

    caterwaul_global.instance_methods = function () {
      return {compile:              this.compile,
              parse:                this.parse,
              macroexpand:          this.macroexpand,
              syntax:               this.syntax,
              ref:                  this.ref,
              id:                   this.syntax_common.id,

              init_function:        this.init_function || this.macroexpand,
              instance_methods:     this.instance_methods,

              ensure_syntax:        this.ensure_syntax,
              ensure_pattern:       this.ensure_pattern,
              ensure_expander:      this.ensure_expander,

              environment:          function (e) {return arguments.length ? (this._environment = e, this)                              : this._environment},
              macros:               function ()  {return arguments.length ? (this._macros = this.flatten.apply(this, arguments), this) : this._macros},

              toString:             function () {return '[caterwaul instance ' + this.id() + ']'},

              init:                 function (f, environment) {return this.is_precompiled(f) || this.init_not_precompiled(f, environment)},
              init_not_precompiled: function (f, environment) {return f.constructor === this.syntax ? this.init_function(f) : this.constructor.compile(this(this.parse(f)))}}};
// Generated by SDoc 




  return caterwaul = caterwaul_global = caterwaul_global.clone()});
// Generated by SDoc 



caterwaul.version('f1e4d2b4486f66342e1335e5a3989d83');
// Generated by SDoc 

// Caterwaul standard library | Spencer Tipping
// Licensed under the terms of the MIT source code license

// Internal libraries.
// These operate on caterwaul in some way, but don't necessarily have an effect on generated code.



// Symbol anonymization | Spencer Tipping
// Licensed under the terms of the MIT source code license

// Introduction.
// A recurring pattern in previous versions of caterwaul was to clone the global caterwaul function and set it up as a DSL processor by defining a macro that manually dictated tree traversal
// semantics. This was often difficult to implement because any context had to be encoded bottom-up and in terms of searching rather than top-down inference. This library tries to solve the
// problem by implementing a grammar-like structure for tree traversal.

//   Use cases.
//   One fairly obvious use case is code tracing. When we trace some code, we need to keep track of whether it should be interpreted in sequence or expression context. Although there are only two
//   states here, it still is too complex for a single-layer macroexpander to handle gracefully; so we create two separate caterwaul functions that delegate control to one another. We then create
//   a set of annotations to indicate which state or states should be chosen next. For example, here are some expansions from the tracing behavior:

//   | E[_x = _y]  ->  H[_x = E[_y]]
//     S[_x = _y]  ->  _x = E[_y]

//   It's straightforward enough to define macros this way; all that needs to be done is to mark the initial state and put state information into the macro patterns. The hard part is making sure
//   that the markers don't interfere with the existing syntax. This requires that all of the markers be replaced by gensyms before the macroexpansion happens.

//   Gensym anonymizing.
//   Replacing symbols in macro patterns is trivial with the replace() method. The only hard part is performing this same substitution on the macroexpansions. (In fact, this is impossible to do
//   transparently given Turing-complete macros.) In order to work around this, strings are automatically expanded (because it's easy to do), but functions must call translate_state_markers() on
//   any patterns they intend to use. This call must happen before substituting syntax into the patterns (!) because otherwise translate_state_markers() may rewrite code that happens to contain
//   markers, thus reintroducing the collision problem that all of this renaming is intended to avoid.

// Usage.
// To anonymize a set of macros you first need to create an anonymizer. This is easy; you just give it a list of symbols to anonymize and then use that anonymizer to transform a series of macros
// (this process is non-destructive):

// | var anonymize = caterwaul.anonymizer('X', 'Y', 'Z');
//   var m = caterwaul.macro(anonymize('X[foo]'), ...);    // Matches against gensym_1_aj49Az0_885nr1q[foo]

// Each anonymizer uses a separate symbol table. This means that two anonymizers that match against 'A' (or any other macro pattern) will always map them to different gensyms.

(function ($) {$.anonymizer = function () {for (var translation_table = {}, i = 0, l = arguments.length; i < l; ++i) translation_table[arguments[i]] = $.gensym();
                                           return function (node) {return node.replace(translation_table)}}})(caterwaul);
// Generated by SDoc 




// Language specializations.
// These provide configurations that specialize caterwaul to operate well with a given programming language. This is relevant because not all languages compile to Javascript the same way, and
// caterwaul should be able to adapt to the syntactic limitations of generated code (and thus be usable with non-Javascript languages like Coffeescript).

// Also included is a standard set of words that can be combined with the Javascript forms to produce useful macros. Together these form a base language that is used by other parts of the
// standard library.



// Common adjectives and adverbs | Spencer Tipping
// Licensed under the terms of the MIT source code license

// Introduction.
// This behavior installs a bunch of common words and sensible behaviors for them. The goal is to handle most Javascript syntactic cases by using words rather than Javascript primitive syntax.
// For example, constructing lambdas can be done with 'given' rather than the normal function() construct:

// | [1, 2, 3].map(x + 1, given[x])        // -> [1, 2, 3].map(function (x) {return x + 1})

// In this case, given[] is registered as a postfix binary adverb. Any postfix binary adverb forms added later will extend the possible uses of given[].

(function ($) {
  var loop_anon = $.anonymizer('i', 'l', 'xs', 'result');
  $.word_macros = function (language) {
    return [

// Quotation.
// qs[] comes from pre-1.0 caterwaul; this lets you quote a piece of syntax, just like quote in Lisp. The idea is that qs[something] returns 'something' as a syntax tree. qse[] is a variant that
// macroexpands the syntax tree before returning it; this used to be there for performance reasons (now irrelevant with the introduction of precompilation) but is also useful for macro reuse.

  language.modifier('qs',  function (match) {return new $.ref(match._expression)}),
  language.modifier('qse', function (match) {return new $.ref(this.expand(match._expression))}),

// Scoping and referencing.
// These all impact scope or references somehow -- in other words, they create variable references but don't otherwise impact the nature of evaluation.

//   Function words.
//   These define functions in some form. given[] and bgiven[] are postfix adverbs to turn an expression into a function; given[] creates a regular closure while bgiven[] preserves the closure
//   binding. They're aliased to the more concise fn[] and fb[] for historical and ergonomic reasons. For example:

//   | var f = fn[x] in x + 1
//     var f = x + 1 |given[x];
//     var f = x + 1 |given.x;

    language.parameterized_modifier('given',  'from',  'fn', '(function (_parameters) {return _expression})'),
    language.parameterized_modifier('bgiven', 'bfrom', 'fb', '(function (t, f) {return (function () {return f.apply(t, arguments)})})(this, (function (_parameters) {return _expression}))'),

//   Side-effecting.
//   The goal here is to take an existing value, modify it somehow, and then return it without allocating an actual variable. This can be done using the /effect[] adverb, also written as /se[].
//   Older versions of caterwaul bound the variable as _; version 1.0 changes this convention to bind the variable to 'it'. For example:

//   | hash(k, v) = {} /effect[it[k] = v];
//     compose(f, g)(x) = g(x) -then- f(it);

    language.parameterized_modifier('effect', 'se',              '(function (it) {return (_parameters), it}).call(this, (_expression))'),
    language.parameterized_modifier('then',   're', 'returning', '(function (it) {return (_parameters)}).call(this, (_expression))'),

//   Scoping.
//   You can create local variables by using the where[] and bind[] adverbs. If you do this, the locals can all see each other since they're placed into a 'var' statement. For example:

//   | where[x = 10][alert(x)]
//     alert(x), where[x = 10]
//     bind[f(x) = x + 1] in alert(f(10))

    language.parameterized_modifier('where', 'bind', '(function () {var _parameters; return (_expression)}).call(this)'),

// Control flow modifiers.
// These impact how something gets evaluated.

//   Conditionals.
//   These impact whether an expression gets evaluated. x /when[y] evaluates to x when y is true, and y when y is false. Similarly, x /unless[y] evaluates to x when y is false, and !y when y is
//   true. A final option 'otherwise' is like || but can have different precedence:

//   | x = x /otherwise.y + z;

    language.parameterized_modifier('when',      '((_parameters) && (_expression))'),
    language.parameterized_modifier('unless',    '(! (_parameters) && (_expression))'),
    language.parameterized_modifier('otherwise', '((_expression) || (_parameters))'),

    language.parameterized_modifier('when_defined',   '((_parameters) != null && (_expression))'),
    language.parameterized_modifier('unless_defined', '((_parameters) == null && (_expression))'),

//   Collection-based loops.
//   These are compact postfix forms of common looping constructs. Rather than assuming a side-effect, each modifier returns an array of the results of the expression.

//   | console.log(it), over[[1, 2, 3]]            // logs 1, then 2, then 3
//     console.log(it), over_keys[{foo: 'bar'}]    // logs foo
//     console.log(it), over_values[{foo: 'bar'}]  // logs bar


    language.parameterized_modifier('over',        loop_anon('(function () {for (var xs = (_parameters), result = [], i = 0, l = xs.length, it; i < l; ++i)' +
                                                               'it = xs[i], result.push(_expression); return result}).call(this)')),

    language.parameterized_modifier('over_keys',   loop_anon('(function () {var x = (_parameters), result = []; ' +
                                                               'for (var it in x) Object.prototype.hasOwnProperty.call(x, it) && result.push(_expression); return result}).call(this)')),

    language.parameterized_modifier('over_values', loop_anon('(function () {var x = (_parameters), result = [], it; ' +
                                                               'for (var k in x) Object.prototype.hasOwnProperty.call(x, k) && (it = x[k], result.push(_expression));' +
                                                               'return result}).call(this)')),

//   Condition-based loops.
//   These iterate until something is true or false, collecting the results of the expression and returning them as an array. For example:

//   | console.log(x), until[++x >= 10], where[x = 0]      // logs 1, 2, 3, 4, 5, 6, 7, 8, 9

    language.parameterized_modifier('until', loop_anon('(function () {var result = []; while (! (_parameters)) result.push(_expression); return result}).call(this)'))]}})(caterwaul);
// Generated by SDoc 





// Javascript-specific macros | Spencer Tipping
// Licensed under the terms of the MIT source code license

(function ($) {

// Structured forms in Javascript.
// These aren't macros, but forms. Each language has its own ways of expressing certain idioms; in Javascript we can set up some sensible defaults to make macros more consistent. For example,
// caterwaul pre-1.0 had the problem of wildly divergent macros. The fn[] macro was always prefix and required parameters, whereas /se[] was always postfix and had a single optional parameter.
// /cps[] was similarly postfix, which was especially inappropriate considering that it could theoretically handle multiple parameters.

// In caterwaul 1.0, the macro author's job is reduced to specifying which words have which behavior; the language driver takes care of the rest. For instance, rather than specifying the full
// pattern syntax, you just specify a word and its definition with respect to an opaque expression and perhaps set of modifiers. Here are the standard Javascript macro forms:

  $.js = function () {
    var macro  = function (name, expander) {return function (template) {return $.macro        ($.parse(template).replace({_modifiers: $.parse(name)}), expander)}};
    var macros = function (name, expander) {return function (template) {return result.modifier($.parse(template).replace({_modifiers: $.parse(name)}), expander)}};

    var result = {modifier:               this.right_variadic(function (name, expander) {
                                            return $.map(macro(name, expander), ['_expression /_modifiers', '_expression -_modifiers', '_expression |_modifiers', '_expression._modifiers',
                                                                                 '_modifiers[_expression]', '_modifiers in _expression'])}),

                  parameterized_modifier: this.right_variadic(function (name, expander) {
                                            return [$.map(macros(name, expander), ['_modifiers[_parameters]', '_modifiers._parameters']),
                                                    $.map(macro(name, expander),  ['_expression <_modifiers> _parameters', '_expression -_modifiers- _parameters'])]}),

// Javascript-specific shorthands.
// Javascript has some syntactic weaknesses that it's worth correcting. These don't relate to any structured macros, but are hacks designed to make JS easier to use.

                  macros: [

//   Javascript intrinsic verbs.
//   These are things that you can do in statement mode but not expression mode.

    this.macro('wobbly[_x]', '(function () {throw _x}).call(this)'),

//   String interpolation.
//   Javascript normally doesn't have this, but it's straightforward enough to add. This macro implements Ruby-style interpolation; that is, "foo#{bar}" becomes "foo" + bar. A caveat (though not
//   bad one in my experience) is that single and double-quoted strings are treated identically. This is because Spidermonkey rewrites all strings to double-quoted form.

//   This version of string interpolation is considerably more sophisticated than the one implemented in prior versions of caterwaul. It still isn't possible to reuse the same quotation marks
//   used on the string itself, but you can now include balanced braces in the interpolated text. For example, this is now valid:

//   | 'foo #{{bar: "bif"}.bar}'

//   There are some caveats; if you have unbalanced braces (even in substrings), it will get confused and misread the boundary of your text. So stuff like this won't work properly:

//   | 'foo #{"{" + bar}'          // won't find the ending properly and will try to compile the closing brace

    function (node) {
      var s = node.data, q = s.charAt(0), syntax = $.syntax;
      if (q !== '\'' && q !== '"' || ! /#\{[^\}]+\}/.test(s)) return false;             // DeMorgan's applied to (! ((q === ' || q === ") && /.../test(s)))

      for (var pieces = [], i = 1, l = s.length - 1, brace_depth = 0, got_hash = false, start = 1, c; i < l; ++i)
        if (brace_depth) if ((c = s.charAt(i)) === '}') --brace_depth || pieces.push(s.substring(start, i)) && (start = i + 1), got_hash = false;
                    else                                brace_depth += c === '{';
   else                  if ((c = s.charAt(i)) === '#') got_hash = true;
                    else if (c === '{' && got_hash)     pieces.push(s.substring(start, i - 1)), start = i + 1, ++brace_depth;
                    else                                got_hash = false;

      pieces.push(s.substring(start, l));

      for (var escaped = new RegExp('\\\\' + q, 'g'), i = 0, l = pieces.length; i < l; ++i) pieces[i] = i & 1 ? $.parse(pieces[i].replace(escaped, q)).as('(') :
                                                                                                                new syntax(q + pieces[i] + q);
      return new syntax('+', pieces).unflatten().as('(')},

//   Destructuring function creation.
//   This is a beautiful hack made possible by Internet Explorer. We can intercept cases of assigning into a function and rewrite them to create a function body. For example, f(x) = y becomes the
//   regular assignment f = function (x) {return y}. Because this macro is repeatedly applied we get currying for free.

//   There's a special case. You can grab the whole arguments array by setting something equal to it. For example, f(xs = arguments) = xs[0] + xs[1]. This makes it easy to use binding constructs
//   inside the body of the function without worrying whether you'll lose the function context.

    this.macro('_left(_args) = _right',            '_left = (function (_args) {return _right})'),
    this.macro('_left(_var = arguments) = _right', '_left = (function () {var _var = arguments; return _right})')]};

    return result}})(caterwaul);
// Generated by SDoc 




  caterwaul.js_base = function () {var js = this.js();
                                   return this.clone().macros(this.word_macros(js), js.macros)};

// Libraries.
// These apply more advanced syntactic transforms to the code and can depend on everything above.



// Inversion behavior | Spencer Tipping
// Licensed under the terms of the MIT source code license

// Introduction.
// Enabling this behavior results in two interesting things. First, every function will be automatically annotated with an inverse, which is stored as a gensym-encoded attribute on the function.
// Second, the lvalue behavior will be extended to allow functional and expression destructuring. It isn't possible to assign into a complex expression in JS grammar, so only parameters can be
// bound this way.

// Inversion isn't guaranteed to be accurate in the general case. All it guarantees is that it is accurate under the function being inverted. That is, if f is an invertible function and fi is its
// inverse, then x === fi(f(x)) isn't true in general. However, f(x) === f(fi(f(x))) generally is.

// Combinatory inversion.
// Each kind of expression has certain inversion semantics. Some of them perform runtime type detection to figure out how best to invert something. For example, the + operator is overloaded
// across strings and numbers, so we have to do a type check on the arguments before knowing which inversion to use. Also, different cases are taken depending on which operand is a constant.
// (Most binary operators fail with two variables.)

// Information gets lost when you invert stuff, as most operators are closed within a finite type. For example, suppose x | 3 = 7. We now don't know the lowest two bits of x, so we arbitrarily
// set them to zero for the purposes of destructuring. (Also, if x | 3 = 6, we reject the match because we know something about the bits set by |.)

// Inversion never degenerates into nondeterminism. That is, ambiguous multivariate cases are rejected immediately rather than explored. So, for example, if f(x, y) = x + y, you can't match
// against f(x, y) and expect it to work. You could match against f(x, 1) or f(5, y), though, since once the constants are propagated through the expression you will end up with an unambiguous
// way to invert the + operator. In some cases nondeterminism is eliminated through default behavior: if f(x, y) = x && y, then matching against f(x, y) = X will result in x = true, y = X when X
// is truthy, and x = X, y = undefined when X is falsy. || behaves similarly; x || y = X results in x = X, y = undefined when X is true, and x = false, y = X when X is falsy.

// Constructor inversion.
// Constructors are a bizarre case of function application, and it's possible to invert them with some accuracy. Basically, we track the assignment of parameters into named 'this' properties and
// construct the inverse based on corresponding properties of the object being matched against. For example, the constructor fc[x, y][this.x = x, this.y = y] is invertible by pulling .x and .y
// from the object.

// Decisional inversion.
// This isn't a joke; it's actually possible to invert a decisional sometimes. However, it may end up taking every branch. The idea is that you try the first branch; if it succeeds, then we
// assume the condition variable was true and return. If it fails, then we try the second branch and assume that the condition variable was false. So, for example:

// | f(cond, x, y) = cond ? {foo: x} : {bar: y};
//   g(f(b, x, y)) = 'got ' + b + ' with ' + [x, y];
//   g({foo: 10})                  // returns 'got true with 10,undefined'
//   g({bar: 10})                  // returns 'got false with undefined,10'

// It's important to have decisional inversion because we might want to invert a pattern-matching function. For example:

// | foo('foo' + bar) = 'got a foo: ' + bar
//   foo('bif' + bar) = 'got a bif: ' + bar
//   g(foo(x)) = x
//   g('got a foo: bar')           // returns 'foobar'
//   g('got a bif: bar')           // returns 'bifbar'

// Recursive inversion.
// This also isn't a joke, though you can cause an infinite loop if you're not careful. You shouldn't really use this, but it's a natural side-effect of the way I'm representing inversions
// anyway. Here's an example:

// | power_of_two(n) = n === 0 ? 1 : 2 * power_of_two(n - 1);
//   g(power_of_two(x)) = x;
//   g(1)                  // -> 0
//   g(2)                  // -> 1
//   g(4)                  // -> 2

// Here's what the inverse function looks like (modulo formatting, error checking, etc):

// | power_of_two_inverse(x) = x === 1 ? {n: 0} : {n: 1 + power_of_two_inverse(x / 2).n};

// Don't use this feature! It's slow, it may infinite-loop, and it doesn't work for most recursive functions because of the nondeterminism limitation. I'm also not even going to guarantee that it
// works correctly in trivial cases like this, though if it doesn't it's probably because of a bug.
// Generated by SDoc 



// Generated by SDoc 

// Caterwaul development extensions | Spencer Tipping
// Licensed under the terms of the MIT source code license

// Process extensions.
// These apply to the development process somehow. Precompilation is here because it's something that you'd do at dev-time (pre-deploy) but not something that you have to include in the standard
// library. (The core caterwaul support for precompilation is rudimentary and very small.)



// Caterwaul precompiler | Spencer Tipping
// Licensed under the terms of the MIT source code license

// Precompilation logic.
// Even though Caterwaul operates as a runtime library, most of the time it will be used in a fairly static context. Precompilation can be done to bypass parsing, macroexpansion, and
// serialization of certain functions, significantly accelerating Caterwaul's loading speed.

caterwaul.js_base()(function ($) {

//   Precompiled output format.
//   The goal of precompilation is to produce code whose behavior is identical to the original. Caterwaul can do this by taking a function whose behavior we want to emulate. It then executes the
//   function with an annotated copy of the caterwaul compiler, tracing calls to compile(). It assumes, incorrectly in pathological cases, that the macroexpansion step does not side-effect
//   against caterwaul or other escaping values. If it does, the precompiled code won't reflect those side-effects. (Though local side-effects, like defmacro[], will apply within the scope of the
//   function being compiled -- as they normally would, in other words.)

//   The output function performs side-effects necessary to emulate the behavior of your macroexpanded code. All other behavior performed by the precompiled function will be identical to the
//   original. Here's an example of how it is used:

//   | var f = caterwaul.precompile(function () {
//       alert('hi');
//       caterwaul.js.base(function () {
//         console.log(x /given.y, qs[foo]);
//       })();
//       return 10;
//     });

//   After this statement, f.toString() will look something like this (except all mashed together, because Caterwaul doesn't format generated code):

//   | function () {
//       alert('hi');
//       caterwaul.js.base(caterwaul.precompiled_internal((function () {
//         var gensym_1 = new caterwaul.syntax('foo');
//         return function () {
//           console.log(function (y) {return x}, gensym_1);
//         })()))();
//       return 10;
//     }

//   The precompiled_internal() function returns a reference that will inform Caterwaul not to operate on the function in question. You should (almost) never use this method! It will break all
//   kinds of stuff if you artificially mark functions as being precompiled when they are not.

//   There are some very important things to keep in mind when precompiling things:

//   | 1. Precompiling a function executes that function at compile time! This has some important consequences, perhaps most importantly that if you do something global, you could bork your
//        precompiling environment. The other important consequence is that if some code paths aren't run, those paths won't be precompiled. Caterwaul can only precompile paths that it has
//        traced.
//     2. Precompilation doesn't macroexpand the function being precompiled, even if the caterwaul function performing the precompilation has macros defined.
//     3. Most syntax tree refs can't be precompiled! If Caterwaul bumps into one it will throw an error. The only refs that it knows how to handle are (1) itself, and (2) references to syntax
//        trees that don't contain other refs. If you want it to handle other refs, you'll need to write a macro that transforms them into something else before the precompiler sees them.
//        (Actually, the standard library contains a fair amount of this kind of thing to avoid this very problem. Instead of using refs to generated values, it installs values onto the caterwaul
//        global and generates indirect references to them.)
//     4. Caterwaul assumes that compilation is completely deterministic. Any nondeterminism won't be reflected. This generally isn't a problem, it just means that your code may have
//        un-precompiled segments if the precompilation test run didn't cover all of those cases.

//   For most code these concerns won't be a problem at all. But if you're doing anything especially dynamic you might run into one of them.

//   Silliness of runtime precompilation.
//   Obviously it doesn't do much good to precompile stuff at runtime -- the point of precompilation is to save time, but it's too late if the code is already running on an end-user system.
//   Fortunately, precompilation is separable:

//   | // Inside the precompiler:
//     var f = caterwaul.precompile(first_code_chunk);
//     var g = caterwaul.precompile(second_code_chunk);
//     // Later, in end-user code:
//     f();
//     g();

//   As a result, individual Javascript files can be precompiled separately, loaded separately, and run in their original order to perform their original behavior (minus pathological caveats
//   above).

    $.precompile(f) = this.compile(remove_gensyms(traced.references, perform_substitution(traced.references, traced.annotated))) -where[traced = trace_execution(this, f)]
    -where[

//   Tracing function destinations.
//   This is more subtle than you might think. We need to construct a custom traced caterwaul function to pass into the function being precompiled. This caterwaul function delegates
//   macroexpansion to the original one but lets us know when anything is compiled.

//   When a parse() call happens, we'll have a reference to the function being parsed. We can identify which function it came from (in the original syntax tree that is) by marking each of the
//   initial functions with a unique gensym on the end of the parameter list:

//   | function (x, y, z, gensym_foo_bar_bif) {...}

//   This serves as a no-op that lets us track the function from its original parse tree into its final compiled state.

//   Next the function may be macroexpanded. If so, we make sure the gensym tag is on the macroexpanded output (if the output of macroexpansion isn't a function, then it's a side-effect and we
//   can't track it). Finally, the function will be compiled within some environment. This is where we go through the compilation bindings, serializing each one with the function. We then wrap
//   this in an immediately-invoked anonymous function (to create a new scope and to simulate the one created by compile()), and this becomes the output.

//   Note that for these patterns we need to use parse() because Spidermonkey optimizes away non-side-effectful function bodies.

    nontrivial_function_pattern         = $.parse('function (_args) {_body}'),
    trivial_function_pattern            = $.parse('function ()      {_body}'),
    nontrivial_function_gensym_template = $.parse('function (_args, _gensym) {_body}'),
    trivial_function_gensym_template    = $.parse('function (_gensym)        {_body}'),

    nontrivial_gensym_detection_pattern = nontrivial_function_gensym_template,
    trivial_gensym_detection_pattern    = trivial_function_gensym_template,

    annotate_macro_generator(template)(references)(match) = result -effect[references[s] = {tree: result}]
                                                                   -where[s      = $.gensym(),
                                                                          result = template.replace({_args: match._args, _gensym: s, _body: annotate_functions_in(match._body, references)})],

    mark_nontrivial_function_macro = annotate_macro_generator(nontrivial_function_gensym_template),
    mark_trivial_function_macro    = annotate_macro_generator(trivial_function_gensym_template),

//   Macroexpansion for function origins.
//   The function annotation is done by a macro that matches against each embedded function. Only one level of precompilation is applied; if you have invocations of caterwaul from inside
//   transformed functions, these sub-functions won't be identified and thus won't be precompiled. (It's actually impossible to precompile them in the general case since we don't ultimately know
//   what part of the code they came from.)

//   Note that the ordering of trivial and nontrivial cases here is important. Later macros take precedence over earlier ones, so we use the most specific case last and let it fall back to the
//   more generic case.

    annotate_functions_in(tree, references) = $.macroexpand(tree, $.macro(trivial_function_pattern,    mark_trivial_function_macro(references)),
                                                                  $.macro(nontrivial_function_pattern, mark_nontrivial_function_macro(references))),

//   Also, an interesting failure case has to do with duplicate compilation:

//   | var f = function () {...};
//     caterwaul.tconfiguration('std', 'foo', f);
//     caterwaul.tconfiguration('macro', 'bar', f);

//   In this example, f() will be compiled twice under two different configurations. But because the replacement happens against the original function (!) due to lack of flow analysis, we won't
//   be able to substitute just one new function for the old one. In this case an error is thrown (see below).

//   Compilation wrapper.
//   Functions that get passed into compile() are assumed to be fully macroexpanded. If the function contains a gensym marker that we're familiar with, then we register the compiled function as
//   the final form of the original. Once the to-be-compiled function returns, we'll have a complete table of marked functions to be converted. We can then do a final pass over the original
//   source, replacing the un-compiled functions with compiled ones.

    function_key(tree) = matches._gensym.data -when.matches -where[matches = nontrivial_gensym_detection_pattern.match(tree) ||
                                                                             trivial_gensym_detection_pattern   .match(tree)],
    mark_as_compiled(references, k, tree, environment) = references[k]
                                                         -effect- wobbly[new Error('detected multiple compilations of #{references[k].tree.serialize()}')] /when[references[k].compiled]
                                                         -effect[references[k].compiled = tree, references[k].environment = environment] -when[k && references[k]],

    wrapped_compile(original, references)(tree, environment) = original.call(this, tree, environment)
                                                               -effect- mark_as_compiled(references, function_key(tree), tree, $.merge({}, this._environment || {}, environment)),

//   Generating compiled functions.
//   This involves a few steps, including (1) signaling to the caterwaul function that the function is precompiled and (2) reconstructing the list of syntax refs.

//     Already-compiled signaling.
//     We don't necessarily know /why/ a particular function is being compiled, so it's beyond the scope of this module to try to produce a method call that bypasses this step. Rather, we just
//     inform caterwaul that a function is going to be compiled ahead-of-time, and all caterwaul functions will bypass the compilation step automatically. To do this, we use the dangerous
//     precompiled_internal() method, which returns a placeholder.

      signal_already_compiled(tree) = qs[caterwaul.precompiled_internal(_x)].replace({_x: tree}),

//     Syntax ref serialization.
//     This is the trickiest part. We have to identify ref nodes whose values we're familiar with and pull them out into their own gensym variables. We then create an anonymous scope for them,
//     along with the compiled function, to simulate the closure capture performed by the compile() function.

      closure_template                     = $.parse('(function () {_vars; return (_value)}).call(this)'),
      closure_variable_template            = $.parse('var _var = _value'),
      closure_null_template                = $.parse('null'),

      escape_string(s)                     = '\'' + s.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/'/g, '\\\'') + '\'',

//     Detecting serializable values.
//     Because it's so trivial to handle falsy things (they're all primitives), I've included that case here. Also, the pre-1.0 standard library apparently depends on it somehow.

//     There's a nice optimization we can make here. Rather than using parse() to reconstruct syntax trees, we can actually go a step further and build the constructor invocations that will build
//     them up from scratch. This should end up being just a bit faster than parsing, at the expense of larger code. (That said, the code should pack very well under gzip and/or minification.)
//     Another advantage of this optimization is that you can change caterwaul's parse() function without causing problems. This lets you use a caterwaul function as a cross-compiler from another
//     language without breaking native Javascript quotation.

      serialize_syntax(value)          = value.length === 0 ? qs[new caterwaul.syntax(_name)].replace({_name: escape_string(value.data)}) :
                                                              qs[new caterwaul.syntax(_name, _children)].replace({_name: escape_string(value.data), _children: children})
                                                                -where[children = new $.syntax(',', serialize_syntax(it) -over.value).unflatten()],

      serialize_ref(value, name, seen) = ! value                        ? '#{value}' :
                                         value.constructor === $.syntax ? seen[value.id()] || (seen[value.id()] = name) -returning- serialize_syntax(value) :
                                                                          wobbly[new Error('syntax ref value is not serializable: #{value}')],

//     Variable table generation.
//     Now we just dive through the syntax tree, find everything that binds a value, and install a variable for it.

      single_variable(name, value)      = closure_variable_template.replace({_var: name, _value: value}),
      names_and_values_for(environment) = single_variable(it, environment[it]) -over_keys.environment,

      tree_variables(tree)              = vars -effect- tree.reach(given.n in vars.push(single_variable(n.data, serialize_ref(n.value, n.data, seen))) -when[n && n.binds_a_value])
                                               -where[vars = [], seen = {}],

      variables_for(tree, environment)  = bind[all_variables = names_and_values_for(environment).concat(tree_variables(tree))]
                                              [all_variables.length ? new $.syntax(';', all_variables) : closure_null_template],

//     Closure state generation.
//     This is where it all comes together. Given an original function, we construct a replacement function that has been marked by caterwaul as being precompiled.

      precompiled_closure(tree, environment)  = closure_template.replace({_vars: variables_for(tree, environment), _value: tree}),
      precompiled_function(tree, environment) = signal_already_compiled(precompiled_closure(tree, environment)),

//   Substitution.
//   Once the reference table is fully populated, we perform a final macroexpansion pass against the initial source tree. This time, rather than annotating functions, we replace them with their
//   precompiled versions. The substitute_precompiled() function returns a closure that expects to be used as a macroexpander whose pattern is gensym_detection_pattern.

    substitute_precompiled(references)(match) = precompiled_function(ref.compiled, ref.environment) -when[ref && ref.compiled] -where[ref = references[match._gensym.data]],

    perform_substitution(references, tree)    = $.macroexpand(tree, $.macro(trivial_gensym_detection_pattern, nontrivial_gensym_detection_pattern, substitute_precompiled(references))),

//     Gensym removal.
//     After we're done compiling we should nuke all of the gensyms we introduced to mark the functions. The remove_gensyms() function does this.

      reconstruct_original(references, match)      = bind[new_match = {_body: remove_gensyms(references, match._body), _args: match._args}]
                                                         [match._args ? nontrivial_function_pattern.replace(new_match) : trivial_function_pattern.replace(new_match)],

      remove_referenced_gensyms(references)(match) = reconstruct_original(references, match) -when[ref && ref.tree] -where[ref = references[match._gensym.data]],

      remove_gensyms(references, tree)             = $.macroexpand(tree, $.macro(trivial_gensym_detection_pattern, nontrivial_gensym_detection_pattern, remove_referenced_gensyms(references))),

//   Tracing.
//   This is where we build the references hash. To do this, we first annotate the functions, build a traced caterwaul, and then run the function that we want to precompile. The traced caterwaul
//   builds references for us.

    annotated_caterwaul(caterwaul, references) = caterwaul.clone() -effect[it.compile = wrapped_compile(it.compile, references)],
    trace_execution(caterwaul, f)              = {references: references, annotated: annotated}
                                                 -effect- caterwaul.compile(annotated, {caterwaul: annotated_caterwaul(caterwaul, references)})()
                                                 -where[references = {}, annotated = annotate_functions_in($.parse(f), references)]]})(caterwaul);
// Generated by SDoc 




// Development tooling.
// These assist the development process. Tracing is useful for finding bugs (you normally wouldn't use it in production code), and unit testing has obvious benefits.



// Code trace behavior | Spencer Tipping
// Licensed under the terms of the MIT source code license

// Introduction.
// The 'tracer' function constructs a caterwaul compiler that invokes hooks before and after each expression. You can inspect the value after it is computed and can measure how long it takes to
// return (or whether it fails to return due to an exception being thrown). For example, here's a very simple profiler (it doesn't account for 'own time', just 'total time'):

// | var trace   = caterwaul.tracer(function (expression)        {timings[expression.id()] = timings[expression.id()] || 0; timers.push(+new Date())},
//                                  function (expression, value) {timings[expression.id()] += +new Date() - timers.pop()});
//   var timings  = {};
//   var timers   = [];
//   var profiler = caterwaul(function (code) {    // This caterwaul creation is unnecessary since it isn't doing anything else, but generally you'll have one
//     return trace(code);
//   });
//   var profiled = profiler(function () {...});   // Annotations inserted during macroexpansion
//   profiled();                                   // This run is measured

// Interface details.
// Tracing things involves modifying the generated expressions in a specific way. First, the tracer marks that an expression will be evaluated. This is done by invoking a 'start' function, which
// then alerts the before-evaluation listener. Then the tracer evaluates the original expression, capturing its output and alerting the listener in the process. Listeners are free to use and/or
// modify this value, but doing so may change how the program runs. (Note that value types are immutable, so in this case no modification will be possible.)

// There is currently no way to catch errors generated by the code. This requires a more aggressive and much slower method of tracing, and most external Javascript debuggers can give you a
// reasonable stack trace. (You can also deduce the error location by observing the discrepancy between before and after events.)

// Here is the basic transformation applied to each expression in the code (where qs[] indicates a reference to the syntax tree):

// | some_expression   ->  (before_hook(qs[some_expression]), after_hook(qs[some_expression], some_expression))

// Note that when you're building up a caterwaul function you'll probably want to trace the code last. For example, these two definitions are very different:

// | // Fails:                                     // Succeeds:
//   caterwaul(function (code) {                   caterwaul(function (code) {
//     var c1 = trace(code);                         var c1 = this.macroexpand(code, macros);
//     return this.macroexpand(c1, macros);          return trace(c1);
//   });                                           });

// The reason is that traced code isn't much like the code going in due to the way the transformation works. Another side-effect of tracing is that some of the functions you're tracing will have
// transformed source code. For example, suppose you're tracing this:

// | xs.map(function (x) {return x + 1});

// The sequence of values will include the trace-annotated version of function (x) {return x + 1}, and this function will be seriously gnarly. I've thought of ways to try to fix this, but I
// haven't come up with any good ones yet. If anyone finds one let me know.

// The hard part.
// If Javascript were any kind of sane language this module would be trivial to implement. Unfortunately, however, it is fairly challenging, primarily because of two factors. One is the role of
// statement-mode constructs, which can't be wrapped directly inside function calls. The other is method invocation binding, which requires either (1) no record of the value of the method itself,
// or (2) caching of the object. In this case I've written a special function to handle the caching to reduce the complexity of the generated code.

caterwaul.js_base()(function ($) {
  $.tracer(before, after)(tree) = trace(anon('S[_x]').replace({_x: tree}))

  -where [trace_caterwaul = $.clone() -effect [it.macros(expression_macros, statement_macros, hook_macros)],
          trace(tree)     = trace_caterwaul.macroexpand(tree)]

//   Expression-mode transformations.
//   Assuming that we're in expression context, here are the transforms that apply. Notationally, H[] means 'hook this', D[] means 'hook this direct method call', I[] means 'hook this indirect
//   method call', E[] means 'trace this expression recursively', and S[] means 'trace this statement recursively'. It's essentially a simple context-free grammar over tree expressions.

  -where [anon              = $.anonymizer('E', 'S', 'H', 'D', 'I'),
          rule(p, e)        = $.macro(anon(p), e.constructor === Function ? e : anon(e)),

          expression_macros = [rule('E[]',   'null'),                                                                 // Base case: oops, descended into nullary something
                               rule('E[_x]', 'H[_, _x]'),                                                             // Base case: identifier or literal

                               assignment_operator(it) -over- qw('= += -= *= /= %= &= |= ^= <<= >>= >>>='),
                               binary_operator(it)     -over- qw('() [] + - * / % < > <= >= == != === !== in instanceof ^ & | && ||'),
                               unary_operator(it)      -over- qw('+ - ! ~'),

                               rule('E[(_x)]', '(E[_x])'),                                                            // Destructuring of parens
                               rule('E[++_x]', 'H[_, ++_x]'), rule('E[--_x]', 'H[_, --_x]'),                          // Increment/decrement (can't trace original value)
                               rule('E[_x++]', 'H[_, _x++]'), rule('E[_x--]', 'H[_, _x--]'),

                               rule('E[_x, _y]',                 'E[_x], E[_y]'),                                     // Preserve commas -- works in an argument list
                               rule('E[_x._y]',                  'H[_, E[_x]._y]'),                                   // No tracing for constant attributes
                               rule('E[_f()]',                   'H[_, E[_f]()]'),                                    // Nullary function call won't be handled by binary ()

                               rule('E[_o._m(_xs)]',             'D[_, E[_o], _m, [E[_xs]]]'),                        // Use D[] to indicate direct method binding
                               rule('E[_o[_m](_xs)]',            'I[_, E[_o], E[_m], [E[_xs]]]'),                     // Use I[] to indicate indirect method binding
                               rule('E[_o._m()]',                'D[_, E[_o], _m, []'),                               // Duplicate for nullary method calls
                               rule('E[_o[_m]()]',               'I[_, E[_o], E[_m], []'),

                               rule('E[typeof _x]',              'H[_, typeof _x]'),                                  // No tracing for typeof since the value may not exist
                               rule('E[void _x]',                'H[_, void E[_x]]'),                                 // Normal tracing
                               rule('E[delete _x._y]',           'H[_, delete E[_x]._y]'),                            // Lvalue, so no tracing for the original
                               rule('E[new _x(_y)]',             'H[_, new H[_x](E[_y])]'),                           // Hook the constructor to prevent method-handling from happening
                               rule('E[{_ps}]',                  'H[_, {E[_ps]}]'),                                   // Hook the final object and distribute across k/v pairs (more)
                               rule('E[_k: _v]',                 '_k: E[_v]'),                                        // Ignore keys (which are constant)
                               rule('E[[_xs]]',                  'H[_, [E[_xs]]]'),                                   // Hook the final array and distribute across elements
                               rule('E[_x ? _y : _z]',           'H[_, E[_x] ? E[_y] : E[_z]]'),
                               rule('E[function (_xs) {_body}]', 'H[_, function (_xs) {S[_body]}]'),                  // Trace body in statement mode rather than expression mode
                               rule('E[function ()    {_body}]', 'H[_, function ()    {S[_body]}]')]                  // Handle nullary case

                              -where [assignment_operator(op) = [rule('E[_x     = _y]', 'H[_, _x           = E[_y]]'),
                                                                 rule('E[_x[_y] = _z]', 'H[_, E[_x][E[_y]] = E[_z]]'),
                                                                 rule('E[_x._y  = _z]', 'H[_, E[_x]._y     = E[_z]]')] -where [t(x)       = anon(x).replace({'=': op}),
                                                                                                                               rule(x, y) = $.macro(t(x), t(y))],

                                      binary_operator(op)     = $.macro(anon('E[_x + _y]').replace({'+': op}),    anon('H[_, E[_x] + E[_y]]').replace({'+': op})),
                                      unary_operator(op)      = $.macro(anon('E[+_x]').replace({'u+': 'u#{op}'}), anon('H[_, +E[_x]]').replace({'u+': 'u#{op}'})),

                                      qw(s)                   = s.split(/\s+/)],

//   Statement-mode transformations.
//   A lot of the time this will drop back into expression mode. However, there are a few cases where we need disambiguation. One is the var statement, where we can't hook the result of the
//   assignment. Another is the {} construct, which can be either a block or an object literal.

//   There's some interesting stuff going on with = and commas. The reason is that sometimes you have var definitions, and they contain = and , trees that can't be traced quite the same way that
//   they are in expressions. For example consider this:

//   | var x = 5, y = 6;

//   In this case we can't evaluate 'x = 5, y = 6' in expression context; if we did, it would produce H[x = H[5]], H[y = H[6]], and this is not valid Javascript within a var statement. Instead,
//   we have to produce x = H[5], y = H[6]. The statement-mode comma and equals rules do exactly that. Note that we don't lose anything by doing this because in statement context the result of an
//   assignment is never used anyway.

          statement_macros = [rule('S[_x]',              'E[_x]'),              rule('S[for (_x) _y]',                           'for (S[_x]) S[_y]'),
                              rule('S[{_x}]',            '{S[_x]}'),            rule('S[for (_x; _y; _z) _body]',                'for (S[_x]; E[_y]; E[_z]) S[_body]'),
                              rule('S[_x; _y]',          'S[_x]; S[_y]'),       rule('S[while (_x) _y]',                         'while (E[_x]) S[_y]'),
                                                                                rule('S[do _x; while (_y)]',                     'do S[_x]; while (E[_y])'),
                              rule('S[_x, _y]',          'S[_x], S[_y]'),       rule('S[do {_x} while (_y)]',                    'do {S[_x]} while (E[_y])'),
                              rule('S[_x = _y]',         '_x = E[_y]'),
                              rule('S[var _xs]',         'var S[_xs]'),         rule('S[try {_x} catch (_e) {_y}]',              'try {S[_x]} catch (_e) {S[_y]}'),
                              rule('S[const _xs]',       'const S[_xs]'),       rule('S[try {_x} catch (_e) {_y} finally {_z}]', 'try {S[_x]} catch (_e) {S[_y]} finally {S[_z]}'),
                                                                                rule('S[try {_x} finally {_y}]',                 'try {S[_x]} finally {S[_y]}'),
                              rule('S[return _x]',       'return E[_x]'),       rule('S[function _f(_args) {_body}]',            'function _f(_args) {S[_body]}'),
                              rule('S[return]',          'return'),             rule('S[function _f()      {_body}]',            'function _f()      {S[_body]}'),
                              rule('S[throw _x]',        'throw E[_x]'),
                              rule('S[break _label]',    'break _label'),       rule('S[if (_x) _y]',                            'if (E[_x]) S[_y]'),
                              rule('S[break]',           'break'),              rule('S[if (_x) _y; else _z]',                   'if (E[_x]) S[_y]; else S[_z]'),
                              rule('S[continue _label]', 'continue _label'),    rule('S[if (_x) {_y} else _z]',                  'if (E[_x]) {S[_y]} else S[_z]'),
                              rule('S[continue]',        'continue'),           rule('S[switch (_c) {_body}]',                   'switch (E[_c]) {S[_body]}'),
                              rule('S[_label: _stuff]',  '_label: S[_stuff]'),  rule('S[with (_x) _y]',                          'with (E[_x]) S[_y]')],

//   Hook generation.
//   Most of the actual hook generation code is fairly routine for JIT stuff. The patterns here don't actually expand into other state marker patterns; H, D, and I are all terminal. The [1]
//   subscript is a hack. We want to grab the un-annotated tree, but all of the patterns have state markers on them. So we subscript by [1] to get the child of that state annotation.

          hook_macros      = [rule('H[_tree, _x]',                              expression_hook     (match._tree[1], match._x) -given.match),
                              rule('D[_tree, _object, _method, [_parameters]]', direct_method_hook  (match._tree[1], match)    -given.match),
                              rule('I[_tree, _object, _method, [_parameters]]', indirect_method_hook(match._tree[1], match)    -given.match)]

                      -where [before_hook(tree)                                   = before(tree)       /when.before,
                              after_hook(tree, value)                             = after(tree, value) /when.after -returning- value,
                              after_method_hook(tree, object, method, parameters) = before_hook(tree[0]) -then- after_hook(tree[0], resolved) -then-
                                                                                    after_hook(tree, resolved.apply(object, parameters)) -where[resolved = object[method]],

                              before_hook_ref                                     = new $.ref(before_hook),
                              after_hook_ref                                      = new $.ref(after_hook),
                              after_method_hook_ref                               = new $.ref(after_method_hook),

                              quote_method_name(s)                                = '"#{method.data.replace(/"/g, "\\\"")}"',

                              expression_hook_template                            = $.parse('(_before(_tree), _after(_tree, _expression))'),
                              indirect_method_hook_template                       = $.parse('(_before(_tree), _after(_tree, _object, _method, [_parameters]))'),

                              expression_hook(original, tree)                     = expression_hook_template.replace({_before: before_hook_ref, _after: after_hook_ref,
                                                                                                                      _tree: new $.ref(original), _expression: tree.as('(')}),

                              method_hook(tree, object, method, parameters)       = indirect_method_hook_template.replace({_before: before_hook_ref, _after: after_method_hook_ref,
                                                                                                                           _tree: new $.ref(original), _object: object, _method: method,
                                                                                                                           _parameters: parameters}),

                              direct_method_hook(tree, match)                     = method_hook(tree, match._object, quote_method_name(match._method), match._parameters),
                              indirect_method_hook(tree, match)                   = method_hook(tree, match._object, match._method,                    match._parameters)]]})(caterwaul);
// Generated by SDoc 





// Unit/integration testing behavior | Spencer Tipping
// Licensed under the terms of the MIT source code license

// Introduction.
// This behavior provides words that are useful for unit testing. It also creates functions on caterwaul to define and handle unit tests. For example, using the unit testing library you can do
// stuff like this:

// | var t = caterwaul.test(function () {
//     'foo'.length -should_be- 3;
//     'foo' -should_not_be- 'bar';
//     // etc
//   });

caterwaul.js_base()(function ($) {
  $.assert(condition, message) = condition || wobbly[new Error(message)];

  $.assertions = {should_be:     given[a, b] in $.assert(a === b, '#{failure}: #{a} !== #{b}' /given.failure),
                  should_not_be: given[a, b] in $.assert(a !== b, '#{failure}: #{a} === #{b}' /given.failure)};

  $.test_case_gensym     = $.gensym();
  $.test_words(language) = [language.parameterized_modifier('should_be',     'caterwaul.assertions.should_be(_expression, _parameters)'),
                            language.parameterized_modifier('should_not_be', 'caterwaul.assertions.should_not_be(_expression, _parameters)')];

  $.test_base() = this.clone() -effect- it.macros(it.macros().concat(it.test_words(it.js())));
  $.test(f)     = this.test_base()(f)()})(caterwaul);
// Generated by SDoc 



// Generated by SDoc 

// Offline precompilation.
// Uses caterwaul's precompile() method.

var code = require('fs').readFileSync(process.argv[2], 'utf8');
require('fs').writeFileSync(process.argv[2].replace(/\.js$/, '.pre.js'),
                            caterwaul.precompile('function () {' + code + '}').toString().replace(/^[\s\n]*function\s*\([^)]*\)[\s\n]*\{((?:.|\n)*)\}[\s\n]*$/, '$1'), 'utf8');
// Generated by SDoc 

// Generated by SDoc 
