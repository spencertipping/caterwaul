// Caterwaul JS | Spencer Tipping
// Licensed under the terms of the MIT source code license

// Introduction.
// Caterwaul is a Javascript-to-Javascript compiler. Visit http://caterwauljs.org for information about how and why you might use it.

(function (f) {return f(f)})(function (initializer, key, undefined) {



// Global caterwaul variable.
// Caterwaul creates a global symbol, caterwaul. Like jQuery, there's a mechanism to get the original one back if you don't want to replace it. You can call caterwaul.deglobalize() to return
// caterwaul and restore the global that was there when Caterwaul was loaded (might be useful in the unlikely event that someone else named their library Caterwaul). Note that deglobalize() is
// available only on the global caterwaul() function.

(function (f) {return f(f)})(function (initializer) {
  var calls_init       = function () {var f = function () {return f.init.apply(f, arguments)}; return f},
      original_global  = typeof caterwaul === 'undefined' ? undefined : caterwaul,
      caterwaul_global = calls_init();

  caterwaul_global.deglobalize      = function () {caterwaul = original_global; return caterwaul_global};
  caterwaul_global.core_initializer = initializer;
  caterwaul_global.context          = this;

// The merge() function is compromised for the sake of Internet Explorer, which contains a bug-ridden and otherwise horrible implementation of Javascript. The problem is that, due to a bug in
// hasOwnProperty and DontEnum within JScript, these two expressions are evaluated incorrectly:

// | for (var k in {toString: 5}) alert(k);        // no alert on IE
//   ({toString: 5}).hasOwnProperty('toString')    // false on IE

// To compensate, merge() manually copies toString if it is present on the extension object.

  caterwaul_global.merge = (function (o) {for (var k in o) if (o.hasOwnProperty(k)) return true})({toString: true}) ?
    // hasOwnProperty, and presumably iteration, both work, so we use the sensible implementation of merge():
    function (o) {for (var i = 1, l = arguments.length, _; i < l; ++i) if (_ = arguments[i]) for (var k in _) if (has(_, k)) o[k] = _[k]; return o} :

    // hasOwnProperty, and possibly iteration, both fail, so we hack around the problem with this gem:
    function (o) {for (var i = 1, l = arguments.length, _; i < l; ++i)
                    if (_ = arguments[i]) {for (var k in _) if (has(_, k)) o[k] = _[k];
                                           if (_.toString && ! /\[native code\]/.test(_.toString.toString())) o.toString = _.toString} return o},

// Modules.
// Caterwaul 1.1.7 adds support for a structured form for defining modules. This isn't particularly interesting or revolutionary by itself; it's just a slightly more structured way to do what
// most Caterwaul extensions have been doing with toplevel functions. For example, a typical extension looks something like this:

// | caterwaul('js_all')(function ($) {
//     $.something(...) = ...,
//     where [...]})(caterwaul);

// Here's what the equivalent module syntax looks like:

// | caterwaul.module('foo', 'js_all', function ($) {      // equivalent to caterwaul.module('foo', caterwaul('js_all')(function ($) {...}))
//     $.something(...) = ...,
//     where [...]});

// Note that the module name has absolutely nothing to do with what the module does. I'm adding modules for a different reason entirely. When you bind a module like this, Caterwaul stores the
// initialization function onto the global object. So, for example, when you run caterwaul.module('foo', f), you have the property that caterwaul.foo_initializer === f. This is significant
// because you can later reuse this function on a different Caterwaul object. In particular, you can do things like sending modules from the server to the client, since the Caterwaul global is
// supplied as a parameter rather than being closed over.

// You can invoke module() with just a name to get the initializer function for that module. This ultimately means that, given only a runtime instance of a Caterwaul function configured with one
// or modules, you can construct a string of Javascript code sufficient to recreate an equivalent Caterwaul function elsewhere. (The replicator() method does this by returning a syntax tree.)

  caterwaul_global.modules = [];
  caterwaul_global.module = function (name, transform, f) {
    if (arguments.length === 1) return caterwaul_global[name + '_initializer'];
    name + '_initializer' in caterwaul_global || caterwaul_global.modules.push(name);
    f || (f = transform, transform = null);
    (caterwaul_global[name + '_initializer'] = transform ? caterwaul_global(transform)(f) : f)(caterwaul_global);
    return caterwaul_global};

  return caterwaul = caterwaul_global});




// Utility methods.
// Utility functions here are:

// | 1. qw      Splits a string into space-separated words and returns an array of the results. This is a Perl idiom that's really useful when writing lists of things.
//   2. se      Side-effects on a value and returns the value.
//   3. fail    Throws an error. This isn't particularly special except for the fact that the keyword 'throw' can't be used in expression context.
//   4. gensym  Generates a string that will never have been seen before.
//   5. bind    Fixes 'this' inside the function being bound. This is a common Javascript idiom, but is reimplemented here because we don't know which other libraries are available.
//   6. map     Maps a function over an array-like object and returns an array of the results.
//   7. rmap    Recursively maps a function over arrays.
//   8. hash    Takes a string, splits it into words, and returns a hash mapping each of those words to true. This is used to construct sets.

// Side-effecting is used to initialize things statefully; for example:

// | return se(function () {return 5}, function (f) {
//     f.sourceCode = 'return 5';
//   });

// Gensyms are unique identifiers that end with high-entropy noise that won't appear in the source being compiled. The general format of a gensym is name_count_suffix, where 'name' is provided by
// whoever requested the gensym (this allows gensyms to be more readable), 'count' is a base-36 number that is incremented with each gensym, and 'suffix' is a constant base-64 string containing
// 128 bits of entropy. (Since 64 possibilities is 6 bits, this means that we have 22 characters.)

    var qw = function (x) {return x.split(/\s+/)},  se = function (x, f) {return f && f.call(x, x) || x},  fail = function (m) {throw new Error(m)},

    unique = key || (function () {for (var xs = [], d = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789$_', i = 21, n; i >= 0; --i) xs.push(d.charAt(Math.random() * 64 >>> 0));
                                  return xs.join('')})(),

    gensym = (function (c) {return function (name) {return [name || '', (++c).toString(36), unique].join('_')}})(0),  is_gensym = function (s) {return s.substr(s.length - 22) === unique},

      bind = function (f, t) {return function () {return f.apply(t, arguments)}},
       map = function (f, xs) {for (var i = 0, ys = [], l = xs.length; i < l; ++i) ys.push(f(xs[i], i)); return ys},
      rmap = function (f, xs) {return map(function (x) {return x instanceof Array ? rmap(f, x) : f(x)})},
      hash = function (s) {for (var i = 0, xs = qw(s), o = {}, l = xs.length; i < l; ++i) o[xs[i]] = true; return annotate_keys(o)},

  // Optimizations.
//   The parser and lexer each assume valid input and do no validation. This is possible because any function passed in to caterwaul will already have been parsed by the Javascript interpreter;
//   syntax errors would have caused an error there. This enables a bunch of optimization opportunities in the parser, ultimately making it not in any way recursive and requiring only three
//   linear-time passes over the token stream. (An approximate figure; it actually does about 19 fractional passes, but not all nodes are reached.)

  // Also, I'm not confident that all Javascript interpreters are smart about hash indexing. Particularly, suppose a hashtable has 10 entries, the longest of whose keys is 5 characters. If we
//   throw a 2K string at it, it might very well hash that whole thing just to find that, surprise, the entry doesn't exist. That's a big performance hit if it happens very often. To prevent this
//   kind of thing, I'm keeping track of the longest string in the hashtable by using the 'annotate_keys' function. 'has()' knows how to look up the maximum length of a hashtable to verify that
//   the candidate is in it, resulting in the key lookup being only O(n) in the longest key (generally this ends up being nearly O(1), since I don't like to type long keys), and average-case O(1)
//   regardless of the length of the candidate.

  // As of Caterwaul 0.7.0 the _max_length property has been replaced by a gensym. This basically guarantees uniqueness, so the various hacks associated with working around the existence of the
//   special _max_length key are no longer necessary.

  // Caterwaul 1.3 introduces the gensym_entropy() method, which allows you to grab the 128 bits of pseudorandom data that are used to mark gensyms. Be careful with this. If you introduce this
//   data into your code, you compromise the uniqueness of past and future gensyms because you know enough to reproduce them and predict their future values.

     max_length_key = gensym('hash'),
      annotate_keys = function (o)    {var max = 0; for (var k in o) own.call(o, k) && (max = k.length > max ? k.length : max); o[max_length_key] = max; return o},
                has = function (o, p) {return p != null && ! (p.length > o[max_length_key]) && own.call(o, p)},  own = Object.prototype.hasOwnProperty,

   caterwaul_global = caterwaul.merge(caterwaul, {map: map, rmap: rmap, gensym: gensym, is_gensym: is_gensym, gensym_entropy: function () {return unique}}),

// Shared parser data.
// This data is used both for parsing and for serialization, so it's made available to all pieces of caterwaul.

  // Precomputed table values.
//   The lexer uses several character lookups, which I've optimized by using integer->boolean arrays. The idea is that instead of using string membership checking or a hash lookup, we use the
//   character codes and index into a numerical array. This is guaranteed to be O(1) for any sensible implementation, and is probably the fastest JS way we can do this. For space efficiency,
//   only the low 256 characters are indexed. High characters will trigger sparse arrays, which may degrade performance. Also, this parser doesn't handle Unicode characters properly; it assumes
//   lower ASCII only.

  // The lex_op table indicates which elements trigger regular expression mode. Elements that trigger this mode cause a following / to delimit a regular expression, whereas other elements would
//   cause a following / to indicate division. By the way, the operator ! must be in the table even though it is never used. The reason is that it is a substring of !==; without it, !== would
//   fail to parse.

  // Caterwaul 1.1.3 adds support for Unicode characters, even though they're technically not allowed as identifiers in Javascript. All Unicode characters are treated as identifiers since
//   Javascript assigns no semantics to them.

  // Caterwaul 1.2 adds @ as an identifier character. This is a hack for me to encode metadata on symbols without having to build subtrees, and it is transparent to Javascript->Javascript
//   compilation since @ is not a valid character in Javascript.

       lex_op = hash('. new ++ -- u++ u-- u+ u- typeof void u~ u! ! * / % + - << >> >>> < > <= >= instanceof in == != === !== & ^ | && || ? = += -= *= /= %= &= |= ^= <<= >>= >>>= : , ' +
                     'return throw case var const break continue else u; ;'),

    lex_table = function (s) {for (var i = 0, xs = [false]; i < 8; ++i) xs.push.apply(xs, xs); for (var i = 0, l = s.length; i < l; ++i) xs[s.charCodeAt(i)] = true; return xs},
    lex_float = lex_table('.0123456789'),    lex_decimal = lex_table('0123456789'),  lex_integer = lex_table('0123456789abcdefABCDEFx'),  lex_exp = lex_table('eE'),
    lex_space = lex_table(' \n\r\t'),        lex_bracket = lex_table('()[]{}?:'),     lex_opener = lex_table('([{?:'),                  lex_punct = lex_table('+-*/%&|^!~=<>?:;.,'),
      lex_eol = lex_table('\n\r'),     lex_regexp_suffix = lex_table('gims'),          lex_quote = lex_table('\'"/'),                   lex_slash = '/'.charCodeAt(0),
     lex_zero = '0'.charCodeAt(0),     lex_postfix_unary = hash('++ --'),              lex_ident = lex_table('@$_abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'),
     lex_star = '*'.charCodeAt(0),              lex_back = '\\'.charCodeAt(0),             lex_x = 'x'.charCodeAt(0),  lex_dot = '.'.charCodeAt(0),  lex_hash = '#'.charCodeAt(0),

  // Parse data.
//   The lexer and parser aren't entirely separate, nor can they be considering the complexity of Javascript's grammar. The lexer ends up grouping parens and identifying block constructs such
//   as 'if', 'for', 'while', and 'with'. The parser then folds operators and ends by folding these block-level constructs.

  // Caterwaul 1.2.7 introduces a few fictional operators into the list. These operators are written such that they could never appear in valid Javascript, but are available to non-Javascript
//   compilers like waul. So far these operators are:

  // | ->  right-associative; folds just before = and ?
//     =>  right-associative; same precedence as ->
//     &&= right-associative; same precedence as =, +=, etc
//     ||= right-associative; same precedence as =, +=, etc

  // These operators matter only if you're writing waul-facing code. If you're writing Javascript-to-Javascript mappings you can ignore their existence, since no valid Javascript will contain
//   them in the first place.

    parse_reduce_order = map(hash, ['function', '( [ . [] ()', 'new delete void', 'u++ u-- ++ -- typeof u~ u! u+ u-', '* / %', '+ -', '<< >> >>>', '< > <= >= instanceof in', '== != === !==',
                                    '&', '^', '|', '&&', '||', '-> =>', 'case', '? = += -= *= /= %= &= |= ^= <<= >>= >>>= &&= ||=', ':', ',', 'return throw break continue', 'var const',
                                    'if else try catch finally for switch with while do', ';']),

parse_associates_right = hash('= += -= *= /= %= &= ^= |= <<= >>= >>>= &&= ||= -> => ~ ! new typeof void u+ u- -- ++ u-- u++ ? if else function try catch finally for switch case with ' +
                              'while do'),

   parse_inverse_order = (function (xs) {for (var  o = {}, i = 0, l = xs.length; i < l; ++i) for (var k in xs[i]) has(xs[i], k) && (o[k] = i); return annotate_keys(o)})(parse_reduce_order),
   parse_index_forward = (function (rs) {for (var xs = [], i = 0, l = rs.length, _ = null; _ = rs[i], xs[i] = true, i < l; ++i)
                                           for (var k in _) if (has(_, k) && (xs[i] = xs[i] && ! has(parse_associates_right, k))) break; return xs})(parse_reduce_order),

              parse_lr = hash('[] . () * / % + - << >> >>> < > <= >= instanceof in == != === !== & ^ | && || -> => = += -= *= /= %= &= |= ^= <<= >>= >>>= &&= ||= , : ;'),
   parse_r_until_block = annotate_keys({'function':2, 'if':1, 'do':1, 'catch':1, 'try':1, 'for':1, 'while':1, 'with':1, 'switch':1}),
         parse_accepts = annotate_keys({'if':'else', 'do':'while', 'catch':'finally', 'try':'catch'}),  parse_invocation = hash('[] ()'),
      parse_r_optional = hash('return throw break continue else'),              parse_r = hash('u+ u- u! u~ u++ u-- new typeof finally case var const void delete'),
           parse_block = hash('; {'),  parse_invisible = hash('i;'),            parse_l = hash('++ --'),     parse_group = annotate_keys({'(':')', '[':']', '{':'}', '?':':'}),
 parse_ambiguous_group = hash('[ ('),    parse_ternary = hash('?'),   parse_not_a_value = hash('function if for while with catch void delete new typeof in instanceof'),
 parse_also_expression = hash('function'),                     parse_misleading_postfix = hash(':'),

// Syntax data structures.
// There are two data structures used for syntax trees. At first, paren-groups are linked into doubly-linked lists, described below. These are then folded into immutable array-based specific
// nodes. At the end of folding there is only one child per paren-group.

  // Doubly-linked paren-group lists.
//   When the token stream is grouped into paren groups it has a hierarchical linked structure that conceptually has these pointers:

  // |                         +--------+
//                    +------  |  node  |  ------+
//                    |   +->  |        |  <--+  |
//             first  |   |    +--------+     |  |  last
//                    |   | parent     parent |  |
//                    V   |                   |  V
//                 +--------+               +--------+
//                 |  node  |   --- r -->   |  node  |  --- r ---/
//      /--- l --- |        |   <-- l ---   |        |
//                 +--------+               +--------+

  // The primary operation performed on this tree, at least initially, is repeated folding. So we have a chain of linear nodes, and one by one certain nodes fold their siblings underneath them,
//   breaking the children's links and linking instead to the siblings' neighbors. For example, if we fold node (3) as a binary operator:

  // |     (1) <-> (2) <-> (3) <-> (4) <-> (5)             (1) <--> (3) <--> (5)
//         / \     / \     / \     / \     / \     -->     / \     /   \     / \
//                                                                /     \
//                                                              (2)     (4)        <- No link between children
//                                                              / \     / \           (see 'Fold nodes', below)

  // Fold nodes.
//   Once a node has been folded (e.g. (3) in the diagram above), none of its children will change and it will gain no more children. The fact that none of its children will change can be shown
//   inductively: suppose you've decided to fold the '+' in 'x + y' (here x and y are arbitrary expressions). This means that x and y are comprised of higher-precedence operators. Since there is
//   no second pass back to high-precedence operators, x and y will not change nor will they interact with one another. The fact that a folded node never gains more children arrives from the fact
//   that it is folded only once; this is by virtue of folding by index instead of by tree structure. (Though a good tree traversal algorithm also wouldn't hit the same node twice -- it's just
//   less obvious when the tree is changing.)

  // Anyway, the important thing about fold nodes is that their children don't change. This means that an array is a completely reasonable data structure to use for the children; it certainly
//   makes the structure simpler. It also means that the only new links that must be added to nodes as they are folded are links to new children (via the array), and links to the new siblings.
//   Once we have the array-form of fold nodes, we can build a query interface similar to jQuery, but designed for syntactic traversal. This will make routine operations such as macro
//   transformation and quasiquoting far simpler later on.

  // Both grouping and fold nodes are represented by the same data structure. In the case of grouping, the 'first' pointer is encoded as [0] -- that is, the first array element. It doesn't
//   contain pointers to siblings of [0]; these are still accessed by their 'l' and 'r' pointers. As the structure is folded, the number of children of each paren group should be reduced to just
//   one. At this point the remaining element's 'l' and 'r' pointers will both be null, which means that it is in hierarchical form instead of linked form.

  // After the tree has been fully generated and we have the root node, we have no further use for the parent pointers. This means that we can use subtree sharing to save memory. Once we're past
//   the fold stage, push() should be used instead of append(). append() works in a bidirectionally-linked tree context (much like the HTML DOM), whereas push() works like it does for arrays
//   (i.e. no parent pointer).

  // Syntax node functions.
//   These functions are common to various pieces of syntax nodes. Not all of them will always make sense, but the prototypes of the constructors can be modified independently later on if it
//   turns out to be an issue.

    syntax_common = caterwaul_global.syntax_common = {

    // Mutability.
//     These functions let you modify nodes in-place. They're used during syntax folding and shouldn't really be used after that (hence the underscores).

      _replace:  function (n) {return (n.l = this.l) && (this.l.r = n), (n.r = this.r) && (this.r.l = n), this},  _append_to: function (n) {return n && n._append(this), this},
      _reparent: function (n) {return this.p && this.p[0] === this && (this.p[0] = n), this},  _fold_l: function (n) {return this._append(this.l && this.l._unlink(this) || empty)},
      _append:   function (n) {return (this[this.length++] = n) && (n.p = this), this},        _fold_r: function (n) {return this._append(this.r && this.r._unlink(this) || empty)},
      _sibling:  function (n) {return n.p = this.p, (this.r = n).l = this},                    _fold_lr: function () {return this._fold_l()._fold_r()},
                                                                                               _fold_rr: function () {return this._fold_r()._fold_r()},

      _wrap:     function (n) {return n.p = this._replace(n).p, this._reparent(n), delete this.l, delete this.r, this._append_to(n)},
      _unlink:   function (n) {return this.l && (this.l.r = this.r), this.r && (this.r.l = this.l), delete this.l, delete this.r, this._reparent(n)},

    // These methods are OK for use after the syntax folding stage is over (though because syntax nodes are shared it's generally dangerous to go modifying them):

      pop: function () {return --this.length, this},  push: function (x) {return this[this.length++] = caterwaul_global.syntax.promote(x || empty), this},

    // Identification.
//     You can request that a syntax node identify itself, in which case it will give you an identifier if it hasn't already. The identity is not determined until the first time it is requested,
//     and after that it is stable. As of Caterwaul 0.7.0 the mechanism works differently (i.e. isn't borked) in that it replaces the prototype definition with an instance-specific closure the
//     first time it gets called. This may reduce the number of decisions in the case that the node's ID has already been computed.

                       id: function () {var id = gensym('id'); return (this.id = function () {return id})()},
      is_caterwaul_syntax: true,

    // Traversal functions.
//     each() is the usual side-effecting shallow traversal that returns 'this'. map() distributes a function over a node's children and returns the array of results, also as usual. Two variants,
//     reach and rmap, perform the process recursively. reach is non-consing; it returns the original as a reference. rmap, on the other hand, follows some rules to cons a new tree. If the
//     function passed to rmap() returns the node verbatim then its children are traversed. If it returns a distinct node, however, then traversal doesn't descend into the children of the newly
//     returned tree but rather continues as if the original node had been a leaf. For example:

    // |           parent          Let's suppose that a function f() has these mappings:
//                /      \
//            node1      node2       f(parent) = parent   f(node1) = q
//            /   \        |                              f(node2) = node2
//          c1     c2      c3

    // In this example, f() would be called on parent, node1, node2, and c3 in that order. c1 and c2 are omitted because node1 was replaced by q -- and there is hardly any point in going through
//     the replaced node's previous children. (Nor is there much point in forcibly iterating over the new node's children, since presumably they are already processed.) If a mapping function
//     returns something falsy, it will have exactly the same effect as returning the node without modification.

    // Recursive map() and each() variants have another form starting with Caterwaul 1.1.3. These are pmap() and peach(), which recursively traverse the tree in post-order. That is, the node
//     itself is visited after its children are.

    // Using the old s() to do gensym-safe replacement requires that you invoke it only once, and this means that for complex macroexpansion you'll have a long array of values. This isn't ideal,
//     so syntax trees provide a replace() function that handles replacement more gracefully:

    // | qs[(foo(_foo), _before_bar + bar(_bar))].replace({_foo: qs[x], _before_bar: qs[3 + 5], _bar: qs[foo.bar]})

    // Controlling rmap() traversal.
//     rmap() provides a fairly rich interface to allow you to inform Caterwaul about what to do with each subtree. For each visited node, you can do three things:

    // | 1. Replace the node with another value. The value you return should be either a string (in which case it will be promoted into a node), or a syntax node. Traversal stops here.
//       2. Preserve the original value, but descend into children. In this case you should return either the original tree or false.
//       3. Preserve the original value, but don't descend into children. In this case you should return true. This has the advantage that it avoids allocating copies of trees that you don't
//          intend to modify. You can also use this to escape from an rmap() operation by continuing to return true.

      each:  function (f) {for (var i = 0, l = this.length; i < l; ++i) f(this[i], i); return this},
      map:   function (f) {for (var n = new this.constructor(this), i = 0, l = this.length; i < l; ++i) n.push(f(this[i], i) || this[i]); return n},

      reach: function (f) {f(this); for (var i = 0, l = this.length; i < l; ++i) this[i].reach(f); return this},
      rmap:  function (f) {var r = f(this); return ! r || r === this ? this.map(function (n) {return n.rmap(f)}) : r === true ? this : r.rmap === undefined ? new this.constructor(r) : r},

      peach: function (f) {for (var i = 0, l = this.length; i < l; ++i) this[i].peach(f); f(this); return this},
      pmap:  function (f) {var t = this.map(function (n) {return n.pmap(f)}); return f(t)},

      clone: function () {return this.rmap(function () {return false})},

      collect: function (p)  {var ns = []; this.reach(function (n) {p(n) && ns.push(n)}); return ns},
      replace: function (rs) {var r; return own.call(rs, this.data) && (r = rs[this.data]) ?
                                              r.constructor === String ? se(this.map(function (n) {return n.replace(rs)}), function () {this.data = r}) : r :
                                              this.map(function (n) {return n.replace(rs)})},

    // Alteration.
//     These functions let you make "changes" to a node by returning a modified copy.

      repopulated_with: function (xs)     {return new this.constructor(this.data, xs)},
      with_data:        function (d)      {return new this.constructor(d, Array.prototype.slice.call(this))},
      change:           function (i, x)   {return se(new this.constructor(this.data, Array.prototype.slice.call(this)), function (n) {n[i] = x})},
      compose_single:   function (i, f)   {return this.change(i, f(this[i]))},
      slice:            function (x1, x2) {return new this.constructor(this.data, Array.prototype.slice.call(this, x1, x2))},

    // General-purpose traversal.
//     This is a SAX-style traversal model, useful for analytical or scope-oriented tree traversal. You specify a callback function that is invoked in pre-post-order on the tree (you get events
//     for entering and exiting each node, including leaves). Each time a node is entered, the callback is invoked with an object of the form {entering: node}, where 'node' is the syntax node
//     being entered. Each time a node is left, the callback is invoked with an object of the form {exiting: node}. The return value of the function is not used. Any null nodes are not traversed,
//     since they would fail any standard truthiness tests for 'entering' or 'exiting'.

    // I used to have a method to perform scope-annotated traversal, but I removed it for two reasons. First, I had no use for it (and no tests, so I had no reason to believe that it worked).
//     Second, Caterwaul is too low-level to need such a method. That would be more appropriate for an analysis extension.

      traverse: function (f) {f({entering: this}); f({exiting: this.each(function (n) {n.traverse(f)})}); return this},

    // Structural transformation.
//     Having nested syntax trees can be troublesome. For example, suppose you're writing a macro that needs a comma-separated list of terms. It's a lot of work to dig through the comma nodes,
//     each of which is binary. Javascript is better suited to using a single comma node with an arbitrary number of children. (This also helps with the syntax tree API -- we can use .map() and
//     .each() much more effectively.) Any binary operator can be transformed this way, and that is exactly what the flatten() method does. (flatten() returns a new tree; it doesn't modify the
//     original.)

    // The tree flattening operation looks like this for a left-associative binary operator:

    // |        (+)
//             /   \              (+)
//          (+)     z     ->     / | \
//         /   \                x  y  z
//        x     y

    // This flatten() method returns the nodes along the chain of associativity, always from left to right. It is shallow, since generally you only need a localized flat tree. That is, it doesn't
//     descend into the nodes beyond the one specified by the flatten() call. It takes an optional parameter indicating the operator to flatten over; if the operator in the tree differs, then the
//     original node is wrapped in a unary node of the specified operator. The transformation looks like this:

    // |                                  (,)
//            (+)                          |
//           /   \   .flatten(',')  ->    (+)
//          x     y                      /   \
//                                      x     y

    // Because ',' is a binary operator, a ',' tree with just one operand will be serialized exactly as its lone operand would be. This means that plurality over a binary operator such as comma
//     or semicolon degrades gracefully for the unary case (this sentence makes more sense in the context of macro definitions; see in particular 'let' and 'where' in std.bind).

    // The unflatten() method performs the inverse transformation. It doesn't delete a converted unary operator in the tree case, but if called on a node with more than two children it will nest
//     according to associativity.

      flatten:   function (d) {d = d || this.data; return d !== this.data ? this.as(d) : ! (has(parse_lr, d) && this.length) ? this : has(parse_associates_right, d) ?
                                                     se(new this.constructor(d), bind(function (n) {for (var i = this;     i && i.data === d; i = i[1]) n.push(i[0]); n.push(i)}, this)) :
                                                     se(new this.constructor(d), bind(function (n) {for (var i = this, ns = []; i.data === d; i = i[0]) i[1] && ns.push(i[1]); ns.push(i);
                                                                                                    for (i = ns.length - 1; i >= 0; --i) n.push(ns[i])}, this))},

      unflatten: function  () {var t = this, right = has(parse_associates_right, this.data); return this.length <= 2 ? this : se(new this.constructor(this.data), function (n) {
                                 if (right) for (var i = 0, l = t.length - 1; i  < l; ++i) n = n.push(t[i]).push(i < l - 2 ? t.data : t[i])[1];
                                 else       for (var i = t.length - 1;        i >= 1; --i) n = n.push(i > 1 ? t.data : t[0]).push(t[i])[0]})},

    // Wrapping.
//     Sometimes you want your syntax tree to have a particular operator, and if it doesn't have that operator you want to wrap it in a node that does. Perhaps the most common case of this is
//     when you have a possibly-plural node representing a variable or expression -- often the case when you're dealing with argument lists -- and you want to be able to assume that it's wrapped
//     in a comma node. Calling node.as(',') will return the node if it's a comma, and will return a new comma node containing the original one if it isn't.

      as: function (d) {return this.data === d ? this : new caterwaul_global.syntax(d).push(this)},

    // Value construction.
//     Syntax nodes sometimes represent hard references to values instead of just syntax. (See 'References' for more information.) In order to compile a syntax tree in the right environment you
//     need a mapping of symbols to these references, which is what the bindings() method returns. (It also collects references for all descendant nodes.) It takes an optional argument to
//     populate, in case you already had a hash set aside for bindings -- though it always returns the hash.

    // A bug in Caterwaul 0.5 and earlier failed to bind falsy values. This is no longer the case; nodes which bind values should indicate that they do so by setting a binds_a_value attribute
//     (ref nodes do this on the prototype), indicating that their value should be read from the 'value' property. (This allows other uses of a 'value' property while making it unambiguous
//     whether a particular node intends to bind something.)

    // Caterwaul 1.1.6 adds the ability to bind values generated by expressions which are evaluated later. This is necessary for precompilation to work for things like the standard library
//     'using' modifier.

      bindings:    function (hash) {var result = hash || {}; this.reach(function (n) {n.add_bindings_to(result)});    return result},
      expressions: function (hash) {var result = hash || {}; this.reach(function (n) {n.add_expressions_to(result)}); return result},

      add_bindings_to:    function (hash) {},           // No-ops for most syntax nodes, but see caterwaul_global.ref and caterwaul_global.expression_ref below.
      add_expressions_to: function (hash) {},

      resolve: function () {return this},               // Identity for most nodes. This is necessary to allow opaque refs to construct expression closures.
      reduce:  function () {return this},               // Ditto here; this is necessary to allow opaque refs to parse themselves but preserve expression ref bindings.

    // Containment.
//     You can ask a tree whether it contains any nodes that satisfy a given predicate. This is done using the .contains() method and is significantly more efficient than using .collect() if your
//     tree does in fact contain a matching node.

      contains: function (f) {var result = f(this);
                              if (result) return result;
                              for (var i = 0, l = this.length; i < l; ++i) if (result = this[i].contains(f)) return result},

    // Matching.
//     Any syntax tree can act as a matching pattern to destructure another one. It's often much more fun to do things this way than it is to try to pick it apart by hand. For example, suppose
//     you wanted to determine whether a node represents a function that immediately returns, and to know what it returns. The simplest way to do it is like this:

    // | var tree = ...
//       var match = caterwaul.parse('function (_) {return _value}').match(tree);
//       if (match) {
//         var value = match._value;
//         ...
//       }

    // The second parameter 'variables' stores a running total of match data. You don't provide this; match() creates it for you on the toplevel invocation. The entire original tree is available
//     as a match variable called '_'; for example: t.match(u)._ === u if u matches t.

    // Caterwaul 1.2 introduces syntax node metadata using @. This is not returned in the match result; for instance:

    // | var pattern = caterwaul.parse('_x@0 + foo');
//       pattern.match('bar + foo')        -> {_x: {'bar'}, _: {'bar + foo'}}

      match: function (target, variables) {target = target.constructor === String ? caterwaul_global.parse(target) : target;
                                           variables || (variables = {_: target});
                                           if (this.is_wildcard() && (!this.leaf_nodes_only() || !this.length)) return variables[this.without_metadata()] = target, variables;
                                      else if (this.length === target.length && this.data === target.data)      {for (var i = 0, l = this.length; i < l; ++i)
                                                                                                                   if (! this[i].match(target[i], variables)) return null;
                                                                                                                 return variables}},

    // Inspection and syntactic serialization.
//     Syntax nodes can be both inspected (producing a Lisp-like structural representation) and serialized (producing valid Javascript code). In the past, stray 'r' links were serialized as block
//     comments. Now they are folded into implied semicolons by the parser, so they should never appear by the time serialization happens.

      toString:  function (depth) {var xs = ['']; this.serialize(xs, depth || -1); return xs.join('')},
      structure: function ()      {if (this.length) return '(' + ['"' + this.data + '"'].concat(map(function (x) {return x.structure()}, this)).join(' ') + ')';
                                   else             return this.data}};

  // Syntax node subclassing.
//   Caterwaul 1.1.1 generalizes the variadic syntax node model to support arbitrary subclasses. This is useful when defining syntax trees for languages other than Javascript. As of Caterwaul
//   1.1.2 this method is nondestructive with respect to the constructor and other arguments.

  // Caterwaul 1.2 allows you to extend all syntax classes in existence at once by invoking syntax_extend on one or more prototype extension objects. For example, you can add a new foo method to
//   all syntax trees like this:

  // | caterwaul.syntax_extend({foo: function () {...}});

  // This also defines the 'foo' method for all syntax classes that are created in the future. It does this by adding the method definitions to syntax_common, which is implicitly merged into the
//   prototype of any syntax subclass. syntax_extend returns the global Caterwaul object.

    caterwaul_global.syntax_subclasses = [];
    caterwaul_global.syntax_subclass = function (ctor) {var extensions = Array.prototype.slice.call(arguments, 1), proxy = function () {return ctor.apply(this, arguments)};
                                                        caterwaul_global.merge.apply(this, [proxy.prototype, syntax_common].concat(extensions));
                                                        caterwaul_global.syntax_subclasses.push(proxy);
                                                        proxy.prototype.constructor = proxy;
                                                        return proxy};

    caterwaul_global.syntax_extend = function () {for (var i = 0, l = caterwaul_global.syntax_subclasses.length, es = Array.prototype.slice.call(arguments); i < l; ++i)
                                                    caterwaul_global.merge.apply(this, [caterwaul_global.syntax_subclasses[i].prototype].concat(es));
                                                  caterwaul_global.merge.apply(this, [syntax_common].concat(es));
                                                  return caterwaul_global};

  // Type detection and retrieval.
//   These methods are used to detect the literal type of a node and to extract that value if it exists. You should use the as_x methods only once you know that the node does represent an x;
//   otherwise you will get misleading results. (For example, calling as_boolean on a non-boolean will always return false.)

  // Other methods are provided to tell you higher-level things about what this node does. For example, is_contextualized_invocation() tells you whether the node represents a call that can't be
//   eta-reduced (if it were, then the 'this' binding would be lost).

  // Wildcards are used for pattern matching and are identified by beginning with an underscore. This is a very frequently-called method, so I'm using a very inexpensive numeric check rather
//   than a string comparison. The ASCII value for underscore is 95.

    var parse_hex = caterwaul_global.parse_hex       = function (digits) {for (var result = 0, i = 0, l = digits.length, d; i < l; ++i)
                                                                            result *= 16, result += (d = digits.charCodeAt(i)) <= 58 ? d - 48 : (d & 0x5f) - 55;
                                                                          return result},

      parse_octal = caterwaul_global.parse_octal     = function (digits) {for (var result = 0, i = 0, l = digits.length; i < l; ++i) result *= 8, result += digits.charCodeAt(i) - 48;
                                                                          return result},

  unescape_string = caterwaul_global.unescape_string = function (s) {for (var i = 0, c, l = s.length, result = [], is_escaped = false; i < l; ++i)
                                                                       if (is_escaped) is_escaped = false,
                                                                                       result.push((c = s.charAt(i)) === '\\' ? '\\' :
                                                                                                   c === 'n' ? '\n'     : c === 'r' ? '\r' : c === 'b' ? '\b' : c === 'f' ? '\f' :
                                                                                                   c === '0' ? '\u0000' : c === 't' ? '\t' : c === 'v' ? '\v' :
                                                                                                   c === '"' || c === '\'' ? c :
                                                                                                   c === 'x' ? String.fromCharCode(parse_hex(s.substring(i, ++i + 1))) :
                                                                                                   c === 'u' ? String.fromCharCode(parse_hex(s.substring(i, (i += 3) + 1))) :
                                                                                                               String.fromCharCode(parse_octal(s.substring(i, (i += 2) + 1))));
                                                                  else if ((c = s.charAt(i)) === '\\') is_escaped = true;
                                                                  else result.push(c);

                                                                     return result.join('')};

    caterwaul_global.javascript_tree_type_methods = {
               is_string: function () {return /['"]/.test(this.data.charAt(0))},           as_escaped_string: function () {return this.data.substr(1, this.data.length - 2)}, 
               is_number: function () {return /^-?(0x|\d|\.\d+)/.test(this.data)},                 as_number: function () {return Number(this.data)},
              is_boolean: function () {return this.data === 'true' || this.data === 'false'},     as_boolean: function () {return this.data === 'true'},
               is_regexp: function () {return /^\/./.test(this.data)},                     as_escaped_regexp: function () {return this.data.substring(1, this.data.lastIndexOf('/'))},
                is_array: function () {return this.data === '['},                        as_unescaped_string: function () {return unescape_string(this.as_escaped_string())},

     could_be_identifier: function () {return /^[A-Za-z_$@][A-Za-z0-9$_@]*$/.test(this.data)},
           is_identifier: function () {return this.length === 0 && this.could_be_identifier() && ! this.is_boolean() && ! this.is_null_or_undefined() && ! has(lex_op, this.data)},

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

              precedence: function () {return parse_inverse_order[this.data]},          is_right_associative: function () {return has(parse_associates_right, this.data)},
          is_associative: function () {return /^[;,]$/.test(this.data)},                            is_group: function () {return /^[(\[{][)\]]?$/.test(this.data)},

                 accepts: function (e) {return has(parse_accepts, this.data) && parse_accepts[this.data] === (e.data || e)}};

  // Tree metadata.
//   When you're writing macros, you often want a concise way to indicate the role of a given tree node. Caterwaul's lexer parses a large superset of Javascript proper, which gives you room to
//   indicate things like this by inserting special characters into identifiers. The rules are:

  // | 1. Nodes beginning with an underscore are wildcards.
//     2. Nodes beginning with @ are gensym-erased; they are guaranteed to match no other symbol. (This is also true of the character @ alone, used as an identifier.)
//     3. Nodes can use @ later on to indicate the presence of match constraints. For example, you can indicate that a wildcard matches only leaf nodes by adding @0 to the end.

    caterwaul_global.javascript_tree_metadata_methods = {
      could_have_metadata: function () {return this.could_be_identifier()},     without_metadata: function () {return this.data.replace(/@.*$/g, '')},

              is_wildcard: function () {return this.data.charCodeAt(0) === 95},  leaf_nodes_only: function () {return /@0/.test(this.data)},
                is_opaque: function () {return this.data.charCodeAt(0) === 64}};

  // Javascript-specific serialization.
//   These methods are specific to the Javascript language. Other languages will have different serialization logic.

    caterwaul_global.javascript_tree_serialization_methods = {

    // Block detection.
//     Block detection is required for multi-level if/else statements. Consider this code:

    // | if (foo) for (...) {}
//       else bif;

    // A naive approach (the one I was using before version 0.6) would miss the fact that the 'for' was trailed by a block, and insert a spurious semicolon, which would break compilation:

    // | if (foo) for (...) {};    // <- note!
//       else bif;

    // What we do instead is dig through the tree and find out whether the last thing in the 'if' case ends with a block. If so, then no semicolon is inserted; otherwise we insert one. This
//     algorithm makes serialization technically O(n^2), but nobody nests if/else blocks to such an extent that it would matter.

      ends_with_block: function () {var block = this[this.length - 1];
                                    if (block && block.data === parse_accepts[this.data]) block = block[0];
                                    return this.data === '{' || has(parse_r_until_block, this.data) && (this.data !== 'function' || this.length === 3) && block && block.ends_with_block()},

    // There's a hack here for single-statement if-else statements. (See 'Grab-until-block behavior' in the parsing code below.) Basically, for various reasons the syntax tree won't munch the
//     semicolon and connect it to the expression, so we insert one automatically whenever the second node in an if, else, while, etc. isn't a block.

    // Update for Caterwaul 0.6.6: I had removed mandatory spacing for unary prefix operators, but now it's back. The reason is to help out the host Javascript lexer, which can misinterpret
//     postfix increment/decrement: x + +y will be serialized as x++y, which is invalid Javascript. The fix is to introduce a space in front of the second plus: x+ +y, which is unambiguous.

    // Update for caterwaul 1.0: The serialize() method is now aggressively optimized for common cases. It also uses a flattened array-based concatenation strategy rather than the deeply nested
//     approach from before.

    // Caterwaul 1.2.1 introduces syntax guarding, the introduction of parentheses where necessary to enforce precedence/associativity that is encoded in the tree but wouldn't be represented in
//     serialization. For example, the tree (* (+ foo bar) bif) would be rendered as foo + bar * bif, resulting in Javascript reinterpreting the operator precedence. After guarding, it would be
//     rendered as (foo + bar) * bif.

    // Internally, guarding is done by providing subtrees with a threshold precedence; if a node has a higher precedence index than its parent, it is parenthesized. Associativity matters as well.
//     For instance, the tree (+ foo (+ bar bif)) also requires grouping even though both operators are the same precedence, whereas (= foo (= bar bif)) does not. This is done by checking whether
//     the child's index is positive; positive indices must be in a right-associative position, so they are handed a precedence index one smaller than the parent's actual precedence. (We
//     basically want to push the child to parenthesize if it's the same precedence, since it's associating the wrong way.)

    // Groups are unambiguous despite having high precedence. To prevent double-grouping in cases like this, a precedence of 'undefined' is passed into children of groups or invocations. This
//     simulates a toplevel invocation, which is implicitly unparenthesized.

      guarded: function (p) {var this_p = this.is_group() || this.is_associative() ? undefined : this.precedence(), right = this.is_right_associative(),
                                 result = this.map(function (x, i) {return x.guarded(this_p - (!right && !!i))});

                             return this_p > p ? result.as('(') : result},

    // Optimized serialization cases.
//     We can tell a lot about how to serialize a node based on just a few properties. For example, if the node has zero length then its serialization is simply its data. This is the leaf case,
//     which is likely to be half of the total number of nodes in the whole syntax tree. If a node has length 1, then we assume a prefix operator unless we identify it as postfix. Otherwise we
//     break it down by the kind of operator that it is.

    // Nodes might be flattened, so we can't assume any upper bound on the arity regardless of what kind of operator it is. Realistically you shouldn't hand flattened nodes over to the compile()
//     function, but it isn't the end of the world if you do.

      serialize: function (xs, depth) {var l = this.length, d = this.data, semi = ';\n', d1 = depth - 1,
                                        push = function (x) {if (lex_ident[xs[xs.length - 1].charCodeAt(0)] === lex_ident[x.charCodeAt(0)]) xs.push(' ', x);
                                                             else                                                                           xs.push(x)};

                                       if (l && depth === 0) return push('...');

                           switch (l) {case 0: if (has(parse_r_optional, d)) return push(d.replace(/^u/, ''));
                                          else if (has(parse_group, d))      return push(d), push(parse_group[d]);
                                          else                               return push(d);

                                       case 1: if (has(parse_r, d) || has(parse_r_optional, d)) return push(d.replace(/^u/, '')), this[0].serialize(xs, d1);
                                          else if (has(parse_misleading_postfix, d))            return this[0].serialize(xs, d1), push(d);
                                          else if (has(parse_group, d))                         return push(d), this[0].serialize(xs, d1), push(parse_group[d]);
                                          else if (has(parse_lr, d))                            return this[0].serialize(xs, d1);
                                          else                                                  return this[0].serialize(xs, d1), push(d);

                                       case 2: if (has(parse_invocation, d))    return this[0].serialize(xs, d1), push(d.charAt(0)), this[1].serialize(xs, d1), push(d.charAt(1));
                                          else if (has(parse_r_until_block, d)) return push(d), this[0].serialize(xs, d1), this[1].serialize(xs, d1);
                                          else if (has(parse_invisible, d))     return this[0].serialize(xs, d1), this[1].serialize(xs, d1);
                                          else if (d === ';')                   return this[0].serialize(xs, d1), push(semi), this[1].serialize(xs, d1);
                                          else                                  return this[0].serialize(xs, d1), push(d), this[1].serialize(xs, d1);

                                      default: if (has(parse_ternary, d))       return this[0].serialize(xs, d1), push(d), this[1].serialize(xs, d1), push(':'), this[2].serialize(xs, d1);
                                          else if (has(parse_r_until_block, d)) return this.accepts(this[2]) && ! this[1].ends_with_block() ?
                                                                                  (push(d), this[0].serialize(xs, d1), this[1].serialize(xs, d1), push(semi), this[2].serialize(xs, d1)) :
                                                                                  (push(d), this[0].serialize(xs, d1), this[1].serialize(xs, d1), this[2].serialize(xs, d1));
                                          else                                  return this.unflatten().serialize(xs, d1)}}};

  // References.
//   You can drop references into code that you're compiling. This is basically variable closure, but a bit more fun. For example:

  // | caterwaul.compile(qs[function () {return _ + 1}].replace({_: new caterwaul.ref(3)}))()      // -> 4

  // What actually happens is that caterwaul.compile runs through the code replacing refs with gensyms, and the function is evaluated in a scope where those gensyms are bound to the values they
//   represent. This gives you the ability to use a ref even as an lvalue, since it's really just a variable. References are always leaves on the syntax tree, so the prototype has a length of 0.

  // Caterwaul 1.0 adds named gensyms, and one of the things you can do is name your refs accordingly. If you don't name one it will just be called 'ref', but you can make it more descriptive by
//   passing in a second constructor argument. This name will automatically be wrapped in a gensym, but that gensym will be removed at compile-time unless you specify not to rename gensyms.

    caterwaul_global.ref_common = caterwaul_global.merge({}, caterwaul_global.javascript_tree_type_methods,
                                                             caterwaul_global.javascript_tree_metadata_methods,
                                                             caterwaul_global.javascript_tree_serialization_methods,

  // Reference replace() support.
//   Refs aren't normal nodes; in particular, invoking the constructor as we do in replace() will lose the ref's value and cause all kinds of problems. In order to avoid this we override the
//   replace() method for syntax refs to behave more sensibly. Note that you can't replace a ref with a syntax 

                                                             {replace: function (replacements) {var r; return own.call(replacements, this.data) && (r = replacements[this.data]) ?
                                                                         r.constructor === String ? se(new this.constructor(this.value), function () {this.data = r}) :
                                                                         r : this},
                                                               length: 0});

    caterwaul_global.ref = caterwaul_global.syntax_subclass(
                             function (value, name) {if (value instanceof this.constructor) this.value = value.value, this.data = value.data;
                                                     else                                   this.value = value,       this.data = gensym(name && name.constructor === String ? name : 'ref')},

                             caterwaul_global.ref_common, {add_bindings_to: function (hash) {hash[this.data] = this.value}});

  // Expression references.
//   These are a step in between references and regular syntax nodes. The idea is that you want to bind a value, but you have an expression that can be executed later to generate it. This gives
//   Caterwaul more options than it would have if you used a regular reference node. In particular, it enables Caterwaul to precompile the source containing the expression ref, since the
//   expression can be evaluated later. For example:

  // | caterwaul.compile(qs[x + 1].replace({x: new caterwaul.expression_ref('50 * 2')}))           // -> 101

  // This ends up evaluating code that looks like this:

  // | (function (ref_gensym) {
//       return ref_gensym + 1;
//     }).call(this, 50 * 2)

    caterwaul_global.expression_ref = caterwaul_global.syntax_subclass(
                                        function (e, name) {if (e instanceof this.constructor) this.e = e.e, this.data = e.data;
                                                            else                               this.e = e,   this.data = gensym(name && name.constructor === String ? name : 'e')},

                                        caterwaul_global.ref_common, {add_expressions_to: function (hash) {hash[this.data] = this.e}});

  // Metadata.
//   Caterwaul 1.3 allows you to add metadata to the syntax tree. The assumption is that it will be removed before you compile the tree; as such, it is represented as an identifier beginning with
//   an @ sign; this will trigger a compilation error if you leave it there. The purpose of metadata is to hold extra information that you don't want to attach to a specific node.

    caterwaul_global.metadata_node = caterwaul_global.syntax_subclass(
                                       function (d, name) {if (d instanceof this.constructor) this.metadata = d.metadata, this.data = d.data;
                                                           else                               this.metadata = d,          this.data = '@' + (name || '')},

                                       caterwaul_global.ref_common);

  // Opaque (unparsed) code references.
//   This gives Caterwaul a way to assemble code in a more performant manner. In particular, it lets Caterwaul omit the expensive (and unnecessary) parse() operation during a replicator() call.
//   The idea here is that this node contains subtrees, but they are unparsed; as such, it appears to have no children and simply returns the code as a string as its data. You can call the node's
//   parse() method to return a parsed tree of its contents.

  // Caterwaul 1.2b7 adds the ability to preserve expression refs bound in an opaque object. This is a necessary step to solve the precompiled module problem described in 'Expression refs,
//   modules, and precompilation' below.

  // If you create an opaque tree without specifying a table of expression refs, Caterwaul checks the object you're passing in for a table under the attribute 'caterwaul_expression_ref_table'.
//   This is Caterwaul's standard way of encoding reconstructible expression references. It should be a table of this form:

  // | {ref_name_1: string, ref_name_2: string, ...}

  // Each string represents the expression that is used to construct the expression that ends up being bound. So, for example:

  // | > f = caterwaul.compile(caterwaul.parse('function () {return _foo}').replace({_foo: new caterwaul.expression_ref(caterwaul.parse('3 + 4'))}))
//     > f.caterwaul_expression_ref_table
//     { e_a_gensym: '3+4' }

  // If you ask an opaque node for its expression bindings, it will return more opaque nodes of those strings. This way you can reuse the bindings from the compile() function, but it won't incur
//   any parsing overhead.

    caterwaul_global.opaque_tree = caterwaul_global.syntax_subclass(
                                     function (code, expression_refs) {if (code instanceof this.constructor) this.data = code.data, this.expression_refs = code.expression_refs;
                                                                       else                                  this.data            = code.toString(),
                                                                                                             this.expression_refs = expression_refs || code.caterwaul_expression_ref_table;
                                                                       var rs = this.expression_refs;
                                                                       for (var k in rs) own.call(rs, k) && rs[k].constructor === String && (rs[k] = new caterwaul_global.opaque_tree(rs[k]))},

                                     {resolve: function ()   {return this.expression_refs ? caterwaul_global.late_bound_tree(new this.constructor(this.data), this.expression_refs) : this},
                                       reduce: function ()   {return this.expression_refs ? caterwaul_global.late_bound_tree(this.parse(), this.expression_refs) : this.parse()},
                                    serialize: function (xs) {return xs.push(this.data), xs},
                                        parse: function ()   {return caterwaul_global.parse(this.data)}});

  // Syntax node constructor.
//   Here's where we combine all of the pieces above into a single function with a large prototype. Note that the 'data' property is converted from a variety of types; so far we support strings,
//   numbers, and booleans. Any of these can be added as children. Also, I'm using an instanceof check rather than (.constructor ===) to allow array subclasses such as Caterwaul finite sequences
//   to be used.

  // Caterwaul 1.2 adds the static caterwaul.syntax.from_string() constructor to simplify string-based syntax node construction.

    caterwaul_global.syntax = se(caterwaul_global.syntax_subclass(
                                   function (data) {if (data instanceof this.constructor) this.data = data.data, this.length = 0;
                                                    else {this.data = data && data.toString(); this.length = 0;
                                                      for (var i = 1, l = arguments.length, _; _ = arguments[i], i < l; ++i)
                                                        for (var j = 0, lj = _.length, it, c; _ instanceof Array ? (it = _[j], j < lj) : (it = _, ! j); ++j)
                                                          this._append(caterwaul_global.syntax.promote(it))}},

                                   caterwaul_global.javascript_tree_type_methods,
                                   caterwaul_global.javascript_tree_metadata_methods,
                                   caterwaul_global.javascript_tree_serialization_methods),

                                 function () {this.from_string = function (s)  {return new caterwaul_global.syntax('"' + s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').
                                                                                                                                                  replace(/\n/g, '\\n') + '"')};

                                              this.from_array  = function (xs) {for (var i = 0, c = new caterwaul_global.syntax(','), l = xs.length; i < l; ++i) c.push(xs[i]);
                                                                                return new caterwaul_global.syntax('[', c.length ? c.unflatten() : [])};

                                              this.from_object = function (o)  {var comma = new caterwaul_global.syntax(',');
                                                                                for (var k in o) if (own.call(o, k)) comma.push(new caterwaul_global.syntax(
                                                                                  ':', /^[$_A-Za-z][A-Za-z0-9$_]*$/.test(k) ? k : caterwaul_global.syntax.from_string(k), o[k].as('(')));
                                                                                return new caterwaul_global.syntax('{', comma.length ? comma.unflatten() : [])}});

    caterwaul_global.syntax.promote = function (v) {var c = v.constructor; return c === String || c === Number || c === Boolean ? new caterwaul_global.syntax(v) : v};

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

  // Syntax folding.
//   The first thing to happen is that parenthetical, square bracket, and braced groups are folded up. This happens in a single pass that is linear in the number of tokens, and other foldable
//   tokens (including unary and binary operators) are indexed by associativity. The following pass runs through these indexes from high to low precedence and folds tokens into trees. By this
//   point all of the parentheticals have been replaced by proper nodes (here I include ?: groups in parentheticals, since they behave the same way). Finally, high-level rules are applied to the
//   remaining keywords, which are bound last. This forms a complete parse tree.

  // Doing all of this efficiently requires a linked list rather than an array. This gets built during the initial paren grouping stage. Arrays are used for the indexes, which are left-to-right
//   and are later processed in the order indicated by the operator associativity. That is, left-associative operators are processed 0 .. n and right associative are processed n .. 0. Keywords
//   are categorized by behavior and folded after all of the other operators. Semicolons are folded last, from left to right.

  // There are some corner cases due to Javascript's questionable heritage from C-style syntax. For example, most constructs take either syntax blocks or semicolon-delimited statements. Ideally,
//   else, while, and catch are associated with their containing if, do, and try blocks, respectively. This can be done easily, as the syntax is folded right-to-left. Another corner case would
//   come up if there were any binary operators with equal precedence and different associativity. Javascript doesn't have them however, and it wouldn't make much sense to; it would render
//   expressions such as 'a op1 b op2 c' ambiguous if op1 and op2 shared precedence but each wanted to bind first. (I mention this because at first I was worried about it, but now I realize it
//   isn't an issue.)

  // Notationally (for easier processing later on), a distinction is made between invocation and grouping, and between dereferencing and array literals. Dereferencing and function invocation are
//   placed into their own operators, where the left-hand side is the thing being invoked or dereferenced and the right-hand side is the paren-group or bracket-group that is responsible for the
//   operation. Also, commas inside these groups are flattened into a single variadic (possibly nullary) comma node so that you don't have to worry about the tree structure. This is the case for
//   all left-associative operators; right-associative operators preserve their hierarchical folding.

  // Parse/lex shared logic.
//   Lexing Javascript is not entirely straightforward, primarily because of regular expression literals. The first implementation of the lexer got things right 99% of the time by inferring the
//   role of a / by its preceding token. The problem comes in when you have a case like this:

  // | if (condition) /foo/.test(x)

  // In this case, (condition) will be incorrectly inferred to be a regular expression (since the close-paren terminates an expression, usually), and /foo/ will be interpreted as division by foo. 

  // We mark the position before a token and then just increment the position. The token, then, can be retrieved by taking a substring from the mark to the position. This eliminates the need for
//   intermediate concatenations. In a couple of cases I've gone ahead and done them anyway -- these are for operators, where we grab the longest contiguous substring that is defined. I'm not too
//   worried about the O(n^2) complexity due to concatenation; they're bounded by four characters.

  // OK, so why use charAt() instead of regular expressions? It's a matter of asymptotic performance. V8 implements great regular expressions (O(1) in the match length for the (.*)$ pattern), but
//   the substring() method is O(n) in the number of characters returned. Firefox implements O(1) substring() but O(n) regular expression matching. Since there are O(n) tokens per document of n
//   characters, any O(n) step makes lexing quadratic. So I have to use the only reliably constant-time method provided by strings, charAt() (or in this case, charCodeAt()).

  // Of course, building strings via concatenation is also O(n^2), so I also avoid that for any strings that could be long. This is achieved by using a mark to indicate where the substring
//   begins, and advancing i independently. The span between mark and i is the substring that will be selected, and since each substring both requires O(n) time and consumes n characters, the
//   lexer as a whole is O(n). (Though perhaps with a large constant.)

  // Parse function.
//   As mentioned earlier, the parser and lexer aren't distinct. The lexer does most of the heavy lifting; it matches parens and brackets, arranges tokens into a hierarchical linked list, and
//   provides an index of those tokens by their fold order. It does all of this by streaming tokens into a micro-parser whose language is grouping and that knows about the oddities required to
//   handle regular expression cases. In the same function, though as a distinct case, the operators are folded and the syntax is compiled into a coherent tree form.

  // The input to the parse function can be anything whose toString() produces valid Javascript code.

    caterwaul_global.parse = function (input) {

      // Caterwaul 1.3 revision: parse() is closed under null-ness.
      if (input == null) return input;

      // Caterwaul 1.1 revision: Allow the parse() function to be used as a 'make sure this thing is a syntax node' function.
      if (input.constructor === caterwaul_global.syntax) return input;

    // Lex variables.
//     s, obviously, is the string being lexed. mark indicates the position of the stream, while i is used for lookahead. The difference is later read into a token and pushed onto the result. c
//     is a temporary value used to store the current character code. re is true iff a slash would begin a regular expression. esc is a flag indicating whether the next character in a string or
//     regular expression literal is escaped. exp indicates whether we've seen the exponent marker in a number. close is used for parsing single and double quoted strings; it contains the
//     character code of the closing quotation mark. t is the token to be processed.

    // Parse variables.
//     grouping_stack and gs_top are used for paren/brace/etc. matching. head and parent mark two locations in the linked syntax tree; when a new group is created, parent points to the opener
//     (i.e. (, [, ?, or {), while head points to the most recently added child. (Hence the somewhat complex logic in push().) indexes[] determines reduction order, and contains references to the
//     nodes in the order in which they should be folded. invocation_nodes is an index of the nodes that will later need to be flattened.

    // The push() function manages the mechanics of adding a node to the initial linked structure. There are a few cases here; one is when we've just created a paren group and have no 'head'
//     node; in this case we append the node as 'head'. Another case is when 'head' exists; in that case we update head to be the new node, which gets added as a sibling of the old head.

        var s = input.toString().replace(/^\s*|\s*$/g, ''), mark = 0, c = 0, re = true, esc = false, dot = false, exp = false, close = 0, t = '', i = 0, l = s.length,
            cs = function (i) {return s.charCodeAt(i)}, grouping_stack = [], gs_top = null, head = null, parent = null, indexes = map(function () {return []}, parse_reduce_order),
            invocation_nodes = [], all_nodes = [empty], new_node = function (n) {return all_nodes.push(n), n},
            push = function (n) {return head ? head._sibling(head = n) : (head = n._append_to(parent)), new_node(n)}, syntax_node = this.syntax, groups = [], ternaries = [];

    // Trivial case.
//     The empty string will break the lexer because we won't generate a token (since we're already at the end). To prevent this we return an empty syntax node immediately, since this is an
//     accurate representation of no input.

        if (l === 0) return empty;

    // Main lex loop.
//     This loop takes care of reading all of the tokens in the input stream. At the end, we'll have a linked node structure with paren groups. At the beginning, we set the mark to the current
//     position (we'll be incrementing i as we read characters), munch whitespace, and reset flags.

        while ((mark = i) < l) {
          while (lex_space[c = cs(i)] && i < l) mark = ++i;
          esc = exp = dot = t = false;

      // Miscellaneous lexing.
//       This includes bracket resetting (the top case, where an open-bracket of any sort triggers regexp mode) and comment removal. Both line and block comments are removed by comparing against
//       lex_slash, which represents /, and lex_star, which represents *.

      // Caterwaul 1.1.6 adds recognition of # comments, which are treated just like other line comments. This is relevant in practice because node.js supports shebang-line invocation of
//       Javascript files.

            if                                        (lex_bracket[c])                                                                    {t = !! ++i; re = lex_opener[c]}
       else if (c === lex_slash && cs(i + 1) === lex_star && (i += 2)) {while (++i < l && cs(i) !== lex_slash || cs(i - 1) !== lex_star);  t = !  ++i}
       else if            (c === lex_slash && cs(i + 1) === lex_slash) {while                              (++i < l && ! lex_eol[cs(i)]);  t = false}
       else if                                        (c === lex_hash) {while                              (++i < l && ! lex_eol[cs(i)]);  t = false}

      // Regexp and string literal lexing.
//       These both take more or less the same form. The idea is that we have an opening delimiter, which can be ", ', or /; and we look for a closing delimiter that follows. It is syntactically
//       illegal for a string to occur anywhere that a slash would indicate division (and it is also illegal to follow a string literal with extra characters), so reusing the regular expression
//       logic for strings is not a problem. (This follows because we know ahead of time that the Javascript is valid.)

       else if (lex_quote[c] && (close = c) && re && ! (re = ! (t = s.charAt(i)))) {while (++i < l && (c = cs(i)) !== close || esc)  esc = ! esc && c === lex_back;
                                                                                    while     (++i < l && lex_regexp_suffix[cs(i)])                               ; t = true}

      // Numeric literal lexing.
//       This is far more complex than the above cases. Numbers have several different formats, each of which requires some custom logic. The reason we need to parse numbers so exactly is that it
//       influences how the rest of the stream is lexed. One example is '0.5.toString()', which is perfectly valid Javascript. What must be output here, though, is '0.5', '.', 'toString', '(',
//       ')'; so we have to keep track of the fact that we've seen one dot and stop lexing the number on the second.

      // Another case is exponent-notation: 3.0e10. The hard part here is that it's legal to put a + or - on the exponent, which normally terminates a number. Luckily we can safely skip over any
//       character that comes directly after an E or e (so long as we're really in exponent mode, which I'll get to momentarily), since there must be at least one digit after an exponent.

      // The final case, which restricts the logic somewhat, is hexadecimal numbers. These also contain the characters 'e' and 'E', but we cannot safely skip over the following character, and any
//       decimal point terminates the number (since '0x5.toString()' is also valid Javascript). The same follows for octal numbers; the leading zero indicates that there will be no decimal point,
//       which changes the lex mode (for example, '0644.toString()' is valid).

      // So, all this said, there are different logic branches here. One handles guaranteed integer cases such as hex/octal, and the other handles regular numbers. The first branch is triggered
//       whenever a number starts with zero and is followed by 'x' or a digit (for conciseness I call 'x' a digit), and the second case is triggered when '.' is followed by a digit, or when a
//       digit starts.

      // A trivial change, using regular expressions, would reduce this logic significantly. I chose to write it out longhand because (1) it's more fun that way, and (2) the regular expression
//       approach has theoretically quadratic time in the length of the numbers, whereas this approach keeps things linear. Whether or not that actually makes a difference I have no idea.

      // Finally, in response to a recently discovered failure case, a period must be followed by a digit if it starts a number. The failure is the string '.end', which will be lexed as '.en',
//       'd' if it is assumed to be a floating-point number. (In fact, any method or property beginning with 'e' will cause this problem.)

       else if                  (c === lex_zero && lex_integer[cs(i + 1)]) {while (++i < l && lex_integer[cs(i)]); re = ! (t = true)}
       else if (lex_float[c] && (c !== lex_dot || lex_decimal[cs(i + 1)])) {while (++i < l && (lex_decimal[c = cs(i)] || (dot ^ (dot |= c === lex_dot)) || (exp ^ (exp |= lex_exp[c] && ++i))));
                                                                            while (i < l && lex_decimal[cs(i)]) ++i; re = ! (t = true)}

      // Operator lexing.
//       The 're' flag is reused here. Some operators have both unary and binary modes, and as a heuristic (which happens to be accurate) we can assume that anytime we expect a regular
//       expression, a unary operator is intended. The only exception are ++ and --, which are always unary but sometimes are prefix and other times are postfix. If re is true, then the prefix
//       form is intended; otherwise, it is postfix. For this reason I've listed both '++' and 'u++' (same for --) in the operator tables; the lexer is actually doing more than its job here by
//       identifying the variants of these operators.

      // The only exception to the regular logic happens if the operator is postfix-unary. (e.g. ++, --.) If so, then the re flag must remain false, since expressions like 'x++ / 4' can be valid.

       else if (lex_punct[c] && (t = re ? 'u' : '', re = true)) {while (i < l && lex_punct[cs(i)] && has(lex_op, t + s.charAt(i)))  t += s.charAt(i++); re = ! has(lex_postfix_unary, t)}

      // Identifier lexing.
//       If nothing else matches, then the token is lexed as a regular identifier or Javascript keyword. The 're' flag is set depending on whether the keyword expects a value. The nuance here is
//       that you could write 'x / 5', and it is obvious that the / means division. But if you wrote 'return / 5', the / would be a regexp delimiter because return is an operator, not a value. So
//       at the very end, in addition to assigning t, we also set the re flag if the word turns out to be an operator.

      // Extended ASCII and above are considered identifiers. This allows Caterwaul to parse Unicode source, even though it will fail to distinguish between Unicode operator symbols and Unicode
//       letters.

       else {while (++i < l && (lex_ident[c = cs(i)] || c > 0x7f)); re = has(lex_op, t = s.substring(mark, i))}

      // Token unification.
//       t will contain true, false, or a string. If false, no token was lexed; this happens when we read a comment, for example. If true, the substring method should be used. (It's a shorthand to
//       avoid duplicated logic.) For reasons that are not entirely intuitive, the lexer sometimes produces the artifact 'u;'. This is never useful, so I have a case dedicated to removing it.

        if (i === mark) throw new Error('Caterwaul lex error at "' + s.substr(mark, 40) + '" with leading context "' + s.substr(mark - 40, 40) + '" (probably a Caterwaul bug)');
        if (t === false) continue;
        t = t === true ? s.substring(mark, i) : t === 'u;' ? ';' : t;

      // Grouping and operator indexing.
//       Now that we have a token, we need to see whether it affects grouping status. There are a couple of possibilities. If it's an opener, then we create a new group; if it's a matching closer
//       then we close the current group and pop out one layer. (We don't check for matching here. Any code provided to Caterwaul will already have been parsed by the host Javascript interpreter,
//       so we know that it is valid.)

      // All operator indexing is done uniformly, left-to-right. Note that the indexing isn't strictly by operator. It's by reduction order, which is arguably more important. That's what the
//       parse_inverse_order table does: it maps operator names to parse_reduce_order subscripts. (e.g. 'new' -> 2.)

      // Caterwaul 1.3 inserts empty sentinels into all brackets with no contents. So, for example, the empty array [] would contain a single child, caterwaul.empty. This makes it much easier to
//       write destructuring binds against syntax trees.

        t === gs_top ? (grouping_stack.pop(), gs_top = grouping_stack[grouping_stack.length - 1], head = head ? head.p : parent, parent = null) :
                       (has(parse_group, t) ? (grouping_stack.push(gs_top = parse_group[t]), parent = push(new_node(new syntax_node(t))), groups.push(parent), head = null)
                                            : push(new_node(new syntax_node(t))),
                        has(parse_inverse_order, t) && indexes[parse_inverse_order[t]].push(head || parent));           // <- This is where the indexing happens

      // Regexp flag special cases.
//       Normally a () group wraps an expression, so a following / would indicate division. The only exception to this is when we have a block construct; in this case, the next token appears in
//       statement-mode, which means that it begins, not modifies, a value. We'll know that we have such a case if (1) the immediately-preceding token is a close-paren, and (2) a block-accepting
//       syntactic form occurs to its left.

      // With all this trouble over regular expressions, I had to wonder whether it was possible to do it more cleanly. I don't think it is, unfortunately. Even lexing the stream backwards fails
//       to resolve the ambiguity:

      // | for (var k in foo) /foo/g.test(k) && bar();

      // In this case we won't know it's a regexp until we hit the 'for' keyword (or perhaps 'var', if we're being clever -- but a 'with' or 'if' would require complete lookahead). A perfectly
//       valid alternative parse, minus the 'for' and 'var', is this:

      // | ((k in foo) / (foo) / (g.test(k))) && bar();

      // The only case where reverse-lexing is useful is when the regexp has no modifiers.

        re |= t === ')' && head.l && has(parse_r_until_block, head.l.data)}

    // Operator fold loop.
//     This is the second major part of the parser. Now that we've completed the lex process, we can fold operators and syntax, and take care of some exception cases.

    // First step: functions, calls, dots, and dereferences.
//     I'm treating this differently from the generalized operator folding because of the syntactic inference required for call and dereference detection. Nothing has been folded at this point
//     (with the exception of paren groups, which is appropriate), so if the node to the left of any ( or [ group is an operator, then the ( or [ is really a paren group or array literal. If, on
//     the other hand, it is another value, then the group is a function call or a dereference. This folding goes left-to-right. The reason we also process dot operators is that they share the same
//     precedence as calls and dereferences. Here's what a () or [] transform looks like:

    // |   quux <--> foo <--> ( <--> bar                              quux <--> () <--> bar
//                             \                                               /  \                  <-- This can be done by saying _.l.wrap(new node('()')).p.fold_r().
//                              bif <--> , <--> baz       -->               foo    (                     _.l.wrap() returns l again, .p gets the wrapping node, and fold_r adds a child to it.
//                                                                                  \
//                                                                                   bif <--> , <--> baz

    // This is actually merged into the for loop below, even though it happens before other steps do (see 'Ambiguous parse groups').

    // Second step: fold operators.
//     Now we can go through the list of operators, folding each according to precedence and associativity. Highest to lowest precedence here, which is just going forwards through the indexes[]
//     array. The parse_index_forward[] array indicates which indexes should be run left-to-right and which should go right-to-left.

        for (var i = 0, l = indexes.length, forward, _; _ = indexes[i], forward = parse_index_forward[i], i < l; ++i)
          for (var j = forward ? 0 : _.length - 1, lj = _.length, inc = forward ? 1 : -1, node, data, ll; forward ? j < lj : j >= 0; j += inc)

      // Binary node behavior.
//       The most common behavior is binary binding. This is the usual case for operators such as '+' or ',' -- they grab one or both of their immediate siblings regardless of what they are.
//       Operators in this class are considered to be 'fold_lr'; that is, they fold first their left sibling, then their right.

      // There is a special case here. If the right-hand side is a prefix unary operator of low precedence (e.g. for or if), then convert the colon to a unary operator. Semantically, this means
//       that the colon has been used to denote a label. This won't universally hold true; in particular, it won't work if an expression is on the right instead of a statement. But it fixes all
//       cases that would produce invalid syntax trees.

            if (has(parse_lr, data = (node = _[j]).data))  if (data === ':' && parse_inverse_order[node.r.data] > i) node._fold_l();
                                                           else                                                      node._fold_lr();

      // Ambiguous parse groups.
//       As mentioned above, we need to determine whether grouping constructs are invocations or real groups. This happens to take place before other operators are parsed (which is good -- that
//       way it reflects the precedence of dereferencing and invocation). The only change we need to make is to discard the explicit parenthetical or square-bracket grouping for invocations or
//       dereferences, respectively. It doesn't make much sense to have a doubly-nested structure, where we have a node for invocation and another for the group on the right-hand side of that
//       invocation. Better is to modify the group in-place to represent an invocation.

      // We can't solve this problem here, but we can solve it after the parse has finished. I'm pushing these invocation nodes onto an index for the end.

      // Sometimes we have a paren group that doesn't represent a value. This is the case for most control flow constructs:

      // | for (var k in o) (...)

      // We need to detect this and not fold the (var k in o)(...) as an invocation, since doing so would seriously break the resulting syntax.

      // There is an even more pathological case to consider. Firefox and other SpiderMonkey-based runtimes rewrite anonymous functions without parentheses, so you end up with stuff like this:

      // | function () {} ()

      // In this case we need to encode an invocation. Fortunately by this point the function node is already folded.

       else if (has(parse_ambiguous_group, data) && node.l && ! ((ll = node.l.l) && has(parse_r_until_block, ll.data)) &&
               (node.l.data === '.' || (node.l.data === 'function' && node.l.length === 2) ||
                                       ! (has(lex_op, node.l.data) ||
                                          has(parse_not_a_value, node.l.data))))  invocation_nodes.push(node.l._wrap(new_node(new syntax_node(data + parse_group[data]))).p._fold_r());

      // Unary left and right-fold behavior.
//       Unary nodes have different fold directions. In this case, it just determines which side we grab the node from. I'm glad that Javascript doesn't allow stuff like '++x++', which would make
//       the logic here actually matter. Because there isn't that pathological case, exact rigidity isn't required.

       else if (has(parse_l, data))  node._fold_l();
       else if (has(parse_r, data))  node._fold_r();

      // Ternary operator behavior.
//       This is kind of interesting. If we have a ternary operator, then it will be treated first as a group; just like parentheses, for example. This is the case because the ternary syntax is
//       unambiguous for things in the middle. So, for example, '3 ? 4 : 5' initially parses out as a '?' node whose child is '4'. Its siblings are '3' and '5', so folding left and right is an
//       obvious requirement. The only problem is that the children will be in the wrong order. Instead of (3) (4) (5), we'll have (4) (3) (5). So after folding everything, we do a quick swap of
//       the first two to set the ordering straight.

      // There's a subtle catch here. Depending on the Javascript parser, low-precedence operators may be allowed in the middle of a ?:. For example, x ? y = z : z is legal in all runtimes that
//       I'm aware of, and x ? y, z : z is illegal only in SpiderMonkey. This becomes a problem because folding the node won't do the right thing if a low-precedence operator isn't already
//       folded.

      // The fix for this is to push the ternary onto a separate list. After all operators have been folded, we can resolve the ternary by assigning the children to the correct places.

       else if (has(parse_ternary, data))  node._fold_lr(), ternaries.push(node);

      // Grab-until-block behavior.
//       Not quite as simple as it sounds. This is used for constructs such as 'if', 'function', etc. Each of these constructs takes the form '<construct> [identifier] () {}', but they can also
//       have variants that include '<construct> () {}', '<construct> () statement;', and most problematically '<construct> () ;'. Some of these constructs also have optional child components; for
//       example, 'if () {} else {}' should be represented by an 'if' whose children are '()', '{}', and 'else' (whose child is '{}'). The tricky part is that 'if' doesn't accept another 'if' as a
//       child (e.g. 'if () {} if () {}'), nor does it accept 'for' or any number of other things. This discrimination is encoded in the parse_accepts table.

      // There are some weird edge cases, as always. The most notable is what happens when we have nesting without blocks:

      // | if (foo) bar; else bif;

      // In this case we want to preserve the semicolon on the 'then' block -- that is, 'bar;' should be its child; so the semicolon is required. But the 'bif' in the 'else' case shouldn't have a
//       semicolon, since that separates top-level statements. Because desperate situations call for desperate measures, there's a hack specifically for this in the syntax tree serialization.

      // One more thing. Firefox rewrites syntax trees, and one of the optimizations it performs on object literals is removing quotation marks from regular words. This means that it will take the
//       object {'if': 4, 'for': 1, etc.} and render it as {if: 4, for: 1, etc.}. As you can imagine, this becomes a big problem as soon as the word 'function' is present in an object literal. To
//       prevent this from causing problems, I only collapse a node if it is not followed by a colon. (And the only case where any of these would legally be followed by a colon is as an object
//       key.)

       else if (has(parse_r_until_block, data) && node.r && node.r.data !== ':')
                                                 {for (var count = 0, limit = parse_r_until_block[data]; count < limit && node.r && ! has(parse_block, node.r.data); ++count) node._fold_r();
                                                  node.r && (node.r.data === ';' ? node.push(empty) : node._fold_r());
                                                  if (has(parse_accepts, data) && parse_accepts[data] === (node.r && node.r.r && node.r.r.data)) node._fold_r().pop()._fold_r();
                                             else if (has(parse_accepts, data) && parse_accepts[data] === (node.r && node.r.data))               node._fold_r()}

      // Optional right-fold behavior.
//       The return, throw, break, and continue keywords can each optionally take an expression. If the token to the right is an expression, then we take it, but if the token to the right is a
//       semicolon then the keyword should be nullary.

       else if (has(parse_r_optional, data))  node.r && node.r.data !== ';' && node._fold_r();

    // Third step.
//     Find all elements with right-pointers and wrap them with semicolon nodes. This is necessary because of certain constructs at the statement-level don't use semicolons; they use brace syntax
//     instead. (e.g. 'if (foo) {bar} baz()' is valid, even though no semicolon precedes 'baz()'.) By this point everything else will already be folded. Note that this does some weird things to
//     associativity; in general, you can't make assumptions about the exact layout of semicolon nodes. Fortunately semicolon is associative, so it doesn't matter in practice. And just in case,
//     these nodes are 'i;' rather than ';', meaning 'inferred semicolon' -- that way it's clear that they aren't original. (They also won't appear when you call toString() on the syntax tree.)

        for (var i = all_nodes.length - 1, _; i >= 0; --i)  (_ = all_nodes[i]).r && _._wrap(new_node(new syntax_node('i;'))).p._fold_r();

    // Fourth step.
//     Flatten out all of the invocation nodes. As explained earlier, they are nested such that the useful data on the right is two levels down. We need to grab the grouping construct on the
//     right-hand side and remove it so that only the invocation or dereference node exists. During the parse phase we built an index of all of these invocation nodes, so we can iterate through
//     just those now. I'm preserving the 'p' pointers, though they're probably not useful beyond here.

    // At the same time, go through all bracket groups and insert empty nodes into the ones that are actually empty. This uniformity means that you can bind a match variable to the contents of an
//     empty bracket group and sort out the difference later. Because we're not reparenting anything there is no need to set the 'p' pointer on the empty child.

        for (var i = 0, l = invocation_nodes.length, _, child; i < l; ++i)  (child = (_ = invocation_nodes[i])[1] = _[1][0] || empty) && (child.p = _);
        for (var i = 0, l = groups.length, _;                  i < l; ++i)  (_ = groups[i]).length || _.push(empty);

    // Another piece of this is fixing up all ternary nodes. Some ternaries have commas or assignments in the middle, which will be folded after the ternary as a whole is folded. This means two
//     things. First, we couldn't have processed the ternary operator in a single step; and second, the children are in the wrong places as mentioned above. In particular, the ternary will have
//     one child at [0], one at [length - 2], and the other at [length - 1]. The conditional is [length - 2], so we put this one first.

        for (var i = 0, l = ternaries.length, _, n, temp; i < l; ++i)  n = (_ = ternaries[i]).length, temp = _[0], _[0] = _[n - 2], _[1] = temp, _[2] = _[n - 1], _.length = 3;

        while (head.p) head = head.p;

    // Fifth step.
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
// set to something else. If you really want some other value of undefined, you can always bind it as an environment variable.

  // Expression refs, modules, and offline compilation.
//   Caterwaul 1.2 introduces (in the beta versions) and then fixes a really interesting problem. First, it introduces the Waul precompiler; this takes a Caterwaul file in one of a few standard
//   forms and emits a precompiled version of that file. Second, it preserves both modules and expression refs (added in 1.1.7 and 1.1.6, respectively); I had actually added expression refs to
//   better support modules under offline precompilation.

  // However, a really interesting pathological problem comes up when you combine these features. The first time a module is precompiled, it gets converted from a Caterwaul function to a regular
//   Javascript function that contains closure references to its expression refs:

  // | caterwaul('js_all')(function () {return 'foo + bar'.qs})    ->    (function (qs_a_gensym) {return function () {return qs_a_gensym}}).call(this,
//                                                                         new caterwaul.syntax('+', new caterwaul.syntax('foo'), new caterwaul.syntax('bar')))

  // So far so good; this will compile just fine. However, Caterwaul provides the 'replicator' function, which returns a function that restores the value of the Caterwaul global as it presently
//   is; that is, with all of the modules you've enabled so far. Because Caterwaul can't inspect the closure state of a Javascript function, any precompiled modules (which will end up looking
//   like the code above) will appear to have references to nonexistent global variables and will then fail the next time they are loaded. As of 1.2b6, Caterwaul does not have enough information
//   to reconstruct the expression refs.

  // Version 1.2b7 introduces a fix for this problem. Expression refs will be bound twice. For the first binding, the expression ref's literal expression value is used as shown above. This allows
//   the compiled function to access its references without any overhead. For the second binding, the expression is serialized and bound as a string. This allows Caterwaul to reconstruct the
//   expression ref when the function is serialized into an opaque ref. This process is handled automatically by the opaque ref constructor if you're using the Caterwaul format for storing
//   closure state.

    var bound_expression_template     = caterwaul_global.parse('var _bindings; return(_expression)'),
        binding_template              = caterwaul_global.parse('_variable = _base._variable'),
        undefined_binding             = caterwaul_global.parse('undefined = void(0)'),
        late_bound_template           = caterwaul_global.parse('(function (_bindings) {var _result=(_body);_result_init;return(_result)}).call(this, _expressions)'),
        late_bound_ref_table_template = caterwaul_global.parse('_result.caterwaul_expression_ref_table = _expression_ref_table');

  // Compilation options.
//   Gensym renaming will break some things that expect the compiled code to be source-identical to the original tree. As a result, I'm introducing an options hash that lets you tell the compiler
//   things like "don't rename the gensyms this time around". Options handled by compile() are:

  // | gensym_renaming     defaults to true. If false, gensyms are preserved in their hideous glory.
//     transparent_errors  defaults to false. If true, compile-time errors are passed through unmodified.
//     unbound_closure     defaults to false. If true, compile() returns a binder closure instead of binding it eagerly to the environment. You can then call this closure on an object containing
//                         bindings.

  // Also see the option table for late_bound_tree; the options passed to compile() are passed into compile's invocation of late_bound_tree as well.

    caterwaul_global.compile = function (tree, environment, options) {
      options = caterwaul_global.merge({gensym_renaming: true, transparent_errors: false, unbound_closure: false}, options);
      tree    = caterwaul_global.late_bound_tree(tree, null, options);

      // Compute the bindings even when the closure is returned unbound. We need to do this to build up the list of local variables inside the closure.
      var bindings = caterwaul_global.merge({}, this._environment, environment, tree.bindings()), variables = [undefined_binding], s = gensym('base');
      for (var k in bindings) if (own.call(bindings, k) && k !== 'this') variables.push(binding_template.replace({_variable: k, _base: s}));

      var variable_definitions = new this.syntax(',', variables).unflatten(),
          function_body        = bound_expression_template.replace({_bindings: variable_definitions, _expression: tree});

      if (options.gensym_renaming) {var renaming_table = this.gensym_rename_table(function_body);
                                    for (var k in bindings) own.call(bindings, k) && (bindings[renaming_table[k] || k] = bindings[k]);
                                    function_body = function_body.replace(renaming_table);
                                    s             = renaming_table[s]}

      var code    = function_body.toString(),
          closure = (function () {if (options.transparent_errors) return new Function(s, code);
                             else                                 try       {return new Function(s, code)}
                                                                  catch (e) {throw new Error((e.message || e) + ' while compiling ' + code)}})();

      return options.unbound_closure ? closure : closure.call(bindings['this'], bindings)};

  // Caterwaul 1.1.6 adds support for expression bindings. To make this easier to work with, the Caterwaul global includes a way to wrap your code with the necessary closure to bind
//   expression-bound node values. For example, for the code 'console.log(<expression>)', suppose you drop in qs[3 + 4] as the expression. caterwaul.late_bound_tree will take your code and return
//   a new syntax tree containing this:

  // | (function (expression_gensym) {
//       return console.log(expression_gensym);
//     }).call(this, 3 + 4);

  // You can also pass in your own environment expressions to supplement the ones in the syntax tree.

  // Caterwaul 1.2b7 adds option support. Right now the only option is expression_ref_table, which defaults to true. If you set this to false, Caterwaul will not store a table of expression
//   references. The consequence of this is that you won't be able to reconstruct a value that comes out of this function after precompilation. Generally you'll want to leave it set to true.

    var trivial_node_template    = caterwaul_global.parse('new caterwaul.syntax(_data)'),
        nontrivial_node_template = caterwaul_global.parse('new caterwaul.syntax(_data, _xs)');

    caterwaul_global.syntax_to_expression = function (tree) {
      if (tree.length) {for (var comma = new caterwaul_global.syntax(','), i = 0, l = tree.length; i < l; ++i) comma.push(caterwaul_global.syntax_to_expression(tree[i]));
                        return nontrivial_node_template.replace({_data: caterwaul_global.syntax.from_string(tree.data), _xs: comma.unflatten()})}
                  else return trivial_node_template.replace({_data: caterwaul_global.syntax.from_string(tree.data)})};

    caterwaul_global.late_bound_tree = function (tree, environment, options) {
      options = caterwaul_global.merge({expression_ref_table: true}, options);
      tree    = tree.rmap(function (node) {return node.resolve()});

      var bindings = caterwaul_global.merge({}, environment, tree.expressions()), variables = new caterwaul_global.syntax(','), expressions = new caterwaul_global.syntax(','), table = {};
      for (var k in bindings) if (own.call(bindings, k)) variables.push(new caterwaul_global.syntax(k)), expressions.push(bindings[k]),
                                                         table[k] = caterwaul_global.syntax.from_string(bindings[k].toString());

      var result_gensym      = caterwaul_global.gensym('result'),
          result_initializer = options.expression_ref_table ? late_bound_ref_table_template.replace({_result: result_gensym, _expression_ref_table: caterwaul_global.syntax.from_object(table)})
                                                            : caterwaul_global.empty;

      return variables.length ? late_bound_template.replace({_bindings: variables.unflatten(), _expressions: expressions.unflatten(), _result: result_gensym,
                                                          _result_init: result_initializer, _body: tree}) : tree};

  // Gensym erasure.
//   Gensyms are horrible. They look like foo_1_j15190ba29n1_$1AC151953, which both takes up a lot of space and is hard to read. Fortunately, we can convert them at compile-time. This is possible
//   because Javascript (mostly) supports alpha-conversion for functions.

  // I said "mostly" because some symbols are converted into runtime strings; these are property keys. In the unlikely event that you've got a gensym being used to dereference something, e.g.
//   foo.gensym, then renaming is no longer safe. This, as far as I know, is the only situation where renaming won't work as intended. Because I can't imagine a situation where this would
//   actually arise, I'm not handling this case yet. (Though let me know if I need to fix this.)

  // New gensym names are chosen by choosing the smallest nonnegative integer N such that the gensym's prefix plus N.toString(36) doesn't occur as an identifier anywhere in the code. (The most
//   elegant option is to use scope analysis to keep N low, but I'm too lazy to implement it.)

    caterwaul_global.gensym_rename_table = function (tree) {
      var names = {}, gensyms = [];
      tree.reach(function (node) {var d = node.data; if (is_gensym(d)) names[d] || gensyms.push(d); names[d] = d.replace(/^(.*)_[a-z0-9]+_.{22}$/, '$1') || 'anon'});

      var unseen_count = {}, next_unseen = function (name) {if (! (name in names)) return name;
                                                            var n = unseen_count[name] || 0; while (names[name + (++n).toString(36)]); return name + (unseen_count[name] = n).toString(36)};

      for (var renamed = {}, i = 0, l = gensyms.length, g; i < l; ++i) renamed[g = gensyms[i]] || (names[renamed[g] = next_unseen(names[g])] = true);
      return renamed};

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

  // Composition syntax.
//   Caterwaul 1.1.6 introduces a string-based syntax for initialization. So instead of things like caterwaul.jquery(caterwaul.js_all())(...), you can write caterwaul('js_all jquery')(...). The
//   rule in this case is that each word is transformed into a method invocation. The first one is invoked with no parameters, and subsequent ones are invoked on the return value of the previous
//   method. Methods are called from left to right, so the string order is opposite from function composition order. For example:

  // | caterwaul('m1 m2 m3')       ->      caterwaul.m3(caterwaul.m2(caterwaul.m1()))

  // All Caterwaul standard libraries are written such that they can be used this way.

  // Caterwaul 1.2.4 introduces bundles, which are just array properties stored on the caterwaul global. This is useful when you have a series of libraries that don't necessarily know about each
//   other. For example, here's how you might create the 'all' bundle:

  // | caterwaul.all = ['js_all', 'jquery', ...];
//     var all_compiler = caterwaul(':all');               <- equivalent to caterwaul('js_all jquery ...');

  var invoke_caterwaul_methods = function (methods) {
    /^:/.test(methods) && (methods = caterwaul_global[methods.substr(1)]);
    methods.constructor === String && (methods = methods.split(/\s+/));
    for (var i = 1, l = methods.length, r = caterwaul_global[methods[0]](); i < l; ++i) r = caterwaul_global[methods[i]](r);
    return r};

  caterwaul_global.init = function (macroexpander) {
    macroexpander || (macroexpander = function (x) {return true});
    return macroexpander.constructor === Function
      ? se((function () {var result = function (f, environment, options) {
                           return typeof f === 'function' || f.constructor === String ? caterwaul_global.compile(result.call(result, caterwaul_global.parse(f)), environment, options) :
                                                                                        f.rmap(function (node) {return macroexpander.call(result, node, environment, options)})};
                         return result})(),
          function () {this.global = caterwaul_global, this.macroexpander = macroexpander})
      : invoke_caterwaul_methods(macroexpander)};

  caterwaul_global.initializer = initializer;
  caterwaul_global.clone       = function () {return se(initializer(initializer, unique).deglobalize(),
                                                        function () {for (var k in caterwaul_global) this[k] || (this[k] = caterwaul_global[k])})};

// Replication.
// A Caterwaul function can replicate itself by returning a syntax tree that, when evaluated, returns an equivalent Caterwaul global (and in this case, installs it accordingly). This is not
// particularly computationally expensive most of the time, as opaque trees are returned.

  var w_template      = caterwaul_global.parse('(function (f) {return f(f)})(_x)'),
      module_template = caterwaul_global.parse('module(_name, _f)');

  caterwaul_global.replicator = function (options) {
    if (options && options.minimal_core_only) return w_template.replace({_x: new this.opaque_tree(this.core_initializer)});
    if (options && options.core_only)         return w_template.replace({_x: new this.opaque_tree(this.initializer)});
    for (var i = 0, ms = options && options.modules || this.modules, c = [], l = ms.length; i < l; ++i)
      c.push(module_template.replace({_name: this.syntax.from_string(ms[i]), _f: new this.opaque_tree(this.module(ms[i]))}));
    for (var i = 0, l = c.length, result = new this.syntax('.', w_template.replace({_x: new this.opaque_tree(this.initializer)})); i < l; ++i) result.push(c[i]);
    return this.late_bound_tree(result.unflatten())};

  return caterwaul});

// Generated by SDoc 
