// Caterwaul precompiler | Spencer Tipping
// Licensed under the terms of the MIT source code license

// Usage: node precompile.js file.js
// This will produce a precompiled file called 'file.pre.js'.

// Introduction.
// Caterwaul is a Javascript-to-Javascript compiler. Visit http://caterwauljs.org for information about how and why you might use it.

(function (f) {return f(f, (function (x) {return function () {return ++x}})(0))})(function (initializer, unique, undefined) {

// Utility methods.
// Gensym is used to support qs[]. When we quote syntax, what we really intend to do is grab a syntax tree representing something; this entails creating a let-binding with the already-evaluated
// tree. (Note: Don't go and modify these qs[]-generated trees; you only get one for each qs[].) The ultimate code ends up looking like this (see 'Environment-dependent compilation' some distance
// below):

// | (function (a_gensym) {
//     var v1 = a_gensym.gensym_1;
//     var v2 = a_gensym.gensym_2;
//     ...
//     return [your macroexpanded function];
//   }) ({gensym_1: v1, gensym_2: v2, ..., gensym_n: vn});

// A note about gensym uniqueness. Gensyms are astronomically unlikely to collide, but there are some compromises made to make sure of this. First, gensyms are not predictable; the first one is
// randomized. This means that if you do have a collision, it may be intermittent (and that is probably a non-feature). Second, and this is a good thing, you can load Caterwaul multiple times
// without worrying about gensyms colliding between them. Each instance of Caterwaul uses its own system time and random number to seed the gensym generation, and the system time remains stable
// while the random number gets incremented. It is very unlikely that any collisions would happen.

// As of version 1.0 gensyms have an additional component to provide information about what they're being used for. This is used during gensym renaming; see the environment-dependent compilation
// source for more information about this.

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
    gensym = function (name) {var v = genval(); return ['gensym', name || '', v[0].toString(36), v[1].toString(36), v[2].toString(36)].join('_')},

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

   max_length_key = gensym('hash_annotation'),
    annotate_keys = function (o)    {var max = 0; for (var k in o) own.call(o, k) && (max = k.length > max ? k.length : max); o[max_length_key] = max; return o},
              has = function (o, p) {return p != null && ! (p.length > o[max_length_key]) && own.call(o, p)},  own = Object.prototype.hasOwnProperty,

// Global caterwaul variable.
// Caterwaul creates a global symbol, caterwaul. Like jQuery, there's a mechanism to get the original one back if you don't want to replace it. You can call caterwaul.deglobalize() to return
// caterwaul and restore the global that was there when Caterwaul was loaded (might be useful in the unlikely event that someone else named their library Caterwaul). Note that deglobalize() is
// available only on the global caterwaul() function.

  calls_init       = function () {var f = function () {return f.init.apply(f, arguments)}; return f},
  original_global  = typeof caterwaul === 'undefined' ? undefined : caterwaul,

  caterwaul_global = se(calls_init(), function () {this.deglobalize = function () {caterwaul = original_global; return caterwaul_global};

                                                   merge(this, {merge:  merge,   map:  map,
                                                                unique: unique,  rmap: rmap,  gensym: gensym})}),

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

       lex_op = hash('. new ++ -- u++ u-- u+ u- typeof u~ u! ! * / % + - << >> >>> < > <= >= instanceof in == != === !== & ^ | && || ? = += -= *= /= %= &= |= ^= <<= >>= >>>= : , ' +
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
 parse_ambiguous_group = hash('[ ('),    parse_ternary = hash('?'),   parse_not_a_value = hash('function if for while catch void delete new typeof in instanceof'),
 parse_also_expression = hash('function'),

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

    syntax_common = caterwaul_global.syntax_common = {

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

      id: function () {var id = gensym('id'); return (this.id = function () {return id})()},

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
      rmap:  function (f) {var r = f(this); return ! r || r === this ? this.map(function (n) {return n.rmap(f)}) : r.rmap === undefined ? new this.constructor(r) : r},

      clone: function () {return this.rmap(function () {return false})},

      collect: function (p)  {var ns = []; this.reach(function (n) {p(n) && ns.push(n)}); return ns},
      replace: function (rs) {var r; return own.call(rs, this.data) && (r = rs[this.data]) ?
                                              r.constructor === String ? se(this.map(function (n) {return n.replace(rs)}), function () {this.data = r}) : r :
                                              this.map(function (n) {return n.replace(rs)})},

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

      match: function (target, variables) {target = target.constructor === String ? caterwaul_global.parse(target) : target;
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

      structure: function () {if (this.length) return '(' + ['"' + this.data + '"'].concat(map(function (x) {return x.structure()}, this)).join(' ') + ')';
                              else             return this.data},

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

//   | caterwaul.compile(qs[function () {return _ + 1}].replace({_: caterwaul.ref(3)}))()    // -> 4

//   What actually happens is that caterwaul.compile runs through the code replacing refs with gensyms, and the function is evaluated in a scope where those gensyms are bound to the values they
//   represent. This gives you the ability to use a ref even as an lvalue, since it's really just a variable. References are always leaves on the syntax tree, so the prototype has a length of 0.

//   Caterwaul 1.0 adds named gensyms, and one of the things you can do is name your refs accordingly. If you don't name one it will just be called 'ref', but you can make it more descriptive by
//   passing in a second constructor argument. This name will automatically be wrapped in a gensym, but that gensym will be removed at compile-time unless you specify not to rename gensyms.

    caterwaul_global.ref = function (value, name) {if (value instanceof this.constructor) this.value = value.value, this.data = value.data;
                                                   else                                   this.value = value,       this.data = gensym(name && name.constructor === String ? name : 'ref')};

    merge(caterwaul_global.ref.prototype, syntax_common, {binds_a_value: true, length: 0});

//   Reference replace() support.
//   Refs aren't normal nodes; in particular, invoking the constructor as we do in replace() will lose the ref's value and cause all kinds of problems. In order to avoid this we override the
//   replace() method for syntax refs to behave more sensibly. Note that you can't replace a ref with a syntax 

    caterwaul_global.ref.prototype.replace = function (replacements) {var r; return own.call(replacements, this.data) && (r = replacements[this.data]) ?
                                                                                      r.constructor === String ? se(new this.constructor(this.value), function () {this.data = r}) : r :
                                                                                      this};

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

      // Caterwaul 1.1 revision: Allow the parse() function to be used as a 'make sure this thing is a syntax node' function.
      if (input.constructor === caterwaul_global.syntax) return input;

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

//     Trivial case.
//     The empty string will break the lexer because we won't generate a token (since we're already at the end). To prevent this we return an empty syntax node immediately, since this is an
//     accurate representation of no input.

        if (l === 0) return empty;

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
          for (var j = forward ? 0 : _.length - 1, lj = _.length, inc = forward ? 1 : -1, node, data, ll; forward ? j < lj : j >= 0; j += inc)

//       Binary node behavior.
//       The most common behavior is binary binding. This is the usual case for operators such as '+' or ',' -- they grab one or both of their immediate siblings regardless of what they are.
//       Operators in this class are considered to be 'fold_lr'; that is, they fold first their left sibling, then their right.

            if (has(parse_lr, data = (node = _[j]).data))  node._fold_lr();

//       Ambiguous parse groups.
//       As mentioned above, we need to determine whether grouping constructs are invocations or real groups. This happens to take place before other operators are parsed (which is good -- that way
//       it reflects the precedence of dereferencing and invocation). The only change we need to make is to discard the explicit parenthetical or square-bracket grouping for invocations or
//       dereferences, respectively. It doesn't make much sense to have a doubly-nested structure, where we have a node for invocation and another for the group on the right-hand side of that
//       invocation. Better is to modify the group in-place to represent an invocation.

//       We can't solve this problem here, but we can solve it after the parse has finished. I'm pushing these invocation nodes onto an index for the end.

//       Sometimes we have a paren group that doesn't represent a value. This is the case for most control flow constructs:

//       | for (var k in o) (...)

//       We need to detect this and not fold the (var k in o)(...) as an invocation, since doing so would seriously break the resulting syntax.

//       There is an even more pathological case to consider. Firefox and other SpiderMonkey-based runtimes rewrite anonymous functions without parentheses, so you end up with stuff like this:

//       | function () {} ()

//       In this case we need to encode an invocation. Fortunately by this point the function node is already folded.

       else if (has(parse_ambiguous_group, data) && node.l && ! ((ll = node.l.l) && has(parse_r_until_block, ll.data)) &&
               (node.l.data === '.' || (node.l.data === 'function' && node.l.length === 2) ||
                                       ! (has(lex_op, node.l.data) ||
                                          has(parse_not_a_value, node.l.data))))  invocation_nodes.push(node.l._wrap(new_node(new syntax_node(data + parse_group[data]))).p._fold_r());

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
                                                  node.r && (node.r.data === ';' ? node.push(empty) : node._fold_r());
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

// Environment-dependent compilation.
// It's possible to bind variables from 'here' (i.e. this runtime environment) inside a compiled function. The way we do it is to create a closure using a gensym. (Another reason that gensyms
// must really be unique.) Here's the idea. We use the Function constructor to create an outer function, bind a bunch of variables directly within that scope, and return the function we're
// compiling. The variables correspond to gensyms placed in the code, so the code will have closure over those variables.

// An optional second parameter 'environment' can contain a hash of variable->value bindings. These will be defined as locals within the compiled function.

// New in caterwaul 0.6.5 is the ability to specify a 'this' binding to set the context of the expression being evaluated.

// Caterwaul 1.0 and later automatically bind a variable called 'undefined' that is set to Javascript's 'undefined' value. This is done to defend against pathological cases of 'undefined' being
// set to something else. If you really wnat some other value of undefined, you can always bind it as an environment variable.

  (function () {var bound_expression_template = caterwaul_global.parse('var _bindings; return(_expression)'),
                    binding_template          = caterwaul_global.parse('_variable = _base._variable'),
                    undefined_binding         = caterwaul_global.parse('undefined = void(0)');

//   Compilation options.
//   Gensym renaming will break some things that expect the compiled code to be source-identical to the original tree. As a result, I'm introducing an options hash that lets you tell the compiler
//   things like "don't rename the gensyms this time around". Right now gensym_renaming is the only option, and it defaults to true.

    caterwaul_global.compile = function (tree, environment, options) {
      options = merge({gensym_renaming: true}, options);

      var bindings = merge({}, this._environment || {}, environment || {}, tree.bindings()), variables = [undefined_binding], s = gensym('base');
      for (var k in bindings) if (own.call(bindings, k) && k !== 'this') variables.push(binding_template.replace({_variable: k, _base: s}));

      var variable_definitions = new this.syntax(',', variables).unflatten(),
          function_body        = bound_expression_template.replace({_bindings: variable_definitions, _expression: tree});

      if (options.gensym_renaming) {var renaming_table = this.gensym_rename_table(function_body);
                                    for (var k in bindings) own.call(bindings, k) && (bindings[renaming_table[k] || k] = bindings[k]);
                                    function_body = function_body.replace(renaming_table);
                                    s             = renaming_table[s]}

      try       {return (new Function(s, function_body)).call(bindings['this'], bindings)}
      catch (e) {throw new Error(e + ' while compiling ' + function_body)}};

//   Gensym erasure.
//   Gensyms are horrible. They look like gensym_foo_1_5fz3ubq_10cbjq3C, which both takes up a lot of space and is hard to read. Fortunately, we can convert them at compile-time. This is possible
//   because Javascript (mostly) supports alpha-conversion for functions.

//   I said "mostly" because some symbols are converted into runtime strings; these are property keys. In the unlikely event that you've got a gensym being used to dereference something, e.g.
//   foo.gensym, then renaming is no longer safe. This, as far as I know, is the only situation where renaming won't work as intended. Because I can't imagine a situation where this would
//   actually arise, I'm not handling this case yet. (Though let me know if I need to fix this.)

//   New gensym names are chosen by choosing the smallest nonnegative integer N such that the gensym's name plus N.toString(36) doesn't occur as an identifier anywhere in the code. (The most
//   elegant option is to use scope analysis to keep N low, but I'm too lazy to implement it.)

    caterwaul_global.gensym_rename_table = function (tree) {
      var names = {}, gensyms = [], gensym_pattern = /^gensym_(.*)_\d+_[^_]+_[^_]+$/;
      tree.reach(function (node) {var d = node.data; gensym_pattern.test(d) && (names[d] || gensyms.push(d)); names[d] = d.replace(gensym_pattern, '$1') || 'anon'});

      var unseen_count = {}, next_unseen = function (name) {if (! (name in names)) return name;
                                                            var n = unseen_count[name] || 0; while (names[name + (++n).toString(36)]); return name + (unseen_count[name] = n).toString(36)};

      for (var renamed = {}, i = 0, l = gensyms.length, g; i < l; ++i) renamed[g = gensyms[i]] || (names[renamed[g] = next_unseen(names[g])] = true);
      return renamed}})();

// Initialization method.
// Caterwaul 1.1 is a huge deviation from before. Now you don't use the global caterwaul as a compiler, because it isn't one. Rather, it's a compiler-generator. You pass in arguments to construct
// the new function. So, for example:

// | var compiler = caterwaul(my_macroexpander);
//   compiler(function () {return 5})()            // -> 5, unless your macroexpander does something really bizarre

// The function returned here will have a permanent link to the global caterwaul that generated it, so deglobalizing is a safe thing to do. These generated functions can be composed by doing the
// parse step ahead of time:

// | var my_caterwaul       = caterwaul(my_macroexpander);
//   var my_other_caterwaul = caterwaul(my_other_macroexpander);
//   var compiler           = function (tree) {
//     return caterwaul.compile(my_other_caterwaul(my_caterwaul(caterwaul.parse(tree))));
//   };

// This informs my_caterwaul and my_other_caterwaul that your intent is just to macroexpand trees to trees, not transform functions into other functions.

  caterwaul_global.init = function (macroexpander) {
    var result = function (f, environment, options) {
      return f.constructor === Function || f.constructor === String ? caterwaul_global.compile(result.call(result, caterwaul_global.parse(f)), environment, options) :
                                                      macroexpander ? f.rmap(function (node) {return macroexpander.call(result, node, environment, options)}) :
                                                                      f};
    result.global        = caterwaul_global;
    result.macroexpander = macroexpander;
    return result};

  caterwaul_global.initializer = initializer;
  caterwaul_global.clone       = function () {return merge(initializer(initializer, unique).deglobalize(), this)};

  return caterwaul = caterwaul_global});

// Generated by SDoc 

// Caterwaul standard library | Spencer Tipping
// Licensed under the terms of the MIT source code license

// Internal libraries.
// These operate on caterwaul in some way, but don't necessarily have an effect on generated code.



// Macro authoring utilities | Spencer Tipping
// Licensed under the terms of the MIT source code license

// Macro definitions.
// A macro is simply a partial function from source trees to source trees. It returns a falsy value if it cannot be applied to a given tree; otherwise it returns the replacement (as shown
// above). Because most macros end up replacing one pattern with another, caterwaul lets you use strings instead of requiring you to construct recognizer functions.

// The expander() method distributes across arrays. That is, you can give it an array of things that can be converted into expanders (strings, functions, syntax trees, or arrays), and it will
// build a function that runs backwards through the array, taking the last entry.

(function ($) {
  var syntax_manipulator = function (base_case) {
    var result = function (x) {if (x.constructor === Array) {for (var i = 0, l = x.length, ys = []; i < l; ++i) ys.push(result(x[i]));
                                                             return function (tree) {for (var i = ys.length - 1, r; i >= 0; --i) if (r = ys[i].call(this, tree)) return r}}

                          else return x.constructor === String   ? result($.parse(x)) :
                                      x.constructor === $.syntax ? base_case.call(this, x) : x};
    return result};

  $.pattern      = syntax_manipulator(function (pattern)     {return function (tree)  {return pattern.match(tree)}});
  $.expander     = syntax_manipulator(function (expander)    {return function (match) {return expander.replace(match)}});
  $.alternatives = syntax_manipulator(function (alternative) {throw new Error('must use replacer functions with caterwaul.alternatives()')});

  $.reexpander   = function (expander) {var e = $.expander(expander);
                                        return function (match) {var r = e.call(this, match); this.constructor === Function || console.log(this); return r && this(r)}};

  var composer = function (expander_base_case) {
    return function (pattern, expander) {var new_pattern = $.pattern(pattern), new_expander = expander_base_case(expander);
                                         return function (tree) {var match = new_pattern.call(this, tree); return match && new_expander.call(this, match)}}};

  $.replacer   = composer($.expander);
  $.rereplacer = composer($.reexpander);

// Global macroexpansion.
// This is a shorthand to enable one-off macroexpansion. The idea is that we build a temporary caterwaul function to do some temporary work.

  $.macroexpand = function (tree) {return $($.alternatives(Array.prototype.slice.call(arguments, 1)))(tree)}})(caterwaul);

// Generated by SDoc 





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
//   var m = caterwaul.replacer(anonymize('X[foo]'), ...);    // Matches against gensym_1_aj49Az0_885nr1q[foo]

// Each anonymizer uses a separate symbol table. This means that two anonymizers that match against 'A' (or any other macro pattern) will always map them to different gensyms.

(function ($) {$.anonymizer = function () {for (var translation_table = {}, i = 0, l = arguments.length; i < l; ++i) translation_table[arguments[i]] = $.gensym(arguments[i]);
                                           return function (node) {return $.parse(node).replace(translation_table)}}})(caterwaul);

// Generated by SDoc 




// Language specializations.
// These provide configurations that specialize caterwaul to operate well with a given programming language. This is relevant because not all languages compile to Javascript the same way, and
// caterwaul should be able to adapt to the syntactic limitations of generated code (and thus be usable with non-Javascript languages like Coffeescript).

// Also included is a standard set of words that can be combined with the Javascript forms to produce useful macros. Together these form a base language that is used by other parts of the
// standard library.



// Javascript-specific macros | Spencer Tipping
// Licensed under the terms of the MIT source code license

(function ($) {

// Structured forms in Javascript.
// These aren't macros, but forms. Each language has its own ways of expressing certain idioms; in Javascript we can set up some sensible defaults to make macros more consistent. For example,
// caterwaul pre-1.0 had the problem of wildly divergent macros. The fn[] macro was always prefix and required parameters, whereas /se[] was always postfix and had a single optional parameter.
// /cps[] was similarly postfix, which was especially inappropriate considering that it could theoretically handle multiple parameters.

// In caterwaul 1.0, the macro author's job is reduced to specifying which words have which behavior; the language driver takes care of the rest. For instance, rather than specifying the full
// pattern syntax, you just specify a word and its definition with respect to an opaque expression and perhaps set of modifiers. Here are the standard Javascript macro forms:

  $.js = function (macroexpander) {

// Javascript-specific shorthands.
// Javascript has some syntactic weaknesses that it's worth correcting. These don't relate to any structured macros, but are hacks designed to make JS easier to use.

//   String interpolation.
//   Javascript normally doesn't have this, but it's straightforward enough to add. This macro implements Ruby-style interpolation; that is, "foo#{bar}" becomes "foo" + bar. A caveat (though not
//   bad one in my experience) is that single and double-quoted strings are treated identically. This is because Spidermonkey rewrites all strings to double-quoted form.

//   This version of string interpolation is considerably more sophisticated than the one implemented in prior versions of caterwaul. It still isn't possible to reuse the same quotation marks
//   used on the string itself, but you can now include balanced braces in the interpolated text. For example, this is now valid:

//   | 'foo #{{bar: "bif"}.bar}'

//   There are some caveats; if you have unbalanced braces (even in substrings), it will get confused and misread the boundary of your text. So stuff like this won't work properly:

//   | 'foo #{"{" + bar}'          // won't find the ending properly and will try to compile the closing brace

    var string_interpolator = function (node) {
      var s = node.data, q = s.charAt(0), syntax = $.syntax;
      if (q !== '\'' && q !== '"' || ! /#\{[^\}]+\}/.test(s)) return false;             // DeMorgan's applied to (! ((q === ' || q === ") && /.../test(s)))

      for (var pieces = [], i = 1, l = s.length - 1, brace_depth = 0, got_hash = false, start = 1, c; i < l; ++i)
        if (brace_depth) if ((c = s.charAt(i)) === '}') --brace_depth || pieces.push(s.substring(start, i)) && (start = i + 1), got_hash = false;
                    else                                brace_depth += c === '{';
   else                  if ((c = s.charAt(i)) === '#') got_hash = true;
                    else if (c === '{' && got_hash)     pieces.push(s.substring(start, i - 1)), start = i + 1, ++brace_depth;
                    else                                got_hash = false;

      pieces.push(s.substring(start, l));

      for (var quoted = new RegExp('\\\\' + q, 'g'), i = 0, l = pieces.length; i < l; ++i) pieces[i] = i & 1 ? this($.parse(pieces[i].replace(quoted, q)).as('(')) :
                                                                                                               new syntax(q + pieces[i] + q);
      return new syntax('+', pieces).unflatten().as('(')};

//   Destructuring function creation.
//   This is a beautiful hack made possible by Internet Explorer. We can intercept cases of assigning into a function and rewrite them to create a function body. For example, f(x) = y becomes the
//   regular assignment f = function (x) {return y}. Because this macro is repeatedly applied we get currying for free.

//   There's a special case. You can grab the whole arguments array by setting something equal to it. For example, f(xs = arguments) = xs[0] + xs[1]. This makes it easy to use binding constructs
//   inside the body of the function without worrying whether you'll lose the function context.

    var function_rule        = $.rereplacer('_left(_args) = _right',            '_left = (function (_args) {return _right})'),
        function_args_rule   = $.rereplacer('_left(_var = arguments) = _right', '_left = (function () {var _var = arguments; return _right})'),

        function_destructure = function (node) {return function_args_rule.call(this, node) || function_rule.call(this, node)};

//   Modifier syntax.
//   These are the 'structured forms' I was talking about above. Prior to caterwaul 1.1 these were stored as individual pre-expanded macros. This had a number of problems, perhaps most notably
//   that it was extremely inefficient. I loaded up caterwaul in the REPL and found that caterwaul.js_ui(caterwaul.js_all()) had 329 macros installed. This meant 329 tree-match tests for every
//   function.

//   Now modifiers are stored on the compiler function directly. Some modifiers take parameters, so there is always some degree of overhead involved in determining whether a modifier case does in
//   fact match. However, there are only a few checks that need to happen before determining whether a modifier match is possible, unlike before.

    var bracket_modifier_form = $.pattern('_modifier[_expression]'),               slash_modifier_form = $.pattern('_expression /_modifier'),
        minus_modifier_form   = $.pattern('_expression -_modifier'),               in_modifier_form    = $.pattern('_modifier in _expression'),
        pipe_modifier_form    = $.pattern('_expression |_modifier'),               comma_modifier_form = $.pattern('_expression, _modifier'),

        dot_parameters        = $.pattern('_modifier._parameters'),                bracket_parameters  = $.pattern('_modifier[_parameters]'),

        parameterized_wickets = $.pattern('_expression <_modifier> _parameters'),  parameterized_minus = $.pattern('_expression -_modifier- _parameters'),

        modifier = function (node) {var parameterized_match = parameterized_wickets.call(this, node) || parameterized_minus.call(this, node);
                                    if (parameterized_match)
                                      for (var es = this.parameterized_modifiers, i = es.length - 1, r; i >= 0; --i)
                                        if (r = es[i].call(this, parameterized_match)) return r;

                                    var regular_match = bracket_modifier_form.call(this, node) || slash_modifier_form.call(this, node) ||
                                                        minus_modifier_form  .call(this, node) || in_modifier_form   .call(this, node) ||
                                                        pipe_modifier_form   .call(this, node) || comma_modifier_form.call(this, node);

                                    if (regular_match) {
                                      // Could still be a parameterized function; try to match one of the parameter forms against the modifier.
                                      var parameter_match = dot_parameters    .call(this, regular_match._modifier) ||
                                                            bracket_parameters.call(this, regular_match._modifier);

                                      if (parameter_match) {
                                        regular_match._modifier   = parameter_match._modifier;
                                        regular_match._parameters = parameter_match._parameters;

                                        for (var es = this.parameterized_modifiers, i = es.length - 1, r; i >= 0; --i)
                                          if (r = es[i].call(this, regular_match)) return r}

                                      else
                                        for (var es = this.modifiers, i = es.length - 1, r; i >= 0; --i)
                                          if (r = es[i].call(this, regular_match)) return r}};

//   Tying it all together.
//   This is where we write a big macroexpander to perform all of the tasks mentioned above. It just falls through cases, which is now a fairly standard pattern for macros. There is a high-level
//   optimization that we can perform: leaf nodes can only be expanded by the string interpolator, so we try this one first and reject any further matching attempts if the node has no children.
//   Because roughly half of the nodes will have no children, this saves on average 5 matching attempts per node.

//   I've got two closures here to avoid putting a conditional in either one of them. In particular, we know already whether we got a macroexpander, so there's no need to test it inside the
//   function (which will be called lots of times).

    var result = macroexpander ? $(function (node) {return macroexpander.call(this, node) ||
                                                           string_interpolator.call(this, node) || node.length && (modifier            .call(this, node) ||
                                                                                                                   function_destructure.call(this, node))}) :

                                 $(function (node) {return string_interpolator.call(this, node) || node.length && (modifier            .call(this, node) ||
                                                                                                                   function_destructure.call(this, node))});
    result.modifiers               = [];
    result.parameterized_modifiers = [];

    return result}})(caterwaul);

// Generated by SDoc 





// Common adjectives and adverbs | Spencer Tipping
// Licensed under the terms of the MIT source code license

// Introduction.
// This behavior installs a bunch of common words and sensible behaviors for them. The goal is to handle most Javascript syntactic cases by using words rather than Javascript primitive syntax.
// For example, constructing lambdas can be done with 'given' rather than the normal function() construct:

// | [1, 2, 3].map(x + 1, given[x])        // -> [1, 2, 3].map(function (x) {return x + 1})

// In this case, given[] is registered as a postfix binary adverb. Any postfix binary adverb forms added later will extend the possible uses of given[].

(function ($) {
  $.words = function (caterwaul_function) {
    var filtered_expander      = function (word, expander) {return function (match) {return match._modifier.data === word && expander.call(this, match)}},

        modifier               = function (word, expander) {caterwaul_function.modifiers              .push(filtered_expander(word, expander))},
        parameterized_modifier = function (word, expander) {caterwaul_function.parameterized_modifiers.push(filtered_expander(word, expander))};

//   Quotation.
//   qs[] comes from pre-1.0 caterwaul; this lets you quote a piece of syntax, just like quote in Lisp. The idea is that qs[something] returns 'something' as a syntax tree. qse[] is a variant
//   that macroexpands the syntax tree before returning it; this used to be there for performance reasons (now irrelevant with the introduction of precompilation) but is also useful for macro
//   reuse.

    modifier('qs',  function (match) {return new $.ref(match._expression, 'qs')});
    modifier('qse', function (match) {return new $.ref(this(match._expression), 'qse')});

//   Macroexpansion control.
//   Sometimes it's useful to request an additional macroexpansion or suppress macroexpansion for a piece of code. The 'reexpand' and 'noexpand' modifiers do these two things, respectively.

    modifier('reexpand', function (match) {return this(this(match._expression))});
    modifier('noexpand', function (match) {return match._expression});

//   Error handling.
//   Javascript in particular has clunky error handling constructs. These words provide error handling in expression context.

    modifier              ('raise',  $.reexpander('(function () {throw _expression}).call(this)'));
    parameterized_modifier('rescue', $.reexpander('(function () {try {return (_expression)} catch (e) {return (_parameters)}}).call(this)'));

// Scoping and referencing.
// These all impact scope or references somehow -- in other words, they create variable references but don't otherwise impact the nature of evaluation.

//   Function words.
//   These define functions in some form. given[] and bgiven[] are modifiers to turn an expression into a function; given[] creates a regular closure while bgiven[] preserves the closure binding.
//   For example:

//   | var f = x + 1 -given [x];
//     var f = x + 1 -given.x;

    parameterized_modifier('given',  $.reexpander('(function (_parameters) {return _expression})'));
    parameterized_modifier('bgiven', $.reexpander('(function (t, f) {return (function () {return f.apply(t, arguments)})})(this, (function (_parameters) {return _expression}))'));

//   Nullary function words.
//   These are used to provide quick function wrappers for values. There are actually a couple of possibilities here. One is to wrap a value in a nullary function that recomputes its expression
//   each time, and another is to compute the value lazily and return the cached value for each future invocation. The modifiers are called 'delay' and 'lazy', and they always bind to the
//   surrounding context (analogous to bgiven, above).

//   Here are their operational semantics by example:

//   | var x = 10;
//     var f = ++x -delay;
//     f()         -> 11
//     f()         -> 12
//     var g = ++x -lazy;
//     g()         -> 13
//     g()         -> 13

    modifier('delay', $.reexpander('(function (t, f) {return (function () {return f.call(t)})})(this, (function () {return _expression}))'));
    modifier('lazy',  $.reexpander('(function (t, f, v, vc) {return (function () {return vc ? v : (vc = true, v = f.call(t))})})(this, (function () {return _expression}))'));

//   Side-effecting.
//   The goal here is to take an existing value, modify it somehow, and then return it without allocating an actual variable. This can be done using the /se[] adverb. Older versions of caterwaul
//   bound the variable as _; version 1.0 changes this convention to bind the variable to 'it'. For example:

//   | hash(k, v) = {} /se[it[k] = v];
//     compose(f, g)(x) = g(x) -re- f(it);

    parameterized_modifier('se', $.reexpander('(function (it) {return (_parameters), it}).call(this, (_expression))'));
    parameterized_modifier('re', $.reexpander('(function (it) {return (_parameters)}).call(this, (_expression))'));

//   Scoping.
//   You can create local variables by using the where[] modifier. If you do this, the locals can all see each other since they're placed into a 'var' statement. For example:

//   | where[x = 10][alert(x)]
//     alert(x), where[x = 10]

    parameterized_modifier('where', $.reexpander('(function () {var _parameters; return (_expression)}).call(this)'));

// Control flow modifiers.
// These impact how something gets evaluated.

//   Conditionals.
//   These impact whether an expression gets evaluated. x /when.y evaluates to x when y is true, and y when y is false. Similarly, x /unless[y] evaluates to x when y is false, and !y when y is
//   truthy.

    parameterized_modifier('when',   $.reexpander('((_parameters) && (_expression))'));
    parameterized_modifier('unless', $.reexpander('(! (_parameters) && (_expression))'));

    return caterwaul_function}})(caterwaul);

// Generated by SDoc 




// Libraries.
// These apply more advanced syntactic transforms to the code and can depend on everything above.



// Sequence comprehensions | Spencer Tipping
// Licensed under the terms of the MIT source code license

// Introduction.
// Caterwaul pre-1.0 had a module called 'seq' that provided a finite and an infinite sequence class and localized operator overloading to make them easier to use. Using wrapper classes was both
// unnecessary (since most sequence operations were done inside the seq[] macro anyway) and problematic, as it required the user to remember to cast sequences back into arrays and such. It also
// reduced runtime performance and created a lot of unnecessary copying.

// Caterwaul 1.0 streamlines the seq[] macro by removing the sequence classes and operating directly on arrays or array-like things. Not everything in Javascript is an array, but I'm going to
// pretend that everything is (or at least looks like one) and rely on the [i] and .length properties. This allows the sequence library to (1) have a very thin design, and (2) compile down to
// tight loops without function calls.

// Notation.
// The notation is mostly a superset of the pre-1.0 sequence notation. Operators that have the same functionality as before (others are reserved for future meanings, but probably won't do what
// they used to):

// | *  = map                      e.g.  [1, 2, 3] *[x + 1] |seq            ->  [2, 3, 4]
//   *! = each                     e.g.  [1, 2, 3] *![console.log(x)] |seq  ->  [1, 2, 3]  (and logs 1, 2, 3)
//   /  = foldl                    e.g.  [1, 2, 3] /[x - next] |seq         ->  -4
//   /! = foldr                    e.g.  [1, 2, 3] /![x - next] |seq        ->  2
//   %  = filter                   e.g.  [1, 2, 3] %[x & 1] |seq            ->  [1, 3]
//   %! = filter-not               e.g.  [1, 2, 3] %![x & 1] |seq           ->  [2]
//   +  = concatenate              e.g.  [1, 2, 3] + [4, 5] |seq            ->  [1, 2, 3, 4, 5]
//   -  = cartesian product        e.g.  [1, 2] - [3, 4] |seq               ->  [[1, 3], [1, 4], [2, 3], [2, 4]]
//   ^  = zip                      e.g.  [1, 2, 3] ^ [4, 5, 6] |seq         ->  [[1, 4], [2, 5], [3, 6]]
//   |  = exists                   e.g.  [1, 2, 3] |[x === 2] |seq          ->  true

// Note that ^ has higher precedence than |, so we can use it in a sequence comprehension without interfering with the |seq macro (so long as the |seq macro is placed on the right).

//   Modifiers.
//   Modifiers are unary operators that come after the primary operator. These have the same (or similar) functionality as before:

//   | ~ = interpret something in sequence context   e.g.  [[1], [2], [3]] *~[x *[x + 1]] |seq  ->  [[2], [3], [4]]
//     x = rename the variable from 'x'              e.g.  [1, 2, 3] *y[y + 1] |seq             ->  [2, 3, 4]

//   Here, 'x' means any identifier. Caterwaul 1.0 introduces some new stuff. The map function now has a new variant, *~!. Filter also supports this variant. Like other operators, they support
//   variable renaming and sequence context. You can do this by putting those modifiers after the *~!; for instance, xs *~!~[exp] interprets 'exp' in sequence context. Similarly, *~!y[exp] uses
//   'y' rather than 'x'.

//   | *~! = flatmap         e.g. [1, 2, 3] *~![[x, x + 1]] |seq      ->  [1, 2, 2, 3, 3, 4]
//     %~! = map/filter      e.g. [1, 2, 3] %~![x & 1 && x + 1] |seq  ->  [2, 4]
//     /~! = unfold          e.g. 1 /~![x < 5 ? x + 1 : null] |seq    ->  [1, 2, 3, 4, 5]

//   Variables.
//   All of the variables from before are still available and the naming is still mostly the same. Each block has access to 'x', which is the immediate element. 'xi' is the index, and 'x0' is the
//   alternative element for folds. Because all sequences are finite, a new variable 'xl' is available -- this is the total number of elements in the source sequence. The sequence object is no
//   longer accessible because there may not be a concrete sequence. (I'm leaving room for cross-operation optimizations in the future.) The renaming is done exactly as before:

//   | [1, 2, 3] *[x + 1] |seq             -> [2, 3, 4]
//     [1, 2, 3] *y[y + 1] |seq            -> [2, 3, 4]
//     [1, 2, 3] *[xi] |seq                -> [0, 1, 2]
//     [1, 2, 3] *foo[fooi] |seq           -> [0, 1, 2]

//   Word operators.
//   Some operators are designed to work with objects, just like in prior versions. However, the precedence has been changed to improve ergonomics. For example, it's uncommon to use objects as an
//   intermediate form because all of the sequence operators are built around arrays. Similarly, it's very common to unpack objects immediately before using them. Therefore the unpack operators
//   should be very high precedence and the pack operator should have very low precedence:

//   | {foo: 'bar'} /keys |seq             -> ['foo']
//     {foo: 'bar'} /values |seq           -> ['bar']
//     {foo: 'bar'} /pairs |seq            -> [['foo', 'bar']]
//     {foo: 'bar'} /pairs |object |seq    -> {foo: 'bar'}

//   Note that unlike regular modifiers you can't use a variety of operators with each word. Each one is defined for just one form. I may change this in the future, but I'm reluctant to start
//   with it because it would remove a lot of syntactic flexibility.

//   Update: After using this in the field, I've found that the low-precedence |object form is kind of a pill. Now the sequence library supports several variants, /object, -object, and |object.

//   Prefixes.
//   New in Caterwaul 1.0.3 is the ability to specify the scope of operation for sequence macros. For instance, you might want to operate on one of several types of data. Normally the sequence
//   macro assumes arrays, but you may want to modify a unary operator such as *[] to transform an object's keys or values. Prefixes let you do this.

//   | o %k*[x.substr(1)] -seq     (equivalent to  o /pairs *[[x[0].substr(1), x[1]]]  -object -seq)
//     o %v*[x.split(/a/)] -seq    (equivalent to  o /pairs *[[x[0], x[1].split(/a/)]] -object -seq)

//   Prefixes are generally faster than manual unpacking and repacking. However, some operations (e.g. fold and its variants) don't work with prefixes. The reason is that it's unclear what to do
//   with the values that correspond to a folded key, for instance. (Imagine what this would mean: o %k/[x + x0] -seq) The following operators can be used with prefixes:

//   | *   = map
//     *!  = each          <- returns the original object
//     %   = filter        <- removes key/value pairs
//     %!  = filter-not
//     %~! = map-filter    <- changes some key-value pairs, removes others

//   These operators support the standard set of modifiers, including ~ prefixing and variable renaming. However, indexing variables such as xi and xl are unavailable because no temporary arrays
//   are constructed.

//   The following operators cannot be used with prefixes because it's difficult to imagine what purpose they would serve:

//   | *~! = flatmap
//     /   = foldl
//     /!  = foldr
//     /~! = unfold

//   None of the binary operators (e.g. +, -, ^, etc) can be used with prefixes because of precedence. Any prefix would bind more strongly to the left operand than it would to the binary
//   operator, which would disrupt the syntax tree.

//   Folding prefixes.
//   New in Caterwaul 1.1 is the ability to specify fold prefixes. This allows you to specify the initial element of a fold:

//   | xs /[0][x0 + x*x] -seq              (sum the squares of each element)
//     xs /~[[]][x0 + [x, x + 1]] -seq     (equivalent to  xs *~![[x, x + 1]] -seq)

//   Function promotion.
//   Caterwaul 1.1 also adds support for implicit function promotion of sequence block expressions:

//   | f(x) = x + 1
//     seq in [1, 2, 3] *f
//     seq in [-1, 0, 1] %f

//   You can use this to make method calls, which will remain bound to the original object:

//   | xs *foo.bar -seq            (equivalent to  xs *[foo.bar(x)] -seq)
//     xs *(bar + bif).baz -seq    (equivalent to  xs *[(bar + bif).baz(x)] -seq)

//   The only restriction is that you can't use a bracketed expression as the last operator; otherwise it will be interpreted as a block. You also can't invoke a promoted function in sequence
//   context, since it is unclear what the intent would be.

//   Numbers.
//   Caterwaul 1.0 removes support for the infinite stream of naturals (fun though it was), since all sequences are now assumed to be finite and are strictly evaluated. So the only macro
//   available is n[], which generates finite sequences of evenly-spaced numbers:

//   | n[1, 10] |seq               ->  [1, 2, 3, 4, 5, 6, 7, 8, 9]
//     n[10] |seq                  ->  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
//     n[0, 10, 2] |seq            ->  [0, 2, 4, 6, 8]

// Generated code.
// Previously the code was factored into separate methods that took callback functions. (Basically the traditional map/filter/each arrangement in functional languages.) However, now the library
// optimizes the methods out of the picture. This means that now we manage all of the dataflow between the different sequence operators. I thought about allocating gensym variables -- one for
// each temporary result -- but this means that the temporary results won't be garbage-collected until the entire sequence comprehension is complete. So instead it generates really gnarly code,
// with each dependent sequence listed in the for-loop variable initialization.

// Luckily this won't matter because, like, there aren't any bugs or anything ;)

// Portability.
// The seq library is theoretically portable to syntaxes besides JS, but you'll probably want to do some aggressive preprocessing if you do this. It assumes a lot about operator precedence and
// such (from a design perspective).

caterwaul.words(caterwaul.js())(function ($) {
  $.seq(caterwaul_function) = caterwaul_function -se-
                              it.modifiers.push(given.match in seq_expand.call(seq_expand, anon_pattern.replace({_x: match._expression})) -re- this(it) /when.it
                                                               -when [match._modifier.data === 'seq'])

                              -where [anon_pattern = anon('S[_x]'),
                                      seq_expand   = $($.alternatives(operator_macros.concat(word_macros)))],

  where [anon            = $.anonymizer('S'),
         rule(p, e)      = $.rereplacer(anon(p), e.constructor === Function ? given.match in e.call(this, match) : anon(e)),

         operator_macros = [rule('S[_x]', '_x'),         rule('S[_x[_y]]', 'S[_x][S[_y]]'),
                            rule('S[(_x)]', '(S[_x])'),  rule('S[_x, _y]', 'S[_x], S[_y]'),

                            operator('',  '|', {normal: exists}),

                            operator('',  '*', {normal:  map,     bang:  each,        tbang: flatmap}),      binary_operator('+', concat),  binary_operator('^', zip),
                            operator('',  '%', {normal:  filter,  bang:  filter_not,  tbang: map_filter}),   binary_operator('-', cross),
                            operator('',  '/', {normal:  foldl,   bang:  foldr,       tbang: unfold,
                                                inormal: ifoldl,  ibang: ifoldr}),

                            operator('k', '*', {normal:  kmap,    bang:  keach}),                            operator('v', '*', {normal: vmap,    bang: veach}),
                            operator('k', '%', {normal:  kfilter, bang:  kfilter_not, tbang: kmap_filter}),  operator('v', '%', {normal: vfilter, bang: vfilter_not, tbang: vmap_filter})]

                    -where [operator(prefix, op, forms) = []
                              -se- it.push(trule(op, 'S[_xs #{p}*_f]',   'S[_xs #{p}*[_f(x)]]'))   /when [forms.normal || forms.inormal]
                              -se- it.push(trule(op, 'S[_xs #{p}*!_f]',  'S[_xs #{p}*![_f(x)]]'))  /when [forms.bang   || forms.ibang]
                              -se- it.push(trule(op, 'S[_xs #{p}*~!_f]', 'S[_xs #{p}*~![_f(x)]]')) /when [forms.tbang  || forms.itbang]

                              -se- it.push(trule(op, 'S[_xs #{p}*[_f]]',          forms.normal),   trule(op, 'S[_xs #{p}*_var[_f]]',          forms.normal))  /when [forms.normal]
                              -se- it.push(trule(op, 'S[_xs #{p}*![_f]]',         forms.bang),     trule(op, 'S[_xs #{p}*!_var[_f]]',         forms.bang))    /when [forms.bang]
                              -se- it.push(trule(op, 'S[_xs #{p}*~![_f]]',        forms.tbang),    trule(op, 'S[_xs #{p}*~!_var[_f]]',        forms.tbang))   /when [forms.tbang]

                              -se- it.push(trule(op, 'S[_xs #{p}*[_init][_f]]',   forms.inormal),  trule(op, 'S[_xs #{p}*_var[_init][_f]]',   forms.inormal)) /when [forms.inormal]
                              -se- it.push(trule(op, 'S[_xs #{p}*![_init][_f]]',  forms.ibang),    trule(op, 'S[_xs #{p}*!_var[_init][_f]]',  forms.ibang))   /when [forms.ibang]
                              -se- it.push(trule(op, 'S[_xs #{p}*~![_init][_f]]', forms.itbang),   trule(op, 'S[_xs #{p}*~!_var[_init][_f]]', forms.itbang))  /when [forms.itbang]

                              -re- it.concat(context_conversions(p, op))

                              -where [p = prefix && '%#{prefix}'],

                            binary_operator(op, f)     = rule(t('S[_xs + _ys]'), f) -where [t(pattern) = anon(pattern).replace({'+': op})]]

                    -where [template(op, p)            = anon(p).replace({'*': op}),
                            trule(op, p, e)            = rule(template(op, p), e.constructor === Function ? e : template(op, e)),

                            context_conversions(p, op) = [trule(op, 'S[_xs #{p}*~_body]',   'S[_xs #{p}*S[_body]]'),
                                                          trule(op, 'S[_xs #{p}*!~_body]',  'S[_xs #{p}*!S[_body]]'),
                                                          trule(op, 'S[_xs #{p}*~!~_body]', 'S[_xs #{p}*~!S[_body]]')],

                            loop_anon                  = $.anonymizer('xs', 'ys', 'x', 'y', 'i', 'j', 'l', 'lj', 'r', 'o', 'k'),
                            loop_form(x)               = loop_anon(scoped(anon(x))),

                            scope                      = anon('(function (xs) {_body}).call(this, S[_xs])'),
                            scoped(tree)               = scope.replace({_body: tree}),

                            op_form(pattern)           = form.replace(variables_for(match)) -given.match -where [form = loop_form(pattern)],

                            map         = op_form('for (var ys = [], _xi = 0, _xl = xs.length, _x; _xi < _xl; ++_xi) _x = xs[_xi], ys.push((_f));                                 return ys'),
                            each        = op_form('for (var          _xi = 0, _xl = xs.length, _x; _xi < _xl; ++_xi) _x = xs[_xi], (_f);                                          return xs'),
                            flatmap     = op_form('for (var ys = [], _xi = 0, _xl = xs.length, _x; _xi < _xl; ++_xi) _x = xs[_xi], ys.push.apply(ys, ys.slice.call((_f)));        return ys'),

                            filter      = op_form('for (var ys = [], _xi = 0, _xl = xs.length, _x; _xi < _xl; ++_xi) _x = xs[_xi], (_f) && ys.push(_x);                           return ys'),
                            filter_not  = op_form('for (var ys = [], _xi = 0, _xl = xs.length, _x; _xi < _xl; ++_xi) _x = xs[_xi], (_f) || ys.push(_x);                           return ys'),
                            map_filter  = op_form('for (var ys = [], _xi = 0, _xl = xs.length, _x, _y; _xi < _xl; ++_xi) _x = xs[_xi], (_y = (_f)) && ys.push(_y);                return ys'),

                            foldl       = op_form('for (var _x0 = xs[0], _xi = 1, _xl = xs.length, _x;            _xi < _xl; ++_xi) _x = xs[_xi], _x0 = (_f);                     return _x0'),
                            foldr       = op_form('for (var _xl = xs.length - 1, _xi = _xl - 1, _x0 = xs[_xi], _x; _xi >= 0; --_xi) _x = xs[_xi], _x0 = (_f);                     return _x0'),
                            unfold      = op_form('for (var ys = [], _x = xs, _xi = 0;                          _x !== null; ++_xi) ys.push(_x), _x = (_f);                       return ys'),

                            ifoldl      = op_form('for (var _x0 = (_init), _xi = 0, _xl = xs.length, _x;      _xi < _xl; ++_xi) _x = xs[_xi], _x0 = (_f);                         return _x0'),
                            ifoldr      = op_form('for (var _xl = xs.length - 1, _xi = _xl, _x0 = (_init), _x; _xi >= 0; --_xi) _x = xs[_xi], _x0 = (_f);                         return _x0'),

                            exists      = op_form('for (var _x = xs[0], _xi = 0, _xl = xs.length, x; _xi < _xl; ++_xi) {_x = xs[_xi]; if (y = (_f)) return y} return false'),

                            concat      = op_form('return xs.concat(S[_ys])'),
                            zip         = op_form('for (var ys = S[_ys], pairs = [], i = 0, l = xs.length; i < l; ++i) pairs.push([xs[i], ys[i]]); return pairs'),
                            cross       = op_form('for (var ys = S[_ys], pairs = [], i = 0, l = xs.length, lj = ys.length; i < l; ++i) ' +
                                                    'for (var j = 0; j < lj; ++j) pairs.push([xs[i], ys[j]]);' + 'return pairs'),

                            kmap        = op_form('var r = {};        for (var _x in xs) if (Object.prototype.hasOwnProperty.call(xs, _x)) r[_f] = xs[_x];                        return r'),
                            keach       = op_form('                   for (var _x in xs) if (Object.prototype.hasOwnProperty.call(xs, _x)) _f;                                    return xs'),

                            kfilter     = op_form('var r = {};        for (var _x in xs) if (Object.prototype.hasOwnProperty.call(xs, _x) &&      (_f))  r[_x] = xs[_x];          return r'),
                            kfilter_not = op_form('var r = {};        for (var _x in xs) if (Object.prototype.hasOwnProperty.call(xs, _x) &&    ! (_f))  r[_x] = xs[_x];          return r'),
                            kmap_filter = op_form('var r = {}, x;     for (var _x in xs) if (Object.prototype.hasOwnProperty.call(xs, _x) && (x = (_f))) r[x]  = xs[_x];          return r'),

                            vmap        = op_form('var r = {}, _x;    for (var  k in xs) if (Object.prototype.hasOwnProperty.call(xs, k)) _x = xs[k], r[k] = (_f);                return r'),
                            veach       = op_form('var _x;            for (var  k in xs) if (Object.prototype.hasOwnProperty.call(xs, k)) _x = xs[k], _f;                         return xs'),

                            vfilter     = op_form('var r = {}, _x;    for (var  k in xs) if (Object.prototype.hasOwnProperty.call(xs, k)) _x = xs[k],        (_f) && (r[k] = _x); return r'),
                            vfilter_not = op_form('var r = {}, _x;    for (var  k in xs) if (Object.prototype.hasOwnProperty.call(xs, k)) _x = xs[k],        (_f) || (r[k] = _x); return r'),
                            vmap_filter = op_form('var r = {}, _x, x; for (var  k in xs) if (Object.prototype.hasOwnProperty.call(xs, k)) _x = xs[k], x = (_f), x && (r[k] =  x); return r'),

                            variables_for(m) = $.merge({}, m, prefixed_hash(m._var)),
                            prefixed_hash(p) = {_x: name, _xi: '#{name}i', _xl: '#{name}l', _x0: '#{name}0'} -where [name = p && p.data || 'x']],

         word_macros     = [rule('S[n[_upper]]',                n),  rule('S[_o /keys]',   keys),    rule('S[_o |object]', object),
                            rule('S[n[_lower, _upper]]',        n),  rule('S[_o /values]', values),  rule('S[_o -object]', object),
                            rule('S[n[_lower, _upper, _step]]', n),  rule('S[_o /pairs]',  pairs),   rule('S[_o /object]', object)]

                    -where [n(match)  = n_pattern.replace($.merge({_lower: '0', _step: '1'}, match)),
                            n_pattern = anon('(function (i, u, s) {if ((u - i) * s <= 0) return [];' +                // Check for degenerate iteration
                                                                  'for (var r = [], d = u - i; d > 0 ? i < u : i > u; i += s) r.push(i); return r})((_lower), (_upper), (_step))'),

                            scope     = anon('(function (o) {_body}).call(this, (S[_o]))'),
                            scoped(t) = scope.replace({_body: t}),

                            form(p)   = tree.replace(match) -given.match -where [tree = scoped(anon(p))],
                            keys      = form('var ks = []; for (var k in o) Object.prototype.hasOwnProperty.call(o, k) && ks.push(k); return ks'),
                            values    = form('var vs = []; for (var k in o) Object.prototype.hasOwnProperty.call(o, k) && vs.push(o[k]); return vs'),
                            pairs     = form('var ps = []; for (var k in o) Object.prototype.hasOwnProperty.call(o, k) && ps.push([k, o[k]]); return ps'),

                            object    = form('for (var r = {}, i = 0, l = o.length, x; i < l; ++i) x = o[i], r[x[0]] = x[1]; return r')]]})(caterwaul);

// Generated by SDoc 




  caterwaul.js_all = function () {return this.seq(this.words(this.js()))};

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

caterwaul.words(caterwaul.js())(function ($) {

//   Precompiled output format.
//   The goal of precompilation is to produce code whose behavior is identical to the original. Caterwaul can do this by taking a function whose behavior we want to emulate. It then executes the
//   function with an annotated copy of the caterwaul compiler, tracing calls to compile(). It assumes, incorrectly in pathological cases, that the macroexpansion step does not side-effect
//   against caterwaul or other escaping values. If it does, the precompiled code won't reflect those side-effects.

//   The output function performs side-effects necessary to emulate the behavior of your macroexpanded code. All other behavior performed by the precompiled function will be identical to the
//   original. Here's an example of how it is used:

//   | var f = caterwaul.precompile(function () {
//       alert('hi');
//       caterwaul.js_all()(function () {
//         console.log(x /given.y, qs[foo]);
//       })();
//       return 10;
//     });

//   After this statement, f.toString() will look something like this (except all mashed together, because Caterwaul doesn't format generated code):

//   | function () {
//       alert('hi');
//       caterwaul.js_all()(caterwaul.precompiled_internal((function () {
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

    annotate_macro_generator(template)(references)(match) = result -se [references[s] = {tree: result}]
                                                                   -where [s      = $.gensym('mark'),
                                                                           result = template.replace({_args: match._args, _gensym: s, _body: annotate_functions_in(match._body, references)})],

    mark_nontrivial_function_macro = annotate_macro_generator(nontrivial_function_gensym_template),
    mark_trivial_function_macro    = annotate_macro_generator(trivial_function_gensym_template),

//   Macroexpansion for function origins.
//   The function annotation is done by a macro that matches against each embedded function. Only one level of precompilation is applied; if you have invocations of caterwaul from inside
//   transformed functions, these sub-functions won't be identified and thus won't be precompiled. (It's actually impossible to precompile them in the general case since we don't ultimately know
//   what part of the code they came from.)

//   Note that the ordering of trivial and nontrivial cases here is important. Later macros take precedence over earlier ones, so we use the most specific case last and let it fall back to the
//   more generic case.

    annotate_functions_in(tree, references) = $.macroexpand(tree, $.replacer(trivial_function_pattern,    mark_trivial_function_macro(references)),
                                                                  $.replacer(nontrivial_function_pattern, mark_nontrivial_function_macro(references))),

//   Also, an interesting failure case has to do with duplicate compilation:

//   | var f = function () {...};
//     caterwaul.js_all()(f);
//     caterwaul.js_ui(caterwaul.js_all())(f);

//   In this example, f() will be compiled twice under two different configurations. But because the replacement happens against the original function (!) due to lack of flow analysis, we won't
//   be able to substitute just one new function for the old one. In this case an error is thrown (see below).

//   Compilation wrapper.
//   Functions that get passed into compile() are assumed to be fully macroexpanded. If the function contains a gensym marker that we're familiar with, then we register the compiled function as
//   the final form of the original. Once the to-be-compiled function returns, we'll have a complete table of marked functions to be converted. We can then do a final pass over the original
//   source, replacing the un-compiled functions with compiled ones.

    function_key(tree) = matches._gensym.data -when.matches -where [matches = nontrivial_gensym_detection_pattern.match(tree) ||
                                                                              trivial_gensym_detection_pattern   .match(tree)],
    mark_as_compiled(references, k, tree, environment) = references[k]
                                                         -se- raise [new Error('detected multiple compilations of #{references[k].tree}')] /when [references[k].compiled]
                                                         -se [references[k].compiled = tree, references[k].environment = environment] -when [k && references[k]],

    wrapped_compile(original, references)(tree, environment, options) = original.call(this, tree, environment, options)
                                                                        -se- mark_as_compiled(references, function_key(tree), tree, $.merge({}, this._environment || {}, environment)),

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
                                                                -where [children = new $.syntax(',', serialize_syntax(it) -over.value).unflatten()],

      serialize_ref(value, name, seen) = ! value                        ? '' + value :
                                         value.constructor === $.syntax ? seen[value.id()] || (seen[value.id()] = name) -re- serialize_syntax(value) :
                                                                          raise [new Error('syntax ref value is not serializable: #{value}')],

//     Variable table generation.
//     Now we just dive through the syntax tree, find everything that binds a value, and install a variable for it.

      single_variable(name, value)      = closure_variable_template.replace({_var: name, _value: value}),
      names_and_values_for(environment) = single_variable(it, environment[it]) -over_keys.environment,

      tree_variables(tree)              = vars -se- tree.reach(given.n in vars.push(single_variable(n.data, serialize_ref(n.value, n.data, seen))) -when [n && n.binds_a_value])
                                               -where [vars = [], seen = {}],

      variables_for(tree, environment)  = where [all_variables = names_and_values_for(environment).concat(tree_variables(tree))]
                                                [all_variables.length ? new $.syntax(';', all_variables) : closure_null_template],

//     Closure state generation.
//     This is where it all comes together. Given an original function, we construct a replacement function that has been marked by caterwaul as being precompiled.

      precompiled_closure(tree, environment)  = closure_template.replace({_vars: variables_for(tree, environment), _value: tree}),
      precompiled_function(tree, environment) = signal_already_compiled(precompiled_closure(tree, environment)),

//   Substitution.
//   Once the reference table is fully populated, we perform a final macroexpansion pass against the initial source tree. This time, rather than annotating functions, we replace them with their
//   precompiled versions. The substitute_precompiled() function returns a closure that expects to be used as a macroexpander whose pattern is gensym_detection_pattern.

    substitute_precompiled(references)(match) = precompiled_function(ref.compiled, ref.environment) -when[ref && ref.compiled] -where[ref = references[match._gensym.data]],

    perform_substitution(references, tree)    = $.macroexpand(tree, $.replacer([trivial_gensym_detection_pattern, nontrivial_gensym_detection_pattern], substitute_precompiled(references))),

//     Gensym removal.
//     After we're done compiling we should nuke all of the gensyms we introduced to mark the functions. The remove_gensyms() function does this.

      reconstruct_original(references, match)      = where [new_match = {_body: remove_gensyms(references, match._body), _args: match._args}]
                                                           [match._args ? nontrivial_function_pattern.replace(new_match) : trivial_function_pattern.replace(new_match)],

      remove_referenced_gensyms(references)(match) = reconstruct_original(references, match) -when[ref && ref.tree] -where[ref = references[match._gensym.data]],

      remove_gensyms(references, tree)             = $.macroexpand(tree, $.replacer([trivial_gensym_detection_pattern, nontrivial_gensym_detection_pattern],
                                                                                    remove_referenced_gensyms(references))),

//   Tracing.
//   This is where we build the references hash. To do this, we first annotate the functions, build a traced caterwaul, and then run the function that we want to precompile. The traced caterwaul
//   builds references for us.

    annotated_caterwaul(caterwaul, references) = caterwaul.clone() -se [it.compile = wrapped_compile(it.compile, references)],
    trace_execution(caterwaul, f)              = {references: references, annotated: annotated}
                                                 -se- caterwaul.compile(annotated, {caterwaul: annotated_caterwaul(caterwaul, references)}, {gensym_renaming: false})()
                                                 -where [references = {}, annotated = annotate_functions_in($.parse(f), references)]]})(caterwaul);

// Generated by SDoc 




// Generated by SDoc 

// Offline precompilation.
// Uses caterwaul's precompile() method.

var code = require('fs').readFileSync(process.argv[2], 'utf8');
require('fs').writeFileSync(process.argv[2].replace(/\.js$/, '.pre.js'),
                            caterwaul.precompile('function () {' + code + '}').toString().replace(/^[\s\n]*function\s*\([^)]*\)[\s\n]*\{((?:.|\n)*)\}[\s\n]*$/, '$1'), 'utf8');
// Generated by SDoc 

// Generated by SDoc 
