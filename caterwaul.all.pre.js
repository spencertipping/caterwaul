// Caterwaul with all modules (precompiled) | Spencer Tipping
// Licensed under the terms of the MIT source code license





// Caterwaul JS | Spencer Tipping
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

  var configurable = (function () {

//   Core interface.
//   The core API for replicable functions is exposed as 'caterwaul.replica'. This is primarily of use to API developers and not to end users. Also of use is the configuration
//   'caterwaul.configurable', which when applied to a replicable function will install Caterwaul's configurability onto it. For example:

//   | var my_compiler = caterwaul.configurable(caterwaul.replica());
//     my_compiler.method('init', function () {/* custom compiler behavior */});
//     my_compiler.clone();        // A new instance

//   You can then customize this function, which will have the same replication interface that Caterwaul has but won't have Caterwaul's default behavior. (A less elegant way to achieve the same
//   thing is to clone caterwaul and give it a new 'init' method.)

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

  var associator_for = function (f) {return function (name, behavior, value) {return f[name] = (f.behaviors[f.attributes[name] = behavior] || id).call(f, value), f}},
        shallow_copy = function (x) {return x && (x.constructor === Array ? x.slice() : x.clone ? x.clone() : merge({}, x))},
             copy_of = function (f) {var g = merge(function () {return g.init.apply(g, arguments)}, {behaviors: shallow_copy(f.behaviors), attributes: {}});
                                     return se(g, function (g) {(g.associate = associator_for(g))('behavior', 'method', function (name, definition) {this.behaviors[name] = definition;
                                                                  return this.associate(name, 'method', function (attribute, value) {return this.associate(attribute, name, value)})}).
                                                                behavior('method', g.behaviors.method);

                                                                for (var k in f.attributes) has(f.attributes, k) && g.associate(k, f.attributes[k], f[k])})},

//   Bootstrapping method behavior.
//   Setting up the behavior(), method(), field(), and shallow() methods. The behavior() and method() methods are codependent and are initialized in the copy_of function above, whereas the
//   field() and shallow() methods are not core and are defined here. I'm also defining a 'configuration' function to allow quick definition of new configurations. (These are loadable by their
//   names when calling clone() or configure() -- see 'Configuration and cloning' below.) A complement method, 'tconfiguration', is also available. This transforms the configuration function
//   before storing it in the table, enabling you to use things like 'qs[]' without manually transforming stuff. The downside is that you lose closure state and can't bind variables.

//   There's a convenience method called 'namespace', which is used when you have a shallow hash shared among different modules. It goes only one level deep.

         replica = se(function () {return copy_of({behaviors: {method: function (v) {return bind(v, this)}}}).behavior('field').behavior('shallow', shallow_copy)}, function (f) {f.init = f});

//   Configuration and cloning.
//   Caterwaul ships with a standard library of useful macros, though they aren't activated by default. To activate them, you say something like this:

//   | caterwaul.configure('std.fn');
//     // Longhand access to the function:
//     caterwaul.configurations['std.fn']

//   You can also pass these libraries into a clone() call:

//   | var copy = caterwaul.clone('std.fn', 'some_other_library', function () {
//       ...
//     });

//   Generally you will just configure with 'std', which includes all of the standard configurations (see caterwaul.std.js.sdoc in the modules/ directory).

//   Note that functions passed to clone() and configure() are transformed using the existing caterwaul instance. This means that closure state is lost, so configuration at the toplevel is a good
//   idea. Named configurations, on the other hand, are not explicitly transformed; so when you define a custom configuration in a named way, you will want to manually transform it. (The reason
//   for this is that we don't want to force the configuration author to lose closure state, since it's arguably more important in a library setting than an end-user setting.) Alternatively you
//   can use tconfigure(), which takes a series of configurations to use to transform your configuration function. (This makes more sense in code than in English; see how the configurations below
//   are written...)

//   Named configurations are made idempotent; that is, they cannot be applied twice. This is done through the 'has' hash, which can be manually reset if you actually do need to apply a
//   configuration multiple times (though you're probably doing something wrong if you do need to do that).

    return function () {return replica().
      shallow('configurations', {}).shallow('has', {}).method('configuration', function (name, f) {this.configurations[name] = f; return this}).
       method('tconfiguration', function (configs, name, f, bindings) {this.configurations[name] = this.clone(configs)(f, bindings); return this}).

       method('namespace', function (s) {return this[s] || this.shallow(s, {})[s]}).
       method('alias',     function (from, to) {return this.method(to, function () {return this[from].apply(this, arguments)})}).

       method('clone',     function () {return arguments.length ? this.clone().configure.apply(null, arguments) : copy_of(this)}).
       method('configure', function () {for (var i = 0, l = arguments.length, _; _ = arguments[i], i < l; ++i)
                                          if (_.constructor === String) for (var cs = qw(arguments[i]), j = 0, lj = cs.length; _ = cs[j], j < lj; ++j)
                                                                          if (this.configurations[_]) this.has[_] || (this.has[_] = this.configurations[_].call(this, this) || this);
                                                                          else                        throw new Error('error: configuration "' + _ + '" does not exist');
                                          else _ instanceof Array ? this.configure.apply(this, _.slice()) : _.call(this, this); return this})}})();
// Generated by SDoc 





// Global management.
// Caterwaul creates a global symbol, caterwaul. Like jQuery, there's a mechanism to get the original one back if you don't want to replace it. You can call caterwaul.deglobalize() to return
// caterwaul and restore the global that was there when Caterwaul was loaded (might be useful in the unlikely event that someone else named their library Caterwaul). Note that deglobalize() is
// available only on the global caterwaul() function. It wouldn't make much sense for clones to inherit it.

  var caterwaul_global = caterwaul = (function () {var _caterwaul = typeof caterwaul === 'undefined' ? undefined : caterwaul;
                                                   return se(configurable(), function () {this.deglobalize = function () {caterwaul = _caterwaul; return this}})})();

// Uniqueness and identification.
// Caterwaul has a number of features that require it to be able to identify caterwaul functions and easily distinguish between them. These methods provide a way to do that.

  caterwaul_global.method('global', function () {return caterwaul_global}).method('id', function () {return this._id || (this._id = genint())}).
                    field('is_caterwaul', is_caterwaul).field('initializer', initializer).field('unique', unique).field('gensym', gensym).field('genint', genint).

                   method('reinitialize', function (transform, erase_configurations) {var c = transform(this.initializer), result = c(c, this.unique).deglobalize();
                                                                                      erase_configurations || (result.configurations = this.configurations); return result}).

// Magic.
// Sometimes you need to grab a unique value that is unlikely to exist elsewhere. Caterwaul gives you such a value given a string. These values are shared across all Caterwaul instances and are
// considered to be opaque. Because of the possibility of namespace collisions, you should name your magic after a configuration or otherwise prefix it somehow.

                   method('magic', (function (table) {return function (name) {return table[name] || (table[name] = {})}}));
// Generated by SDoc 






// Shared parser data.
// This data is used both for parsing and for serialization, so it's made available to all pieces of caterwaul.

//   Precomputed table values.
//   The lexer uses several character lookups, which I've optimized by using integer->boolean arrays. The idea is that instead of using string membership checking or a hash lookup, we use the
//   character codes and index into a numerical array. This is guaranteed to be O(1) for any sensible implementation, and is probably the fastest JS way we can do this. For space efficiency,
//   only the low 256 characters are indexed. High characters will trigger sparse arrays, which may degrade performance. (I'm aware that the arrays are power-of-two-sized and that there are
//   enough of them, plus the right usage patterns, to cause cache line contention on most Pentium-class processors. If we are so lucky to have a Javascript JIT capable enough to have this
//   problem, I think we'll be OK.)

//   The lex_op table indicates which elements trigger regular expression mode. Elements that trigger this mode cause a following / to delimit a regular expression, whereas other elements would
//   cause a following / to indicate division. By the way, the operator ! must be in the table even though it is never used. The reason is that it is a substring of !==; without it, !== would
//   fail to parse. (See test/lex-neq-failure for examples.)

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
   parse_inverse_order = (function (xs) {for (var  o = {}, i = 0, l = xs.length; i < l; ++i) for (var k in xs[i]) has(xs[i], k) && (o[k] = i); return annotate_keys(o)}) (parse_reduce_order),
   parse_index_forward = (function (rs) {for (var xs = [], i = 0, l = rs.length, _ = null; _ = rs[i], xs[i] = true, i < l; ++i)
                                           for (var k in _) if (has(_, k) && (xs[i] = xs[i] && ! has(parse_associates_right, k))) break; return xs}) (parse_reduce_order),

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

  (function () {

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

    var syntax_node_inspect = function (x) {return x ? x.inspect() : '(<>)'},  syntax_node_tostring = function (x) {return x ? x.serialize ? x.serialize() : x.toString() : ''},

//   Syntax node functions.
//   These functions are common to various pieces of syntax nodes. Not all of them will always make sense, but the prototypes of the constructors can be modified independently later on if it
//   turns out to be an issue.

    syntax_structure_common = {

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
//     You can request that a syntax node identify itself, in which case it will give you an identifier if it hasn't already. The identity is not determined until the first time it is requested,
//     and after that it is stable. As of Caterwaul 0.7.0 the mechanism works differently (i.e. isn't borked) in that it replaces the prototype definition with an instance-specific closure the
//     first time it gets called. This may reduce the number of decisions in the case that the node's ID has already been computed.

      id: function () {var id = genint(); return (this.id = function () {return id})()},

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

               is_string: function () {return /['"]/.test(this.data.charAt(0))},           as_escaped_string: function () {return this.data.substr(1, this.data.length - 2)}, 
               is_number: function () {return /^-?(0x|\d|\.\d+)/.test(this.data)},                 as_number: function () {return Number(this.data)},
              is_boolean: function () {return this.data === 'true' || this.data === 'false'},     as_boolean: function () {return this.data === 'true'},
               is_regexp: function () {return /^\/./.test(this.data)},                     as_escaped_regexp: function () {return this.data.substring(1, this.data.lastIndexOf('/'))},

       has_grouped_block: function () {return has(parse_r_until_block, this.data)},                 is_block: function () {return has(parse_block, this.data)},
    is_blockless_keyword: function () {return has(parse_r_optional, this.data)},        is_null_or_undefined: function () {return this.data === 'null' || this.data === 'undefined'},

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

//     A bug in Caterwaul 0.5 and earlier failed to bind falsy values. This is no longer the case; nodes which bind values should indicate that they do so by setting a binds_a_value attribute
//     (ref nodes do this on the prototype), indicating that their value should be read from the 'value' property. (This allows other uses of a 'value' property while making it unambiguous
//     whether a particular node intends to bind something.)

      bindings: function (hash) {var result = hash || {}; this.reach(function (n) {if (n.binds_a_value) result[n.data] = n.value}); return result},

//     Matching.
//     Syntax trees can use the Caterwaul match function to return a list of wildcards.

         match: function (pattern) {return macro_try_match(pattern, this)},

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

//     Update for Caterawul 0.6.6: I had removed mandatory spacing for unary prefix operators, but now it's back. The reason is to help out the host Javascript lexer, which can misinterpret
//     postfix increment/decrement: x + +y will be serialized as x++y, which is invalid Javascript. The fix is to introduce a space in front of the second plus: x+ +y, which is unambiguous.

        toString: function ()   {return this.inspect()},
         inspect: function ()   {return (this.l ? '(left) <- ' : '') + '(' + this.data + (this.length ? ' ' + map(syntax_node_inspect, this).join(' ') : '') + ')' +
                                        (this.r ? ' -> ' + this.r.inspect() : '')},

//     An improvement that could be made to serialize() is to use one big array that is then join()ed for serialization, rather than appending all of these little strings. Based on the
//     benchmarking I've done, the compilation phase is fairly zippy; but if it ever ends up being a problem then I'll look into optimizations like this.

       serialize: function (xs) {var op = this.data, space = /\w/.test(op.charAt(op.length - 1)) ? ' ' : '';
                                 return               op === ';' ? this.length ? map(syntax_node_tostring, this).join(';\n') : ';' :
                                        has(parse_invisible, op) ? map(syntax_node_tostring, this).join(space) :
                                       has(parse_invocation, op) ? map(syntax_node_tostring, [this[0], op.charAt(0), this[1], op.charAt(1)]).join(space) :
                                          has(parse_ternary, op) ? map(syntax_node_tostring, [this[0], op, this[1], parse_group[op], this[2]]).join(space) :
                                            has(parse_group, op) ? op + map(syntax_node_tostring, this).join(space) + parse_group[op] :
                                               has(parse_lr, op) ? this.length ? map(syntax_node_tostring, this).join(space + op + space) : op :
                   has(parse_r, op) || has(parse_r_optional, op) ? op.replace(/^u/, ' ') + space + (this[0] ? this[0].serialize() : '') :
                                    has(parse_r_until_block, op) ? has(parse_accepts, op) && this[1] && this[2] && parse_accepts[op] === this[2].data && ! this[1].ends_with_block() ?
                                                                     op + space + map(syntax_node_tostring, [this[0], this[1], ';\n', this[2]]).join('') :
                                                                     op + space + map(syntax_node_tostring, this).join('') :
                                                has(parse_l, op) ? (this[0] ? this[0].serialize() : '') + space + op : op}};

    caterwaul_global.method('define_syntax_structure', function (name, ctor) {return this.field(name, extend(ctor, syntax_structure_common))}).
                      field('syntax_structure_common', syntax_structure_common).

//   References.
//   You can drop references into code that you're compiling. This is basically variable closure, but a bit more fun. For example:

//   | caterwaul.compile(qs[fn_[_ + 1]].replace({_: new caterwaul.ref(3)})()    // -> 4

//   What actually happens is that caterwaul.compile runs through the code replacing refs with gensyms, and the function is evaluated in a scope where those gensyms are bound to the values they
//   represent. This gives you the ability to use a ref even as an lvalue, since it's really just a variable. References are always leaves on the syntax tree, so the prototype has a length of 0.

    define_syntax_structure('ref', function (value) {if (value instanceof this.constructor) {this.value = value.value; this.data = value.data}
                                                     else                                   {this.value = value;       this.data = gensym()}}, {length: 0, binds_a_value: true}).

//   Syntax node constructor.
//   Here's where we combine all of the pieces above into a single function with a large prototype. Note that the 'data' property is converted from a variety of types; so far we support strings,
//   numbers, and booleans. Any of these can be added as children. Also, I'm using an instanceof check rather than (.constructor ===) to allow array subclasses such as Caterwaul finite sequences
//   to be used.

    define_syntax_structure('syntax', function (data) {if (data instanceof this.constructor) this.data = data.data, this.length = 0;
                                                       else {this.data = data && data.toString(); this.length = 0;
                                                         for (var i = 1, l = arguments.length, _; _ = arguments[i], i < l; ++i)
                                                           for (var j = 0, lj = _.length, it, itc; _ instanceof Array ? (it = _[j], j < lj) : (it = _, ! j); ++j)
                                                             this._append((itc = it.constructor) === String || itc === Number || itc === Boolean ? new this.constructor(it) : it)}})})();
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

  caterwaul_global.alias('parse', 'decompile').
                  method('parse', (function () {

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

      return function (input) {

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
            new_node = function (n) {return all_nodes.push(n), n}, push = function (n) {return head ? head._sibling(head = n) : (head = n._append_to(parent)), new_node(n)},
            syntax_node = caterwaul_global.syntax;

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
        return head}})());
// Generated by SDoc 





// Environment-dependent compilation.
// It's possible to bind variables from 'here' (i.e. this runtime environment) inside a compiled function. The way we do it is to create a closure using a gensym. (Another reason that gensyms
// must really be unique.) Here's the idea. We use the Function constructor to create an outer function, bind a bunch of variables directly within that scope, and return the function we're
// compiling. The variables correspond to gensyms placed in the code, so the code will have closure over those variables.

// An optional second parameter 'environment' can contain a hash of variable->value bindings. These will be defined as locals within the compiled function.

// New in caterwaul 0.6.5 is the ability to specify a 'this' binding to set the context of the expression being evaluated.

  caterwaul_global.method('compile',
    function (tree, environment) {
      var vars = [], values = [], bindings = merge({}, environment || {}, tree.bindings()), s = gensym(); for (var k in bindings) if (has(bindings, k)) vars.push(k), values.push(bindings[k]);
      var code = map(function (v) {return v === 'this' ? '' : 'var ' + v + '=' + s + '.' + v}, vars).join(';') + ';return(' + tree.serialize() + ')';
      try {return (new Function(s, code)).call(bindings['this'], bindings)} catch (e) {throw new Error('Caught ' + e + ' while compiling ' + code)}});
// Generated by SDoc 






// Baking support.
// To "bake" a caterwaul function is to freeze its settings and apply long-run optimizations such as macroexpander compilation. Once a function is baked you can't do certain things, most notably
// adding macros. (Other restrictions may apply later as further optimizations are implemented.)

//   Meta-methods.
//   Baking is a state transition, and these are hooks and behaviors that are aware of the state (so that your code doesn't have to be). method_until_baked() is just like method(), but replaces
//   the method with an error generator once bake() is called. when_baked() installs an event listener and allows you to perform some optimization.

    caterwaul_global.shallow('bake_listeners', []).method('bake', function () {for (var i = 0, l = this.bake_listeners.length; i < l; ++i) this.bake_listeners[i].call(this); return this}).
                      method('when_baked', function (f) {this.bake_listeners.push(f); return this}).

                      method('method_until_baked', function (name, f) {return this.method(name, f).when_baked(function () {
                                                                                this.method(name, function () {throw new Error('cannot call ' + name + ' on a baked caterwaul')})})});
// Generated by SDoc 






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
// was called on. (So any future caterwaul()ed functions would have access to it.) You can also define conditional macros, though they will probably be slower. For example:

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
//       caterwaul.rmacro(p, fn[x][...]);
//     });
//   }) ();

// Caterwaul implements several optimizations that make it much faster to macroexpand code when the macro patterns are easily identified.

  (function () {

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

//   | 1. Reassembly of different pieces (see above).
//     2. Anything at all, if you modify the syntax tree in the macro code. Returning a replacement is one thing, but modifying one will break things.
//     3. Performance bounds.

//   Matching.
//   macro_try_match returns null if two syntax trees don't match, or a possibly empty array of wildcards if the given tree matches the pattern. Wildcards are indicated by '_' nodes, as
//   illustrated in the macro definition examples earlier in this section. Note that this function is O(n) in the number of nodes in the pattern. It is optimized, though, to reject invalid nodes
//   quickly -- that is, if there is any mismatch in arity or data.

    caterwaul_global.method('macro_try_match', function (pattern, t) {if (pattern.data === '_')                                   return [t];
                                                                      if (pattern.data !== t.data || pattern.length !== t.length) return null;
                                                                      for (var i = 0, l = pattern.length, wildcards = [], match = null; i < l; ++i)
                                                                        if (match = macro_try_match(pattern[i], t[i])) Array.prototype.push.apply(wildcards, match);
                                                                        else                                           return null;
                                                                      return wildcards});

// Macroexpansion behavior.
// Caterwaul exposes macroexpansion as a contained interface. This lets you write your own compilers with macroexpansion functionality, even if the syntax trees weren't created by Caterwaul.
// (Though you won't be able to precompile these.) In order for this to work, your syntax trees must:

// | 1. Look like arrays -- that is, have a .length property and be indexable by number (e.g. x[0], x[1], ..., x[x.length - 1])
//   2. Implement an rmap() method. This should perform a depth-first traversal of the syntax tree, invoking a callback function on each node. If the callback returns a value, that value should
//      be subsituted for the node passed in and traversal should continue on the next node (not the one that was grafted in). Otherwise traversal should descend into the unmodified node. The
//      rmap() method defined for Caterwaul syntax trees can be used as a reference implementation. (It's fairly straightforward.)
//   3. Implement a .data property. This represents an equivalence class for syntax nodes under ===. Right now there is no support for using other equivalence relations.

// As of version 0.7.0 this compatibility may change without notice. The reason is that the macroexpansion logic used by Caterwaul is becoming more sophisticated to increase performance, which
// means that it may become arbitrarily optimized.

//   Macro vs. rmacro.
//   macro() defines a macro whose expansion is left alone. rmacro(), on the other hand, will macroexpand the expansion, letting you emit macro-forms such as fn[][]. Most of the time you will
//   want to use rmacro(), but if you want to have a literal[] macro, for instance, you would use macro():

//   | caterwaul.configure(function () {
//       // Using macro() instead of rmacro(), so no further expansion:
//       this.macro(qs[literal[_]], fn[x][x]);
//     });

//   While macro() is marginally faster than rmacro(), the difference isn't significant in most cases.

//   New in caterwaul 1.0 is the ability to specify multiple macro patterns that share an expander by passing more than two arguments to macro() and rmacro().

    var variadic_definition = function (f) {return function () {for (var i = 0, l = arguments.length - 1; i < l; ++i) f.call(this, arguments[i], arguments[l]); return this}};

    caterwaul_global.shallow('macro_patterns', []).
                     shallow('macro_expanders', []).

          method_until_baked('macro',  variadic_definition(function (pattern, expander) {if (! expander.apply) throw new Error('macro: cannot define macro with non-function expander');
                                                                                         else return this.macro_patterns.push(pattern), this.macro_expanders.push(expander), this})).

          method_until_baked('rmacro', variadic_definition(function (pattern, expander) {if (! expander.apply) throw new Error('rmacro: cannot define macro with non-function expander');
                                                                                         else return this.macro(pattern, function () {var t = expander.apply(this, arguments);
                                                                                                                                      return t && this.macroexpand(t)})})).
                      method('macroexpand', function (t) {return macro_expand_naive(t, this.macro_patterns, this.macro_expanders, this)}).
                  when_baked(function () {var f = this.create_baked_macroexpander(this.macro_patterns, this.macro_expanders);
                                          this.method('macroexpand', function (t) {return t.rmap(function (n) {return f.call(this, n)})})})})();
// Generated by SDoc 





// Naive macroexpander implementation.
// This is the macroexpander used in Caterwaul 0.6.x and prior. It offers reasonable performance when there are few macros, but for high-macro cases it becomes prohibitive. Version 0.7.0 and
// forward use the optimizing JIT macroexpander defined in sdoc::js::core/caterwaul.macroexpander.jit. (Note that this macroexpander is still here to reduce the amount of compilation overhead for
// small macroexpansions.)

//   Expansion.
//   Uses the straightforward brute-force algorithm to go through the source tree and expand macros. At first I tried to use indexes, but found that I couldn't think of a particularly good way to
//   avoid double-expansion -- that is, problems like qs[qs[foo]] -- the outer must be expanded without the inner one. Most indexing strategies would not reliably (or if reliably, not profitably)
//   index the tree in such a way as to encode containment. Perhaps at some point I'll find a faster macroexpander, especially if this one proves to be slow. At this point macroexpansion is by
//   far the most complex part of this system, at O(nki) where n is the number of parse tree nodes, k is the number of macros, and i is the number of nodes in the macro pattern tree. (Though in
//   practice it's generally not quite so bad.)

//   Note! This function by default does not re-macroexpand the output of macros. That is handled at a higher level by Caterwaul's macro definition facility (see the 'rmacro' method).

//   Note that as of version 0.5, macroexpansion proceeds backwards. This means that the /last/ matching macro is used, not the first. It's an important feature, as it lets you write new macros
//   to override previous definitions. This ultimately lets you define sub-caterwaul functions for DSLs, and each can define a default case by matching on qs[_] (thus preventing access to other
//   macro definitions that may exist).

  caterwaul_global.method('macro_expand_naive', function (t, macros, expanders) {
                           return t.rmap(function (n) {for (var i = macros.length - 1, macro, match, replacement; i >= 0 && (macro = macros[i]); --i)
                                                         if ((match = macro_try_match(macro, n)) && (replacement = expanders[i].apply(this, match))) return replacement})});
// Generated by SDoc 





// JIT macroexpander.
// This macroexpander examines the syntax trees used as macro patterns, constructs a breadth-first decision tree, and JITs a custom macroexpander function for those trees. Because this is a
// fairly tine-consuming operation the process is memoized in the macro list.

// At first I was using a context-free probabilistic model to optimize the order of decisions, but this requires knowing something about the syntax tree -- which means that each macroexpand()
// call involves generating a new function. This proved to be very expensive (worse than naive macroexpansion!), so I'm going with a model that can be used without knowing anything about the
// syntax trees being transformed.

// For history's sake I've left some of the theoretical notes involving probability, but in practice we don't know what the probability will be when we're building the decision tree.

  caterwaul_global.method('create_baked_macroexpander', (function () {

//   Irrelevance of discrimination.
//   Suppose you have two macro trees, each with the same form (i.e. same arity of each node and same wildcard positions). I propose that the traversal order doesn't require any extensive
//   optimization beyond one thing: How much information is being gained per comparison? This is very different from discrimination, which was the focus of the probabilistic JIT macroexpander
//   design. Here is an example.

//   | (, (_) (* (where) ([] ([ (=  (_) (_))))))               <- the macro patterns
//     (, (_) (* (where) ([] ([ (== (_) (_))))))

//   Suppose we run into a syntax tree that starts with ','. The likelihood of a comma occurring anyway is P(','), so we now have 1 / P(',') information. It doesn't matter that this fails to
//   discriminate between the two macro patterns. We needed to know it anyway if we were going to perform a match, and it let us jump out early if it wasn't there. The left-hand side of each
//   expansion tells us nothing, so we don't bother inspecting that yet. We instead go to the right-hand side, which we'll reject with probability (1 - P('*')). We then follow the right-hand side
//   recursively downwards, continuing to match the non-wildcard nodes.

//   Once all non-wildcard nodes are matched, we will have eliminated one macro pattern or the other. (This won't be true if we have overlapping macro definitions, but it is in this case.) At
//   that point we will have both verified the macro pattern and reduced the macro-space as much as possible.

//   Heterogeneous tree forms.
//   Most of the time heterogeneity doesn't matter. The reason for this is that there are few variadic nodes. However, they do sometimes come up. One case is 'return', which sometimes occurs
//   without a child. In this case we might have macro patterns like this:

//   | (return (foo))
//     (return)

//   We'll obviously have to compare the 'return' first, but what happens with the subtree in the first case? The answer is that the tree length is compared when the data is. This gives us an
//   extra bailout condition. So comparing the 'return' will eliminate one possibility or the other, since the length check will fail for one of them. So we have a nice invariant: All trees under
//   consideration will have the same shape.

//   This check isn't reflected in the traversal path construction below, but it is generated in the final pattern-matching code. It's also generated in the intermediate treeset object
//   representation.

//   Traversal path.
//   The pattern matcher uses both depth-first and breadth-first traversal of the pattern space. The idea is that each motion through the tree is fairly expensive, so we do a comparison at each
//   point. However, we can decide which branch to progress down without losing progress. For example, suppose we have this:

//   | (+ (* (a) (b)) (/ (a) (b)))

//   The first comparison to happen is +, regardless of what the rest of the tree looks like. If we don't bail out, then without loss of generality suppose we take the * branch. At this point we
//   have two nodes stored in local variables; one is the root + node, and the other is the child * node. The total child set is now (a), (b), and (/ (a) (b)). We take whichever one of these
//   children is most likely to bail out, which let's suppose is (b). Because (b) has no children, we now have (a) and (/ (a) (b)). Now suppose that / is the next lowest-probability symbol; we
//   then visit that node, producing the children (a) and (b). (b) is the lower-probability one, so we test that, leaving the total child list at (a), (a). The order of these last two comparisons
//   doesn't matter.

//   We need an intermediate representation for the path-finder decisions. The reason is that these decisions are used to both (1) partition the tree set, and (2) generate code. (2) isn't
//   particularly difficult using just stack-local data, but (1) ends up being tricky because of the potential for breadth-first searching. The problem is a subtle one but is demonstrated by this
//   example:

//   | (+ (* (/ (a) (b)) (c)) (+ (a) (b)))
//     (+ (* (* (a) (b)) (c)) (- (a) (b)))

//   Suppose here that we search subtree [0] first. Further, suppose that we end up progressing into subtree [0][0]. At this point we'll create a branch, so we have partitioned the original tree
//   space into two fragments. As such, we need to know to ask for just the probability of '+' or '-' on its own, not the sum, since we'll be able to bail out immediately if the wrong one is
//   present. This kind of coupling means that we need to be able to query the original trees in their entirety and from the root point. This in turn requires a logical path representation that
//   can be used to both partition trees, and to later generate code to do the same thing. (An interesting question is why we wouldn't use the JIT to do this for us. It would be a cool solution,
//   but I think it would also be very slow to independently compile that many functions.)

//   Paths are represented as strings, each of whose characters' charCodes is an index into a subtree. The empty string refers to the root. I'm encoding it this way so that paths can be used as
//   hash keys, which makes it very fast to determine which paths have already been looked up. Also, most macro paths will be fewer than five characters, so even on eager-consing runtimes the
//   quadratic nature of it isn't that bad.

//   Treeset partitions are returned as objects that map the arity and data to an array of trees. The arity is encoded as a single character whose charCode is the actual arity. So, for example,
//   partition_treeset() might return this object:

//   | {'\002+': [(+ (x) (y)), (+ (x) (z))],
//      '\002-': [(- (x) (y)), (- (x) (z))]}

    var resolve_tree_path = function (tree,  path) {for (var i = 0, l = path.length; i < l; ++i) if (! (tree = tree[path.charCodeAt(i)])) return tree; return tree},
        partition_treeset = function (trees, path) {for (var r = {}, i = 0, l = trees.length, t, ti; i < l; ++i)
                                                        (t = resolve_tree_path(ti = trees[i], path)) ? (t = String.fromCharCode(t.length) + t.data) : (t = ''), (r[t] || (r[t] = [])).push(ti);
                                                    return r},

//   Pathfinder logic.
//   For optimization's sake the hash of visited paths maps each path to the arity of the tree that it points to. This makes it very easy to generate adjacent paths without doing a whole bunch of
//   path resolution.

//   Partitioning is done by visit_path, which first partitions the tree-space along the path, and then returns new visited[] hashes along with the partitions. The visited[] hash ends up being
//   split because different partitions will have different traversal orders. In practice this means that we copy visited[] into several new hashes. The other reason we need to split visited[] is
//   that the arity of the path may be different per partition. So the result of visit_path looks like this:

//   | {'aritydata': {visited: {new_visited_hash}, trees: [...]},
//      'aritydata': ...}

//   The base case is when there is no visited history; then we return '' to get the process started with the root path.

//   As explained in 'Full specification detection', next_path needs to skip over any paths that refer to wildcards.

    next_path = function (visited, trees) {if (! visited) return '';
                                           for (var k in visited) if (visited.hasOwnProperty(k)) for (var i = 0, l = visited[k], p; i < l; ++i)
                                             if (! ((p = k + String.fromCharCode(i)) in visited)) {
                                               for (var j = 0, lj = trees.length, skip; j < lj; ++j) if (skip = resolve_tree_path(trees[j], p).data === '_') break;
                                               if (! skip) return p}},

    visit_path = function (path, visited, trees) {var partitions = partition_treeset(trees, path), kv = function (k, v) {var r = {}; r[k] = v; return r};
                                                  for (var k in partitions) if (partitions.hasOwnProperty(k))
                                                      partitions[k] = {trees: partitions[k], visited: merge({}, visited, kv(path, k.charCodeAt(0)))};
                                                  return partitions},

//   Full specification detection.
//   Sometimes no path resolves the treeset. At that point one or more trees are fully specified, so we need to find and remove those trees from the list. This will produce an array of results
//   [treeset, treeset, treeset, ...]. The property is that each treeset will contain trees that either (1) are all fully specified with respect to the set of visited paths, or (2) are all not
//   fully specified with respect to the paths. Order is also preserved from the original treeset.

//   Note that the first treeset always represents trees which are not fully specified, then each subsequent treeset alternates in its specification. This way you can use a shorthand such as i&1
//   to determine whether a given treeset is final. (Because of all of this, the first treeset may be empty. All other ones, if they exist, will be populated.)

//   This is actually a much more straightforward task than it sounds like, because the number of non-wildcard nodes for each tree is already stored in pattern_data. This means that we just need
//   to find trees for which the number of non-wildcard nodes equals the number of visited paths.

//   There's a kind of pathological case that also needs to be considered. Suppose you've got a couple of macro patterns like this:

//   | (a (b) (_))
//     (a (_) (b))

//   In this case we may very well have to try both even though technically neither tree will be specified yet (and hence we don't think there's any ambiguity). The way to address this is to make
//   sure that any trees we put into an 'unspecified' partition are all unspecified in the same place. So the two trees above would go into separate partitions, even though they're both
//   unspecified. Then next_path() will be able to provide a single path that increases specificity, not one that hits a wildcard.

//   This case can be recognized because non-wildcards will occur in different positions. A greedy algorithm will suffice; the idea is that we build a list of indexes that refer to non-wildcards
//   and intersect it with each tree we consider. If the next tree results in a zero list then we defer it to the next partition. The way I'm doing this is finishing off the current partition,
//   inserting an empty fully-specified partition, and then kicking off a new partition of unspecified trees. This probably isn't the most efficient way to go about it, but the code generator
//   knows how to deal with empty partitions gracefully.

    split_treeset_on_specification = function (trees, pattern_data, visited) {
                                       var r = [], visited_count = 0, available_paths = {}, available_count = 0;
                                       if (visited != null) {for (var k in visited) if (visited.hasOwnProperty(k)) {
                                                              ++visited_count;
                                                              for (var i = 0, l = visited[k]; i < l; ++i) available_paths[k + String.fromCharCode(i)] = ++available_count}}
                                       else available_paths = {'': available_count = 1};

                                       for (var p = [], s = false, remaining_paths = null, remaining_count = 0, i = 0, l = trees.length, t, td; i < l; ++i)
                                         if (((td = pattern_data[(t = trees[i]).id()]).non_wildcards === visited_count) !== s) r.push(p), p = [t], s = !s, remaining_paths = null;
                                         else if (s) p.push(t);
                                         else {
                                           if (remaining_paths === null) remaining_paths = merge({}, available_paths), remaining_count = available_count;
                                           for (var ps = td.wildcard_paths, j = 0, lj = ps.length, pj; j < lj; ++j)
                                             remaining_count -= remaining_paths.hasOwnProperty(pj = ps[j]), delete remaining_paths[pj];
                                           if (remaining_count) p.push(t);
                                           else                 r.push(p), r.push([]), p = [t], remaining_paths = null}

                                       p.length && r.push(p);
                                       return r},

//   Pattern data.
//   We end up with lots of subarrays of the original pattern list. However, we need to be able to get back to the original expander for a given pattern, so we keep a hash of pattern data indexed
//   by the ID of the pattern tree. The pattern data consists of more than just the expander; we also store the number of non-wildcard nodes per pattern tree. This is used to determine which
//   trees are fully resolved. We also need a list of wildcard paths for each tree; this is used to efficiently construct the arrays that are passed into the expander functions.

//   By convention I call the result of this function pattern_data, which shadows this function definition. (Seems somehow appropriate to do it this way.)

    wildcard_paths = function (t) {for (var r = t.data === '_' ? [''] : [], i = 0, l = t.length; i < l; ++i)
                                     for (var ps = t[i] && wildcard_paths(t[i]), j = 0, lj = ps.length; j < lj; ++j) r.push(String.fromCharCode(i) + ps[j]);
                                   return r},

    pattern_data = function (ps, es) {for (var r = {}, i = 0, l = ps.length, p; i < l; ++i)
                                        r[(p = ps[i]).id()] = {expander: es[i], non_wildcards: non_wildcard_node_count(p), wildcard_paths: wildcard_paths(p)};
                                      return r},

//   Code generation.
//   This is the last step and it's where the algorithm finally comes together. Two big things are going on here. One is the traversal process, which uses next_path to build the piecewise
//   traversal order. The other is the code generation process, which conses up a code tree according to the treeset partitioning that guides the traversal. These two processes happen in
//   parallel.

//   The original JIT design goes over a lot of the code generation, but I'm duplicating it here for clarity. (There are also some changes in this design, though the ideas are the same since
//   they're both fundamentally just decision trees.)

//     Function body.
//     This is largely uninteresting, except that it provides the base context for path dereferencing (see 'Variable allocation' below). It also provides a temporary 'result' variable, which is
//     used by the macroexpander invocation code.

      pattern_match_function_template = caterwaul_global.parse('function (t) {var result; _body}'),
      empty_variable_mapping_table    = function () {return {'': 't'}},

//     Partition encoding.
//     Each time we partition the tree set, we generate a switch() statement. The switch operates both on arity and on the data, just like the partitions would suggest. (However these two things
//     are separate conditionals, unlike their representation in the partition map.) The layout looks like this:

//     | switch (tree.length) {
//         case 0:
//           switch (tree.data) {
//             case 'foo': ...
//             case 'bar': ...
//           }
//           break;
//         case 1:
//           switch (tree.data) {
//             case 'bif': ...
//             case 'baz': ...
//           }
//           break;
//       }

//     Note that we can't return false immediately after hitting a failing case. The reason has to do with overlapping macro definitions. If we have two macro definitions that would both
//     potentially match the input, we have to proceed to the second if the first one rejects the match.

      partition_template        = caterwaul_global.parse('switch (_value) {_cases}'),
      partition_branch_template = caterwaul_global.parse('case _value: _body; break'),

//     Attempting a macro match is kind of interesting. We need a way to use 'break' to escape from a match, so we construct a null while loop that lets us do this. Any 'break' will then send the
//     code into the sequential continuation, not escape from the function.

      single_macro_attempt_template = caterwaul_global.parse('do {_body} while (false)'),

//     Variable allocation.
//     Variables are allocated to hold temporary trees. This reduces the amount of dereferencing that must be done. If at any point we hit a variable that should have a value but doesn't, we bail
//     out of the pattern match. A table keeps track of path -> variable name mappings. The empty path always maps to 't', which is the input tree.

//     Incremental path references can be generated anytime we have a variable that is one dereference away from the given path. generate_incremental_path_reference does two things. First, it
//     creates a unique temporary name and stashes it into the path -> variable mapping, and then it returns a syntax tree that uses that unique name and existing entries in the path -> variable
//     mapping. The path's index is hard-coded. Note that if the path isn't properly adjacent you'll end up with an array instead of a syntax tree, and things will go downhill quickly from there.

      indexed_path_reference_template  = caterwaul_global.parse('_base[_index]'),
      absolute_path_reference_template = caterwaul_global.parse('_base'),
      generate_path_reference          = function (variables, path) {
                                           return variables[path] ? absolute_path_reference_template.replace({_base: variables[path]}) :
                                                                    indexed_path_reference_template .replace({_base: generate_path_reference(variables, path.substr(0, path.length - 1)),
                                                                                                              _index: '' + path.charCodeAt(path.length - 1)})},
      path_variable_template = caterwaul_global.parse('var _temp = _value; if (! _temp) break'),
      path_exists_template   = caterwaul_global.parse('null'),
      generate_path_variable = function (variables, path) {if (variables[path]) return path_exists_template;
                                                           var name = 't' + genint(), replacements = {_value: generate_path_reference(variables, path), _temp: name};
                                                           return variables[path] = name, path_variable_template.replace(replacements)},

//     Macroexpander invocation encoding.
//     The actual macroexpander functions are invoked by embedding ref nodes in the syntax tree. If one function fails, it's important to continue processing with whatever assumptions have been
//     made. (This is actually one of the trickier points of this implementation.) Detecting this isn't too bad though. It's done above by split_treeset_on_specification.

      non_wildcard_node_count = function (tree) {var r = 0; tree.reach(function (node) {r += node.data !== '_'}); return r},

//     Invocations of the macroexpander should be fast, so there's some kind of interesting logic to quickly match wildcards with a minimum of array consing. This optimization requires a
//     simplifying assumption that all _ nodes are leaf nodes, but this is generally true. (It's possible to build macro patterns that don't have this property, but they won't, and never would
//     have, behaved properly.) The idea is that once we have a fully-specified macro pattern we can simply go through each visited path, grab the direct children of each node, and detect
//     wildcards. We then encode these wildcard paths as hard-coded offsets from the tree variables. So, for example:

//     | (+ (/ (_) (b)) (* (a) (_)))
//       visited: [0], [0][1], [1], [1][0]
//       children: (_), (b), (a), (_)
//       parameters: [paths[0][0], paths[1][1]]

//     This requires a lexicographic sort of the paths to make sure the tree is traversed from left to right.

//     Note that a new array is consed per macroexpander invocation. I'm not reusing the array from last time because (1) it's too much work, and (2) the fallthrough-macro case is already fairly
//     expensive and uncommon; a new array cons isn't going to make much difference at that point.

      path_reference_array_template = caterwaul_global.parse('[_elements]'),
      generate_path_reference_array = function (variables, paths) {for (var refs = [], i = 0, l = paths.length; i < l; ++i) refs.push(generate_path_reference(variables, paths[i]));
                                                                   return path_reference_array_template.replace({_elements: refs.length > 1 ? new caterwaul_global.syntax(',', refs) : refs[0]})},

      macroexpander_invocation_template = caterwaul_global.parse('if (result = _expander.apply(this, _path_reference_array)) return result'),
      generate_macroexpander_invocation = function (pattern_data, pattern, variables) {return macroexpander_invocation_template.replace(
                                                   {_expander:             new ref(pattern_data[pattern.id()].expander),
                                                    _path_reference_array: generate_path_reference_array(variables, pattern_data[pattern.id()].wildcard_paths)})},

//     Multiple match handling.
//     When one or more macros are fully specified, we need to go through them in a particular order. Failover is handled gracefully; we just separate the macro patterns by a semicolon, since a
//     success side-effects via return and a failure's side-effect is its sequential continuation. (This is why we needed 'break' instead of 'return false' when generating case statements above.)

//     Here the pattern_data variable refers to a hash that maps each pattern's identity to some data about it, including which macroexpander belongs to the pattern in the first place. Note that
//     because I'm using identities this way, you can't add the same pattern (referentially speaking) to map to two different macroexpanders. It would be a weird thing to do, so I don't
//     anticipate that it would happen by accident. But it will cause bogus macroexpansion results if you do.

//       First case: underspecified trees.
//       In this case we create a switch on the tree length first. Then we subdivide into the data comparison. We create the tree-length switch() even if only one tree matches; the reason is that
//       we still need to know that the tree we're matching against has the right length, even if it doesn't narrow down the macro space at all.

        length_reference_template = caterwaul_global.parse('_value.length'),
        data_reference_template   = caterwaul_global.parse('_value.data'),

        generate_partitioned_switch = function (trees, visited, variables, pattern_data) {
                                        var path = next_path(visited, trees), partitions = visit_path(path, visited, trees), lengths = {}, length_pairs = [];
                                        for (var k in partitions) if (partitions.hasOwnProperty(k)) (lengths[k.charCodeAt(0)] || (lengths[k.charCodeAt(0)] = [])).push(k.substr(1));
                                        for (var k in lengths)    if (lengths.hasOwnProperty(k))    length_pairs.push([k, lengths[k]]);

                                        var new_variables = merge({}, variables), path_reference_variable = generate_path_variable(new_variables, path), variable = new_variables[path],
                                            length_reference = length_reference_template.replace({_value: variable}), data_reference = data_reference_template.replace({_value: variable});

                                        for (var length_cases = new caterwaul_global.syntax(';'), i = 0, l = length_pairs.length, pair; i < l; ++i) {
                                          for (var data_cases = new caterwaul_global.syntax(';'), length = (pair = length_pairs[i])[0], values = pair[1], j = 0, lj = values.length, p, v;
                                               j < lj; ++j)

                                            p = partitions[String.fromCharCode(length) + (v = values[j])],
                                            data_cases.push(partition_branch_template.replace({_value: '"' + v.replace(/([\\"])/g, '\\$1') + '"',
                                                                                               _body:  generate_decision_tree(p.trees, path, p.visited, new_variables, pattern_data)}));
                                          lj &&
                                          length_cases.push(partition_branch_template.replace({_value: '' + length_pairs[i][0],
                                                                                               _body:  partition_template.replace({_value: data_reference, _cases: data_cases})}))}
                                        return single_macro_attempt_template.replace({_body:
                                                 new caterwaul_global.syntax(';', path_reference_variable,
                                                                                  length_cases.length ? partition_template.replace({_value: length_reference, _cases: length_cases}) : [])})},

//       Second case: specified trees (base case).
//       This is fairly simple. We just generate a sequence of invocations, since each tree has all of the constants assumed.

        generate_unpartitioned_sequence = function (trees, variables, pattern_data) {for (var r = new caterwaul_global.syntax(';'), i = 0, l = trees.length; i < l; ++i)
                                                                                       r.push(generate_macroexpander_invocation(pattern_data, trees[i], variables));
                                                                                     return r},

//       Inductive step.
//       This is where we delegate either to the partitioned switch logic or the sequential sequence logic.

        generate_decision_tree = function (trees, path, visited, variables, pattern_data) {
                                   for (var r = new caterwaul_global.syntax(';'), sts = split_treeset_on_specification(trees, pattern_data, visited), i = 0, l = sts.length; i < l; ++i)
                                     sts[i].length && r.push(i & 1 ? generate_unpartitioned_sequence(sts[i], variables, pattern_data) :
                                                                     generate_partitioned_switch(sts[i], visited, variables, pattern_data));
                                   return r};

//   Macroexpansion generator.
//   This is where all of the logic comes together. The only remotely weird thing we do here is reverse both the pattern and expansion lists so that the macros get applied in the right order.

    return function (patterns, expanders) {for (var i = patterns.length - 1, rps = [], res = []; i >= 0; --i) rps.push(patterns[i]), res.push(expanders[i]);
                                           return this.compile(pattern_match_function_template.replace(
                                             {_body: generate_decision_tree(rps, null, null, empty_variable_mapping_table(), pattern_data(rps, res))}))}})());
// Generated by SDoc 






// Precompilation logic.
// Even though Caterwaul operates as a runtime library, most of the time it will be used in a fairly static context. Precompilation can be done to bypass parsing, macroexpansion, and
// serialization of certain functions, significantly accelerating Caterwaul's loading speed.

  caterwaul_global.field('precompiled_internal_table', {}).
                  method('precompiled_internal', function (f) {var k = gensym(); this.precompiled_internal_table[k] = f; return k}).

                  method('is_precompiled', function (f) {return f.constructor === String && this.precompiled_internal_table[f]}).

                  method('precompile', (function () {

//   Precompiled output format.
//   The goal of precompilation is to produce code whose behavior is identical to the original. Caterwaul can do this by taking a function whose behavior we want to emulate. It then executes the
//   function with an annotated copy of the caterwaul compiler, tracing calls to compile(). It assumes, incorrectly in pathological cases, that the macroexpansion step does not side-effect
//   against caterwaul or other escaping values. If it does, the precompiled code won't reflect those side-effects. (Though local side-effects, like defmacro[], will apply within the scope of the
//   function being compiled -- as they normally would, in other words.)

//   The output function performs side-effects necessary to emulate the behavior of your macroexpanded code. All other behavior performed by the precompiled function will be identical to the
//   original. Here's an example of how it is used:

//   | var f = caterwaul.precompile(function () {
//       alert('hi');
//       caterwaul.tconfiguration('std', 'foo', function () {
//         this.rmacro(qs[foo], fn_[qs[bar]]);
//       });
//       return 10;
//     });

//   After this statement, f.toString() will look something like this (except all mashed together, because Caterwaul doesn't format generated code):

//   | function () {
//       alert('hi');
//       caterwaul.tconfiguration('std', 'foo', caterwaul.precompiled_internal((function () {
//         var gensym_1 = caterwaul.parse('foo');
//         var gensym_2 = caterwaul.parse('bar');
//         return function () {
//           this.rmacro(gensym_1, function () {
//             return gensym_2;
//           });
//         })()));
//       return 10;
//     }

//   The precompiled_internal() function returns a reference that will inform Caterwaul not to operate on the function in question. You should (almost) never use this method! It will break all
//   kinds of stuff if you artificially mark functions as being precompiled when they are not.

//   There are some very important things to keep in mind when precompiling things:

//   | 1. Precompiling a function executes that function at compile time! This has some important consequences, perhaps most importantly that if you do something global, you could bork your
//        precompiling environment. The other important consequence is that if some code paths aren't run, those paths won't be precompiled. Caterwaul can only precompile paths that it has
//        traced.
//     2. As mentioned above, Caterwaul assumes that the act of macroexpanding a function will have no side effects. This is not always true, and by design. In particular, stuff in the 'macro'
//        module violates this assumption. So if your code relies on escaping side-effects of the macroexpansion process, the precompiled version will behave differently from the regular version.
//        For instance, if you are using defmacro[], defsubst[], or compile_eval[] and hanging onto the caterwaul function, then the precompiled version will act as if those macros had never been
//        encountered.
//     3. Precompilation doesn't macroexpand the function being precompiled, even if the caterwaul function performing the precompilation has macros defined.
//     4. Most syntax tree refs can't be precompiled! If Caterwaul bumps into one it will throw an error. The only refs that it knows how to handle are (1) itself, and (2) references to syntax
//        trees that don't contain other refs. If you want it to handle other refs, you'll need to write a macro that transforms them into something else before the precompiler sees them.
//        (Actually, the standard library contains a fair amount of this kind of thing to avoid this very problem. Instead of using refs to generated values, it installs values onto the caterwaul
//        global and generates references to them.)
//     5. Caterwaul assumes that compilation is completely deterministic. Any nondeterminism won't be reflected.

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

//   Tracing function destinations.
//   This is more subtle than you might think. First, we need to construct a custom traced caterwaul function to pass into the function being precompiled. This caterwaul is a clone of the regular
//   one, but has hooks that track calls to compile(). It also installs these hooks on any clones of itself, which means that the clone() method is overridden as well.

//   When a parse() call happens, we'll have a reference to the function being parsed. We can identify which function it came from (in the original syntax tree that is) by marking each of the
//   initial functions with a unique gensym on the end of the parameter list:

//   | function (x, y, z, gensym_foo_bar_bif) {...}

//   This serves as a no-op that lets us track the function from its original parse tree into its final compiled state.

//   Next the function may be macroexpanded. If so, we make sure the gensym tag is on the macroexpanded output (if the output of macroexpansion isn't a function, then it's a side-effect and we
//   can't track it). Finally, the function will be compiled within some environment. This is where we go through the compilation bindings, serializing each one with the function. We then wrap
//   this in an immediately-invoked anonymous function (to create a new scope and to simulate the one created by compile()), and this becomes the output.

    var nontrivial_function_pattern         = caterwaul_global.parse('function (_) {_}'),
        trivial_function_pattern            = caterwaul_global.parse('function () {_}'),
        nontrivial_function_gensym_template = caterwaul_global.parse('function (_args, _gensym) {_body}'),
        trivial_function_gensym_template    = caterwaul_global.parse('function (_gensym) {_body}'),

        mark_nontrivial_function_macro = function (references) {return function (args, body) {
                                           var s = gensym(), result = nontrivial_function_gensym_template.replace({_args: args, _gensym: s, _body: annotate_functions_in(body, references)});
                                           return references[s] = {tree: result}, result}},

        mark_trivial_function_macro    = function (references) {return function (body) {
                                           var s = gensym(), result = trivial_function_gensym_template.replace({_gensym: s, _body: annotate_functions_in(body, references)});
                                           return references[s] = {tree: result}, result}},

//   Macroexpansion for function origins.
//   The function annotation is done by a macro that matches against each embedded function. Only one level of precompilation is applied; if you have invocations of caterwaul from inside
//   transformed functions, these sub-functions won't be identified and thus won't be precompiled. (It's actually impossible to precompile them in the general case since we don't ultimately know
//   what part of the code they came from.)

//   Note that the ordering of trivial and nontrivial cases here is important. Later macros take precedence over earlier ones, so we use the most specific case last and let it fall back to the
//   more generic case.

    annotate_functions_in = function (tree, references) {return macro_expand_naive(tree, [trivial_function_pattern,                nontrivial_function_pattern],
                                                                                         [mark_trivial_function_macro(references), mark_nontrivial_function_macro(references)], null)},

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

    nontrivial_gensym_detection_pattern = caterwaul_global.parse('function (_, _) {_}'),
    trivial_gensym_detection_pattern    = caterwaul_global.parse('function (_) {_}'),

    wrapped_compile = function (original, references) {return function (tree, environment) {
                        var            matches = tree.match(nontrivial_gensym_detection_pattern), k = matches && matches[1].data;
                        if (! matches) matches = tree.match(   trivial_gensym_detection_pattern), k = matches && matches[0].data;

                        if (matches && references[k]) if (references[k].compiled) throw new Error('detected multiple compilations of ' + references[k].tree.serialize());
                                                      else                        references[k].compiled = tree, references[k].environment = environment;
                        return original.call(this, tree, environment)}},

//   Generating compiled functions.
//   This involves a few steps, including (1) signaling to the caterwaul function that the function is precompiled and (2) reconstructing the list of syntax refs.

//     Already-compiled signaling.
//     We don't necessarily know /why/ a particular function is being compiled, so it's beyond the scope of this module to try to produce a method call that bypasses this step. Rather, we just
//     inform caterwaul that a function is going to be compiled ahead-of-time, and all caterwaul functions will bypass the compilation step automatically. To do this, we use the dangerous
//     precompiled_internal() method, which returns a placeholder.

      already_compiled_template = caterwaul_global.parse('caterwaul.precompiled_internal(_x)'),
      signal_already_compiled = function (tree) {return already_compiled_template.replace({_x: tree})},

//     Syntax ref serialization.
//     This is the trickiest part. We have to identify ref nodes whose values we're familiar with and pull them out into their own gensym variables. We then create an anonymous scope for them,
//     along with the compiled function, to simulate the closure capture performed by the compile() function.

      closure_template          = caterwaul_global.parse('(function () {_vars; return (_value)})()'),
      closure_variable_template = caterwaul_global.parse('var _var = _value'),
      closure_null_template     = caterwaul_global.parse('null'),

      syntax_ref_template       = caterwaul_global.parse('caterwaul.parse(_string)'),
      caterwaul_ref_template    = caterwaul_global.parse('caterwaul.clone(_string)'),

      syntax_ref_string         = function (ref) {return '\'' + ref.serialize().replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/'/g, '\\\'') + '\''},
      caterwaul_ref_string      = function (has) {var ks = []; for (var k in has) own.call(has, k) && ks.push(k); return '\'' + ks.join(' ') + '\''},

//     Detecting caterwaul functions.
//     This can be done by using the is_caterwaul property of caterwaul functions. (Presumably other functions won't have this property, but if they attempt to look like caterwaul functions by
//     taking on its value then there isn't much we can do.) The idea here is to compare this to a known global value and see if it matches up. Only a caterwaul function (we hope) will have the
//     right value for this property, since the value is a unique gensym.

//     Because it's so trivial to handle falsy things (they're all primitives), I've included that case here. Also, the standard library apparently depends on it somehow.

      serialize_ref             = function (value, name, seen) {
                                        if (! value)                                       return '' + value;
                                   else if (value.constructor === caterwaul_global.syntax) return seen[value.id()] || (seen[value.id()] = name,
                                                                                             syntax_ref_template.replace({_string: syntax_ref_string(value)}));
                                   else if (value.is_caterwaul === is_caterwaul)           return seen[value.id()] || (seen[value.id()] = name,
                                                                                             caterwaul_ref_template.replace({_string: caterwaul_ref_string(value.has)}));
                                   else                                                    throw new Error('syntax ref value is not serializable: ' + value)},

//     Variable table generation.
//     Now we just dive through the syntax tree, find everything that binds a value, and install a variable for it.

      variables_for             = function (tree, environment) {
                                    var names = [], values = [], seen = {};

                                    for (var k in environment) if (own.call(environment, k)) names.push(k), values.push(serialize_ref(environment[k], k, seen));
                                    tree.reach(function (n) {if (n && n.binds_a_value) names.push(n.data), values.push(serialize_ref(n.value, n.data, seen))});

                                    for (var vars = [], i = 0, l = names.length; i < l; ++i) vars.push(closure_variable_template.replace({_var: names[i], _value: values[i]}));
                                    return names.length ? new caterwaul_global.syntax(';', vars) : closure_null_template},

//     Closure state generation.
//     This is where it all comes together. Given an original function, we construct a replacement function that has been marked by caterwaul as being precompiled.

      precompiled_closure       = function (tree, environment) {return closure_template.replace({_vars: variables_for(tree, environment), _value: tree})},
      precompiled_function      = function (tree, environment) {return signal_already_compiled(precompiled_closure(tree, environment))},

//   Substitution.
//   Once the reference table is fully populated, we perform a final macroexpansion pass against the initial source tree. This time, rather than annotating functions, we replace them with their
//   precompiled versions. The substitute_precompiled() function returns a closure that expects to be used as a macroexpander whose pattern is gensym_detection_pattern.

    substitute_precompiled      = function (references) {return function (args_or_gensym, gensym_or_body, body) {
                                    var ref = references[args_or_gensym.data] || references[gensym_or_body.data];
                                    return ref && ref.compiled && precompiled_function(ref.compiled, ref.environment)}},

    perform_substitution        = function (references, tree) {var expander = substitute_precompiled(references);
                                                               return macro_expand_naive(tree, [trivial_gensym_detection_pattern, nontrivial_gensym_detection_pattern],
                                                                                               [expander,                         expander], null)},

//   Tracing.
//   This is where we build the references hash. To do this, we first annotate the functions, build a traced caterwaul, and then run the function that we want to precompile. The traced caterwaul
//   builds references for us. Because compile() is registered as a method, clones will inherit it automatically.

//   Note that I'm assigning an extra property into references. It doesn't matter because no gensym will ever collide with it and we never enumerate the properties.

    annotated_caterwaul         = function (caterwaul, references) {return caterwaul.clone().field('compile', wrapped_compile(caterwaul.compile, references))},
    trace_execution             = function (caterwaul, f) {var references = {}, annotated = references.annotated = annotate_functions_in(caterwaul_global.parse(f), references);
                                                           caterwaul.compile(annotated, {caterwaul: annotated_caterwaul(caterwaul, references)})();
                                                           return references};

    return function (f) {var references = trace_execution(this, f); return this.compile(perform_substitution(references, references.annotated))}})());
// Generated by SDoc 





// Composition behavior.
// New in 0.6.4 is the ability to compose caterwaul functions. This allows you to write distinct macroexpanders that might not be idempotent (as is the case for the Figment translator, for
// example: http://github.com/spencertipping/figment). Composition is achieved by invoking after(), which governs the behavior of the macroexpand() function. The list of functions to be invoked
// after a caterwaul function can be inspected by invoking after() with no arguments.

// | var f = caterwaul.clone(), g = caterwaul.clone();
//   f.after(g);           // Causes g to be run on f's output; that is, g is an after-effect of f.
//   f.after(h);           // Adds another after function, to be run after all of the others.
//   f.after();            // -> [g, h]

// The design for this feature is different in 0.6.5. The problem with the original design, in which after() returned a clone of the original function, was that you couldn't set up
// after-composition from within a configuration (since, reasonably enough, configuration is closed over the caterwaul instance).

// There is deliberately no before() method. The reason for this is that when you define a macro on a caterwaul function, it should take precedence over all other macros that get run. Obviously
// this doesn't happen for g if g comes after f, but generally that relationship is obvious from the setup code (which it might not be if a before() method could be invoked by configurations).

  caterwaul_global.shallow('after_functions', []).
                    method('after', function () {if (arguments.length) {for (var i = 0, l = arguments.length; i < l; ++i) this.after_functions.push(arguments[i]); return this}
                                                 else                  return this.after_functions});
// Generated by SDoc 






// Init method.
// This is the main entry point of caterwaul when you use it as a function. As of version 0.6.4, the init() property is polymorphic in semantics as well as structure. There are two cases:

// | 1. You invoke caterwaul on a syntax node. In this case only macroexpansion is performed.
//   2. You invoke caterwaul on anything else. In this case the object is decompiled, macroexpanded, and then compiled.

// This pattern is then closed under intent; that is, caterwaul functions compose both in the context of function -> function compilers (though composition here isn't advisable), and in the
// context of tree -> tree compilers (macroexpansion). Having such an arrangement is important for before() and after() to work properly.

  caterwaul_global.method('init_not_precompiled', function (f, environment) {
                                                    var result = f.constructor === this.syntax ? this.macroexpand(f) : this.compile(this(this.decompile(f)), environment);
                                                    if (f.constructor === this.syntax) for (var i = 0, l = this.after_functions.length; i < l; ++i) result = this.after_functions[i](result);
                                                    return result}).

                   method('init',                 function (f, environment) {return this.is_precompiled(f) || this.init_not_precompiled(f, environment)});
// Generated by SDoc 




  return caterwaul_global});
// Generated by SDoc 





caterwaul.configuration('std.qs',(function (qs_template,qse_template,literal_template,gensym_2_gmjt2wvy_7xdxur){return function (gensym_2_gmjt2wvy_7xdxus){this.macro(qs_template,function (tree,gensym_2_gmjt2wvy_7xdxut){return new this.ref(tree)}).macro(qse_template,function (tree,gensym_2_gmjt2wvy_7xdxuu){return new this.ref(this.macroexpand(tree))}).macro(literal_template,function (tree,gensym_2_gmjt2wvy_7xdxuv){return tree})}})(caterwaul.parse('qs[_]'),caterwaul.parse('qse[_]'),caterwaul.parse('literal[_]'))).tconfiguration('std.qs','std.qg',caterwaul.precompiled_internal((function (){var gensym_2_gmjt2wvy_7xdxvi=caterwaul.parse('qg[_]');
return (function (gensym_2_gmjt2wvy_7xdxuw){this.rmacro(gensym_2_gmjt2wvy_7xdxvi,function (expression,gensym_2_gmjt2wvy_7xdxux){return expression.as('(')})})})())).tconfiguration('std.qs std.qg','std.fn',caterwaul.precompiled_internal((function (){var gensym_2_gmjt2wvy_7xdxvk=caterwaul.parse('fn[_][_]');
var gensym_2_gmjt2wvy_7xdxvl=caterwaul.parse('qg[function (vars,gensym_2_gmjt2wvy_7xdxv0){return expression}]');
var gensym_2_gmjt2wvy_7xdxvm=caterwaul.parse('fn_[_]');
var gensym_2_gmjt2wvy_7xdxvn=caterwaul.parse('qg[function (gensym_2_gmjt2wvy_7xdxv2){return expression}]');
var gensym_2_gmjt2wvy_7xdxvo=caterwaul.parse('fb[_][_]');
var gensym_2_gmjt2wvy_7xdxvp=caterwaul.parse('fn[_t][fn_[fn[vars][e].apply(_t,arguments)]](this)');
var gensym_2_gmjt2wvy_7xdxvq=caterwaul.parse('fb_[_]');
var gensym_2_gmjt2wvy_7xdxvr=caterwaul.parse('fn[_t][fn_[fn_[e].apply(_t,arguments)]](this)');
var gensym_2_gmjt2wvy_7xdxvs=caterwaul.parse('fc[_][_]');
var gensym_2_gmjt2wvy_7xdxvt=caterwaul.parse('(fn[vars][body,undefined])');
var gensym_2_gmjt2wvy_7xdxvu=caterwaul.parse('fc_[_]');
var gensym_2_gmjt2wvy_7xdxvv=caterwaul.parse('(fn[vars][body,undefined])');
return (function (gensym_2_gmjt2wvy_7xdxuy){this.configure('std.qg').rmacro(gensym_2_gmjt2wvy_7xdxvk,function (vars,expression,gensym_2_gmjt2wvy_7xdxuz){return gensym_2_gmjt2wvy_7xdxvl.replace({vars:vars,expression:expression})}).rmacro(gensym_2_gmjt2wvy_7xdxvm,function (expression,gensym_2_gmjt2wvy_7xdxv1){return gensym_2_gmjt2wvy_7xdxvn.replace({expression:expression})}).rmacro(gensym_2_gmjt2wvy_7xdxvo,function (vars,expression,gensym_2_gmjt2wvy_7xdxv3){return gensym_2_gmjt2wvy_7xdxvp.replace({_t:this.gensym(),vars:vars,e:expression})}).rmacro(gensym_2_gmjt2wvy_7xdxvq,function (expression,gensym_2_gmjt2wvy_7xdxv4){return gensym_2_gmjt2wvy_7xdxvr.replace({_t:this.gensym(),e:expression})}).rmacro(gensym_2_gmjt2wvy_7xdxvs,function (vars,body,gensym_2_gmjt2wvy_7xdxv5){return gensym_2_gmjt2wvy_7xdxvt.replace({vars:vars,body:body})}).rmacro(gensym_2_gmjt2wvy_7xdxvu,function (body,gensym_2_gmjt2wvy_7xdxv6){return gensym_2_gmjt2wvy_7xdxvv.replace({body:body})})})})())).tconfiguration('std.qs std.qg std.fn','std.obj',caterwaul.precompiled_internal((function (){var gensym_2_gmjt2wvy_7xdxvx=caterwaul.parse('_/mb/_');
var gensym_2_gmjt2wvy_7xdxvy=caterwaul.parse('((function (_o,gensym_2_gmjt2wvy_7xdxv0){return _o.m&&(function (gensym_2_gmjt2wvy_7xdxv2){return _o.m.apply(_o,arguments)})}))(o)');
var gensym_2_gmjt2wvy_7xdxvz=caterwaul.parse('_/mb[_]');
var gensym_2_gmjt2wvy_7xdxw0=caterwaul.parse('((function (_o,_m,gensym_2_gmjt2wvy_7xdxv0){return _o[_m]&&(function (gensym_2_gmjt2wvy_7xdxv2){return _o[_m].apply(_o,arguments)})}))(o,m)');
var gensym_2_gmjt2wvy_7xdxw1=caterwaul.parse('_/se._[_]');
var gensym_2_gmjt2wvy_7xdxw2=caterwaul.parse('((function (n,gensym_2_gmjt2wvy_7xdxv0){return b,n})).call(this,v)');
var gensym_2_gmjt2wvy_7xdxw3=caterwaul.parse('_/se[_]');
var gensym_2_gmjt2wvy_7xdxw4=caterwaul.parse('v/se._[b]');
var gensym_2_gmjt2wvy_7xdxw5=caterwaul.parse('_/re._[_]');
var gensym_2_gmjt2wvy_7xdxw6=caterwaul.parse('((function (n,gensym_2_gmjt2wvy_7xdxv0){return b})).call(this,v)');
var gensym_2_gmjt2wvy_7xdxw7=caterwaul.parse('_/re[_]');
var gensym_2_gmjt2wvy_7xdxw8=caterwaul.parse('v/re._[b]');
return (function (gensym_2_gmjt2wvy_7xdxv7){this.configure('std.qg std.fn').rmacro(gensym_2_gmjt2wvy_7xdxvx,(function (object,method,gensym_2_gmjt2wvy_7xdxv0){return gensym_2_gmjt2wvy_7xdxvy.replace({_o:this.gensym(),o:object,m:method})})).rmacro(gensym_2_gmjt2wvy_7xdxvz,(function (object,method,gensym_2_gmjt2wvy_7xdxv0){return gensym_2_gmjt2wvy_7xdxw0.replace({_o:this.gensym(),_m:this.gensym(),o:object,m:method})})).rmacro(gensym_2_gmjt2wvy_7xdxw1,(function (v,n,b,gensym_2_gmjt2wvy_7xdxv0){return gensym_2_gmjt2wvy_7xdxw2.replace({b:b,n:n,v:v})})).rmacro(gensym_2_gmjt2wvy_7xdxw3,(function (v,b,gensym_2_gmjt2wvy_7xdxv0){return gensym_2_gmjt2wvy_7xdxw4.replace({b:b,v:v})})).rmacro(gensym_2_gmjt2wvy_7xdxw5,(function (v,n,b,gensym_2_gmjt2wvy_7xdxv0){return gensym_2_gmjt2wvy_7xdxw6.replace({b:b,n:n,v:v})})).rmacro(gensym_2_gmjt2wvy_7xdxw7,(function (v,b,gensym_2_gmjt2wvy_7xdxv0){return gensym_2_gmjt2wvy_7xdxw8.replace({b:b,v:v})}))})})())).tconfiguration('std.qs std.qg std.fn','std.bind',caterwaul.precompiled_internal((function (){var let_in=caterwaul.parse('let[_] in _');
var let_brackets=caterwaul.parse('let[_][_]');
var lets_in=caterwaul.parse('let*[_] in _');
var lets_brackets=caterwaul.parse('let*[_][_]');
var gensym_2_gmjt2wvy_7xdxwd=caterwaul.parse('qg[function (gensym_2_gmjt2wvy_7xdxv9){var vars;\nreturn expression}].call(this)');
var gensym_2_gmjt2wvy_7xdxwf=caterwaul.parse('qg[function (vars,gensym_2_gmjt2wvy_7xdxva){return e}].call(this,values)');
var gensym_2_gmjt2wvy_7xdxwg=caterwaul.parse('l[_] in _');
var gensym_2_gmjt2wvy_7xdxwh=caterwaul.parse('l[_][_]');
var gensym_2_gmjt2wvy_7xdxwi=caterwaul.parse('_,where[_]');
var gensym_2_gmjt2wvy_7xdxwj=caterwaul.parse('l*[_] in _');
var gensym_2_gmjt2wvy_7xdxwk=caterwaul.parse('l*[_][_]');
var gensym_2_gmjt2wvy_7xdxwl=caterwaul.parse('_,where*[_]');
return (function (gensym_2_gmjt2wvy_7xdxv8){this.configure('std.qg');
var lf=(function (gensym_2_gmjt2wvy_7xdxwa,gensym_2_gmjt2wvy_7xdxv0){return (function (gensym_2_gmjt2wvy_7xdxv2){return (function (form,gensym_2_gmjt2wvy_7xdxv0){return this.rmacro(form,l_expander)}).apply(gensym_2_gmjt2wvy_7xdxwa,arguments)})})(this),lsf=(function (gensym_2_gmjt2wvy_7xdxwb,gensym_2_gmjt2wvy_7xdxv0){return (function (gensym_2_gmjt2wvy_7xdxv2){return (function (form,gensym_2_gmjt2wvy_7xdxv0){return this.rmacro(form,l_star_expander)}).apply(gensym_2_gmjt2wvy_7xdxwb,arguments)})})(this),l_star_expander=(function (gensym_2_gmjt2wvy_7xdxwc,gensym_2_gmjt2wvy_7xdxv0){return (function (gensym_2_gmjt2wvy_7xdxv2){return (function (vars,expression,gensym_2_gmjt2wvy_7xdxv0){return gensym_2_gmjt2wvy_7xdxwd.replace({vars:this.macroexpand(vars),expression:expression})}).apply(gensym_2_gmjt2wvy_7xdxwc,arguments)})})(this),l_expander=(function (gensym_2_gmjt2wvy_7xdxwe,gensym_2_gmjt2wvy_7xdxv0){return (function (gensym_2_gmjt2wvy_7xdxv2){return (function (vars,expression,gensym_2_gmjt2wvy_7xdxv0){return vars=this.macroexpand(vars).flatten(','),gensym_2_gmjt2wvy_7xdxwf.replace({vars:vars.map((function (n,gensym_2_gmjt2wvy_7xdxv0){return n[0]})).unflatten(),e:expression,values:vars.map((function (n,gensym_2_gmjt2wvy_7xdxv0){return n[1]})).unflatten()})}).apply(gensym_2_gmjt2wvy_7xdxwe,arguments)})})(this);
lf(gensym_2_gmjt2wvy_7xdxwg),lf(gensym_2_gmjt2wvy_7xdxwh),lf(let_in),lf(let_brackets).rmacro(gensym_2_gmjt2wvy_7xdxwi,(function (expression,vars,gensym_2_gmjt2wvy_7xdxv0){return l_expander(vars,expression)}));
lsf(gensym_2_gmjt2wvy_7xdxwj),lsf(gensym_2_gmjt2wvy_7xdxwk),lsf(lets_in),lsf(lets_brackets).rmacro(gensym_2_gmjt2wvy_7xdxwl,(function (expression,vars,gensym_2_gmjt2wvy_7xdxv0){return l_star_expander(vars,expression)}))})})()),{let_in:caterwaul.parse('let [_] in _'),let_brackets:caterwaul.parse('let [_][_]'),lets_in:caterwaul.parse('let*[_] in _'),lets_brackets:caterwaul.parse('let*[_][_]')}).tconfiguration('std.qs std.qg std.fn','std.lvalue',caterwaul.precompiled_internal((function (){var gensym_2_gmjt2wvy_7xdxwn=caterwaul.parse('_(_)=_');
var gensym_2_gmjt2wvy_7xdxwo=caterwaul.parse('base=qg[function (params,gensym_2_gmjt2wvy_7xdxvc){return value}]');
return (function (gensym_2_gmjt2wvy_7xdxvb){this.rmacro(gensym_2_gmjt2wvy_7xdxwn,(function (base,params,value,gensym_2_gmjt2wvy_7xdxv0){return gensym_2_gmjt2wvy_7xdxwo.replace({base:base,params:params,value:value})}))})})())).tconfiguration('std.qs std.qg std.fn','std.cond',caterwaul.precompiled_internal((function (){var gensym_2_gmjt2wvy_7xdxwq=caterwaul.parse('_,when[_]');
var gensym_2_gmjt2wvy_7xdxwr=caterwaul.parse('qg[l]&&qg[r]');
var gensym_2_gmjt2wvy_7xdxws=caterwaul.parse('_,unless[_]');
var gensym_2_gmjt2wvy_7xdxwt=caterwaul.parse(' !qg[l]&&qg[r]');
return (function (gensym_2_gmjt2wvy_7xdxvd){this.configure('std.qg').rmacro(gensym_2_gmjt2wvy_7xdxwq,(function (expr,cond,gensym_2_gmjt2wvy_7xdxv0){return gensym_2_gmjt2wvy_7xdxwr.replace({l:cond,r:expr})})).rmacro(gensym_2_gmjt2wvy_7xdxws,(function (expr,cond,gensym_2_gmjt2wvy_7xdxv0){return gensym_2_gmjt2wvy_7xdxwt.replace({l:cond,r:expr})}))})})())).tconfiguration('std.qs std.qg std.fn','std.ref',caterwaul.precompiled_internal((function (){var gensym_2_gmjt2wvy_7xdxwv=caterwaul.parse('caterwaul');
return (function (gensym_2_gmjt2wvy_7xdxve){this.macro(gensym_2_gmjt2wvy_7xdxwv,(function (gensym_2_gmjt2wvy_7xdxv2){return new this.ref(this)}))})})())).tconfiguration('std.qs std.fn std.bind','std.string',caterwaul.precompiled_internal((function (){var gensym_2_gmjt2wvy_7xdxwx=caterwaul.parse('_');
return (function (gensym_2_gmjt2wvy_7xdxvf){this.rmacro(gensym_2_gmjt2wvy_7xdxwx,(function (string,gensym_2_gmjt2wvy_7xdxv0){return string.is_string()&&/#\{[^\}]+\}/.test(string.data)&&(function (gensym_2_gmjt2wvy_7xdxv9){var q=string.data.charAt(0),s=string.as_escaped_string(),eq=new RegExp('\\\\'+q,'g'),strings=s.split(/#\{[^\}]+\}/),xs=[],result=new this.syntax('+');
return s.replace(/#\{([^\}]+)\}/g,(function (_,s,gensym_2_gmjt2wvy_7xdxv0){return xs.push(s),''})),this.util.map((function (gensym_2_gmjt2wvy_7xdxwy,gensym_2_gmjt2wvy_7xdxv0){return (function (gensym_2_gmjt2wvy_7xdxv2){return (function (x,i,gensym_2_gmjt2wvy_7xdxv0){return result.push(new this.syntax(q+(i<strings.length?strings[i]:'')+q)).push(new this.syntax('(',this.parse(xs[i].replace(eq,q))))}).apply(gensym_2_gmjt2wvy_7xdxwy,arguments)})})(this),xs),new this.syntax('(',result.push(new this.syntax(q+(xs.length<strings.length?strings[strings.length-1]:'')+q)).unflatten())}).call(this)}))})})())).configuration('std',function (gensym_2_gmjt2wvy_7xdxvg){this.configure('std.qs std.qg std.bind std.lvalue std.cond std.fn std.obj std.ref std.string')});





caterwaul.tconfiguration('std.qs std.fn std.bind','macro.defmacro',caterwaul.precompiled_internal((function (){var gensym_2_gmjt2n95_h3mubt=caterwaul.parse('defmacro[_][_]');
var gensym_2_gmjt2n95_h3mubu=caterwaul.parse('null');
var gensym_2_gmjt2n95_h3mubv=caterwaul.parse('defsubst[_][_]');
var gensym_2_gmjt2n95_h3mubw=caterwaul.parse('null');
return (function (gensym_2_gmjt2n95_h3mubo){(function (wildcard){return this.macro(gensym_2_gmjt2n95_h3mubt,(function (pattern,expansion){return this.rmacro(pattern,this.compile(this.macroexpand(expansion))),gensym_2_gmjt2n95_h3mubu})).macro(gensym_2_gmjt2n95_h3mubv,(function (pattern,expansion){return this.rmacro(pattern.rmap(wildcard),(function (wildcards){return (function (){return (function (hash,as){return this.util.map((function (v,i){return hash[v.data]=as[i]}),wildcards),expansion.replace(hash)}).call(this,{},arguments)})}).call(this,pattern.collect(wildcard))),gensym_2_gmjt2n95_h3mubw}))}).call(this,(function (n){return n.data.constructor===String&&n.data.charAt(0)==='_'&&'_'}))})})())).tconfiguration('std.qs std.fn std.bind','macro.with_gensyms',caterwaul.precompiled_internal((function (){var gensym_2_gmjt2n95_h3muby=caterwaul.parse('with_gensyms[_][_]');
var gensym_2_gmjt2n95_h3muc0=caterwaul.parse('qs[_]');
return (function (gensym_2_gmjt2n95_h3mubp){this.rmacro(gensym_2_gmjt2n95_h3muby,(function (vars,expansion){return (function (bindings){return vars.flatten(',').each((function (gensym_2_gmjt2n95_h3mubz){return (function (){return (function (v){return bindings[v.data]=this.gensym()}).apply(gensym_2_gmjt2n95_h3mubz,arguments)})})(this)),gensym_2_gmjt2n95_h3muc0.replace({_:expansion.replace(bindings)})}).call(this,{})}))})})())).tconfiguration('std.qs std.fn','macro.compile_eval',caterwaul.precompiled_internal((function (){var gensym_2_gmjt2n95_h3muc2=caterwaul.parse('compile_eval[_]');
var gensym_2_gmjt2n95_h3muc3=caterwaul.parse('fn_[_]');
return (function (gensym_2_gmjt2n95_h3mubq){this.macro(gensym_2_gmjt2n95_h3muc2,(function (e){return new this.ref(this.compile(this.macroexpand(gensym_2_gmjt2n95_h3muc3.replace({_:e}))).call(this))}))})})())).configuration('macro',function (gensym_2_gmjt2n95_h3mubr){this.configure('macro.defmacro macro.with_gensyms macro.compile_eval')});





caterwaul.tconfiguration('std macro','opt.unroll',caterwaul.precompiled_internal((function (){var gensym_2_gmjt2qnn_c7bgl9=caterwaul.parse('opt.unroll[_,_][_]');
var gensym_2_gmjt2qnn_c7bgle=caterwaul.parse('qg[function (gensym_2_gmjt2qnn_c7bgla,gensym_2_gmjt2qnn_c7bgl6){for (var gensym_2_gmjt2qnn_c7bglb=gensym_2_gmjt2qnn_c7bgla>=0&&gensym_2_gmjt2qnn_c7bgla>>3,gensym_2_gmjt2qnn_c7bglc=gensym_2_gmjt2qnn_c7bgla>=0&&gensym_2_gmjt2qnn_c7bgla&7,_i_=0;\n_i_<gensym_2_gmjt2qnn_c7bglc;\n ++_i_)_body_;\nfor (var gensym_2_gmjt2qnn_c7bgld=0;\ngensym_2_gmjt2qnn_c7bgld<gensym_2_gmjt2qnn_c7bglb;\n ++gensym_2_gmjt2qnn_c7bgld){_body_;\n_i_++;\n_body_;\n_i_++;\n_body_;\n_i_++;\n_body_;\n_i_++;\n_body_;\n_i_++;\n_body_;\n_i_++;\n_body_;\n_i_++;\n_body_;\n_i_++};\nreturn gensym_2_gmjt2qnn_c7bgla}].call(this,_iterations_)');
return (function (gensym_2_gmjt2qnn_c7bgl5){this.rmacro(gensym_2_gmjt2qnn_c7bgl9,(function (variable,iterations,body){return gensym_2_gmjt2qnn_c7bgle.replace({_i_:variable,_body_:body,_iterations_:iterations})}))})})()));
caterwaul.configuration('opt',function (gensym_2_gmjt2qnn_c7bgl7){this.configure('opt.unroll')});





caterwaul.configuration('continuation.core',function (gensym_2_gmjt2hw2_17qyp1){this.shallow('continuation',{})}).tconfiguration('std','continuation.unwind',caterwaul.precompiled_internal((function (){var gensym_2_gmjt2hw2_17qypb=caterwaul.parse('unwind_protect[_][_]');
var gensym_2_gmjt2hw2_17qype=caterwaul.parse('_f((function (gensym_2_gmjt2hw2_17qypc){return (function (){return (function (e){return _escape}).apply(gensym_2_gmjt2hw2_17qypc,arguments)})})(this),(function (gensym_2_gmjt2hw2_17qypd){return (function (){return (function (){return _body}).apply(gensym_2_gmjt2hw2_17qypd,arguments)})})(this))');
var gensym_2_gmjt2hw2_17qypf=caterwaul.parse('caterwaul.continuation.unwind_protect');
var gensym_2_gmjt2hw2_17qypg=caterwaul.parse('unwind[_]');
var gensym_2_gmjt2hw2_17qyph=caterwaul.parse('caterwaul.continuation.unwind(_e)');
return (function (gensym_2_gmjt2hw2_17qyp2){((function (_){return _.unwind_protect=function (escape,f,gensym_2_gmjt2hw2_17qyp3){try {return f()}catch (e){return escape(e)}},_.unwind=function (e,gensym_2_gmjt2hw2_17qyp4){throw e},_})).call(this,this.configure('std.fn continuation.core').continuation);
this.rmacro(gensym_2_gmjt2hw2_17qypb,(function (escape,body){return gensym_2_gmjt2hw2_17qype.replace({_f:gensym_2_gmjt2hw2_17qypf,_escape:escape,_body:body})})).rmacro(gensym_2_gmjt2hw2_17qypg,(function (e){return gensym_2_gmjt2hw2_17qyph.replace({_e:e})}))})})())).tconfiguration('std','continuation.cps',caterwaul.precompiled_internal((function (){var gensym_2_gmjt2hw2_17qypj=caterwaul.parse('(function (_){return _f}).call(this,_c)');
var gensym_2_gmjt2hw2_17qypk=caterwaul.clone('std.qs std.qg std.bind std.lvalue std.cond std.fn std.obj std.ref std.string std');
var gensym_2_gmjt2hw2_17qypl=caterwaul.parse('_f[_v][_b]');
var gensym_2_gmjt2hw2_17qypm=caterwaul.parse('fb');
var gensym_2_gmjt2hw2_17qypn=caterwaul.parse('fn');
var gensym_2_gmjt2hw2_17qypp=caterwaul.parse('l/_form[_,_< -_] in _');
var gensym_2_gmjt2hw2_17qypq=gensym_2_gmjt2hw2_17qypk;
var gensym_2_gmjt2hw2_17qypr=caterwaul.parse('l/_form[_< -_] in _');
var gensym_2_gmjt2hw2_17qyps=gensym_2_gmjt2hw2_17qypk;
var gensym_2_gmjt2hw2_17qypt=caterwaul.parse('l/_form[_,_< -_][_]');
var gensym_2_gmjt2hw2_17qypu=gensym_2_gmjt2hw2_17qypk;
var gensym_2_gmjt2hw2_17qypv=caterwaul.parse('l/_form[_< -_][_]');
var gensym_2_gmjt2hw2_17qypw=gensym_2_gmjt2hw2_17qypk;
var gensym_2_gmjt2hw2_17qypo=caterwaul.parse('l/cps[cs][_f]');
var gensym_2_gmjt2hw2_17qypx=caterwaul.parse('_/_form[_]');
var gensym_2_gmjt2hw2_17qypy=caterwaul.parse('_f/_form._[_b]');
var gensym_2_gmjt2hw2_17qypz=caterwaul.parse('_/_form._[_]');
var gensym_2_gmjt2hw2_17qyq0=caterwaul.parse('(function (_){return _f}).call(this,_c)');
var gensym_2_gmjt2hw2_17qyq1=gensym_2_gmjt2hw2_17qypk;
var gensym_2_gmjt2hw2_17qyq2=caterwaul.parse('_f[_v][_b]');
var gensym_2_gmjt2hw2_17qyq3=caterwaul.parse('fb');
var gensym_2_gmjt2hw2_17qyq4=caterwaul.parse('fn');
var gensym_2_gmjt2hw2_17qyq5=caterwaul.parse('cps');
var gensym_2_gmjt2hw2_17qyq6=caterwaul.parse('cpb');
var gensym_2_gmjt2hw2_17qyq7=caterwaul.parse('cps');
var gensym_2_gmjt2hw2_17qyq8=caterwaul.parse('cpb');
return (function (gensym_2_gmjt2hw2_17qyp5){(function (){var cps_convert=(function (v,f,b,bound){return gensym_2_gmjt2hw2_17qypj.replace({_c:gensym_2_gmjt2hw2_17qypk.macroexpand(gensym_2_gmjt2hw2_17qypl.replace({_f:bound?gensym_2_gmjt2hw2_17qypm:gensym_2_gmjt2hw2_17qypn})).replace({_v:v.as('(')[0],_b:b}),_f:f})}),l_cps_def=(function (t,form,bound){return (function (inductive,base){return t.rmacro(gensym_2_gmjt2hw2_17qypp.replace({_form:form}),inductive).rmacro(gensym_2_gmjt2hw2_17qypq.parse(('let/'+(form.serialize())+'[_, _ <- _] in _')),inductive).rmacro(gensym_2_gmjt2hw2_17qypr.replace({_form:form}),base).rmacro(gensym_2_gmjt2hw2_17qyps.parse(('let/'+(form.serialize())+'[   _ <- _] in _')),base).rmacro(gensym_2_gmjt2hw2_17qypt.replace({_form:form}),inductive).rmacro(gensym_2_gmjt2hw2_17qypu.parse(('let/'+(form.serialize())+'[_, _ <- _][_]')),inductive).rmacro(gensym_2_gmjt2hw2_17qypv.replace({_form:form}),base).rmacro(gensym_2_gmjt2hw2_17qypw.parse(('let/'+(form.serialize())+'[   _ <- _][_]')),base)}).call(this,(function (cs,v,f,b){return gensym_2_gmjt2hw2_17qypo.replace({cs:cs,_f:cps_convert(v,f,b,bound)})}),(function (v,f,b){return cps_convert(v,f,b,bound)}))}),cps_def=(function (t,form,bound){return t.rmacro(gensym_2_gmjt2hw2_17qypx.replace({_form:form}),(function (f,b){return gensym_2_gmjt2hw2_17qypy.replace({_form:form,_f:f,_b:b})})).rmacro(gensym_2_gmjt2hw2_17qypz.replace({_form:form}),(function (f,v,b){return gensym_2_gmjt2hw2_17qyq0.replace({_c:gensym_2_gmjt2hw2_17qyq1.macroexpand(gensym_2_gmjt2hw2_17qyq2.replace({_f:bound?gensym_2_gmjt2hw2_17qyq3:gensym_2_gmjt2hw2_17qyq4})).replace({_v:v,_b:b}),_f:f})}))});
return ((function (_){return cps_def(_,gensym_2_gmjt2hw2_17qyq5,false),cps_def(_,gensym_2_gmjt2hw2_17qyq6,true),l_cps_def(_,gensym_2_gmjt2hw2_17qyq7,false),l_cps_def(_,gensym_2_gmjt2hw2_17qyq8,true),_})).call(this,this.configure('std.fn continuation.core'))}).call(this)})})())).tconfiguration('std','continuation.delimited',caterwaul.precompiled_internal((function (){var gensym_2_gmjt2hw2_17qyqa=caterwaul.parse('call/cc[_]');
var gensym_2_gmjt2hw2_17qyqb=caterwaul.parse('qg[caterwaul.continuation.call_cc.call(this,_f)]');
var gensym_2_gmjt2hw2_17qyqc=caterwaul.parse('call/tail[_(_)]');
var gensym_2_gmjt2hw2_17qyqd=caterwaul.parse('qg[caterwaul.continuation.call_tail.call(_f,_args)]');
return (function (gensym_2_gmjt2hw2_17qyp6){(function (magic){return ((function (_){return _.call_cc=function (f,gensym_2_gmjt2hw2_17qyp7){var escaped=false,cc=function (x,gensym_2_gmjt2hw2_17qyp8){escaped=true;
throw x},frame={magic:magic,continuation:f,parameters:[cc]};
try {while ((frame=frame.continuation.apply(this,frame.parameters))&&frame&&frame.magic===magic);
return frame}catch (e){if (escaped)return e;
else throw e}},_.call_tail=(function (){return {magic:magic,continuation:this,parameters:arguments}}),_})).call(this,this.continuation)}).call(this,this.configure('std.qg continuation.core').continuation.magic=this.magic('continuation.delimited'));
this.rmacro(gensym_2_gmjt2hw2_17qyqa,(function (f){return gensym_2_gmjt2hw2_17qyqb.replace({_f:f})})).rmacro(gensym_2_gmjt2hw2_17qyqc,(function (f,args){return gensym_2_gmjt2hw2_17qyqd.replace({_f:f,_args:args})}))})})())).configuration('continuation',function (gensym_2_gmjt2hw2_17qyp9){this.configure('continuation.core continuation.unwind continuation.cps continuation.delimited')});





caterwaul.tconfiguration('std','seq.core',caterwaul.precompiled_internal((function (){null;
return (function (gensym_2_gmjt2ug2_eud8ut){this.shallow('seq',{core:((function (_){return _.prototype=((function (p){return p.constructor=_,p})).call(this,[]),_})).call(this,(function (){return null}))})})})())).tconfiguration('std opt continuation','seq.finite.core',caterwaul.precompiled_internal((function (){null;
return (function (gensym_2_gmjt2ug2_eud8uu){this.configure('seq.core').seq.finite=((function (c){return c.prototype=((function (_){return _.size=(function (){return this.l||this.length}),_.slice=(function (){return ((function (_){return (function (gensym_2_gmjt2ug2_eud8pi){for (var gensym_2_gmjt2ug2_eud8pj=gensym_2_gmjt2ug2_eud8pi>=0&&gensym_2_gmjt2ug2_eud8pi>>3,gensym_2_gmjt2ug2_eud8pk=gensym_2_gmjt2ug2_eud8pi>=0&&gensym_2_gmjt2ug2_eud8pi&7,i=0;
i<gensym_2_gmjt2ug2_eud8pk;
 ++i)_.push(this[i]);
for (var gensym_2_gmjt2ug2_eud8pl=0;
gensym_2_gmjt2ug2_eud8pl<gensym_2_gmjt2ug2_eud8pj;
 ++gensym_2_gmjt2ug2_eud8pl){_.push(this[i]);
i++;
_.push(this[i]);
i++;
_.push(this[i]);
i++;
_.push(this[i]);
i++;
_.push(this[i]);
i++;
_.push(this[i]);
i++;
_.push(this[i]);
i++;
_.push(this[i]);
i++};
return gensym_2_gmjt2ug2_eud8pi}).call(this,this.size()),_})).call(this,[])}),_.constructor=c,_})).call(this,new this.seq.core()),c})).call(this,((function (xs){return this.length=this.l=xs?(function (gensym_2_gmjt2ug2_eud8pi){for (var gensym_2_gmjt2ug2_eud8pj=gensym_2_gmjt2ug2_eud8pi>=0&&gensym_2_gmjt2ug2_eud8pi>>3,gensym_2_gmjt2ug2_eud8pk=gensym_2_gmjt2ug2_eud8pi>=0&&gensym_2_gmjt2ug2_eud8pi&7,i=0;
i<gensym_2_gmjt2ug2_eud8pk;
 ++i)this[i]=xs[i];
for (var gensym_2_gmjt2ug2_eud8pl=0;
gensym_2_gmjt2ug2_eud8pl<gensym_2_gmjt2ug2_eud8pj;
 ++gensym_2_gmjt2ug2_eud8pl){this[i]=xs[i];
i++;
this[i]=xs[i];
i++;
this[i]=xs[i];
i++;
this[i]=xs[i];
i++;
this[i]=xs[i];
i++;
this[i]=xs[i];
i++;
this[i]=xs[i];
i++;
this[i]=xs[i];
i++};
return gensym_2_gmjt2ug2_eud8pi}).call(this,xs.size?xs.size():xs.length):0,undefined})))})})())).tconfiguration('std opt continuation','seq.finite.serialization',caterwaul.precompiled_internal((function (){null;
return (function (gensym_2_gmjt2ug2_eud8uv){((function (_){return _.toString=(function (){return ('seq['+(this.slice().join(", "))+']')}),_.join=(function (x){return this.slice().join(x)}),_})).call(this,this.configure('seq.finite.core').seq.finite.prototype)})})())).tconfiguration('std opt continuation','seq.finite.mutability',caterwaul.precompiled_internal((function (){null;
return (function (gensym_2_gmjt2ug2_eud8uw){(function (push,slice){return ((function (_){return _.push=(function (){return (function (as){return ((function (_){return this.length=this.l,this})).call(this,(function (gensym_2_gmjt2ug2_eud8pi){for (var gensym_2_gmjt2ug2_eud8pj=gensym_2_gmjt2ug2_eud8pi>=0&&gensym_2_gmjt2ug2_eud8pi>>3,gensym_2_gmjt2ug2_eud8pk=gensym_2_gmjt2ug2_eud8pi>=0&&gensym_2_gmjt2ug2_eud8pi&7,i=0;
i<gensym_2_gmjt2ug2_eud8pk;
 ++i)this[this.l++]=as[i];
for (var gensym_2_gmjt2ug2_eud8pl=0;
gensym_2_gmjt2ug2_eud8pl<gensym_2_gmjt2ug2_eud8pj;
 ++gensym_2_gmjt2ug2_eud8pl){this[this.l++]=as[i];
i++;
this[this.l++]=as[i];
i++;
this[this.l++]=as[i];
i++;
this[this.l++]=as[i];
i++;
this[this.l++]=as[i];
i++;
this[this.l++]=as[i];
i++;
this[this.l++]=as[i];
i++;
this[this.l++]=as[i];
i++};
return gensym_2_gmjt2ug2_eud8pi}).call(this,as.length))}).call(this,arguments)}),_.pop=(function (){return ((function (_){return delete this[this.length=this.l],_})).call(this,this[ --this.l])}),_.concat=(function (xs){return ((function (_){return _.push.apply(_,slice.call(xs)),_})).call(this,new this.constructor(this))}),_})).call(this,this.configure('seq.finite.core').seq.finite.prototype)}).call(this,Array.prototype.push,Array.prototype.slice)})})())).tconfiguration('std opt continuation','seq.finite.object',caterwaul.precompiled_internal((function (){null;
return (function (gensym_2_gmjt2ug2_eud8ux){(function (own){return ((function (_){return _.keys=(function (o,all){return ((function (_){return (function (gensym_2_gmjt2ug2_eud8uy){for (var k in o)if (all||own.call(o,k))_.push(k)})(),_})).call(this,new _())}),_.values=(function (o,all){return ((function (_){return (function (gensym_2_gmjt2ug2_eud8uz){for (var k in o)if (all||own.call(o,k))_.push(o[k])})(),_})).call(this,new _())}),_.pairs=(function (o,all){return ((function (_){return (function (gensym_2_gmjt2ug2_eud8v0){for (var k in o)if (all||own.call(o,k))_.push([k,o[k]])})(),_})).call(this,new _())}),_.prototype.object=(function (o){return ((function (_){return this.each((function (p){return _[p[0]]=p[1]})),_})).call(this,(o||{}))}),_})).call(this,this.configure('seq.finite.core').seq.finite)}).call(this,Object.prototype.hasOwnProperty)})})())).tconfiguration('std opt continuation','seq.finite.traversal',caterwaul.precompiled_internal((function (){null;
return (function (gensym_2_gmjt2ug2_eud8v1){((function (_){return _.map=(function (f){return ((function (_){return (function (gensym_2_gmjt2ug2_eud8pi){for (var gensym_2_gmjt2ug2_eud8pj=gensym_2_gmjt2ug2_eud8pi>=0&&gensym_2_gmjt2ug2_eud8pi>>3,gensym_2_gmjt2ug2_eud8pk=gensym_2_gmjt2ug2_eud8pi>=0&&gensym_2_gmjt2ug2_eud8pi&7,i=0;
i<gensym_2_gmjt2ug2_eud8pk;
 ++i)_.push(f.call(this,this[i],i));
for (var gensym_2_gmjt2ug2_eud8pl=0;
gensym_2_gmjt2ug2_eud8pl<gensym_2_gmjt2ug2_eud8pj;
 ++gensym_2_gmjt2ug2_eud8pl){_.push(f.call(this,this[i],i));
i++;
_.push(f.call(this,this[i],i));
i++;
_.push(f.call(this,this[i],i));
i++;
_.push(f.call(this,this[i],i));
i++;
_.push(f.call(this,this[i],i));
i++;
_.push(f.call(this,this[i],i));
i++;
_.push(f.call(this,this[i],i));
i++;
_.push(f.call(this,this[i],i));
i++};
return gensym_2_gmjt2ug2_eud8pi}).call(this,this.l),_})).call(this,new this.constructor())}),_.filter=(function (f){return ((function (_){return (function (gensym_2_gmjt2ug2_eud8pi){for (var gensym_2_gmjt2ug2_eud8pj=gensym_2_gmjt2ug2_eud8pi>=0&&gensym_2_gmjt2ug2_eud8pi>>3,gensym_2_gmjt2ug2_eud8pk=gensym_2_gmjt2ug2_eud8pi>=0&&gensym_2_gmjt2ug2_eud8pi&7,i=0;
i<gensym_2_gmjt2ug2_eud8pk;
 ++i)(f.call(this,this[i],i))&&(_.push(this[i]));
for (var gensym_2_gmjt2ug2_eud8pl=0;
gensym_2_gmjt2ug2_eud8pl<gensym_2_gmjt2ug2_eud8pj;
 ++gensym_2_gmjt2ug2_eud8pl){(f.call(this,this[i],i))&&(_.push(this[i]));
i++;
(f.call(this,this[i],i))&&(_.push(this[i]));
i++;
(f.call(this,this[i],i))&&(_.push(this[i]));
i++;
(f.call(this,this[i],i))&&(_.push(this[i]));
i++;
(f.call(this,this[i],i))&&(_.push(this[i]));
i++;
(f.call(this,this[i],i))&&(_.push(this[i]));
i++;
(f.call(this,this[i],i))&&(_.push(this[i]));
i++;
(f.call(this,this[i],i))&&(_.push(this[i]));
i++};
return gensym_2_gmjt2ug2_eud8pi}).call(this,this.l),_})).call(this,new this.constructor())}),_.each=(function (f){return ((function (_){return (function (gensym_2_gmjt2ug2_eud8pi){for (var gensym_2_gmjt2ug2_eud8pj=gensym_2_gmjt2ug2_eud8pi>=0&&gensym_2_gmjt2ug2_eud8pi>>3,gensym_2_gmjt2ug2_eud8pk=gensym_2_gmjt2ug2_eud8pi>=0&&gensym_2_gmjt2ug2_eud8pi&7,i=0;
i<gensym_2_gmjt2ug2_eud8pk;
 ++i)f.call(_,_[i],i);
for (var gensym_2_gmjt2ug2_eud8pl=0;
gensym_2_gmjt2ug2_eud8pl<gensym_2_gmjt2ug2_eud8pj;
 ++gensym_2_gmjt2ug2_eud8pl){f.call(_,_[i],i);
i++;
f.call(_,_[i],i);
i++;
f.call(_,_[i],i);
i++;
f.call(_,_[i],i);
i++;
f.call(_,_[i],i);
i++;
f.call(_,_[i],i);
i++;
f.call(_,_[i],i);
i++;
f.call(_,_[i],i);
i++};
return gensym_2_gmjt2ug2_eud8pi}).call(this,_.l),_})).call(this,this)}),_.reversed=(function (){return ((function (_){return (function (l){return (function (gensym_2_gmjt2ug2_eud8pi){for (var gensym_2_gmjt2ug2_eud8pj=gensym_2_gmjt2ug2_eud8pi>=0&&gensym_2_gmjt2ug2_eud8pi>>3,gensym_2_gmjt2ug2_eud8pk=gensym_2_gmjt2ug2_eud8pi>=0&&gensym_2_gmjt2ug2_eud8pi&7,i=0;
i<gensym_2_gmjt2ug2_eud8pk;
 ++i)_.push(this[l-i-1]);
for (var gensym_2_gmjt2ug2_eud8pl=0;
gensym_2_gmjt2ug2_eud8pl<gensym_2_gmjt2ug2_eud8pj;
 ++gensym_2_gmjt2ug2_eud8pl){_.push(this[l-i-1]);
i++;
_.push(this[l-i-1]);
i++;
_.push(this[l-i-1]);
i++;
_.push(this[l-i-1]);
i++;
_.push(this[l-i-1]);
i++;
_.push(this[l-i-1]);
i++;
_.push(this[l-i-1]);
i++;
_.push(this[l-i-1]);
i++};
return gensym_2_gmjt2ug2_eud8pi}).call(this,l)}).call(this,this.l),_})).call(this,new this.constructor())}),_.flat_map=(function (f){return ((function (_){return this.each((function (x,xi){return (((function (xs){return xs.each?xs:new this.constructor(xs)})).call(this,f.call(this,x,xi))).each((function (x){return _.push(x)}))})),_})).call(this,new this.constructor())}),_.foldl=(function (f,x){return (function (x,xi){return (this.l>=xi)&&((function (gensym_2_gmjt2ug2_eud8pi){for (var gensym_2_gmjt2ug2_eud8pj=gensym_2_gmjt2ug2_eud8pi>=0&&gensym_2_gmjt2ug2_eud8pi>>3,gensym_2_gmjt2ug2_eud8pk=gensym_2_gmjt2ug2_eud8pi>=0&&gensym_2_gmjt2ug2_eud8pi&7,i=0;
i<gensym_2_gmjt2ug2_eud8pk;
 ++i)x=f.call(this,x,this[i+xi],i+xi);
for (var gensym_2_gmjt2ug2_eud8pl=0;
gensym_2_gmjt2ug2_eud8pl<gensym_2_gmjt2ug2_eud8pj;
 ++gensym_2_gmjt2ug2_eud8pl){x=f.call(this,x,this[i+xi],i+xi);
i++;
x=f.call(this,x,this[i+xi],i+xi);
i++;
x=f.call(this,x,this[i+xi],i+xi);
i++;
x=f.call(this,x,this[i+xi],i+xi);
i++;
x=f.call(this,x,this[i+xi],i+xi);
i++;
x=f.call(this,x,this[i+xi],i+xi);
i++;
x=f.call(this,x,this[i+xi],i+xi);
i++;
x=f.call(this,x,this[i+xi],i+xi);
i++};
return gensym_2_gmjt2ug2_eud8pi}).call(this,this.l-xi),x)}).call(this,arguments.length>1?x:this[0],2-arguments.length)}),_.foldr=(function (f,x){return (function (x,xi,l){return (l>=xi-1)&&((function (gensym_2_gmjt2ug2_eud8pi){for (var gensym_2_gmjt2ug2_eud8pj=gensym_2_gmjt2ug2_eud8pi>=0&&gensym_2_gmjt2ug2_eud8pi>>3,gensym_2_gmjt2ug2_eud8pk=gensym_2_gmjt2ug2_eud8pi>=0&&gensym_2_gmjt2ug2_eud8pi&7,i=0;
i<gensym_2_gmjt2ug2_eud8pk;
 ++i)x=f.call(this,this[l-(i+xi)],x,l-(i+xi));
for (var gensym_2_gmjt2ug2_eud8pl=0;
gensym_2_gmjt2ug2_eud8pl<gensym_2_gmjt2ug2_eud8pj;
 ++gensym_2_gmjt2ug2_eud8pl){x=f.call(this,this[l-(i+xi)],x,l-(i+xi));
i++;
x=f.call(this,this[l-(i+xi)],x,l-(i+xi));
i++;
x=f.call(this,this[l-(i+xi)],x,l-(i+xi));
i++;
x=f.call(this,this[l-(i+xi)],x,l-(i+xi));
i++;
x=f.call(this,this[l-(i+xi)],x,l-(i+xi));
i++;
x=f.call(this,this[l-(i+xi)],x,l-(i+xi));
i++;
x=f.call(this,this[l-(i+xi)],x,l-(i+xi));
i++;
x=f.call(this,this[l-(i+xi)],x,l-(i+xi));
i++};
return gensym_2_gmjt2ug2_eud8pi}).call(this,l-(xi-1)),x)}).call(this,arguments.length>1?x:this[this.l-1],3-arguments.length,this.l)}),_})).call(this,this.configure('seq.finite.core seq.finite.mutability').seq.finite.prototype)})})())).tconfiguration('std opt continuation','seq.finite.zip',caterwaul.precompiled_internal((function (){var gensym_2_gmjt2ug2_eud8vi=caterwaul.clone('std.qs std.qg std.bind std.lvalue std.cond std.fn std.obj std.ref std.string std opt.unroll opt continuation.core continuation.unwind continuation.cps continuation.delimited continuation');
return (function (gensym_2_gmjt2ug2_eud8v2){((function (_){return (function (seq,slice){return _.prototype.zip=(function (){return (function (as,options){return (as[as.size()-1].constructor===Object)&&(gensym_2_gmjt2ug2_eud8vi.util.merge(options,as.pop())),(function (l,f){return ((function (_){return (function (gensym_2_gmjt2ug2_eud8pi){for (var gensym_2_gmjt2ug2_eud8pj=gensym_2_gmjt2ug2_eud8pi>=0&&gensym_2_gmjt2ug2_eud8pi>>3,gensym_2_gmjt2ug2_eud8pk=gensym_2_gmjt2ug2_eud8pi>=0&&gensym_2_gmjt2ug2_eud8pi&7,i=0;
i<gensym_2_gmjt2ug2_eud8pk;
 ++i)_.push(f.apply({i:i},as.map((function (x){return x[i]})).slice()));
for (var gensym_2_gmjt2ug2_eud8pl=0;
gensym_2_gmjt2ug2_eud8pl<gensym_2_gmjt2ug2_eud8pj;
 ++gensym_2_gmjt2ug2_eud8pl){_.push(f.apply({i:i},as.map((function (x){return x[i]})).slice()));
i++;
_.push(f.apply({i:i},as.map((function (x){return x[i]})).slice()));
i++;
_.push(f.apply({i:i},as.map((function (x){return x[i]})).slice()));
i++;
_.push(f.apply({i:i},as.map((function (x){return x[i]})).slice()));
i++;
_.push(f.apply({i:i},as.map((function (x){return x[i]})).slice()));
i++;
_.push(f.apply({i:i},as.map((function (x){return x[i]})).slice()));
i++;
_.push(f.apply({i:i},as.map((function (x){return x[i]})).slice()));
i++;
_.push(f.apply({i:i},as.map((function (x){return x[i]})).slice()));
i++};
return gensym_2_gmjt2ug2_eud8pi}).call(this,l),_})).call(this,new this.constructor())}).call(this,as.map((function (x){return x.size?x.size():x.length})).foldl(options.outer?(function (x,y){return Math.max(x,y)}):(function (x,y){return Math.min(x,y)})),options.f)}).call(this,new seq([this].concat(slice.call(arguments))),{f:(function (){return new seq(arguments)}),outer:false})})}).call(this,_,Array.prototype.slice),_})).call(this,this.configure('seq.finite.traversal').seq.finite)})})())).tconfiguration('std opt continuation','seq.finite.quantification',caterwaul.precompiled_internal((function (){var gensym_2_gmjt2ug2_eud8vk=caterwaul.clone('std.qs std.qg std.bind std.lvalue std.cond std.fn std.obj std.ref std.string std opt.unroll opt continuation.core continuation.unwind continuation.cps continuation.delimited continuation');
return (function (gensym_2_gmjt2ug2_eud8v3){((function (_){return _.exists=(function (f){return (gensym_2_gmjt2ug2_eud8vk.continuation.call_cc.call(this,(function (gensym_2_gmjt2ug2_eud8vl){return (function (){return (function (cc){return (function (gensym_2_gmjt2ug2_eud8pi){for (var gensym_2_gmjt2ug2_eud8pj=gensym_2_gmjt2ug2_eud8pi>=0&&gensym_2_gmjt2ug2_eud8pi>>3,gensym_2_gmjt2ug2_eud8pk=gensym_2_gmjt2ug2_eud8pi>=0&&gensym_2_gmjt2ug2_eud8pi&7,i=0;
i<gensym_2_gmjt2ug2_eud8pk;
 ++i)((function (_){return _&&cc(_)})).call(this,f.call(this,this[i],i));
for (var gensym_2_gmjt2ug2_eud8pl=0;
gensym_2_gmjt2ug2_eud8pl<gensym_2_gmjt2ug2_eud8pj;
 ++gensym_2_gmjt2ug2_eud8pl){((function (_){return _&&cc(_)})).call(this,f.call(this,this[i],i));
i++;
((function (_){return _&&cc(_)})).call(this,f.call(this,this[i],i));
i++;
((function (_){return _&&cc(_)})).call(this,f.call(this,this[i],i));
i++;
((function (_){return _&&cc(_)})).call(this,f.call(this,this[i],i));
i++;
((function (_){return _&&cc(_)})).call(this,f.call(this,this[i],i));
i++;
((function (_){return _&&cc(_)})).call(this,f.call(this,this[i],i));
i++;
((function (_){return _&&cc(_)})).call(this,f.call(this,this[i],i));
i++;
((function (_){return _&&cc(_)})).call(this,f.call(this,this[i],i));
i++};
return gensym_2_gmjt2ug2_eud8pi}).call(this,this.l),false}).apply(gensym_2_gmjt2ug2_eud8vl,arguments)})})(this)))}),_.forall=(function (f){return  !this.exists((function (){return  !f.apply(this,arguments)}))}),_})).call(this,this.configure('seq.finite.core').seq.finite.prototype)})})())).tconfiguration('std opt continuation','seq.infinite.core',caterwaul.precompiled_internal((function (){null;
return (function (gensym_2_gmjt2ug2_eud8v4){this.configure('seq.core').seq.infinite=((function (_){return (function (i){return _.def=(function (name,ctor,h,t){return i[name]=((function (_){return _.prototype=((function (_){return _.h=h,_.t=t,_.constructor=ctor,_})).call(this,new i()),_})).call(this,ctor)})}).call(this,_),_.def('cons',(function (h,t){return this._h=h,this._t=t}),(function (){return this._h}),(function (){return this._t})),_.def('k',(function (x){return this._x=x}),(function (){return this._x}),(function (){return this})),_})).call(this,((function (_){return (function (ctor){return _.prototype=((function (_){return _.constructor=ctor,_})).call(this,new this.seq.core())}).call(this,_),_})).call(this,(function (){return null})))})})())).tconfiguration('std opt continuation','seq.infinite.y',caterwaul.precompiled_internal((function (){null;
return (function (gensym_2_gmjt2ug2_eud8v5){this.configure('seq.infinite.core').seq.infinite.def('y',((function (f,x){return this._f=f,this._x=x,undefined})),(function (){return this._x}),(function (){return new this.constructor(this._f,this._f(this._x))}))})})())).tconfiguration('std opt continuation','seq.infinite.transform',caterwaul.precompiled_internal((function (){var gensym_2_gmjt2ug2_eud8vp=caterwaul.clone('std.qs std.qg std.bind std.lvalue std.cond std.fn std.obj std.ref std.string std opt.unroll opt continuation.core continuation.unwind continuation.cps continuation.delimited continuation');
var gensym_2_gmjt2ug2_eud8vq=gensym_2_gmjt2ug2_eud8vp;
return (function (gensym_2_gmjt2ug2_eud8v6){((function (_){return _.prototype.map=(function (f){return new _.map(f,this)}),_.def('map',((function (f,xs){return this._f=f,this._xs=xs,undefined})),(function (){return this._f(this._xs.h())}),(function (){return new this.constructor(this._f,this._xs.t())})),_.prototype.filter=(function (f){return new _.filter(f,this)}),_.def('filter',((function (f,xs){return this._f=f,this._xs=(function (){var next=(function (s){return (function (cc){return f(s.h())?cc(s):(gensym_2_gmjt2ug2_eud8vp.continuation.call_tail.call(next(s.t()),cc))})});
return (gensym_2_gmjt2ug2_eud8vq.continuation.call_cc.call(this,next(xs)))}).call(this),undefined})),(function (){return this._xs.h()}),(function (){return new this.constructor(this._f,this._xs.t())})),_})).call(this,this.configure('seq.infinite.core').seq.infinite)})})())).tconfiguration('std opt continuation','seq.infinite.traversal',caterwaul.precompiled_internal((function (){var gensym_2_gmjt2ug2_eud8vs=caterwaul.clone('std.qs std.qg std.bind std.lvalue std.cond std.fn std.obj std.ref std.string std opt.unroll opt continuation.core continuation.unwind continuation.cps continuation.delimited continuation');
var gensym_2_gmjt2ug2_eud8vt=gensym_2_gmjt2ug2_eud8vs;
var gensym_2_gmjt2ug2_eud8vu=gensym_2_gmjt2ug2_eud8vs;
var gensym_2_gmjt2ug2_eud8vv=gensym_2_gmjt2ug2_eud8vs;
return (function (gensym_2_gmjt2ug2_eud8v7){(function (finite){return ((function (_){return _.drop=(function (f){return (function (){var next=(function (s){return (function (cc){return f(s.h())?(gensym_2_gmjt2ug2_eud8vs.continuation.call_tail.call(next(s.t()),cc)):cc(s)})});
return (gensym_2_gmjt2ug2_eud8vt.continuation.call_cc.call(this,next(this)))}).call(this)}),_.take=(function (f){return (function (){var xs=new finite(),next=(function (s){return (function (cc){return (function (h){return f(h)?(xs.push(h),(gensym_2_gmjt2ug2_eud8vu.continuation.call_tail.call(next(s.t()),cc))):cc(xs)}).call(this,s.h())})});
return (gensym_2_gmjt2ug2_eud8vv.continuation.call_cc.call(this,next(this)))}).call(this)}),_})).call(this,this.configure('seq.infinite.core').seq.infinite.prototype)}).call(this,this.configure('seq.finite.core seq.finite.mutability').seq.finite)})})())).tconfiguration('std opt continuation','seq.numeric',caterwaul.precompiled_internal((function (){null;
return (function (gensym_2_gmjt2ug2_eud8v8){((function (_){return _.naturals_from=(function (x){return new _.infinite.y((function (n){return n+1}),x)}),_.naturals=_.naturals_from(0),_.n=(function (l,u,s){return (function (lower,upper){return (function (step){return new _.infinite.y((function (n){return n+step}),lower).take((function (x){return (upper-lower)*(upper-x)>0}))}).call(this,Math.abs(s||1)*(lower<upper?1: -1))}).call(this,arguments.length>1?l:0,arguments.length>1?u:l)}),_})).call(this,this.configure('seq.infinite.core seq.infinite.y seq.finite.core').seq)})})())).tconfiguration('std opt continuation','seq.dsl',caterwaul.precompiled_internal((function (){var gensym_2_gmjt2ug2_eud8vz=caterwaul.parse(' -x');
var gensym_2_gmjt2ug2_eud8w0=caterwaul.parse('[_]');
var gensym_2_gmjt2ug2_eud8w1=caterwaul.parse('_[_]');
var gensym_2_gmjt2ug2_eud8w2=caterwaul.parse(' +_');
var gensym_2_gmjt2ug2_eud8w3=caterwaul.parse('_+x');
var gensym_2_gmjt2ug2_eud8w4=caterwaul.clone('std.qs std.qg std.bind std.lvalue std.cond std.fn std.obj std.ref std.string std opt.unroll opt continuation.core continuation.unwind continuation.cps continuation.delimited continuation');
var gensym_2_gmjt2ug2_eud8w5=caterwaul.parse('qg[fn[f][fn_[ !f.apply(this,arguments)]]]');
var gensym_2_gmjt2ug2_eud8w6=caterwaul.parse('fn[xs][y]');
var gensym_2_gmjt2ug2_eud8w7=caterwaul.parse('fb');
var gensym_2_gmjt2ug2_eud8w8=caterwaul.parse('fn');
var gensym_2_gmjt2ug2_eud8w9=caterwaul.parse('_x.filter(_y)');
var gensym_2_gmjt2ug2_eud8wa=caterwaul.parse('_,_i');
var gensym_2_gmjt2ug2_eud8wb=caterwaul.parse('_x.map(_y)');
var gensym_2_gmjt2ug2_eud8wc=caterwaul.parse('_,_i');
var gensym_2_gmjt2ug2_eud8wd=caterwaul.parse('_x.foldl(_y)');
var gensym_2_gmjt2ug2_eud8we=caterwaul.parse('_,_0,_i');
var gensym_2_gmjt2ug2_eud8wf=caterwaul.parse('_x.filter(c(_y))');
var gensym_2_gmjt2ug2_eud8wg=caterwaul.parse('_,_i');
var gensym_2_gmjt2ug2_eud8wh=caterwaul.parse('_x.each(_y)');
var gensym_2_gmjt2ug2_eud8wi=caterwaul.parse('_,_i');
var gensym_2_gmjt2ug2_eud8wj=caterwaul.parse('_x.foldr(_y)');
var gensym_2_gmjt2ug2_eud8wk=caterwaul.parse('_,_0,_i');
var gensym_2_gmjt2ug2_eud8wl=caterwaul.parse('_x.forall(_y)');
var gensym_2_gmjt2ug2_eud8wm=caterwaul.parse('_,_i');
var gensym_2_gmjt2ug2_eud8wn=caterwaul.parse('_x.exists(_y)');
var gensym_2_gmjt2ug2_eud8wo=caterwaul.parse('_,_i');
var gensym_2_gmjt2ug2_eud8wp=caterwaul.parse('_x.flat_map(_y)');
var gensym_2_gmjt2ug2_eud8wq=caterwaul.parse('_,_i');
var gensym_2_gmjt2ug2_eud8wr=caterwaul.parse('_x.drop(_y)');
var gensym_2_gmjt2ug2_eud8ws=caterwaul.parse('_');
var gensym_2_gmjt2ug2_eud8wt=caterwaul.parse('_x.take(_y)');
var gensym_2_gmjt2ug2_eud8wu=caterwaul.parse('_');
var gensym_2_gmjt2ug2_eud8wv=caterwaul.parse('new caterwaul.seq.infinite.y(_y,_x)');
var gensym_2_gmjt2ug2_eud8ww=caterwaul.parse('_');
var gensym_2_gmjt2ug2_eud8wx=caterwaul.parse('_+_');
var gensym_2_gmjt2ug2_eud8wy=caterwaul.parse('qg[_x].size()+qg[_y].size()');
var gensym_2_gmjt2ug2_eud8wz=caterwaul.parse('_&&_');
var gensym_2_gmjt2ug2_eud8x0=caterwaul.parse('((function (xp){return xp&&xp.size()?_y:xp}).call(this,_x))');
var gensym_2_gmjt2ug2_eud8x1=caterwaul.parse('_||_');
var gensym_2_gmjt2ug2_eud8x2=caterwaul.parse('((function (xp){return xp&&xp.size()?xp:_y}).call(this,_x))');
var gensym_2_gmjt2ug2_eud8x3=caterwaul.parse('_===_');
var gensym_2_gmjt2ug2_eud8x4=caterwaul.parse('qg[l[xp=_x,yp=_y][xp===yp||xp.size()===yp.size()&&xp.zip(yp).forall(fn[p][p[0]===p[1]])]]');
var gensym_2_gmjt2ug2_eud8x5=caterwaul.parse('_!==_');
var gensym_2_gmjt2ug2_eud8x6=caterwaul.parse('qg[l[xp=_x,yp=_y][xp!==yp&&(xp.size()!==yp.size()||xp.zip(yp).exists(fn[p][p[0]!==p[1]]))]]');
var gensym_2_gmjt2ug2_eud8x7=caterwaul.parse('_^_');
var gensym_2_gmjt2ug2_eud8x8=caterwaul.parse('_x.zip(_y)');
var gensym_2_gmjt2ug2_eud8x9=caterwaul.parse('_+_');
var gensym_2_gmjt2ug2_eud8xa=caterwaul.parse('_x.concat(_y)');
var gensym_2_gmjt2ug2_eud8xb=caterwaul.parse(' !_');
var gensym_2_gmjt2ug2_eud8xc=caterwaul.parse('_x.object()');
var gensym_2_gmjt2ug2_eud8xd=caterwaul.parse('_,_');
var gensym_2_gmjt2ug2_eud8xe=caterwaul.parse('_x,_y');
var gensym_2_gmjt2ug2_eud8xf=caterwaul.parse(' ~_');
var gensym_2_gmjt2ug2_eud8xg=caterwaul.parse('qg[new caterwaul.seq.finite(_x)]');
var gensym_2_gmjt2ug2_eud8xh=caterwaul.parse('_?_:_');
var gensym_2_gmjt2ug2_eud8xi=caterwaul.parse('x?y:z');
var gensym_2_gmjt2ug2_eud8xj=caterwaul.parse('_(_)');
var gensym_2_gmjt2ug2_eud8xk=caterwaul.parse('_x(_y)');
var gensym_2_gmjt2ug2_eud8xl=caterwaul.parse('_[_]');
var gensym_2_gmjt2ug2_eud8xm=caterwaul.parse('_x[_y]');
var gensym_2_gmjt2ug2_eud8xn=caterwaul.parse('_._');
var gensym_2_gmjt2ug2_eud8xo=caterwaul.parse('_x._y');
var gensym_2_gmjt2ug2_eud8xp=caterwaul.parse('_');
var gensym_2_gmjt2ug2_eud8xq=caterwaul.parse('qg[_x]');
var gensym_2_gmjt2ug2_eud8xr=caterwaul.parse(' +_');
var gensym_2_gmjt2ug2_eud8xs=caterwaul.parse('N');
var gensym_2_gmjt2ug2_eud8xt=caterwaul.parse('caterwaul.seq.naturals');
var gensym_2_gmjt2ug2_eud8xu=caterwaul.parse('N[_]');
var gensym_2_gmjt2ug2_eud8xv=caterwaul.parse('caterwaul.seq.naturals_from(x)');
var gensym_2_gmjt2ug2_eud8xw=caterwaul.parse('n[_]');
var gensym_2_gmjt2ug2_eud8xx=caterwaul.parse('caterwaul.seq.n(x)');
var gensym_2_gmjt2ug2_eud8xz=caterwaul.parse('p[_]');
var gensym_2_gmjt2ug2_eud8y0=caterwaul.parse('caterwaul.seq.finite.r(x)');
var gensym_2_gmjt2ug2_eud8y1=caterwaul.parse('seq[_]');
var gensym_2_gmjt2ug2_eud8y2=gensym_2_gmjt2ug2_eud8w4;
return (function (gensym_2_gmjt2ug2_eud8v9){this.configure('seq.core seq.infinite.y seq.finite.core seq.finite.zip seq.finite.traversal seq.finite.mutability').seq.dsl=((function (_){return (function (){var rxy=(function (tree){return (function (x,y){return tree.replace({_x:_.macroexpand(x),_y:y&&_.macroexpand(y)})})}),seq=(function (gensym_2_gmjt2ug2_eud8vy){return (function (){return (function (xs){return new this.seq.finite(xs)}).apply(gensym_2_gmjt2ug2_eud8vy,arguments)})})(this),prepend=(function (operator){return (function (x){return ((function (_){return _.data=operator,_})).call(this,gensym_2_gmjt2ug2_eud8vz.replace({x:x}))})}),tree_forms=(function (){var base=seq([gensym_2_gmjt2ug2_eud8w0,gensym_2_gmjt2ug2_eud8w1]),mod=(function (fs,op){return fs.concat(fs.map(prepend(op)))});
return mod(mod(base,'u-'),'u~').concat(seq([gensym_2_gmjt2ug2_eud8w2]))}).call(this),template=(function (op){return (function (t){return ((function (_){return _.data=op,_})).call(this,gensym_2_gmjt2ug2_eud8w3.replace({x:t}))})}),qw=gensym_2_gmjt2ug2_eud8w4.util.qw,not=gensym_2_gmjt2ug2_eud8w5,trees_for=(function (op){return ((function (_){return _.map(template(op.replace(/!$/,'')))})).call(this,((function (_){return op.charAt(op.length-1)==='!'?_.map(prepend('u!')):_})).call(this,tree_forms))});
return _.prefix_substitute=(function (tree,prefix){return tree.rmap((function (n){return (n.data.charAt(0)==='_')&&(new n.constructor((''+(prefix)+''+(n.data.substring(1))+'')))}))}),_.define_functional=(function (op,expansion,xs){return trees_for(op).map((function (t,i){return _.macro(t,(function (l,v,r){return expansion.replace({_x:_.macroexpand(l),_y:i>=8?v:gensym_2_gmjt2ug2_eud8w6.replace({fn:i&2?gensym_2_gmjt2ug2_eud8w7:gensym_2_gmjt2ug2_eud8w8,xs:_.prefix_substitute(xs,i&1?v.data:'_'),y:(i&4?_.macroexpand:(function (x){return x}))(r||v)})})}))}))}),((function (_){return _('%',gensym_2_gmjt2ug2_eud8w9,gensym_2_gmjt2ug2_eud8wa),_('*',gensym_2_gmjt2ug2_eud8wb,gensym_2_gmjt2ug2_eud8wc),_('/',gensym_2_gmjt2ug2_eud8wd,gensym_2_gmjt2ug2_eud8we),_('%!',gensym_2_gmjt2ug2_eud8wf.replace({c:not}),gensym_2_gmjt2ug2_eud8wg),_('*!',gensym_2_gmjt2ug2_eud8wh,gensym_2_gmjt2ug2_eud8wi),_('/!',gensym_2_gmjt2ug2_eud8wj,gensym_2_gmjt2ug2_eud8wk),_('&',gensym_2_gmjt2ug2_eud8wl,gensym_2_gmjt2ug2_eud8wm),_('|',gensym_2_gmjt2ug2_eud8wn,gensym_2_gmjt2ug2_eud8wo),_('-',gensym_2_gmjt2ug2_eud8wp,gensym_2_gmjt2ug2_eud8wq),_('>>',gensym_2_gmjt2ug2_eud8wr,gensym_2_gmjt2ug2_eud8ws),_('<<',gensym_2_gmjt2ug2_eud8wt,gensym_2_gmjt2ug2_eud8wu),_('>>>',gensym_2_gmjt2ug2_eud8wv,gensym_2_gmjt2ug2_eud8ww),_})).call(this,_.define_functional),seq(qw('> < >= <= == !=')).each((function (op){return _.macro(((function (_){return _.data=op,_})).call(this,gensym_2_gmjt2ug2_eud8wx.clone()),rxy(((function (_){return _.data=op,_})).call(this,gensym_2_gmjt2ug2_eud8wy.clone())))})),(function (e){return ((function (_){return _(gensym_2_gmjt2ug2_eud8wz,rxy(gensym_2_gmjt2ug2_eud8x0)),_(gensym_2_gmjt2ug2_eud8x1,rxy(gensym_2_gmjt2ug2_eud8x2)),_(gensym_2_gmjt2ug2_eud8x3,rxy(gensym_2_gmjt2ug2_eud8x4)),_(gensym_2_gmjt2ug2_eud8x5,rxy(gensym_2_gmjt2ug2_eud8x6)),_(gensym_2_gmjt2ug2_eud8x7,rxy(gensym_2_gmjt2ug2_eud8x8)),_(gensym_2_gmjt2ug2_eud8x9,rxy(gensym_2_gmjt2ug2_eud8xa)),_(gensym_2_gmjt2ug2_eud8xb,rxy(gensym_2_gmjt2ug2_eud8xc)),_(gensym_2_gmjt2ug2_eud8xd,rxy(gensym_2_gmjt2ug2_eud8xe)),_(gensym_2_gmjt2ug2_eud8xf,rxy(gensym_2_gmjt2ug2_eud8xg)),_(gensym_2_gmjt2ug2_eud8xh,(function (x,y,z){return gensym_2_gmjt2ug2_eud8xi.replace({x:e(x),y:e(y),z:e(z)})})),(function (rx){return _(gensym_2_gmjt2ug2_eud8xj,rx(gensym_2_gmjt2ug2_eud8xk)),_(gensym_2_gmjt2ug2_eud8xl,rx(gensym_2_gmjt2ug2_eud8xm)),_(gensym_2_gmjt2ug2_eud8xn,rx(gensym_2_gmjt2ug2_eud8xo)),_(gensym_2_gmjt2ug2_eud8xp.as('('),rx(gensym_2_gmjt2ug2_eud8xq))}).call(this,(function (t){return (function (x,y){return t.replace({_x:e(x),_y:y})})})),_(gensym_2_gmjt2ug2_eud8xr,(function (x){return x})),(function (rx){return _(gensym_2_gmjt2ug2_eud8xs,(function (){return gensym_2_gmjt2ug2_eud8xt})),_(gensym_2_gmjt2ug2_eud8xu,rx(gensym_2_gmjt2ug2_eud8xv)),_(gensym_2_gmjt2ug2_eud8xw,rx(gensym_2_gmjt2ug2_eud8xx))}).call(this,(function (t){return (function (x){return t.replace({x:x})})})),seq(qw('sk sv sp')).zip(qw('keys values pairs')).each((function (gensym_2_gmjt2ug2_eud8xy){return (function (){return (function (p){return _(gensym_2_gmjt2ug2_eud8xz.replace({p:p[0]}),(function (x){return gensym_2_gmjt2ug2_eud8y0.replace({r:p[1],x:x})}))}).apply(gensym_2_gmjt2ug2_eud8xy,arguments)})})(this)),_})).call(this,_.macro)}).call(this,(function (x){return _.macroexpand(x)})),this.rmacro(gensym_2_gmjt2ug2_eud8y1,_.macroexpand)}).call(this),_})).call(this,gensym_2_gmjt2ug2_eud8y2.global().clone())})})())).configuration('seq',function (gensym_2_gmjt2ug2_eud8va){this.configure('seq.core seq.finite.core seq.finite.object seq.finite.mutability seq.finite.traversal seq.finite.zip seq.finite.quantification '+'seq.finite.serialization seq.infinite.core seq.infinite.y seq.infinite.transform seq.infinite.traversal '+'seq.numeric seq.dsl')});





caterwaul.tconfiguration('std seq','heap',caterwaul.precompiled_internal((function (){var gensym_2_gmjt2liv_4ii0f1=caterwaul.clone('std.qs std.qg std.bind std.lvalue std.cond std.fn std.obj std.ref std.string std seq.core seq.finite.core seq.finite.object seq.finite.mutability seq.finite.traversal seq.finite.zip seq.finite.quantification seq.finite.serialization seq.infinite.core seq.infinite.y seq.infinite.transform seq.infinite.traversal seq.numeric seq.dsl seq');
return (function (gensym_2_gmjt2liv_4ii0ez){this.heap=(function (less){return ((function (c){return c.prototype=((function (_){return _.insert=(function (x){return this.push(x).heapify_up(this.size()-1)}),_.root=(function (){return this[0]}),_.rroot=(function (){return ((function (_){return ((function (_){return (this.size())&&(this[0]=_,this.heapify_down(0)),_})).call(this,this.pop()),_})).call(this,this[0])}),_.swap=(function (i,j){return ((function (_){return (function (temp){return _[j]=_[i],_[i]=temp}).call(this,_[j]),_})).call(this,this)}),_.heapify_up=(function (i){return ((function (_){return (function (p){return (less.call(_,_[i],_[p]))&&(_.swap(i,p).heapify_up(p))}).call(this,i>>1),_})).call(this,this)}),_.heapify_down=(function (i){return ((function (_){return (function (){var s=_.size(),r=i+1<<1,l=r-1,ll=l<s&&less.call(_,_[l],_[i])?l:i,lr=r<s&&less.call(_,_[r],_[ll])?r:ll;
return  !(lr===i)&&(_.swap(lr,i).heapify_down(lr))}).call(this),_})).call(this,this)}),_})).call(this,((function (_){return _.constructor=c,_})).call(this,new gensym_2_gmjt2liv_4ii0f1.seq.finite())),c})).call(this,((function (vars){return null,undefined})))})})})()));





caterwaul.tconfiguration('std seq continuation','memoize',caterwaul.precompiled_internal((function (){var gensym_2_gmjt2p00_1nq84l=caterwaul.clone('std.qs std.qg std.bind std.lvalue std.cond std.fn std.obj std.ref std.string std seq.core seq.finite.core seq.finite.object seq.finite.mutability seq.finite.traversal seq.finite.zip seq.finite.quantification seq.finite.serialization seq.infinite.core seq.infinite.y seq.infinite.transform seq.infinite.traversal seq.numeric seq.dsl seq continuation.core continuation.unwind continuation.cps continuation.delimited continuation');
var gensym_2_gmjt2p00_1nq84m=gensym_2_gmjt2p00_1nq84l;
return (function (gensym_2_gmjt2p00_1nq84j){((function (m){return m.wrap=(function (f){return ((function (_){return _.original=f,_})).call(this,(function (){return (function (as,start){return ((function (_){return _.time= +new Date()-start,_})).call(this,gensym_2_gmjt2p00_1nq84l.continuation.unwind_protect((function (gensym_2_gmjt2p00_1nq7zf){return (function (){return (function (e){return {error:e}}).apply(gensym_2_gmjt2p00_1nq7zf,arguments)})})(this),(function (gensym_2_gmjt2p00_1nq7zg){return (function (){return (function (){return {result:f.apply(this,as)}}).apply(gensym_2_gmjt2p00_1nq7zg,arguments)})})(this)))}).call(this,arguments, +new Date())}))}),m.perform=(function (result){return result.error?gensym_2_gmjt2p00_1nq84m.continuation.unwind(result.error):result.result}),m.from=(function (proxy){return (function (f){return (function (state,g){return (function (){return m.perform(proxy.call(state,this,arguments,g))})}).call(this,{},m.wrap(f))})}),m})).call(this,this.namespace('memoize'))})})()));





caterwaul.tconfiguration('std seq continuation memoize','parser.core',caterwaul.precompiled_internal((function (){var gensym_2_gmjt2sb3_bwlzjb=caterwaul.clone('std.qs std.qg std.bind std.lvalue std.cond std.fn std.obj std.ref std.string std seq.core seq.finite.core seq.finite.object seq.finite.mutability seq.finite.traversal seq.finite.zip seq.finite.quantification seq.finite.serialization seq.infinite.core seq.infinite.y seq.infinite.transform seq.infinite.traversal seq.numeric seq.dsl seq continuation.core continuation.unwind continuation.cps continuation.delimited continuation memoize');
var gensym_2_gmjt2sb3_bwlzjc=gensym_2_gmjt2sb3_bwlzjb;
return (function (gensym_2_gmjt2sb3_bwlzj0){((function (_){return _.parse_state=(function (input,i,result,memo){return ((function (_){return this.input=input,this.i=i,this.result=result,this.memo=memo,_})).call(this,undefined)}),((function (s){return s.from_input=(function (input){return new _.parse_state(input,0,null,{})}),((function (_){return _.accept=(function (i,r){return new this.constructor(this.input,i,r,this.memo)}),_.has_input=(function (){return this.i<this.input.length}),_.toString=(function (){return ('ps['+(this.input.substr(this.i))+', '+(this.result)+']')}),_})).call(this,s.prototype),s})).call(this,_.parse_state),_.memoize=gensym_2_gmjt2sb3_bwlzjb.memoize.from((function (c,as,f){return (function (k,m){return k in m?m[k]:(m[k]=f.apply(c,as))}).call(this,(''+(f.original.memo_id)+'|'+(as[0].i)+''),as[0].memo||(as[0].memo={}))})),_.promote_non_states=(function (f){return (function (state){return state instanceof _.parse_state?f.call(this,state):((function (_){return _&&_.result})).call(this,f.call(this,_.parse_state.from_input(state)))})}),_.identify=(function (f){return ((function (_){return _.memo_id=gensym_2_gmjt2sb3_bwlzjc.gensym(),_})).call(this,f)}),_.parser=(function (f){return _.promote_non_states(_.memoize(_.identify(f)))}),_.defparser=(function (name,f){return _.parsers[name]=(function (){return _.parser(f.apply(this,arguments))})}),_.parsers={},_})).call(this,this.namespace('parser'))})})())).tconfiguration('std seq continuation','parser.c',caterwaul.precompiled_internal((function (){var gensym_2_gmjt2sb3_bwlzje=caterwaul.clone('std.qs std.qg std.bind std.lvalue std.cond std.fn std.obj std.ref std.string std seq.core seq.finite.core seq.finite.object seq.finite.mutability seq.finite.traversal seq.finite.zip seq.finite.quantification seq.finite.serialization seq.infinite.core seq.infinite.y seq.infinite.transform seq.infinite.traversal seq.numeric seq.dsl seq continuation.core continuation.unwind continuation.cps continuation.delimited continuation');
var gensym_2_gmjt2sb3_bwlzjf=gensym_2_gmjt2sb3_bwlzje;
var gensym_2_gmjt2sb3_bwlzjg=gensym_2_gmjt2sb3_bwlzje;
var gensym_2_gmjt2sb3_bwlzjh=gensym_2_gmjt2sb3_bwlzje;
return (function (gensym_2_gmjt2sb3_bwlzj1){this.configure('parser.core').parser.defparser('c',(function (x,l){return (function (){var check_index=(function (i,s,p){return i.exists((function (_,_i){return (function (s){return _[('@'+(s)+'')]&&s}).call(this,s.substr(p,_.length))}))}),index_entries=(function (xs){return (function (){var xsp=(new gensym_2_gmjt2sb3_bwlzje.seq.finite(xs)),ls=gensym_2_gmjt2sb3_bwlzjf.seq.finite.keys((xsp.map((function (_,_i){return [_.length,true]}))).object()).map((function (_,_i){return Number(_)}));
return (new gensym_2_gmjt2sb3_bwlzjg.seq.finite(ls.slice().sort((function (x,y){return y-x})))).map((function (l,li){return (xsp.filter((function (_,_i){return _.length===l})).map((function (_,_i){return [('@'+(_)+''),true]})).concat([['length',l]])).object()}))}).call(this)}),add_absolute_anchors_to=(function (x){return (function (parts){return new RegExp(('^'+(parts[1])+'$'),parts[2])}).call(this,/^\/(.*)\/(\w*)$/.exec(x.toString()))}),fail_length=(function (re,s,p,l){return re.test(s.substr(p,l))?p+(l<<1)<=s.length?fail_length(re,s,p,l<<1):l<<1:l}),split_lengths=(function (re,s,p,l,u){return (function (){var b=(function (l,u){return l+1<u?((function (m){return re.test(s.substr(p,m))?b(m,u):b(l,m)})).call(this,(l+(u-l>>1))):l});
return b(l,u)}).call(this)});
return x.constructor===String?(function (st){return (x===st.input.substr(st.i,x.length))&&(st.accept(st.i+x.length,x))}):x instanceof Array?(function (index){return (function (st){return ((function (_){return _&&st.accept(st.i+_.length,_)})).call(this,check_index(index,st.input,st.i))})}).call(this,index_entries(x)):x.constructor===RegExp?(function (x){return (function (st){return ((function (_){return _>l&&((function (_){return st.accept(st.i+_,x.exec(st.input.substr(st.i,_)))})).call(this,split_lengths(x,st.input,st.i,l,_))})).call(this,fail_length(x,st.input,st.i,l))})}).call(this,add_absolute_anchors_to(x)):x.constructor===Function?(function (st){return ((function (_){return _&&st.accept(st.i+_,st.input.substr(st.i,_))})).call(this,x.call(st,st.input,st.i))}):(function (index){return (function (st){return ((function (_){return _&&st.accept(st.i+_.length,x[_])})).call(this,check_index(index,st.input,st.i))})}).call(this,index_entries(gensym_2_gmjt2sb3_bwlzjh.seq.finite.keys(x)))}).call(this)}))})})())).tconfiguration('std opt seq continuation','parser.seq',caterwaul.precompiled_internal((function (){var gensym_2_gmjt2sb3_bwlzjj=caterwaul.clone('std.qs std.qg std.bind std.lvalue std.cond std.fn std.obj std.ref std.string std opt.unroll opt seq.core seq.finite.core seq.finite.object seq.finite.mutability seq.finite.traversal seq.finite.zip seq.finite.quantification seq.finite.serialization seq.infinite.core seq.infinite.y seq.infinite.transform seq.infinite.traversal seq.numeric seq.dsl seq continuation.core continuation.unwind continuation.cps continuation.delimited continuation');
return (function (gensym_2_gmjt2sb3_bwlzj2){this.configure('parser.core').parser.defparser('seq',(function (){return (function (as){return (function (state){return (function (result){return (gensym_2_gmjt2sb3_bwlzjj.continuation.call_cc.call(this,(function (cc){return (function (gensym_2_gmjt2sb3_bwlzdp){for (var gensym_2_gmjt2sb3_bwlzdq=gensym_2_gmjt2sb3_bwlzdp>=0&&gensym_2_gmjt2sb3_bwlzdp>>3,gensym_2_gmjt2sb3_bwlzdr=gensym_2_gmjt2sb3_bwlzdp>=0&&gensym_2_gmjt2sb3_bwlzdp&7,i=0;
i<gensym_2_gmjt2sb3_bwlzdr;
 ++i)(state=as[i](state))?result.push(state.result):cc(false);
for (var gensym_2_gmjt2sb3_bwlzds=0;
gensym_2_gmjt2sb3_bwlzds<gensym_2_gmjt2sb3_bwlzdq;
 ++gensym_2_gmjt2sb3_bwlzds){(state=as[i](state))?result.push(state.result):cc(false);
i++;
(state=as[i](state))?result.push(state.result):cc(false);
i++;
(state=as[i](state))?result.push(state.result):cc(false);
i++;
(state=as[i](state))?result.push(state.result):cc(false);
i++;
(state=as[i](state))?result.push(state.result):cc(false);
i++;
(state=as[i](state))?result.push(state.result):cc(false);
i++;
(state=as[i](state))?result.push(state.result):cc(false);
i++;
(state=as[i](state))?result.push(state.result):cc(false);
i++};
return gensym_2_gmjt2sb3_bwlzdp}).call(this,as.length),state.accept(state.i,result)})))}).call(this,[])})}).call(this,arguments)}))})})())).tconfiguration('std opt seq continuation','parser.alt',caterwaul.precompiled_internal((function (){var gensym_2_gmjt2sb3_bwlzjl=caterwaul.clone('std.qs std.qg std.bind std.lvalue std.cond std.fn std.obj std.ref std.string std opt.unroll opt seq.core seq.finite.core seq.finite.object seq.finite.mutability seq.finite.traversal seq.finite.zip seq.finite.quantification seq.finite.serialization seq.infinite.core seq.infinite.y seq.infinite.transform seq.infinite.traversal seq.numeric seq.dsl seq continuation.core continuation.unwind continuation.cps continuation.delimited continuation');
return (function (gensym_2_gmjt2sb3_bwlzj3){this.configure('parser.core').parser.defparser('alt',(function (){return (function (as){return (function (state){return as.exists((function (_,_i){return _(state)}))})}).call(this,(new gensym_2_gmjt2sb3_bwlzjl.seq.finite(arguments)))}))})})())).tconfiguration('std opt seq continuation','parser.times',caterwaul.precompiled_internal((function (){var gensym_2_gmjt2sb3_bwlzjn=caterwaul.clone('std.qs std.qg std.bind std.lvalue std.cond std.fn std.obj std.ref std.string std opt.unroll opt seq.core seq.finite.core seq.finite.object seq.finite.mutability seq.finite.traversal seq.finite.zip seq.finite.quantification seq.finite.serialization seq.infinite.core seq.infinite.y seq.infinite.transform seq.infinite.traversal seq.numeric seq.dsl seq continuation.core continuation.unwind continuation.cps continuation.delimited continuation');
var gensym_2_gmjt2sb3_bwlzjo=gensym_2_gmjt2sb3_bwlzjn;
var gensym_2_gmjt2sb3_bwlzjp=gensym_2_gmjt2sb3_bwlzjn;
return (function (gensym_2_gmjt2sb3_bwlzj4){this.configure('parser.core').parser.defparser('times',(function (p,lower,upper){return (function (state){return (function (count,result){return (gensym_2_gmjt2sb3_bwlzjn.continuation.call_cc.call(this,(function (cc){return (function (gensym_2_gmjt2sb3_bwlzdp){for (var gensym_2_gmjt2sb3_bwlzdq=gensym_2_gmjt2sb3_bwlzdp>=0&&gensym_2_gmjt2sb3_bwlzdp>>3,gensym_2_gmjt2sb3_bwlzdr=gensym_2_gmjt2sb3_bwlzdp>=0&&gensym_2_gmjt2sb3_bwlzdp&7,i=0;
i<gensym_2_gmjt2sb3_bwlzdr;
 ++i) ++count,(state=p(state))?result.push(state.result):cc(false);
for (var gensym_2_gmjt2sb3_bwlzds=0;
gensym_2_gmjt2sb3_bwlzds<gensym_2_gmjt2sb3_bwlzdq;
 ++gensym_2_gmjt2sb3_bwlzds){ ++count,(state=p(state))?result.push(state.result):cc(false);
i++;
 ++count,(state=p(state))?result.push(state.result):cc(false);
i++;
 ++count,(state=p(state))?result.push(state.result):cc(false);
i++;
 ++count,(state=p(state))?result.push(state.result):cc(false);
i++;
 ++count,(state=p(state))?result.push(state.result):cc(false);
i++;
 ++count,(state=p(state))?result.push(state.result):cc(false);
i++;
 ++count,(state=p(state))?result.push(state.result):cc(false);
i++;
 ++count,(state=p(state))?result.push(state.result):cc(false);
i++};
return gensym_2_gmjt2sb3_bwlzdp}).call(this,lower),true})))&&(gensym_2_gmjt2sb3_bwlzjo.continuation.call_cc.call(this,(function (){var loop=(function (cc){return ( !upper||count++<upper)&&state.has_input()&&((function (_){return (_)&&(state=_),_})).call(this,p(state))?result.push(state.result)&&(gensym_2_gmjt2sb3_bwlzjp.continuation.call_tail.call(loop,cc)):cc(state.accept(state.i,result))});
return loop}).call(this)))}).call(this,0,[])})}))})})())).tconfiguration('std opt seq continuation','parser.opt',caterwaul.precompiled_internal((function (){null;
return (function (gensym_2_gmjt2sb3_bwlzj5){this.configure('parser.core').parser.defparser('opt',(function (p){return (function (state){return (function (){var s=p(state),n=s?s.i:state.i,r=s&&s.result;
return state.accept(n,r)}).call(this)})}))})})())).tconfiguration('std opt seq continuation','parser.match',caterwaul.precompiled_internal((function (){null;
return (function (gensym_2_gmjt2sb3_bwlzj6){((function (_){return _.defparser('match',(function (p){return (function (state){return ((function (_){return _&&state.accept(state.i,state.result)})).call(this,p(state))})})),_.defparser('reject',(function (p){return (function (state){return ((function (_){return  !_&&state.accept(state.i,null)})).call(this,p(state))})})),_})).call(this,this.configure('parser.core').parser)})})())).tconfiguration('std opt seq continuation','parser.bind',caterwaul.precompiled_internal((function (){null;
return (function (gensym_2_gmjt2sb3_bwlzj7){((function (_){return _.defparser('bind',(function (p,f){return (function (state){return ((function (_){return _&&_.accept(_.i,f.call(_,_.result))})).call(this,p(state))})})),_})).call(this,this.configure('parser.core').parser)})})())).tconfiguration('std opt seq continuation','parser.dsl',caterwaul.precompiled_internal((function (){var gensym_2_gmjt2sb3_bwlzju=caterwaul.parse('peg[_]');
var gensym_2_gmjt2sb3_bwlzjv=caterwaul.parse('qg[l*[_bindings][_parser]]');
var gensym_2_gmjt2sb3_bwlzjw=caterwaul.clone('std.qs std.qg std.bind std.lvalue std.cond std.fn std.obj std.ref std.string std opt.unroll opt seq.core seq.finite.core seq.finite.object seq.finite.mutability seq.finite.traversal seq.finite.zip seq.finite.quantification seq.finite.serialization seq.infinite.core seq.infinite.y seq.infinite.transform seq.infinite.traversal seq.numeric seq.dsl seq continuation.core continuation.unwind continuation.cps continuation.delimited continuation');
var gensym_2_gmjt2sb3_bwlzjx=caterwaul.parse('_x=_y');
var gensym_2_gmjt2sb3_bwlzjy=caterwaul.parse('_name(_x,_y)');
var gensym_2_gmjt2sb3_bwlzjz=caterwaul.parse('_name(_x,_y)');
var gensym_2_gmjt2sb3_bwlzk0=caterwaul.parse('_name(_x)');
var gensym_2_gmjt2sb3_bwlzk1=caterwaul.parse('_(_)');
var gensym_2_gmjt2sb3_bwlzk2=caterwaul.parse('_x(_y)');
var gensym_2_gmjt2sb3_bwlzk3=caterwaul.parse('_/_');
var gensym_2_gmjt2sb3_bwlzk4=caterwaul.parse('_%_');
var gensym_2_gmjt2sb3_bwlzk5=caterwaul.parse('_>>_');
var gensym_2_gmjt2sb3_bwlzk6=caterwaul.parse('[_]');
var gensym_2_gmjt2sb3_bwlzk7=caterwaul.parse('_');
var gensym_2_gmjt2sb3_bwlzk8=caterwaul.parse('_[_]');
var gensym_2_gmjt2sb3_bwlzk9=caterwaul.parse('times(_x,_l)');
var gensym_2_gmjt2sb3_bwlzka=caterwaul.parse('_[_,_]');
var gensym_2_gmjt2sb3_bwlzkb=caterwaul.parse('times(_x,_l,_u)');
var gensym_2_gmjt2sb3_bwlzkc=gensym_2_gmjt2sb3_bwlzjw;
return (function (gensym_2_gmjt2sb3_bwlzj8){this.configure('parser.core').rmacro(gensym_2_gmjt2sb3_bwlzju,(function (x){return (function (outer){return gensym_2_gmjt2sb3_bwlzjv.replace({_bindings:new this.syntax(',',gensym_2_gmjt2sb3_bwlzjw.seq.finite.pairs(this.parser.parsers).map((function (_,_i){return gensym_2_gmjt2sb3_bwlzjx.replace({_x:_[0],_y:new outer.ref(_[1])})}))),_parser:this.parser.dsl.macroexpand(x)})}).call(this,this)})),this.parser.dsl=((function (dsl){return ((function (_){return (function (){var e=dsl.macroexpand,fb=(function (op,name){return (function (x,y){return gensym_2_gmjt2sb3_bwlzjy.replace({_name:name,_x:((function (_){return _.data=',',_})).call(this,x.flatten(op).map(e)),_y:e(y)})})}),b=(function (name){return (function (x,y){return gensym_2_gmjt2sb3_bwlzjz.replace({_name:name,_x:e(x),_y:y})})}),u=(function (name){return (function (x){return gensym_2_gmjt2sb3_bwlzk0.replace({_name:name,_x:e(x)})})});
return _(gensym_2_gmjt2sb3_bwlzk1,(function (x,y){return gensym_2_gmjt2sb3_bwlzk2.replace({_x:e(x),_y:y})})),_(gensym_2_gmjt2sb3_bwlzk3,fb('/','alt')),_(gensym_2_gmjt2sb3_bwlzk4,fb('%','seq')),_(gensym_2_gmjt2sb3_bwlzk5,b('bind')),_(gensym_2_gmjt2sb3_bwlzk6,u('opt')),_(gensym_2_gmjt2sb3_bwlzk7.as('('),(function (x){return e(x).as('(')})),_(gensym_2_gmjt2sb3_bwlzk8,(function (x,l){return gensym_2_gmjt2sb3_bwlzk9.replace({_x:e(x),_l:l})})),_(gensym_2_gmjt2sb3_bwlzka,(function (x,l,u){return gensym_2_gmjt2sb3_bwlzkb.replace({_x:e(x),_l:l,_u:u})}))}).call(this),_})).call(this,dsl.macro),dsl})).call(this,gensym_2_gmjt2sb3_bwlzkc.global().clone())})})())).configuration('parser',function (gensym_2_gmjt2sb3_bwlzj9){this.configure('parser.core parser.c parser.seq parser.alt parser.times parser.opt parser.match parser.bind parser.dsl')});



// Generated by SDoc 
