// Caterwaul JS | Spencer Tipping
// Licensed under the terms of the MIT source code license

(function (f) {return f(f)}) (function (self, undefined) {

// Introduction.
// Caterwaul implements a very small Lisp in Javascript syntax. The syntax ends up looking much more like McCarthy's M-expressions than traditional S-expressions, due to the ease of embedding
// those in a JS-compatible grammar. Also, Javascript convention makes square-bracket calls such as qs[foo] relatively uncommon, so I'm using that as the macro syntax (though of course you can
// define macros with other forms as well).

// The most important thing Caterwaul does is provide a quotation operator. For example:

// | caterwaul.clone('std')(function () {
//     return qs[x + 1];
//   });

// This function returns a syntax tree representing the expression 'x + 1'. Caterwaul also includes macro-definition and quasiquoting (not quite like Lisp, though I imagine you could write a
// macro for that):

// | caterwaul.configure('std')(function () {
//     caterwaul.macro(qs[let (_ = _) in _], function (variable, value, expression) {
//       return qs[(function (variable) {return expression}).call(this, value)].replace({variable: variable, expression: expression, value: value});
//     });
//     // Macro usable in future caterwaul()ed functions
//   });

// Or, more concisely (since macro definitions can be used inside other macro definitions when you define with rmacro):

// | var f = caterwaul.configure('std')(function () {
//     caterwaul.rmacro(qs[let (_ = _) in _], fn[variable, value, expression]
//                                              [qs[(fn[variable][expression]).call(this, value)].replace({variable: variable, expression: expression, value: value})]);
//   });

// Note that 'caterwaul' inside a transformed function refers to the transforming function, not to the global Caterwaul function.

// See the 'Macroexpansion' section some distance below for more information about defining macros.

//   Coding style.
//   I like to code using syntactic minimalism, and since this project is a hobby instead of work I've run with that style completely. This has some advantages and some disadvantages. Advantages
//   include (1) a very small gzipped/minified footprint (especially since these comments make up most of the file), (2) few lines of code, though they are very long, and (3) lots of semantic
//   factoring that should make modification relatively simple. Disadvantages are (1) completely impenetrable logic (especially without the comments) and (2) possibly suboptimal performance in
//   the small scale (depending on whether your JS interpreter is optimized for statements or expressions).

//   There are a couple of things worth knowing about as you're reading through this code. One is that invariants are generally coded as such; for example, the 'own' property lookup is factored
//   out of the 'has' function even though it would be trivial to write it inside. This is to indicate to Javascript that Object.prototype.hasOwnProperty is relatively invariant, and that saves
//   some lookups as the code is running. Another is that I use the (function (variable) {return expression})(value) form to emulate let-bindings. (Reading the code with this in mind will make it
//   much more obvious what's going on.)

//   Utility methods.
//   Gensym is used to support qs[]. When we quote syntax, what we really intend to do is grab a syntax tree representing something; this entails creating a let-binding with the already-evaluated
//   tree. (Note: Don't go and modify these qs[]-generated trees; you only get one for each qs[].) The ultimate code ends up looking like this (see 'Environment-dependent compilation' some
//   distance below):

//   | (function (a_gensym) {
//       var v1 = a_gensym.gensym_1;
//       var v2 = a_gensym.gensym_2;
//       ...
//       return <your macroexpanded function>;
//     }) ({gensym_1: v1, gensym_2: v2, ..., gensym_n: vn});

//   A note about gensym uniqueness. Gensyms are astronomically unlikely to collide, but there are some compromises made to make sure of this. First, gensyms are not predictable; the first one is
//   randomized. This means that if you do have a collision, it may be intermittent (and that is probably a non-feature). Second, and this is a good thing, you can load Caterwaul multiple times
//   without worrying about gensyms colliding between them. Each instance of Caterwaul uses its own system time and random number to seed the gensym generation, and the system time remains stable
//   while the random number gets incremented. It is very unlikely that any collisions would happen.

//   Bind() is the usual 'bind this function to some value' function. The only difference is that it supports rebinding; that is, if you have a function you've already bound to X, you can call
//   bind on that function and some new value Y and get the original function bound to Y. The bound function has two attributes, 'original' and 'binding', that let bind() achieve this rebinding.

//   Map() is an array map function, fairly standard really. I include it because IE doesn't provide Array.prototype.map. hash() takes a string, splits it on whitespace, and returns an object
//   that maps each element to true. It's useful for defining sets. extend() takes a constructor function and zero or more extension objects, merging each extension object into the constructor
//   function's prototype. The constructor function is then returned. It's a shorthand for defining classes.

//   Se() stands for 'side-effect', and its purpose is to take a value and a function, pass the value into the function, and return either whatever the function returned or the value you gave it.
//   It's used to initialize things statefully; for example:

//   | return se(function () {return 5}, function (f) {
//       f.sourceCode = 'return 5';
//     });

//   The Caterwaul standard library gives you an equivalent but much more refined form of se() called /se[].

    var qw = function (x) {return x.split(/\s+/)},  id = function (x) {return x},  se = function (x, f) {return f && f.call(x, x) || x},
    gensym = (function (n, m) {return function () {return 'gensym_' + n.toString(36) + '_' + (++m).toString(36)}})(+new Date(), Math.random() * (1 << 30) >>> 0),

      bind = function (f, t) {return f.binding === t ? f : f.original ? bind(f.original, t) : merge(function () {return f.apply(t, arguments)}, {original: f, binding: t})},
       map = function (f, xs) {for (var i = 0, ys = [], l = xs.length; i < l; ++i) ys.push(f(xs[i], i)); return ys},
      hash = function (s) {for (var i = 0, xs = qw(s), o = {}, l = xs.length; i < l; ++i) o[xs[i]] = true; return annotate_keys(o)},
     merge = function (o) {for (var i = 1, l = arguments.length, _ = null; _ = arguments[i], i < l; ++i) if (_) for (var k in _) has(_, k) && (o[k] = _[k]); return o},
    extend = function (f) {merge.apply(null, [f.prototype].concat(Array.prototype.slice.call(arguments, 1))); return f},

//   Optimizations.
//   The parser and lexer each assume valid input and do no validation. This is possible because any function passed in to caterwaul will already have been parsed by the Javascript interpreter;
//   syntax errors would have caused an error there. This enables a bunch of optimization opportunities in the parser, ultimately making it not in any way recursive and requiring only three
//   linear-time passes over the token stream. (An approximate figure; it actually does about 19 fractional passes, but not all nodes are reached.)

//   Also, I'm not confident that all Javascript interpreters are smart about hash indexing. Particularly, suppose a hashtable has 10 entries, the longest of whose keys is 5 characters. If we
//   throw a 2K string at it, it might very well hash that whole thing just to find that, surprise, the entry doesn't exist. That's a big performance hit if it happens very often. To prevent this
//   kind of thing, I'm keeping track of the longest string in the hashtable by using the 'annotate_keys' function. 'has()' knows how to look up the maximum length of a hashtable to verify that
//   the candidate is in it, resulting in the key lookup being only O(n) in the longest key (generally this ends up being nearly O(1), since I don't like to type long keys), and average-case O(1)
//   regardless of the length of the candidate.

//   The bad part is that you can't refer to an object called '_max_length' -- this will never be considered to be in the hash. I don't really have a problem with that, but it's worth being aware
//   of. Also, on IE browsers various properties won't exist (among them toString, hasOwnProperty, etc.). These aren't special in Javascript so it isn't a problem, but it's still unfortunate.

    annotate_keys = function (o)    {var max = 0; for (var k in o) own.call(o, k) && (max = k.length > max ? k.length : max); o._max_length = max; return o},
              has = function (o, p) {return p && ! (p.length > o._max_length) && p !== '_max_length' && own.call(o, p)},  own = Object.prototype.hasOwnProperty,

//   Global management.
//   Caterwaul creates a global symbol, caterwaul. Like jQuery, there's a mechanism to get the original one back if you don't want to replace it. You can call caterwaul.deglobalize() to return
//   caterwaul and restore the global that was there when Caterwaul was loaded (might be useful in the unlikely event that someone else named their library Caterwaul). Note that deglobalize() is
//   available only on the global caterwaul() function. It wouldn't make much sense for clones to inherit it.

    _caterwaul = typeof caterwaul === 'undefined' ? undefined : caterwaul,

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

       syntax_node_inspect = function (x) {return x ? x.inspect() : '(<>)'},  syntax_node_tostring = function (x) {return x ? x.serialize ? x.serialize() : x.toString() : ''},

//   Syntax node functions.
//   These functions are common to various pieces of syntax nodes. Not all of them will always make sense, but the prototypes of the constructors can be modified independently later on if it
//   turns out to be an issue.

      node_methods = {

//     Mutability.
//     These functions let you modify nodes in-place. They're used during syntax folding and shouldn't really be used after that (hence the underscores).

       _replace: function (n) {return (n.l = this.l) && (this.l.r = n), (n.r = this.r) && (this.r.l = n), this},  _append_to: function (n) {return n && n._append(this), this},
      _reparent: function (n) {return this.p && this.p[0] === this && (this.p[0] = n), this},  _fold_l: function (n) {return this._append(this.l && this.l._unlink(this))},
        _append: function (n) {return (this[this.length++] = n) && (n.p = this), this},        _fold_r: function (n) {return this._append(this.r && this.r._unlink(this))},
       _sibling: function (n) {return n.p = this.p, (this.r = n).l = this},                                                            _fold_lr: function () {return this._fold_l()._fold_r()},
          _wrap: function (n) {return n.p = this._replace(n).p, this._reparent(n), delete this.l, delete this.r, this._append_to(n)},  _fold_rr: function () {return this._fold_r()._fold_r()},
        _unlink: function (n) {return this.l && (this.l.r = this.r), this.r && (this.r.l = this.l), delete this.l, delete this.r, this._reparent(n)},

//     These methods are OK for use after the syntax folding stage is over (though because syntax nodes are shared it's generally dangerous to go modifying them):

            pop: function () {return --this.length, this},  push: function (x) {return this[this.length++] = x, this},

//     Identification.
//     You can request that a syntax node identify itself, in which case it will give you a string identifier if it hasn't already. The identity is not determined until the first time it is
//     requested, and after that it is stable.

      id: function () {return this.id || (this.id = gensym())},

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

//     There is a map() variant called nmap() (and a corresponding rnmap()) that lets you insert falsy nodes into the syntax tree. This is used by replace(), which lets you replace named nodes
//     with falsy things if you want them to go away. (The exact behavior is that falsy nodes are not added to the syntax tree at all, rather than remaining in their original state.)

      each: function (f) {for (var i = 0, l = this.length; i < l; ++i) f(this[i], i); return this},
       map: function (f) {for (var n = new this.constructor(this), i = 0, l = this.length;    i < l; ++i) n.push(f(this[i], i) || this[i]); return n},
      nmap: function (f) {for (var n = new this.constructor(this), i = 0, l = this.length, r; i < l; ++i) (r = f(this[i], i)) && n.push(r); return n},
     reach: function (f) {f(this); this.each(function (n) {n && n.reach(f)}); return this},
      rmap: function (f) {var r = f(this); return ! r || r === this ? this. map(function (n) {return n && n. rmap(f)}) :      r.data === undefined ? new this.constructor(r) : r},
     rnmap: function (f) {var r = f(this); return        r === this ? this.nmap(function (n) {return n && n.rnmap(f)}) : r && r.data === undefined ? new this.constructor(r) : r},

     clone: function () {return this.rmap(function () {return false})},

   collect: function (p)  {var ns = []; this.reach(function (n) {p(n) && ns.push(n)}); return ns},
   replace: function (rs) {return this.rnmap(function (n) {return own.call(rs, n.data) ? rs[n.data] : n})},

//     Alteration.
//     These functions let you make "changes" to a node by returning a modified copy.

      repopulated_with: function (xs)   {return new this.constructor(this.data, xs)},
                change: function (i, x) {return se(new this.constructor(this.data, Array.prototype.slice.call(this)), function (n) {n[i] = x})},
        compose_single: function (i, f) {return this.change(i, f(this[i]))},

//     General-purpose traversal.
//     This is a SAX-style traversal model, useful for analytical or scope-oriented tree traversal. You specify a callback function that is invoked in pre-post-order on the tree (you get events
//     for entering and exiting each node, including leaves). Each time a node is entered, the callback is invoked with an object of the form {entering: node}, where 'node' is the syntax node
//     being entered. Each time a node is left, the callback is invoked with an object of the form {exiting: node}. The return value of the function is not used. Any null nodes are not traversed,
//     since they would fail any standard truthiness tests for 'entering' or 'exiting'.

//     I used to have a method to perform scope-annotated traversal, but I removed it for two reasons. First, I had no use for it (and no tests, so I had no reason to believe that it worked).
//     Second, Caterwaul is too low-level to need such a method. That would be more appropriate for an analysis extension.

      traverse: function (f) {f({entering: this}); f({exiting: this.each(function (n) {n && n.traverse(f)})}); return this},

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

      unflatten: function  () {var right = has(parse_associates_right, this.data); return this.length <= 2 ? this : se(new this.constructor(this.data), bind(function (n) {
                                 if (right) for (var i = 0, l = this.length - 1; i  < l; ++i) n = n.push(this[i]).push(i < l - 2 ? new this.constructor(this.data) : this[i])[1];
                                 else       for (var i = this.length - 1;        i >= 1; --i) n = n.push(i > 1 ? new this.constructor(this.data) : this[0]).push(this[i])[0]}, this))},

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

               is_string: function () {return /['"]/.test(this.data.charAt(0))},               as_escaped_string: function () {return this.data.substr(1, this.data.length - 2)}, 
               is_number: function () {return /\d/.test(this.data) && ! /^[\/\w'"]/.test(this.data)},  as_number: function () {return Number(this.data)},
              is_boolean: function () {return this.data === 'true' || this.data === 'false'},         as_boolean: function () {return this.data === 'true'},
               is_regexp: function () {return /^\/./.test(this.data)},                         as_escaped_regexp: function () {return this.data.substring(1, this.data.lastIndexOf('/'))},

       has_grouped_block: function () {return has(parse_r_until_block, this.data)},                     is_block: function () {return has(parse_block, this.data)},
    is_blockless_keyword: function () {return has(parse_r_optional, this.data)},            is_null_or_undefined: function () {return this.data === 'null' || this.data === 'undefined'},

             is_constant: function () {return this.is_number() || this.is_string() || this.is_boolean() || this.is_regexp() || this.is_null_or_undefined()},
          left_is_lvalue: function () {return /=$/.test(this.data) || /\+\+$/.test(this.data) || /--$/.test(this.data)},
                is_empty: function () {return !this.length},                              has_parameter_list: function () {return this.data === 'function' || this.data === 'catch'},
         has_lvalue_list: function () {return this.data === 'var' || this.data === 'const'},  is_dereference: function () {return this.data === '.' || this.data === '[]'},
           is_invocation: function () {return this.data === '()'},              is_contextualized_invocation: function () {return this.is_invocation() && this[0] && this[0].is_dereference()},

            is_invisible: function () {return has(parse_invisible, this.data)},           is_binary_operator: function () {return has(parse_lr, this.data)},
is_prefix_unary_operator: function () {return has(parse_r, this.data)},            is_postfix_unary_operator: function () {return has(parse_l,  this.data)},
       is_unary_operator: function () {return this.is_prefix_unary_operator() || this.is_postfix_unary_operator()},

                 accepts: function (e) {return parse_accepts[this.data] && this.accepts[parse.data] === (e.data || e)},

//     Value construction.
//     Syntax nodes sometimes represent hard references to values instead of just syntax. (See 'References' for more information.) In order to compile a syntax tree in the right environment you
//     need a mapping of symbols to these references, which is what the bindings() method returns. (It also collects references for all descendant nodes.) It takes an optional argument to
//     populate, in case you already had a hash set aside for bindings -- though it always returns the hash.

      bindings: function (hash) {var result = hash || {}; this.reach(function (n) {if (n.value) result[n.data] = n.value}); return result},

//     Matching.
//     Syntax trees can use the Caterwaul match function to return a list of wildcards.

         match: function (pattern) {return macro_try_match(pattern, this)},

//     Inspection and syntactic serialization.
//     Syntax nodes can be both inspected (producing a Lisp-like structural representation) and serialized (producing valid Javascript code). Each representation captures stray links via the 'r'
//     pointer. In the serialized representation, it is shown as a comment /* -> */ containing the serialization of whatever is to the right. This has the property that it will break tests but
//     won't necessarily break code (though if it happens in the field then it's certainly a bug).

//     There's a hack here for single-statement if-else statements. (See 'Grab-until-block behavior' in the parsing code below.) Basically, for various reasons the syntax tree won't munch the
//     semicolon and connect it to the expression, so we insert one automatically whenever the second node in an if, else, while, etc. isn't a block.

        toString: function () {return this.inspect()},
         inspect: function () {return (this.l ? '(left) <- ' : '') + '(' + this.data + (this.length ? ' ' + map(syntax_node_inspect, this).join(' ') : '') + ')' +
                                      (this.r ? ' -> ' + this.r.inspect() : '')},
       serialize: function () {var op = this.data, right = this.r ? '/* -> ' + this.r.serialize() + ' */' : '', space = /\w/.test(op.charAt(op.length - 1)) ? ' ' : '',
                                    s = has(parse_invisible, op) ? map(syntax_node_tostring, this).join(space) :
                                       has(parse_invocation, op) ? map(syntax_node_tostring, [this[0], op.charAt(0), this[1], op.charAt(1)]).join(space) :
                                          has(parse_ternary, op) ? map(syntax_node_tostring, [this[0], op, this[1], parse_group[op], this[2]]).join(space) :
                                            has(parse_group, op) ? op + map(syntax_node_tostring, this).join(space) + parse_group[op] :
                                               has(parse_lr, op) ? this.length ? map(syntax_node_tostring, this).join(space + op + space) : op :
                   has(parse_r, op) || has(parse_r_optional, op) ? op.replace(/^u/, '') + space + (this[0] ? this[0].serialize() : '') :
                                    has(parse_r_until_block, op) ? has(parse_accepts, op) && this[1] && this[1].data !== '{' && this[2] && parse_accepts[op] === this[2].data ?
                                                                    op + space + map(syntax_node_tostring, [this[0], this[1], ';', this[2]]).join('') :
                                                                    op + space + map(syntax_node_tostring, this).join('') :
                                                has(parse_l, op) ? (this[0] ? this[0].serialize() : '') + space + op : op;
                               return right ? s + right : s}},

//   References.
//   You can drop references into code that you're compiling. This is basically variable closure, but a bit more fun. For example:

//   | caterwaul.compile(qs[fn_[_ + 1]].replace({_: new caterwaul.ref(3)})()    // -> 4

//   What actually happens is that caterwaul.compile runs through the code replacing refs with gensyms, and the function is evaluated in a scope where those gensyms are bound to the values they
//   represent. This gives you the ability to use a ref even as an lvalue, since it's really just a variable. References are always leaves on the syntax tree, so the prototype has a length of 0.

    ref = extend(function (value) {if (value instanceof this.constructor) {this.value = value.value; this.data = value.data}
                                   else                                   {this.value = value;       this.data = gensym()}}, {length: 0}, node_methods),

//   Syntax node constructor.
//   Here's where we combine all of the pieces above into a single function with a large prototype:

    syntax_node = extend(function (data) {if (data instanceof this.constructor) this.data = data.data, this.length = 0;
                                          else {this.data = data; this.length = 0; for (var i = 1, l = arguments.length, _; _ = arguments[i], i < l; ++i)
                                                                                     for (var j = 0, lj = _.length, it; _.constructor === Array ? (it = _[j], j < lj) : (it = _, ! j); ++j)
                                                                                       this._append(it.constructor === String ? new this.constructor(it) : it)}}, node_methods),

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

//   Of course, building strings via concatenation is also O(n^2), so I also avoid that for any strings that could be long. This is achieved by using a mark to indicate where the substring begins,
//   and advancing i independently. The span between mark and i is the substring that will be selected, and since each substring both requires O(n) time and consumes n characters, the lexer as a
//   whole is O(n). (Though perhaps with a large constant.)

//     Precomputed table values.
//     The lexer uses several character lookups, which I've optimized by using integer->boolean arrays. The idea is that instead of using string membership checking or a hash lookup, we use the
//     character codes and index into a numerical array. This is guaranteed to be O(1) for any sensible implementation, and is probably the fastest JS way we can do this. For space efficiency, only
//     the low 256 characters are indexed. High characters will trigger sparse arrays, which may degrade performance. (I'm aware that the arrays are power-of-two-sized and that there are enough of
//     them, plus the right usage patterns, to cause cache line contention on most Pentium-class processors. If we are so lucky to have a Javascript JIT capable enough to have this problem, I think
//     we'll be OK.)

//     The lex_op table indicates which elements trigger regular expression mode. Elements that trigger this mode cause a following / to delimit a regular expression, whereas other elements would
//     cause a following / to indicate division. By the way, the operator ! must be in the table even though it is never used. The reason is that it is a substring of !==; without it, !== would
//     fail to parse, which causes an infinite loop. (See test/lex-neq-failure for examples.)

         lex_op = hash('. new ++ -- u++ u-- u+ u- typeof u~ u! ! * / % + - << >> >>> < > <= >= instanceof in == != === !== & ^ | && || ? = += -= *= /= %= &= |= ^= <<= >>= >>>= : , ' +
                       'return throw case var const break continue void else u; ;'),

      lex_table = function (s) {for (var i = 0, xs = [false]; i < 8; ++i) xs = xs.concat(xs); for (var i = 0, l = s.length; i < l; ++i) xs[s.charCodeAt(i)] = true; return xs},
      lex_float = lex_table('.0123456789'),    lex_decimal = lex_table('0123456789'),  lex_integer = lex_table('0123456789abcdefABCDEFx'),  lex_exp = lex_table('eE'),
      lex_space = lex_table(' \n\r\t'),        lex_bracket = lex_table('()[]{}'),       lex_opener = lex_table('([{'),                    lex_punct = lex_table('+-*/%&|^!~=<>?:;.,'),
        lex_eol = lex_table('\n\r'),     lex_regexp_suffix = lex_table('gims'),          lex_quote = lex_table('\'"/'),                   lex_slash = '/'.charCodeAt(0),
       lex_star = '*'.charCodeAt(0),              lex_back = '\\'.charCodeAt(0),             lex_x = 'x'.charCodeAt(0),                     lex_dot = '.'.charCodeAt(0),
       lex_zero = '0'.charCodeAt(0),     lex_postfix_unary = hash('++ --'),              lex_ident = lex_table('$_abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'),

//     Parse data.
//     The lexer and parser aren't entirely separate, nor can they be considering the complexity of Javascript's grammar. The lexer ends up grouping parens and identifying block constructs such
//     as 'if', 'for', 'while', and 'with'. The parser then folds operators and ends by folding these block-level constructs.

    parse_reduce_order = map(hash, ['function', '( [ . [] ()', 'new delete', 'u++ u-- ++ -- typeof u~ u! u+ u-', '* / %', '+ -', '<< >> >>>', '< > <= >= instanceof in', '== != === !==', '&',
                                    '^', '|', '&&', '||', 'case', '?', '= += -= *= /= %= &= |= ^= <<= >>= >>>=', ':', ',', 'return throw break continue void', 'var const',
                                    'if else try catch finally for switch with while do', ';']),

parse_associates_right = hash('= += -= *= /= %= &= ^= |= <<= >>= >>>= ~ ! new typeof u+ u- -- ++ u-- u++ ? if else function try catch finally for switch case with while do'),
   parse_inverse_order = (function (xs) {for (var  o = {}, i = 0, l = xs.length; i < l; ++i) for (var k in xs[i]) has(xs[i], k) && (o[k] = i); return annotate_keys(o)}) (parse_reduce_order),
   parse_index_forward = (function (rs) {for (var xs = [], i = 0, l = rs.length, _ = null; _ = rs[i], xs[i] = true, i < l; ++i)
                                           for (var k in _) if (has(_, k) && (xs[i] = xs[i] && ! has(parse_associates_right, k))) break; return xs}) (parse_reduce_order),

              parse_lr = hash('[] . () * / % + - << >> >>> < > <= >= instanceof in == != === !== & ^ | && || = += -= *= /= %= &= |= ^= <<= >>= >>>= , : ;'),
   parse_r_until_block = annotate_keys({'function':2, 'if':1, 'do':1, 'catch':1, 'try':1, 'for':1, 'while':1, 'with':1}),
         parse_accepts = annotate_keys({'if':'else', 'do':'while', 'catch':'finally', 'try':'catch'}),  parse_invocation = hash('[] ()'),
      parse_r_optional = hash('return throw break continue else'),  parse_also_expression = hash('function'),    parse_r = hash('u+ u- u! u~ u++ u-- new typeof finally var const void delete'),
           parse_block = hash('; {'),  parse_invisible = hash('i;'),              parse_l = hash('++ --'),   parse_group = annotate_keys({'(':')', '[':']', '{':'}', '?':':'}),
 parse_ambiguous_group = hash('[ ('),    parse_ternary = hash('?'),     parse_not_a_value = hash('function if for while catch'),

//   Parse function.
//   As mentioned earlier, the parser and lexer aren't distinct. The lexer does most of the heavy lifting; it matches parens and brackets, arranges tokens into a hierarchical linked list, and
//   provides an index of those tokens by their fold order. It does all of this by streaming tokens into a micro-parser whose language is grouping and that knows about the oddities required to
//   handle regular expression cases. In the same function, though as a distinct case, the operators are folded and the syntax is compiled into a coherent tree form.

//   The input to the parse function can be anything whose toString() produces valid Javascript code.

      parse = function (input) {

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
            grouping_stack = [], gs_top = null, head = null, parent = null, indexes = map(function () {return []}, parse_reduce_order), invocation_nodes = [], all_nodes = [],
            new_node = function (n) {return all_nodes.push(n), n}, push = function (n) {return head ? head._sibling(head = n) : (head = n._append_to(parent)), new_node(n)};

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
                        has(parse_inverse_order, t) && indexes[parse_inverse_order[t]].push(head || parent));

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

//     First step: fold function literals, function calls, dots, and dereferences.
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

            if (has(parse_lr, data)) node._fold_lr();

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

       else if (has(parse_ternary, data)) {node._fold_lr(); var temp = node[1]; node[1] = node[0]; node[0] = temp}

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

        for (var i = all_nodes.length - 1, _; _ = all_nodes[i], i >= 0; --i)  _.r && _._wrap(new syntax_node('i;')).p._fold_r();

//     Fourth step.
//     Flatten out all of the invocation nodes. As explained earlier, they are nested such that the useful data on the right is two levels down. We need to grab the grouping construct on the
//     right-hand side and remove it so that only the invocation or dereference node exists. During the parse phase we built an index of all of these invocation nodes, so we can iterate through
//     just those now. I'm preserving the 'p' pointers, though they're probably not useful beyond here.

        for (var i = 0, l = invocation_nodes.length, _, child; _ = invocation_nodes[i], i < l; ++i) (child = _[1] = _[1][0]) && (child.p = _);

        while (head.p) head = head.p;

//     Fifth step.
//     Prevent a space leak by clearing out all of the 'p' pointers.

        for (var i = all_nodes.length - 1; i >= 0; --i)  delete all_nodes[i].p;
        return head},

// Macroexpansion.
// Caterwaul is a Lisp, which in this case means that it provides the ability to transform code before that code is compiled. Lisp does macroexpansion inline; that is, as the code is being read
// (or compiled -- there are several stages I believe). Caterwaul provides offline macros instead; that is, you define them separately from their use. This gives Caterwaul some opportunity to
// optimize macro-rewriting.

// Defining offline macros is done in the normal execution path. For example:

// | caterwaul(function () {
//     caterwaul.rmacro(qs[let (_ = _) in _], fn[n, v, e][qs[fn[args][body].call(this, values)].replace({args: n, body: e, values: v})]);
//   }) ();        // Must invoke the function

// | // Macro is usable in this function:
//   caterwaul(function () {
//     let (x = 5) in console.log(x);
//   });

// Wrapping the first function in caterwaul() wasn't necessary, though it was helpful to get the qs[] and fn[] shorthands. In this case, the macro is persistent to the caterwaul function that it
// was called on. (So any future caterwaul()ed functions would have access to it.)

// You can also define conditional macros, though they will probably be slower. For example:

// | caterwaul(function () {
//     caterwaul.rmacro(qs[let (_) in _], fn[bs, e][bs.data === '=' && ...]);
//   }) ();

// Here, returning a falsy value indicates that nothing should be changed about this syntax tree. It is replaced by itself and processing continues normally. You should try to express things in
// terms of patterns; there are theoretical optimizations that can cut the average-case runtime of pattern matching to a fraction of a full linear scan. The worst possible case is when you match
// on a universal pattern and restrict later:

// | caterwaul(function () {
//     caterwaul.rmacro(qs[_], fn[x][...]);
//   }) ();

// This will call your macroexpander once for every node in the syntax tree, which for large progams is costly. If you really do have such a variant structure, your best bet is to define separate
// macros, one for each case:

// | caterwaul(function () {
//     var patterns = [qs[foo], qs[bar], qs[bif]];
//     patterns.map (function (p) {
//       caterwaul.rmacro (p, fn[x][...]);
//     });
//   }) ();

// This gives Caterwaul the opportunity to call your function only on relevant nodes. (Note that at present I haven't found an algorithm to make things any faster than using a depth-first scan.
// However, if I do find such an algorithm later on then macroexpansion will run quite a bit faster for programs with well-defined patterns.)

//   Pitfalls of macroexpansion.
//   Macroexpansion as described here can encode a lambda-calculus. The whole point of having macros is to make them capable, so I can't complain about that. But there are limits to how far I'm
//   willing to go down the pattern-matching path. Let's suppose the existence of the let-macro, for instance:

//   | let (x = y) in z   ->   (function (x) {return z}) (y)

//   If you write these macros:

//   | foo[x, y]   ->   let (x = y)
//     bar[x, y]   ->   x in y

//   Caterwaul is not required to expand bar[foo[x, y], z] into (function (x) {return z}) (y). It might just leave it at let (x = y) in z instead. The reason is that while the individual
//   macroexpansion outputs are macroexpanded, a fixed point is not run on macroexpansion in general. (That would require multiple-indexing, which in my opinion isn't worth the cost.) To get the
//   extra macroexpansion you would have to wrap the whole expression in another macro, in this case called 'expand':

//   | caterwaul.configure(function () {
//       this.rmacro(expand[_], fn[expression][caterwaul.macroexpand(expression)]);
//     });

//   This is an eager macro; by outputting the already-expanded contents, it gets another free pass through the macroexpander.

//   Things that are not guaranteed:

//   | 1. Reassembly of different pieces (see above)
//     2. Anything at all, if you modify the syntax tree in the macro code. Returning a replacement is one thing, but modifying one will break things.
//     3. Performance bounds.

//   Macro vs. rmacro.
//   macro() defines a macro whose expansion is left alone. rmacro(), on the other hand, will macroexpand the expansion, letting you emit macro-forms such as fn[][]. Most of the time you will
//   want to use rmacro(), but if you want to have a literal[] macro, for instance, you would use macro():

//   | caterwaul.configure(function () {
//       // Using macro() instead of rmacro(), so no further expansion:
//       this.macro(qs[literal[_]], fn[x][x]);
//     });

//   While macro() is marginally faster than rmacro(), the difference isn't significant in most cases.

//   Matching.
//   macro_try_match returns null if two syntax trees don't match, or a possibly empty array of wildcards if the given tree matches the pattern. Wildcards are indicated by '_' nodes, as
//   illustrated in the macro definition examples earlier in this section. Note that this function is O(n) in the number of nodes in the pattern. It is optimized, though, to reject invalid nodes
//   quickly -- that is, if there is any mismatch in arity or data.

      macro_array_push = Array.prototype.push,
      macro_try_match  = function (pattern, t) {if (pattern.data === '_')                                   return [t];
                                                if (pattern.data !== t.data || pattern.length !== t.length) return null;
                                                for (var i = 0, l = pattern.length, wildcards = [], match = null; i < l; ++i)
                                                  if (match = macro_try_match(pattern[i], t[i])) macro_array_push.apply(wildcards, match);
                                                  else                                           return null;
                                                return wildcards},

//   Expansion.
//   Uses the straightforward brute-force algorithm to go through the source tree and expand macros. At first I tried to use indexes, but found that I couldn't think of a particularly good way to
//   avoid double-expansion -- that is, problems like qs[qs[foo]] -- the outer must be expanded without the inner one. Most indexing strategies would not reliably (or if reliably, not profitably)
//   index the tree in such a way as to encode containment. Perhaps at some point I'll find a faster macroexpander, especially if this one proves to be slow. At this point macroexpansion is by
//   far the most complex part of this system, at O(nki) where n is the number of parse tree nodes, k is the number of macros, and i is the number of nodes in the macro pattern tree. (Though in
//   practice it's generally not quite so bad.)
//   
//   Note! This function by default does not re-macroexpand the output of macros. That is handled at a higher level by Caterwaul's macro definition facility (see the 'rmacro' method).

//   The fourth parameter, 'context', is used to hand a 'this' reference to the macroexpander. This is necessary to get defmacro[] to work properly, and in general lets macros be side-effectful.
//   (Not that you should be in the habit of defining side-effectful macros, but I certainly won't stop you.)

//   Note that as of version 0.5, macroexpansion proceeds backwards. This means that the /last/ matching macro is used, not the first. It's an important feature, as it lets you write new macros
//   to override previous definitions. This ultimately lets you define sub-caterwaul functions for DSLs, and each can define a default case by matching on qs[_] (thus preventing access to other
//   macro definitions that may exist).

    macro_expand = function (t, macros, expanders, context) {
                     return t.rmap(function (n) {for (var i = macros.length - 1, macro, match, replacement; i >= 0 && (macro = macros[i]); --i)
                                                   if ((match = macro_try_match(macro, n)) && (replacement = expanders[i].apply(context, match))) return replacement})},

// Environment-dependent compilation.
// It's possible to bind variables from 'here' (i.e. this runtime environment) inside a compiled function. The way we do it is to create a closure using a gensym. (Another reason that gensyms
// must really be unique.) Here's the idea. We use the Function constructor to create an outer function, bind a bunch of variables directly within that scope, and return the function we're
// compiling. The variables correspond to gensyms placed in the code, so the code will have closure over those variables.

// An optional second parameter 'environment' can contain a hash of variable->value bindings. These will be defined as locals within the compiled function.

  compile = function (tree, environment) {      // Despite the coincidence of 'tree' and 'environment' on this line, I'm seriously not pushing a green agenda :)
    var vars = [], values = [], bindings = merge({}, environment || {}, tree.bindings()), s = gensym(); for (var k in bindings) if (has(bindings, k)) vars.push(k), values.push(bindings[k]);
    var code = map(function (v) {return 'var ' + v + '=' + s + '.' + v}, vars).join(';') + ';return(' + tree.serialize() + ')';
    try {return (new Function(s, code))(bindings)} catch (e) {throw new Error('Caught ' + e + ' while compiling ' + code)}},

// Configurations.
// Caterwaul is stateful in some ways, most particularly with macro definitions and compiler options. To prevent you from having to modify the global caterwaul() function, I've enabled
// replication. This works by giving you access to copies of caterwaul() (and copies of those copies, if you so choose) that you can customize independently. So, for example:

// | var copy = caterwaul.clone (function () {
//     // This function is for customizations. Totally optional; can also customize at the toplevel.
//     this.macro(qs[foo], fn_[qs[bar]]);
//   });

// | copy(function () {
//     var bar = 6;
//     return foo;
//   }) ();                // returns 6

// Related to this is a configure() method that modifies and returns the original function:

// | caterwaul.configure (function () {
//     // Global configuration using 'this'
//   });

//   Attributes and methods.
//   Function copying doesn't involve copying over every attribute indiscriminately, since different behaviors are required for different properties. For example, the macro table should be copied
//   so that clones append to their local copies, methods should be rebound to the new function, and some attributes should just be referenced. These behaviors are encoded by way of an attribute
//   table that keeps track of what to do with each. Attributes show up in this table when you call one of the attribute-association methods:

//   | .field('attribute', value)          Creates a reference-copying attribute. No copying is done at all; the attribute is cross-referenced between copies of the Caterwaul function.
//     .shallow('attribute', value)        Creates an attribute whose value is copied shallowly; for hashes or arrays.
//     .method('name', f)                  Creates a method bound to the Caterwaul function. f will be bound to any copies on those copies.

//   Naturally, attributes that don't appear in the table are left alone. You can add more of these attribute behaviors using the behavior() method:

//   | .behavior('name', definition)       Creates a new attribute behavior. definition() should take an original attribute value and return a new one, where 'this' is the new Caterwaul function.

//   Underlying this mechanism is the associate() method:

//   | .associate('attribute', 'behavior', value)          Creates an attribute with the given behavior and assigns it a value.

//   A couple of notes. First, these functions are bound to the function they modify; that is, you can eta-reduce them freely. Second, this is not a general purpose function replicator. All of
//   the functions returned here call their own init() method rather than sharing a function body somewhere. (To be fair, the init() method gets referenced -- so it's almost as good I suppose.) A
//   general-purpose way to do this would be to have g call f instead of g.init in the copy_of() function below. I'm not doing this in order to save stack frames; I want the function call
//   performance to be constant-time in the number of copies.

//   Another thing to be aware of is that this isn't a general-purpose metaclassing framework. I made a compromise by discouraging side-effecting initialization in the behavior-association
//   methods -- these should just copy things, reference them, or transform them in some nondestructive way. This makes it easier to have extensional copies of objects, since there are fewer
//   unknowns about the internal state. (e.g. we know that if 'foo' appears in the attribute table, we'll have something called 'foo' on the object itself and we can call its behavior -- we don't
//   have to wonder about anything else.)

  associator_for = function (f) {return function (name, behavior, value) {return f[name] = (f.behaviors[f.attributes[name] = behavior] || id).call(f, value), f}},
    shallow_copy = function (x) {return x && (x.constructor === Array ? Array.prototype.slice.call(x) : x.clone ? x.clone() : merge({}, x))},
         copy_of = function (f) {var g = merge(function () {return g.init.apply(g, arguments)}, {behaviors: shallow_copy(f.behaviors), attributes: {}});
                                 return se(g, function (g) {(g.associate = associator_for(g))('behavior', 'method', function (name, definition) {this.behaviors[name] = definition;
                                                              return this.associate(name, 'method', function (attribute, value) {return this.associate(attribute, name, value)})}).
                                                            behavior('method', g.behaviors.method);

                                                            for (var k in f.attributes) has(f.attributes, k) && g.associate(k, f.attributes[k], f[k])})};

  return caterwaul = merge(copy_of({behaviors: {method: function (v) {return bind(v, this)}}}), {deglobalize: function () {caterwaul = _caterwaul; return this}}).

//   Bootstrapping method behavior.
//   Setting up the behavior(), method(), field(), and shallow() methods. The behavior() and method() methods are codependent and are initialized in the copy_of function above, whereas the
//   field() and shallow() methods are not core and are defined here. I'm also defining a 'configuration' function to allow quick definition of new configurations. (These are loadable by their
//   names when calling clone() or configure() -- see 'Configuration and cloning' below.) A complement method, 'tconfiguration', is also available. This transforms the configuration function
//   before storing it in the table, enabling you to use things like 'qs[]' without manually transforming stuff. The downside is that you lose closure state and can't bind variables.

//   There's a convenience method called 'namespace', which is used when you have a shallow hash shared among different modules. It goes only one level deep.

    method('tconfiguration', function (configs, name, f) {this.configurations[name] = this.clone(configs)(f); return this}).behavior('field').behavior('shallow', shallow_copy).
    method('configuration',  function          (name, f) {this.configurations[name] = f; return this}).method('namespace', function (s) {return this[s] || this.shallow(s, {})[s]}).

// Global Caterwaul setup.
// Now that we've defined lexing, parsing, and macroexpansion, we can create a global Caterwaul function that has the appropriate attributes.

    shallow('macro_patterns', []).shallow('macro_expanders', []).shallow('configurations', {}).shallow('has', {}).
      field('syntax', syntax_node).field('ref', ref).field('parse', parse).field('compile', compile).field('gensym', gensym).field('map', map).field('self', self).

      field('global', function () {return caterwaul}).
      field('decompile', parse).method('macro', function (pattern, expansion) {return this.macro_patterns.push(pattern), this.macro_expanders.push(expansion), this}).

     method('init',   function                 (f) {return this.compile(this.macroexpand(this.decompile(f)))}).
     method('rmacro', function (pattern, expander) {if (! expander.apply) throw new Error('caterwaul.rmacro: Cannot define macro with non-function expander');
                                                    else return this.macro(pattern, function () {var t = expander.apply(this, arguments); return t && this.macroexpand(t)})}).

     method('macroexpand',  function (t) {return macro_expand(t, this.macro_patterns, this.macro_expanders, this)}).
     method('reinitialize', function (transform, erase_configurations) {var c = transform(this.self), result = c(c).deglobalize();
                                                                        erase_configurations || (result.configurations = this.configurations); return result}).

// Utility library.
// Caterwaul uses and provides some design-pattern libraries to encourage extension consistency. This is not entirely selfless on my part; configuration functions have no access to the variables
// I've defined above, since the third-party ones are defined outside of the Caterwaul main function. So anything that they need access to must be accessible on the Caterwaul function that is
// being configured; thus a 'util' object that contains some useful stuff. For starters it contains some general-purpose methods:

    shallow('util', {extend: extend, merge: merge, se: se, macro_try_match: macro_try_match, id: id, bind: bind, map: map, qw: qw}).

// Magic.
// Sometimes you need to grab a unique value that is unlikely to exist elsewhere. Caterwaul gives you such a value given a string. These values are shared across all Caterwaul instances and are
// considered to be opaque. Because of the possibility of namespace collisions, you should name your magic after a configuration or otherwise prefix it somehow.

     method('magic', (function (table) {return function (name) {return table[name] || (table[name] = {})}})({})).

// Configuration and cloning.
// Caterwaul ships with a standard library of useful macros, though they aren't activated by default. To activate them, you say something like this:

// | caterwaul.configure('std.fn');
//   // Longhand access to the function:
//   caterwaul.configurations['std.fn']

// You can also pass these libraries into a clone() call:

// | var copy = caterwaul.clone('std.fn', 'some_other_library', function () {
//     ...
//   });

// Generally you will just configure with 'std', which includes all of the standard configurations (see caterwaul.std.js.sdoc in the modules/ directory).

// Note that functions passed to clone() and configure() are transformed using the existing caterwaul instance. This means that closure state is lost, so configuration at the toplevel is a good
// idea. Named configurations, on the other hand, are not explicitly transformed; so when you define a custom configuration in a named way, you will want to manually transform it. (The reason for
// this is that we don't want to force the configuration author to lose closure state, since it's arguably more important in a library setting than an end-user setting.) Alternatively you can use
// tconfigure(), which takes a series of configurations to use to transform your configuration function. (This makes more sense in code than in English; see how the configurations below are
// written...)

// Named configurations are made idempotent; that is, they cannot be applied twice. This is done through the 'has' hash, which can be manually reset if you actually do need to apply a
// configuration multiple times (though you're probably doing something wrong if you do need to do that).

    method('clone',     function () {return arguments.length ? this.clone().configure.apply(null, arguments) : copy_of(this)}).
    method('configure', function () {for (var i = 0, l = arguments.length, _; _ = arguments[i], i < l; ++i)
                                       if (_.constructor === String) for (var cs = qw(arguments[i]), j = 0, lj = cs.length; _ = cs[j], j < lj; ++j)
                                                                       if (this.configurations[_]) this.has[_] || (this.has[_] = this.configurations[_].call(this) || this);
                                                                       else                        throw new Error('caterwaul.configure error: configuration "' + _ + '" does not exist');
                                       else _.constructor === Array ? this.configure.apply(this, _) : this(_).call(this); return this})});

// Generated by SDoc 
// Caterwaul standard library | Spencer Tipping
// Licensed under the terms of the MIT source code license

  caterwaul.

// Qs library.
// You really need to use this if you're going to write macros. It enables the qs[] construct in your code. This comes by default when you configure with 'std'. A variant, qse[], macroexpands the
// quoted code first and returns the macroexpansion. This improves performance while still enabling terse macro forms -- for example, if you write this:

// | this.rmacro(qs[foo[_]], function (tree) {return qse[fn_[x + 1]].replace({x: tree})})

// The fn_[] will be expanded exactly once when the qse[] is processed, rather than each time as part of the macroexpansion. I don't imagine it improves performance that noticeably, but it's
// been bugging me for a while so I decided to add it.

// Finally, there's also a literal[] macro to preserve code forms. Code inside literal[] will not be macroexpanded in any way.

  configuration('std.qs', function () {this.macro(this.parse('qs[_]'),      function (tree) {return new this.ref(tree)}).
                                            macro(this.parse('qse[_]'),     function (tree) {return new this.ref(this.macroexpand(tree))}).
                                            macro(this.parse('literal[_]'), function (tree) {return tree})}).

// Qg library.
// The qg[] construct seems useless; all it does is parenthesize things. The reason it's there is to overcome constant-folding and rewriting Javascript runtimes such as SpiderMonkey. Firefox
// failed the unit tests when ordinary parentheses were used because it requires disambiguation for expression-mode functions only at the statement level; thus syntax trees are not fully mobile
// like they are ordinarily. Already-parenthesized expressions aren't wrapped.

  tconfiguration('std.qs', 'std.qg', function () {this.rmacro(qs[qg[_]], function (expression) {return expression.as('(')})}).

// Function abbreviations (the 'fn' library).
// There are several shorthands that are useful for functions. fn[x, y, z][e] is the same as function (x, y, z) {return e}, fn_[e] constructs a nullary function returning e. fb[][] and fb_[]
// are identical to fn[][] and fn_[], but they preserve 'this' across the function call.

// The fc[][] and fc_[] variants build constructor functions. These are just like regular functions, but they always return undefined.

  tconfiguration('std.qs std.qg', 'std.fn', function () {
    this.configure('std.qg').
         rmacro(qs[fn[_][_]], function (vars, expression) {return qs[qg[function (vars) {return expression}]].replace({vars: vars, expression: expression})}).
         rmacro(qs[fn_[_]],   function       (expression) {return qs[qg[function     () {return expression}]].replace({expression: expression})}).
         rmacro(qs[fb[_][_]], function (vars, expression) {return qse[fn[_t][fn_[fn[vars][e].apply(_t, arguments)]](this)].replace({_t: this.gensym(), vars: vars, e: expression})}).
         rmacro(qs[fb_[_]],   function       (expression) {return qse[fn[_t][fn_[fn_     [e].apply(_t, arguments)]](this)].replace({_t: this.gensym(),             e: expression})}).
         rmacro(qs[fc[_][_]], function       (vars, body) {return qse[qg[fn[vars][body, undefined]]].replace({vars: vars, body: body})}).
         rmacro(qs[fc_[_]],   function             (body) {return qse[qg[fn[vars][body, undefined]]].replace({            body: body})})}).

// Object abbreviations (the 'obj' library).
// Another useful set of macros is the /mb/ and the /mb[] notation. These return methods bound to the object from which they were retrieved. This is useful when you don't want to explicitly
// eta-expand when calling a method in point-free form:

// | xs.map(object/mb/method);           // === xs.map(fn[x][object.method(x)])
//   xs.map(object/mb[method]);          // === xs.map(fn[x][object[method](x)])

// Also useful is side-effecting, which you can do this way:

// | {} /se[_.foo = 'bar']               // === l[_ = {}][_.foo = 'bar', _]

// Side-effects can be chained since / is left-associative.

// An alternative form of side-effecting is the 'right-handed' side-effect, written x /re[y]. This returns the result of evaluating y, where _ is bound to x. Variants of /se and /re allow you to
// specify a variable name:

// | {} /se.o[o.foo = 'bar']

  tconfiguration('std.qs std.qg std.fn', 'std.obj', function () {
    this.configure('std.qg std.fn').rmacro(qs[_/mb/_],    fn   [object, method][qse[qg[fn[_o][fn_[_o.m.apply (_o, arguments)]]](o)].replace({_o: this.gensym(), o: object, m: method})]).
                                    rmacro(qs[_/mb[_]],   fn   [object, method][qse[qg[fn[_o][fn_[_o[m].apply(_o, arguments)]]](o)].replace({_o: this.gensym(), o: object, m: method})]).
                                    rmacro(qs[_/se[_]],   fn      [value, body][qse[qg[fn[_][body, _]].call(this, value)].replace({body: body, value: value})]).
                                    rmacro(qs[_/re[_]],   fn      [value, body][qse[qg[fn[_]   [body]].call(this, value)].replace({body: body, value: value})]).
                                    rmacro(qs[_/se._[_]], fn[value, name, body][qse[qg[fn[name][body, name]].call(this, value)].replace({body: body, name: name, value: value})]).
                                    rmacro(qs[_/re._[_]], fn[value, name, body][qse[qg[fn[name]      [body]].call(this, value)].replace({body: body, name: name, value: value})])}).

// Binding abbreviations (the 'bind' library).
// Includes forms for defining local variables. One is 'l[bindings] in expression', and the other is 'expression, where[bindings]'. For the second, keep in mind that comma is left-associative.
// This means that you'll get the whole comma-expression placed inside a function, rendering it useless for expressions inside procedure calls. (You'll need parens for that.) Each of these
// expands into a function call; e.g.

// | l[x = 6] in x + y         -> (function (x) {return x + y}).call(this, 6)

// You also get l* and where*, which define their variables in the enclosed scope:

// | l*[x = 6, y = x] in x + y
//   // compiles into:
//   (function () {
//     var x = 6, y = x;
//     return x + y;
//   }).call(this);

// This form has a couple of advantages over the original. First, you can use the values of previous variables; and second, you can define recursive functions:

// | l*[f = fn[x][x > 0 ? f(x - 1) + 1 : x]] in f(5)

// You can also use the less English-like but more expressive l[...][...] syntax:

// | l[x = 5][x + 1]
//   l*[f = fn[x][x > 0 ? f(x - 1) + 1 : x]][f(5)]

// This has the advantage that you no longer need to parenthesize any short-circuit, decisional, or relational logic in the expression.

// The legacy let and let* forms are also supported, but they will cause syntax errors in some Javascript interpreters (hence the change).

  tconfiguration('std.qs std.qg std.fn', 'std.bind', function () {this.configure('std.qg');
    var lf = fb[form][this.rmacro(form, l_expander)], lsf = fb[form][this.rmacro(form, l_star_expander)],
        l_star_expander = fb[vars, expression][qs[qg[function () {var vars; return expression}].call(this)].replace({vars: this.macroexpand(vars), expression: expression})],
        l_expander      = fb[vars, expression][vars = this.macroexpand(vars).flatten(','),
                            qs[qg[function (vars) {return e}].call(this, values)].replace({vars: vars.map(fn[n][n[0]]).unflatten(), e: expression, values: vars.map(fn[n][n[1]]).unflatten()})];

    lf (qs[l [_] in _]), lf (qs[l [_][_]]), lf (this.parse('let [_] in _')), lf (this.parse('let [_][_]')).rmacro(qs[_, where [_]], fn[expression, vars][l_expander(vars, expression)]);
    lsf(qs[l*[_] in _]), lsf(qs[l*[_][_]]), lsf(this.parse('let*[_] in _')), lsf(this.parse('let*[_][_]')).rmacro(qs[_, where*[_]], fn[expression, vars][l_star_expander(vars, expression)])}).

// Assignment abbreviations (the 'lvalue' library).
// Lets you create functions using syntax similar to the one supported in Haskell and OCaml -- for example, f(x) = x + 1. You can extend this too, though Javascript's grammar is not very easy
// to work with on this point. (It's only due to an interesting IE feature (bug) that assigning to a function call is possible in the first place.)

  tconfiguration('std.qs std.qg std.fn', 'std.lvalue', function () {this.rmacro(qs[_(_) = _], fn[base, params, value][qs[base = qg[function (params) {return value}]].
                                                                                                                        replace({base: base, params: params, value: value})])}).

// Conditional abbreviations (the 'cond' library).
// Includes forms for making decisions in perhaps a more readable way than using short-circuit logic. In particular, it lets you do things postfix; i.e. 'do X if Y' instead of 'if Y do X'.

  tconfiguration('std.qs std.fn', 'std.cond', function () {this.configure('std.qg').rmacro(qs[_,   when[_]], fn[expression, cond][qs[  qg[l] && qg[r]].replace({l: cond, r: expression})]).
                                                                                    rmacro(qs[_, unless[_]], fn[expression, cond][qs[! qg[l] && qg[r]].replace({l: cond, r: expression})])}).

// Macro authoring tools (the 'defmacro' library).
// Lisp provides some handy macros for macro authors, including things like (with-gensyms (...) ...) and even (defmacro ...). Writing defmacro is simple because 'this' inside a macroexpander
// refers to the caterwaul function that is running. It is trivial to expand into 'null' and side-effectfully define a new macro on that caterwaul object.

// Another handy macro is 'with_gensyms', which lets you write hygienic macros. For example:

// | defmacro[forEach[_][_]][fn[xs, f][with_gensyms[i, l, xs][(function() {for (var i = 0, xs = _xs, l = xs.length, it; it = xs[i], it < l; ++it) {_body}})()].replace({_xs: xs, _body: f})]];

// This will prevent 'xs', 'l', and 'i' from being visible; here is a sample (truncated) macroexpansion:

// | forEach[[1, 2, 3]][console.log(it)]   ->  (function() {for (var _gensym_gesr8o7u_10fo11_ = 0, _gensym_gesr8o7u_10fo12_ = [1, 2, 3],
//                                                                   _gensym_gesr8o7u_10fo13_ = _gensym_gesr8o7u_10fo12_.length, it;
//                                                               it = _gensym_gesr8o7u_10fo12_[_gensym_...], _gensym_... < ...; ...) {console.log(it)}})()

// Since nobody in their right mind would name a variable _gensym_gesr8o7u_10fo11_, it is effectively collision-proof. (Also, even if you load Caterwaul twice you aren't likely to have gensym
// collisions. The probability of it is one-in-several-billion at least.)

// Note that macros defined with 'defmacro' are persistent; they outlast the function they were defined in. Presently there is no way to define scoped macros. Related to 'defmacro' is 'defsubst',
// which lets you express simple syntactic rewrites more conveniently. Here's an example of a defmacro and an equivalent defsubst:

// | defmacro[_ <equals> _][fn[left, right][qs[left === right].replace({left: left, right: right})]];
//   defsubst[_left <equals> _right][_left === _right];

// Syntax variables are prefixed with underscores; other identifiers are literals.

  tconfiguration('std.qs std.fn std.bind std.lvalue', 'std.defmacro', function () {
    l[wildcard(n) = n.data.constructor === String && n.data.charAt(0) === '_' && '_'] in
    this.macro(qs[defmacro[_][_]], fn[pattern, expansion][this.rmacro(pattern, this.compile(this.macroexpand(expansion))), qs[null]]).
         macro(qs[defsubst[_][_]], fn[pattern, expansion][this.rmacro(pattern.rmap(wildcard), l[wildcards = pattern.collect(wildcard)] in fn_[l[hash = {}, as = arguments]
                                                            [this.util.map(fn[v, i][hash[v.data] = as[i]], wildcards), expansion.replace(hash)]]), qs[null]])}).

  tconfiguration('std.qs std.fn std.bind', 'std.with_gensyms', function () {
    this.rmacro(qs[with_gensyms[_][_]], fn[vars, expansion][l[bindings = {}][vars.flatten(',').each(fb[v][bindings[v.data] = this.gensym()]),
                                                                             qs[qs[_]].replace({_: expansion.replace(bindings)})]])}).

// Compile-time eval (the 'compile_eval' library).
// This is one way to get values into your code (though you don't have closure if you do it this way). Compile-time evals will be bound to the current caterwaul function and the resulting
// expression will be inserted into the code as a reference. The evaluation is done at macro-expansion time, and any macros defined when the expression is evaluated are used.

  tconfiguration('std.qs std.fn', 'std.compile_eval', function () {
    this.macro(qs[compile_eval[_]], fn[e][new this.ref(this.compile(this.macroexpand(qs[fn_[_]].replace({_: e}))).call(this))])}).

// Self-reference (the 'ref' library).
// Sometimes you want to get a reference to 'this Caterwaul function' at runtime. If you're using the anonymous invocation syntax (which I imagine is the most common one), this is actually not
// possible without a macro. This macro provides a way to obtain the current Caterwaul function by writing 'caterwaul'. The expression is replaced by a closure variable that will refer to
// whichever Caterwaul function was used to transform the code.

  tconfiguration('std.qs std.fn', 'std.ref', function () {this.macro(qs[caterwaul], fn_[new this.ref(this)])}).

// Local macroexpansion (the 'locally' library).
// Sometimes you want to write a configuration that isn't applied globally, but rather just to a delimited section of code. This macro does just that: You can specify one or more configurations
// and a block of code, and the block of code will be transformed under a Caterwaul clone with those configurations and returned. So, for example:

// | caterwaul.clone('std.locally')(function () {
//     return locally['std'][fn[x][x + 1]];        // General case (especially if you want multiple configurations separated by spaces)
//     return locally[std][fn[x][x + 1]];          // Same thing
//     return locally.std[fn[x][x + 1]];           // Also the same thing
//   });

// Note that the implementation of this isn't terribly efficient. It creates a custom Caterwaul clone for the block in question and then throws that clone away. This probably pales in comparison
// to the macroexpansion process in general, but if your Caterwaul has a ton of configurations applied it could be a performance bottleneck during macroexpansion.

  tconfiguration('std.qs std.bind std.lvalue', 'std.locally', function () {
    l*[t = this, handler(c, e) = t.clone(c.is_string() ? c.as_escaped_string() : c.data).macroexpand(e)] in this.macro(qs[locally[_][_]], handler).macro(qs[locally._[_]], handler)}).

// String interpolation.
// Rebase provides interpolation of #{} groups inside strings. Caterwaul can do the same using a similar rewrite technique that enables macroexpansion inside #{} groups. It generates a syntax
// tree of the form (+ 'string' (expression) 'string' (expression) ... 'string') -- that is, a flattened variadic +. Strings that do not contain #{} groups are returned as-is.

// There is some weird stuff going on with splitting and bounds here. Most of it is IE6-related workarounds; IE6 has a buggy implementation of split() that fails to return elements inside match
// groups. It also fails to return leading and trailing zero-length strings (so, for example, splitting ':foo:bar:bif:' on /:/ would give ['foo', 'bar', 'bif'] in IE, vs. ['', 'foo', 'bar',
// 'bif', ''] in sensible browsers). So there is a certain amount of hackery that happens to make sure that where there are too few strings empty ones get inserted, etc.

// Another thing that has to happen is that we need to take care of any backslash-quote sequences in the expanded source. The reason is that while generally it's safe to assume that the user
// didn't put any in, Firefox rewrites strings to be double-quoted, escaping any double-quotes in the process. So in this case we need to find \" and replace them with ".

// In case the 'result.push' at the end looks weird, it's OK because result is a syntax node and syntax nodes return themselves when you call push(). If 'result' were an array the code would be
// seriously borked.

  tconfiguration('std.qs std.fn std.bind', 'std.string', function () {
    this.rmacro(qs[_], fn[string]
      [string.is_string() && /#\{[^\}]+\}/.test(string.data) &&
       l*[q = string.data.charAt(0), s = string.as_escaped_string(), eq = new RegExp('\\\\' + q, 'g'), strings = s.split(/#\{[^\}]+\}/), xs = [], result = new this.syntax('+')]
         [s.replace(/#\{([^\}]+)\}/g, fn[_, s][xs.push(s), '']),
          this.util.map(fb[x, i][result.push(new this.syntax(q + (i < strings.length ? strings[i] : '') + q)).push(new this.syntax('(', this.parse(xs[i].replace(eq, q))))], xs),
          new this.syntax('(', result.push(new this.syntax(q + (xs.length < strings.length ? strings[strings.length - 1] : '') + q)).unflatten())]])}).

// Standard configuration.
// This loads all of the production-use extensions.

  configuration('std', function () {this.configure('std.qs std.qg std.bind std.lvalue std.cond std.fn std.obj std.defmacro std.with_gensyms std.ref std.locally std.compile_eval std.string')});

// Generated by SDoc 
// Caterwaul optimization library | Spencer Tipping
// Licensed under the terms of the MIT source code license

// Introduction.
// JavaScript JIT technology has come a long way, but there are some optimizations that it still isn't very good at performing. One is loop unrolling, which can have a large impact on execution
// speed. Another is function inlining, which may be coming soon but for now also makes a difference. This library provides macros to transform well-factored code into high-performance code.

// Loop unrolling.
// This is probably the most straightforward family of optimizations in the library. If you're using the 'seq' library for iteration, then you will already benefit from these macros; but you can
// also use them directly.

//   Counting loops.
//   Loop unrolling is designed to optimize the most common use of 'for' loops, a loop from zero to some upper boundary. For example:

//   | for (var i = 0, total = 0; i < xs.length; ++i) {
//       console.log(xs[i]);
//       total += xs[i];
//     }

//   Using opt.unroll.
//   The opt.unroll macro takes two bracketed expressions. The first describes the loop parameters and the second is the body to be executed on each iteration. The loop parameters are the
//   variable representing the index, and its upper bound. (At present there is no way to specify a lower loop bound, nor custom incrementing. This may be added later.)

//   Note that there isn't a good way to break out of a loop that's running. Using 'break' directly is illegal because of JavaScript's syntax rules. In the future there will be some mechanism
//   that supports break and perhaps continue, in some form or another.

//   Here is the unrolled version of the for loop described in 'Counting loops':

//   | var total = 0;
//     var x;
//     opt.unroll[i, xs.length][
//       x = xs[i],
//       console.log(x),
//       total += x
//     ];

//   And here is the generated code, reformatted for readability:

//   | var total = 0;
//     var x;
//     (function (_gensym_iterations) {
//       var _gensym_rounds = _gensym_iterations >>> 3;
//       var _gensym_extra  = _gensym_iterations & 7;
//       for (var i = 0; i < _gensym_extra; ++i)
//         x = xs[i], console.log(x), total += x;
//       for (var _gensym_i = 0; _gensym_i < _gensym_rounds; ++_gensym_i) {
//         x = xs[i], console.log(x), total += x; i++;
//         x = xs[i], console.log(x), total += x; i++;
//         x = xs[i], console.log(x), total += x; i++;
//         x = xs[i], console.log(x), total += x; i++;
//         x = xs[i], console.log(x), total += x; i++;
//         x = xs[i], console.log(x), total += x; i++;
//         x = xs[i], console.log(x), total += x; i++;
//         x = xs[i], console.log(x), total += x; i++;
//       }
//       return _gensym_iterations;
//     }) (xs.length);

//   Caveats.
//   Caterwaul's optimizer is not smart about identifying loop invariants or non-side-effectful things about loops. In other words, it really exists only for the purpose of taking the work out of
//   unrolling things or doing similarly mechanical low-level optimization. It also does not optimize algorithms or any other high-level aspects of your code that generally have a more
//   significant performance impact than low-level stuff like loop unrolling.

  caterwaul.tconfiguration('std', 'opt.unroll', function () {this.rmacro(qs[opt.unroll[_, _][_]], fn[variable, iterations, body][
    with_gensyms[l, rs, es, j][qg[function (l) {for (var rs = l >= 0 && l >> 3, es = l >= 0 && l & 7, _i_ = 0; _i_ < es; ++_i_) _body_;
                                                for (var j = 0; j < rs; ++j) {_body_; _i_++; _body_; _i_++; _body_; _i_++; _body_; _i_++;
                                                                              _body_; _i_++; _body_; _i_++; _body_; _i_++; _body_; _i_++}; return l}].call(this, _iterations_)].
    replace({_i_: variable, _body_: body, _iterations_: iterations})])});

// Opt module collection.
// Loading the 'opt' configuration will enable all of the individual macros in the optimization library.

  caterwaul.configuration('opt', function () {this.configure('opt.unroll')});

// Generated by SDoc 
// Continuation manipulation module | Spencer Tipping
// Licensed under the terms of the MIT source code license

// Introduction.
// This module provides macros to assist with continuations. The most widely-known case of continuation manipulation is probably continuation-passing-style conversion, which you use when you do
// nonblocking things such as AJAX. In this case the callback function is the continuation of the call. (I'm not going to fully explain continuations here, but
// http://en.wikipedia.org/wiki/Continuation is a good if intimidating place to start if you're into functional programming -- which I assume you are if you're using Caterwaul :).)

  caterwaul.configuration('continuation.core', function () {this.shallow('continuation', {})}).

// Unwind protection.
// This is how you can implement error handling. You can intercept both the normal and the escaping cases and specify a return value for each alternative. Unwind-protect ultimately compiles into
// a try/catch. Also provided is the unwind[] macro, which causes an unwind through any call/cc operations until an unwind-protect is hit or the toplevel is reached, in which case it shows up as
// an error. unwind[x] is exactly equivalent to (function () {throw x})().

// Unwind-protect is of this form:

// | unwind_protect[<escape>][<body>]      // === caterwaul.continuation.unwind_protect(fn[e][<escape>], fn_[<body>])

// The escape block will be run if any abnormal escaping is being performed (e.g. escaping via call/cc, unwind[], or an exception). Body is executed regardless, and if it returns normally then
// its return value is the return value of the unwind_protect block. The escape block can refer to 'e', the escaping value. 'this' is preserved in the body and escape blocks.

  tconfiguration('std', 'continuation.unwind', function () {
    this.configure('std.fn continuation.core').continuation /se[_.unwind_protect = function (escape, f) {try {return f()} catch (e) {return escape(e)}},
                                                                _.unwind         = function (e) {throw e}];
    this.rmacro(qs[unwind_protect[_][_]], fn[escape, body][qse[_f(fb[e][_escape], fb_[_body])].replace({_f: new this.ref(this.continuation.unwind_protect), _escape: escape, _body: body})]).
         rmacro(qs[unwind[_]], fn[e][qs[_f(_e)].replace({_f: new this.ref(this.continuation.unwind), _e: e})])}).

// CPS-conversion.
// Converting a whole program to CPS to get re-entrant continuations is a lot of work, so I'm not even trying that. But localized CPS is really useful, especially for nested AJAX calls and such.
// Here's a common example:

// | $.getJSON('some-url', fn[result]
//     [$.getJSON('some-other-url-#{result.property}', fn[other_result][...])]);

// Rather than dealing with this nesting explicitly, it's more convenient to use normal l-notation. That's exactly what l/cps does:

// | l/cps[result       <- $.getJSON('some-url', _),
//         other_result <- $.getJSON('some-other-url-#{result.property}', _)]
//   [console.log(result)];

// There are a couple of things to note about this setup. First, the arrows. This is so that your continuations can be n-ary. (Javascript doesn't let you assign into a paren-list.)

// | l/cps[(x, y) <- binary_ajax_call('some-url', _)][...];

// Second, and this is important: l/cps returns immediately with the result of the first continuation-producing expression (so in the above example, the return value of binary_ajax_call would be
// the value of the l/cps[][] block). This has some important ramifications, perhaps most importantly that the code in the block must be side-effectful to be productive. No magic is happening
// here; l/cps ultimately gets translated into the set of nested functions that you would otherwise write.

// There's also a shorthand form to CPS-convert functions. If you care only about the first parameter (which is true for a lot of functions), you can use the postfix /cps[] form, like this:

// | $.getJSON('foo', _) /cps[alert(_)];
//   $.getJSON('foo', _) /cps.x[alert(x)];         // Also has named form

// Bound variants of both l/cps and /cps[] are also available:

// | $.getJSON('foo', _) /cpb[...];
//   l/cpb[x <- foo(_)][...];

// The legacy let/cps and let/cpb forms are also supported for backwards compatibility.

  tconfiguration('std', 'continuation.cps', function () {
    l*[cps_convert(v, f, b, bound) = f.replace({_: caterwaul.macroexpand(qs[_f[_v][_b]].replace({_f: bound ? qs[fb] : qs[fn]})).replace({_v: v.as('(')[0], _b: b})}),
         l_cps_def(t, form, bound) = l[inductive(cs, v, f, b) = qs[l/cps[cs][_f]].replace({cs: cs, _f: cps_convert(v, f, b, bound)}), base(v, f, b) = cps_convert(v, f, b, bound)] in
                                     t.rmacro(qs[l/_form[_, _ <- _][_]].replace({_form: form}), inductive).rmacro(caterwaul.parse('let/#{form.serialize()}[_, _ <- _][_]'), inductive).
                                       rmacro(qs[l/_form[   _ <- _][_]].replace({_form: form}), base)     .rmacro(caterwaul.parse('let/#{form.serialize()}[   _ <- _][_]'), base),
         cps_def(t, form, bound)   = t.rmacro(qs[_(_) /_form[_]].  replace({_form: form}), fn[f, ps, b][qse[_f(_ps) /_form._[_b]].replace({_form: form, _f: f, _ps: ps, _b: b})]).
                                       rmacro(qs[_(_) /_form._[_]].replace({_form: form}),
                                              fn[f, ps, v, b][qs[_f(_ps)].replace({_f: f, _ps: ps.replace({_: caterwaul.macroexpand(qs[_f[_v][_b]].replace({_f: bound ? qs[fb] : qs[fn]})).
                                                                                                                                                   replace({_v: v, _b: b})})})])] in
    this.configure('std.fn continuation.core') /se[cps_def(_, qs[cps], false), cps_def(_, qs[cpb], true), l_cps_def(_, qs[cps], false), l_cps_def(_, qs[cpb], true)]}).

// Escaping continuations and tail call optimization.
// The most common use for continuations besides AJAX is escaping. This library gives you a way to escape from a loop or other function by implementing a non-reentrant call/cc. You can also use
// tail-call-optimized recursion if your functions are written as such.

// | call/cc[fn[cc][cc(5)]]        // returns 5
//   call/cc[fn[cc][cc(5), 6]]     // still returns 5
//   call/cc[fn[cc][19]]           // returns 19

// Tail calls must be indicated explicitly with call/tail. (Otherwise they'll be regular calls.) For example:

// | var factorial_cps = fn[n, acc, cc][n > 0 ? call/tail[factorial_cps(n - 1, acc * n, cc)] : call/tail[cc(acc)]];
//   call/cc[fn[cc][factorial_cps(5, 1, cc)]];   // -> 120

// In this example it's also legal to call the final continuation 'cc' normally: cc(acc). It's faster to use call/tail[cc(acc)] though. Importantly, continuations lose their bindings! This means
// that tail-calling a method won't do what you want:

// | call/tail[object.method(5)]   // calls object.method with wrong 'this'

// What you can do instead is eta-expand or use Caterwaul's /mb notation (note the extra parens; they're necessary, just as they would be if you were invoking an /mb'd method directly):

// | call/tail[fn[x][object.method(x)](5)];
//   call/tail[(object/mb/method)(5)];             // At this rate you're probably better off using the call_tail function directly.

// Either of these will invoke object.method in the right context.

// Delimited continuations work because call/cc uses an internal while loop to forward parameters outside of the tail call. This keeps the stack bounded by a constant. Note that tail calls work
// only inside a call/cc context. You can use them elsewhere, but they will not do what you want. Also, tail calls really do have to be tail calls. You need to return the call/tail[...]
// expression in order for it to work, just like you'd have to do in Scheme or ML (except that in JS, return is explicit rather than implicit).

// Note that call/cc and call/tail are macros, not functions. The functions are available in normal Javascript form, however (no deep macro-magic is ultimately required to support delimited
// continuations). call/cc is stored as caterwaul.continuation.call_cc, and call/tail is caterwaul.continuation.call_tail. The invocation of call_tail is different from call/tail:

// | caterwaul.continuation.call_tail.call(f, arg1, arg2, ...);

  tconfiguration('std', 'continuation.delimited', function () {
    l[magic = this.configure('continuation.core').continuation.magic = this.magic('continuation.delimited')] in
    this.continuation /se[_.call_cc     = function (f) {var escaped = false, cc = function (x) {escaped = true; throw x}, frame = {magic: magic, continuation: f, parameters: [cc]};
                                                        try       {while ((frame = frame.continuation.apply(this, frame.parameters)) && frame && frame.magic === magic); return frame}
                                                        catch (e) {if (escaped) return e; else throw e}},
                          _.call_tail() = {magic: magic, continuation: this, parameters: arguments}];

    this.rmacro(qs[call/cc[_]],      fn[f]      [qs[qg[_call_cc.call(this, _f)]].   replace({_call_cc:   new this.ref(this.continuation.call_cc),   _f: f})]).
         rmacro(qs[call/tail[_(_)]], fn[f, args][qs[qg[_call_tail.call(_f, _args)]].replace({_call_tail: new this.ref(this.continuation.call_tail), _f: f, _args: args})])}).

// End-user library.

  configuration('continuation', function () {this.configure('continuation.core continuation.unwind continuation.cps continuation.delimited')});

// Generated by SDoc 
// Caterwaul JS sequence library | Spencer Tipping
// Licensed under the terms of the MIT source code license

// Introduction.
// Javascript's looping facilities are side-effectful and more importantly operate in statement-mode rather than expression-mode. This sequence library moves finite and anamorphic looping into
// expression-mode using both methods and macros. Macros are used sparingly here; they provide comprehensions, but are ultimately just shorthands for sequence methods. All sequences ultimately
// inherit from Array, which may or may not work as desired.

  caterwaul.tconfiguration('std', 'seq.core', function () {this.shallow('seq', {core: fn_[null] /se[_.prototype = [] /se.p[p.constructor = _]]})}).

// There are two kinds of sequences represented here. One is a finite sequence, which is eager and acts like a Javascript array (though it has a different prototype). The other is an infinite
// stream; this is an anamorphism that generates new elements from previous ones. Because Javascript isn't required to optimize tail calls, any recursion done by the sequence library is coded in
// CPS using the continuation library.

// Finite sequence API.
// Finite sequences are assumed to have numbered elements and a 'length' field, just like a Javascript array or jQuery object. Any mapping, filtering, or folding on these sequences is done
// eagerly (put differently, most sequence/stream operations are closed under eagerness). There's a core prototype for finite sequences that contains eager implementations of each(), map(),
// filter(), foldl(), foldr(), zip(), etc.

  tconfiguration('std', 'seq.finite.core', function () {
    l[push = Array.prototype.push, slice = Array.prototype.slice]
    [this.configure('seq.core').seq.finite = fc[xs][this.length = 0, push.apply(this, slice.call(xs || []))] /se.c[c.prototype = new this.seq.core() /se[
      _.size() = this.length, _.constructor = c]]]}).

  tconfiguration('std', 'seq.finite.serialization', function () {
    this.configure('seq.finite.core').seq.finite.prototype.toString() = 'seq[#{Array.prototype.slice.call(this).join(", ")}]'}).

//   Mutability.
//   Sequences can be modified in-place. Depending on how Javascript optimizes this case it may be much faster than reallocating. Note that the methods here are not quite the same as the regular
//   Javascript array methods. In particular, push() returns the sequence rather than its new length. Also, there is no shift()/unshift() API. These would each be linear-time given that we're
//   using hard indexes. concat() behaves as it does for arrays; it allocates a new sequence rather than modifying either of its arguments.

    tconfiguration('std', 'seq.finite.mutability', function () {
      l[push = Array.prototype.push, slice = Array.prototype.slice] in
      this.configure('seq.finite.core').seq.finite.prototype /se[_.push()     = (push.apply(this, arguments), this),            // Can't /se this one; it references 'arguments'
                                                                 _.pop()      = this[--this.length] /se[delete this[this.length]],
                                                                 _.concat(xs) = new this.constructor(this) /se[_.push.apply(_, slice.call(xs))]]}).

//   Object interfacing.
//   Sequences can be built from object keys, values, or key-value pairs. This keeps you from having to write for (var k in o) ever again. Also, you can specify whether you want all properties or
//   just those which belong to the object directly (by default the latter is assumed). For example:

//   | var keys     = caterwaul.seq.finite.keys({foo: 'bar'});             // hasOwnProperty is used
//     var all_keys = caterwaul.seq.finite.keys({foo: 'bar'}, true);       // hasOwnProperty isn't used; you get every enumerable property

//   Javascript, unlike Perl, fails to make the very useful parallel between objects and arrays. Because references are cheap in Javascript (both notationally and computationally), the
//   representation of an object is slightly different from the one in Perl. You use an array of pairs, like this: [[k1, v1], [k2, v2], ..., [kn, vn]].

//   | object([o = {}]): Zips a sequence of pairs into an object containing those mappings. Later pairs take precedence over earlier ones if there is a collision. You can specify an optional
//                       object o to zip into; if you do this, then the pairs are added to o and o is returned instead of creating a new object and adding pairs to that.

    tconfiguration('std', 'seq.finite.object', function () {
      l[own = Object.prototype.hasOwnProperty] in
      this.configure('seq.finite.core').seq.finite /se[_.keys  (o, all) = new _() /se[(function () {for (var k in o) if (all || own.call(o, k)) _.push(k)})()],
                                                       _.values(o, all) = new _() /se[(function () {for (var k in o) if (all || own.call(o, k)) _.push(o[k])})()],
                                                       _.pairs (o, all) = new _() /se[(function () {for (var k in o) if (all || own.call(o, k)) _.push([k, o[k]])})()],
                                                       _.prototype.object(o) = (o || {}) /se[this.each(fn[p][_[p[0]] = p[1]])]]}).

//   Mapping and traversal.
//   Sequences support the usual set of map/filter/fold operations. Unlike most sequence libraries, though, all of these functions used unrolled loops. This means that if your JS runtime has good
//   hot-inlining support they should be really fast. (The same does not hold for the infinite stream library, which uses simulated continuations for lots of things and is probably quite slow.)

//   If you fold on a sequence with too few elements (and you don't supply extras by giving it more arguments), it will return something falsy.

    tconfiguration('std opt', 'seq.finite.traversal', function () {
      this.configure('seq.finite.core seq.finite.mutability').seq.finite.prototype
        /se[_.map(f)      = new this.constructor() /se[opt.unroll[i, this.length][_.push(f.call(this, this[i], i))]],
            _.filter(f)   = new this.constructor() /se[opt.unroll[i, this.length][_.push(this[i]), when[f.call(this, this[i], i)]]],
            _.each(f)     = this                   /se[opt.unroll[i,    _.length][f.call(_, _[i], i)]],
            _.reversed()  = new this.constructor() /se[l[l = this.length] in opt.unroll[i, l][_.push(this[l - i - 1])]],
            _.flat_map(f) = new this.constructor() /se[this.each(fn[x, xi][(f.call(this, x, xi) /re.xs[xs.each ? xs : new this.constructor(xs)]).each(fn[x][_.push(x)])])],

            _.foldl(f, x) = l[x = arguments.length > 1 ? x : this[0], xi = 2 - arguments.length]
                             [opt.unroll[i, this.length - xi][x = f.call(this, x, this[i + xi], i + xi)], x, when[this.length >= xi]],
            _.foldr(f, x) = l[x = arguments.length > 1 ? x : this[this.length - 1], xi = 3 - arguments.length, l = this.length]
                             [opt.unroll[i, l - (xi - 1)][x = f.call(this, this[l - (i + xi)], x, l - (i + xi))], x, when[l >= xi - 1]]]}).

//   Zipping.
//   Zipping as a generalized construct has a few variants. One is the function used to zip (by default, [x, y]), another is the number of sequences to zip together, and the last one is whether
//   you want an inner or outer product. Here's the full argument syntax for zip() with defaults:

//   | xs.zip(xs1, xs2, ..., xsn, {f: fn_[new seq(arguments)], outer: false})

//   Each of xsi should be an array-ish object (i.e. should support the .length and [i] attributes). If you specify the optional hash at the end, its 'f' attribute, if specified, will be invoked
//   on every n-tuple of items, and if 'outer' is truthy then you will have the outer-product of all of your sequences (i.e. the longest sequence length is used, and undefined is specified when
//   you run past the end of any other one).

    tconfiguration('std opt', 'seq.finite.zip', function () {
      this.configure('seq.finite.traversal').seq.finite
        /se[l[seq = _, slice = Array.prototype.slice][_.prototype.zip() =
          l[as = new seq([this].concat(slice.call(arguments))), options = {f: fn_[new seq(arguments)], outer: false}]
           [caterwaul.util.merge(options, as.pop()), when[as[as.length - 1].constructor === Object],
            l[l = as.map(fn[x][x.length]).foldl(options.outer ? fn[x, y][Math.max(x, y)] : fn[x, y][Math.min(x, y)]), f = options.f] in
            new this.constructor() /se[opt.unroll[i, l][_.push(f.apply({i: i}, as.map(fn[x][x[i]]).slice()))]]]]]}).

//   Quantification.
//   Functions to determine whether all sequence elements have some property. exists() returns the element that satisfies the predicate if it's truthy; otherwise it just returns true.

    tconfiguration('std opt continuation', 'seq.finite.quantification', function () {
      this.configure('seq.finite.core').seq.finite.prototype /se[_.exists(f) = call/cc[fb[cc][opt.unroll[i, this.length][f.call(this, this[i], i) && cc(this[i] || true)], false]],
                                                                 _.forall(f) = ! this.exists(fn_[! f.apply(this, arguments)])]}).

// Stream API.
// All streams are assumed to be infinite in length; that is, given some element there is always another one. Streams provide this interface with h() and t() methods; the former returns the first
// element of the stream, and the latter returns a stream containing the rest of the elements.

  tconfiguration('std', 'seq.infinite.core', function () {
    this.configure('seq.core').seq.infinite = fn_[null] /se[_.prototype = new this.seq.core() /se[_.constructor = ctor], where[ctor = _]]
      /se[_.def(name, ctor, h, t) = i[name] = ctor /se[_.prototype = new i() /se[_.h = h, _.t = t, _.constructor = ctor]], where[i = _],

          _.def('cons', fn[h, t][this._h = h, this._t = t], fn_[this._h], fn_[this._t]),
          _.def('k',    fn   [x][this._x = x],              fn_[this._x], fn_[this])]}).

//   Anamorphisms via fixed-point.
//   Anamorphic streams are basically unwrapped version of the Y combinator. An anamorphic stream takes a function f and an initial element x, and returns f(x), f(f(x)), f(f(f(x))), ....

    tconfiguration('std', 'seq.infinite.y', function () {
      this.configure('seq.infinite.core').seq.infinite.def('y', fc[f, x][this._f = f, this._x = x], fn_[this._x], fn_[new this.constructor(this._f, this._f(this._x))])}).

//   Lazy map and filter.
//   These are implemented as separate classes that wrap instances of infinite streams. They implement the next() method to provide the desired functionality. map() and filter() are simple
//   because they provide streams as output. filter() is eager on its first element; that is, it remains one element ahead of what is requested.

    tconfiguration('std continuation', 'seq.infinite.transform', function () {
      this.configure('seq.infinite.core').seq.infinite
        /se[_.prototype.map(f) = new _.map(f, this),
            _.def('map', fc[f, xs][this._f = f, this._xs = xs], fn_[this._f(this._xs.h())], fn_[new this.constructor(this._f, this._xs.t())]),

            _.prototype.filter(f) = new _.filter(f, this),
            _.def('filter', fc[f, xs][this._f = f, this._xs = l*[next(s)(cc) = f(s.h()) ? cc(s) : call/tail[next(s.t())(cc)]] in call/cc[next(xs)]],
                            fn_[this._xs.h()], fn_[new this.constructor(this._f, this._xs.t())])]}).

//   Traversal and forcing.
//   This is where we convert from infinite streams to finite sequences. You can take or drop elements while a condition is true. take() always assumes it will return a finite sequence, whereas
//   drop() assumes it will return an infinite stream. (In other words, the number of taken or dropped elements is assumed to be finite.) Both take() and drop() are eager. drop() returns a
//   sequence starting with the element that fails the predicate, whereas take() returns a sequence for which no element fails the predicate.

    tconfiguration('std continuation', 'seq.infinite.traversal', function () {
      l[finite = this.configure('seq.finite.core seq.finite.mutability').seq.finite] in
      this.configure('seq.infinite.core').seq.infinite.prototype
        /se[_.drop(f) = l*[next(s)(cc) = f(s.h()) ? call/tail[next(s.t())(cc)] : cc(s)] in call/cc[next(this)],
            _.take(f) = l*[xs = new finite(), next(s)(cc) = l[h = s.h()][f(h) ? (xs.push(h), call/tail[next(s.t())(cc)]) : cc(xs)]] in call/cc[next(this)]]}).

// Sequence manipulation language.
// Using methods to manipulate sequences can be clunky, so the sequence library provides a macro to enable sequence-specific manipulation. You enter this mode by using seq[], and expressions
// inside the brackets are interpreted as sequence transformations. For example, here is some code translated into the seq[] macro:

// | var primes1 = l[two = naturals.drop(fn[x][x < 2])] in two.filter(fn[n][two.take(fn[x][x <= Math.sqrt(n)]).forall(fn[k][n % k])]);
//   var primes2 = l[two = seq[naturals >>[_ < 2]] in seq[two %n[two[_ <= Math.sqrt(n)] &[n % _]]];

// These operators are supported and take their normal Javascript precedence and associativity:

// | x *[_ + 2]            // x.map(fn[_, _i][_ + 2])
//   x *~[_ + xs]          // x.map(fn[_, _i][_.concat(xs)])
//   x *+(console/mb/log)  // x.map(console/mb/log)
//   x *!+f                // x.each(f)
//   x *![console.log(_)]  // x.each(fn[_, _i][console.log(_)])
//   x /[_ + _0]           // x.foldl(fn[_, _0, _i][_ + _0])
//   x /![_ + _0]          // x.foldr(fn[_, _0, _i][_ + _0])
//   x %[_ >= 100]         // x.filter(fn[_, _i][_ >= 100])
//   x %![_ >= 100]        // x.filter(fn[_, _i][!(x >= 100)])
//   x *n[n + 2]           // x.map(fn[n, ni][n + 2])
//   x *!n[console.log(n)] // x.each(fn[n, ni][console.log(n)])
//   x /n[n + n0]          // x.foldl(fn[n, n0, ni][n + n0])
//   x /!n[n + n0]         // x.foldr(fn[n, n0, ni][n + n0])
//   x %n[n % 100 === 0]   // x.filter(fn[n, ni][n % 100 === 0])
//   x %!n[n % 100]        // x.filter(fn[n, ni][!(n % 100 === 0)])
//   x <<[_ >= 10]         // x.take(fn[_][_ >= 10])
//   x <<n[n >= 10]        // x.take(fn[n][n >= 10])
//   x >>[_ >= 10]         // x.drop(fn[_][_ >= 10])
//   x >>n[n >= 10]        // x.drop(fn[n][n >= 10])
//   x |[_ === 5]          // x.exists(fn[_, _i][_ === 5])
//   x &[_ === 5]          // x.forall(fn[_, _i][_ === 5])
//   x |n[n === 5]         // x.exists(fn[n, ni][n === 5])
//   x &n[n === 5]         // x.forall(fn[n, ni][n === 5])
//   x -~[~[_, _ + 1]]     // x.flat_map(fn[_, _i][seq[~[_, _ + 1]]])
//   x -~i[~[i, i + 1]]    // x.flat_map(fn[i, ii][seq[~[i, i + 1]]])
//   x >>>[_ + 1]          // new caterwaul.seq.infinite.y(fn[_][_ + 1], x)
//   x >>>n[n + 1]         // new caterwaul.seq.infinite.y(fn[n][n + 1], x)
//   x || y                // x && x.length ? x : y
//   x && y                // x && x.length ? y : x
//   x > y                 // x.length > y.length
//   x >= y                // x.length >= y.length
//   x < y                 // x.length < y.length
//   x <= y                // x.length <= y.length
//   x == y                // x.length === y.length
//   x != y                // x.length !== y.length
//   x === y               // x.length === y.length && x.zip(y).forall(fn[p][p[0] === p[1]])
//   x !== y               // !(x === y)
//   sk[x]                 // caterwaul.seq.finite.keys(x)
//   sv[x]                 // caterwaul.seq.finite.values(x)
//   sp[x]                 // caterwaul.seq.finite.pairs(x)
//   x ^ y                 // x.zip(y)
//   x + y                 // x.concat(y)
//   !x                    // x.object()
//   ~x                    // new caterwaul.seq.finite(x)
//   +(x)                  // x    (this means 'literal')

// Method calls are treated normally and arguments are untransformed; so you can call methods normally.

//   Modifiers.
//   There are patterns in the above examples. For instance, x %[_ + 1] is the root form of the filter operator, but you can also write x %n[n + 1] to use a different variable name. The ~
//   modifier is available as well; this evaluates the expression inside brackets in sequence context rather than normal Javascript. (e.g. xs %~[_ |[_ === 1]] finds all subsequences that contain
//   1.) Finally, some operators have a ! variant (fully listed in the table above). In this case, the ! always precedes the ~.

//   Another modifier is +; this lets you use point-free form rather than creating a callback function. For example, xs %+divisible_by(3) expands into xs.filter(divisible_by(3)). This modifier
//   goes where ~ would have gone.

//   Inside the DSL code.
//   This code probably looks really intimidating, but it isn't actually that complicated. The first thing I'm doing is setting up a few methods to help with tree manipulation. The
//   prefix_substitute() method takes a prefix and a tree and looks for data items in the tree that start with underscores. It then changes their names to reflect the variable prefixes. For
//   example, prefix_substitute(qs[fn[_, _x, _i][...]], 'foo') would return fn[foo, foox, fooi].

//   The next interesting thing is define_functional. This goes beyond macro() by assuming that you want to define an operator with a function body to its right; e.g. x >>[body]. It defines two
//   forms each time you call it; the first form is the no-variable case (e.g. x *[_ + 1]), and the second is the with-variable case (e.g. x *n[n + 1]). The trees_for function takes care of the
//   bang-variant of each operator. This gets triggered if you call define_functional on an operator that ends in '!'.

//   After this is the expansion logic (which is just the regular Caterwaul macro logic). Any patterns that match are descended into; otherwise expansion returns its tree verbatim. Also, the
//   expander-generator function rxy() causes expansion to happen on each side. This is what keeps expansion going. When I specify a custom function it's because either (1) rxy doesn't take
//   enough parameters, or (2) I want to specify that only some subtrees should be expanded. (That's what happens when there's a dot or invocation, for instance.)

//   Pattern matching always starts at the end of the arrays as of Caterwaul 0.5. This way any new patterns that you define will bind with higher precedence than the standard ones.

    tconfiguration('std opt continuation', 'seq.dsl', function () {
      this.configure('seq.core seq.infinite.y seq.finite.core seq.finite.zip seq.finite.traversal seq.finite.mutability').seq.dsl = caterwaul.global().clone()

      /se[_.prefix_substitute(tree, prefix)      = tree.rmap(fn[n][new n.constructor('#{prefix}#{n.data.substring(1)}'), when[n.data.charAt(0) === '_']]),
          _.define_functional(op, expansion, xs) = trees_for(op).map(fn[t, i][_.macro(t,
            fn[l, v, r][expansion.replace({x: _.macroexpand(l), y: i < 4 ? qs[fn[xs][y]].replace({xs: _.prefix_substitute(xs, i & 1 ? v.data : '_'), 
                                                                                                   y: (i & 2 ? _.macroexpand : fn[x][x])(r || v)}) : v})])]),

          _.define_functional /se[_('%',  qs[x.filter(y)],                      qs[_, _i]), _('*',  qs[x.map(y)],    qs[_, _i]), _('/',  qs[x.foldl(y)],    qs[_, _0, _i]),
                                  _('%!', qs[x.filter(c(y))].replace({c: not}), qs[_, _i]), _('*!', qs[x.each(y)],   qs[_, _i]), _('/!', qs[x.foldr(y)],    qs[_, _0, _i]),
                                  _('&',  qs[x.forall(y)],                      qs[_, _i]), _('|',  qs[x.exists(y)], qs[_, _i]), _('-',  qs[x.flat_map(y)], qs[_, _i]),
                                  _('>>', qs[x.drop(y)],  qs[_]), _('<<', qs[x.take(y)], qs[_]), _('>>>', qs[new r(y, x)].replace({r: new this.ref(this.seq.infinite.y)}), qs[_])],

          seq(qw('> < >= <= == !=')).each(fn[op][_.macro(qs[_ + _].clone() /se[_.data = op], rxy(qs[x.length + y.length].clone() /se[_.data = op]))]),

          l[e(x) = _.macroexpand(x)] in
          _.macro /se[_(qs[_ && _], rxy(qs[qg[x && x.length ? y : x]])), _(qs[_ === _], rxy(qs[qg[x === y ||  x.length === y.length && x.zip(y).forall(fn[p][p[0] === p[1]])]])),
                      _(qs[_ || _], rxy(qs[qg[x && x.length ? x : y]])), _(qs[_ !== _], rxy(qs[qg[x !== y && (x.length !== y.length || x.zip(y).exists(fn[p][p[0] !== p[1]]))]])),

                      _(qs[_ ^ _], rxy(qs[x.zip(y)])), _(qs[_ + _], rxy(qs[x.concat(y)])), _(qs[!_], rxy(qs[x.object()])), _(qs[_, _], rxy(qs[x, y])),
                      _(qs[~_], rxy(qs[new r(x)].as('(').replace({r: new this.ref(this.seq.finite)}))), _(qs[_?_:_], fn[x, y, z][qs[x ? y : z].replace({x: e(x), y: e(y), z: e(z)})]),

                      l[rx(t)(x, y) = t.replace({x: e(x), y: y})][_(qs[_(_)], rx(qs[x(y)])), _(qs[_[_]], rx(qs[x[y]])), _(qs[_._], rx(qs[x.y])), _(qs[_].as('('), rx(qs[qg[x]]))],
                      _(qs[+_], fn[x][x]),

                      seq(qw('sk sv sp')).zip(qw('keys values pairs')).each(fb[p][_(qs[p[_]].replace({p: p[0]}), rxy(qs[r(x)].replace({r: new this.ref(this.seq.finite[p[1]])})))])],

          this.rmacro(qs[seq[_]], _.macroexpand),

          where*[template(op)(t) = qs[_ + x].replace({x: t}) /se[_.data = op], qw = caterwaul.util.qw, not = new this.ref(fn[f][fn_[!f.apply(this, arguments)]]),
                 trees_for(op) = op.charAt(op.length - 1) === '!' ? seq([qs[![_]], qs[!_[_]], qs[!~[_]], qs[!~_[_]], qs[!+_]]).map(template(op.substring(0, op.length - 1))) :
                                                                    seq([qs[[_]],  qs[_[_]],  qs[~[_]],  qs[~_[_]],  qs[+_]]). map(template(op)),
                 rxy(tree)(x, y) = tree.replace({x: _.macroexpand(x), y: y && _.macroexpand(y)}), seq = fb[xs][new this.seq.finite(xs)]]]}).

// Final configuration.
// Rather than including individual configurations above, you'll probably just want to include this one.

  configuration('seq', function () {this.configure('seq.core seq.finite.core seq.finite.object seq.finite.mutability seq.finite.traversal seq.finite.zip seq.finite.quantification ' +
                                                            'seq.finite.serialization seq.infinite.core seq.infinite.y seq.infinite.transform seq.infinite.traversal seq.dsl')});

// Generated by SDoc 
