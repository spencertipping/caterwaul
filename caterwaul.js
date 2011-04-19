// Caterwaul JS | Spencer Tipping
// Licensed under the terms of the MIT source code license

// Core caterwaul compiler.
// This is generated from the files in the core/ directory of the source distribution and has a version tag.



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

// The Caterwaul standard library gives you an equivalent but much more refined form of se() called /se[].

    var qw = function (x) {return x.split(/\s+/)},  id = function (x) {return x},  se = function (x, f) {return f && f.call(x, x) || x},
    genval = (function (n, m, u) {return function () {return [u, n, ++m]}})(+new Date(), Math.random() * (1 << 30) >>> 0, unique()),

    genint = function () {var v = genval(); return (v[0] << 2) + v[0] + (v[1] << 1) + v[1] + v[2]},
    gensym = function () {var v = genval(); return ['gensym', v[0].toString(36), v[1].toString(36), v[2].toString(36)].join('_')},

      fail = function (m) {throw new Error(m)},

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

    replica = se(function () {return copy_of({behaviors: {method: function (v) {return bind(v, this)}}}).behavior('field').behavior('shallow', shallow_copy).
                                                                                                         behavior('self_reference', function () {return this})}, function (f) {f.init = f});

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

// There's an interesting case that comes up when loading a global caterwaul. If we detect that the caterwaul we just loaded has the same version as the one that's already there, we revert back
// to the original. This is very important for precompilation and the reason for it is subtle. Precompilation relies on tracing to determine the compiled form of each function handed to
// caterwaul, so if that caterwaul is replaced for any reason then the traces won't happen. A very common setup is something like this:

// | <script src='caterwaul.js'></script>
//   <script src='some-caterwaul-extension.js'></script>
//   <script src='my-script.js'></script>

// Often you'll want to precompile the whole bundle, since caterwaul.js includes behaviors that aren't necessarily precompiled. To do this, it's tempting to precompile the whole bundle of
// caterwaul, the extensions, and your code. Without version checking, however, the traces would be lost and nothing would happen.

  var original_global  = typeof caterwaul === 'undefined' ? undefined : caterwaul,
      caterwaul_global = caterwaul = se(configurable(), function () {this.deglobalize = function () {caterwaul = original_global; return this}});

//   Uniqueness and identification.
//   Caterwaul has a number of features that require it to be able to identify caterwaul functions and easily distinguish between them. These methods provide a way to do that. Also, I'm using
//   this section as an excuse to stash some useful utility methods onto caterwaul.

//   Finally, the 'caterwaul' property of any caterwaul function will refer to the caterwaul function. This makes the node.js API more systematic.

  caterwaul_global.method('global', function () {return caterwaul_global}).method('id', function () {return this._id || (this._id = gensym())}).
                    field('is_caterwaul', is_caterwaul).field('initializer', initializer).field('unique', unique).field('gensym', gensym).field('genint', genint).
           self_reference('caterwaul').

                   method('toString', function () {return '[caterwaul instance ' + this.id() + ']'}).field('merge', merge).
                   method('check_version', function () {if (original_global && this.version === original_global.version) this.deglobalize(); return this}).

                   method('reinitialize', function (transform, erase_configurations) {var c = (transform || id)(this.initializer), result = c(c, this.unique).deglobalize();
                                                                                      erase_configurations || (result.configurations = this.configurations); return result}).

//   Magic.
//   Sometimes you need to grab a unique value that is unlikely to exist elsewhere. Caterwaul gives you such a value given a string. These values are shared across all Caterwaul instances and are
//   considered to be opaque. Because of the possibility of namespace collisions, you should name your magic after a configuration or otherwise prefix it somehow.

                   method('magic', (function (table) {return function (name) {return table[name] || (table[name] = {})}}));
// Generated by SDoc 






// Variadic methods.
// A lot of the time we'll want some kind of variadic behavior for methods. These meta-methods define such behavior. There are a few templates that occur commonly in the caterwaul source, and you
// can define your own meta-methods to handle other possibilities.

  caterwaul_global.method('variadic', function (name, f) {return this.method(name, function () {for (var i = 0, l = arguments.length; i < l; ++i) f.call(this, arguments[i]); return this})}).
                   method('right_variadic_binary', function (name, f) {return this.method(name, function () {
                                                     for (var i = 0, l = arguments.length - 1, x = arguments[l]; i < l; ++i) f.call(this, arguments[i], x); return this})});
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

    syntax_common = {

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
//     Any syntax tree can act as a matching pattern to destructure another one. It's often much more fun to do things this way than it is to try to pick it apart by hand. For example, suppose
//     you wanted to determine whether a node represents a function that immediately returns, and to know what it returns. The simplest way to do it is like this:

//     | var tree = ...
//       var match = caterwaul.parse('function (_) {return _value}').match(tree);
//       if (match) {
//         var value = match._value;
//         ...
//       }

//     The second parameter 'variables' stores a running total of match data. You don't normally provide this; match creates it for you on the toplevel invocation.

         match: function (target, variables) {variables || (variables = {});
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

//     Update for Caterawul 0.6.6: I had removed mandatory spacing for unary prefix operators, but now it's back. The reason is to help out the host Javascript lexer, which can misinterpret
//     postfix increment/decrement: x + +y will be serialized as x++y, which is invalid Javascript. The fix is to introduce a space in front of the second plus: x+ +y, which is unambiguous.

        toString: function ()   {return this.serialize()},
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

    caterwaul_global.method('define_syntax', function (name, ctor) {return this.field(name, extend.apply(this, [ctor, syntax_common].concat(Array.prototype.slice.call(arguments, 2))))}).
                     method('ensure_syntax', function (thing)      {return thing && thing.constructor === String ? this.parse(thing) : thing}).
                      field('syntax_common', syntax_common).

//   References.
//   You can drop references into code that you're compiling. This is basically variable closure, but a bit more fun. For example:

//   | caterwaul.compile(qs[fn_[_ + 1]].replace({_: new caterwaul.ref(3)})()    // -> 4

//   What actually happens is that caterwaul.compile runs through the code replacing refs with gensyms, and the function is evaluated in a scope where those gensyms are bound to the values they
//   represent. This gives you the ability to use a ref even as an lvalue, since it's really just a variable. References are always leaves on the syntax tree, so the prototype has a length of 0.

    define_syntax('ref', function (value) {if (value instanceof this.constructor) {this.value = value.value; this.data = value.data}
                                           else                                   {this.value = value;       this.data = gensym()}}, {length: 0, binds_a_value: true}).

//   Syntax node constructor.
//   Here's where we combine all of the pieces above into a single function with a large prototype. Note that the 'data' property is converted from a variety of types; so far we support strings,
//   numbers, and booleans. Any of these can be added as children. Also, I'm using an instanceof check rather than (.constructor ===) to allow array subclasses such as Caterwaul finite sequences
//   to be used.

    define_syntax('syntax', function (data) {if (data instanceof this.constructor) this.data = data.data, this.length = 0;
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

// Caterwaul 1.0 introduces the 'globals' attribute, which lets you set global variables that will automatically be present when compiling syntax trees. Note that using this feature can prevent
// precompilation, since the global references may not be serializable.

  caterwaul_global.shallow('globals', {}).method('compile',
    function (tree, environment) {
      var vars = [], values = [], bindings = merge({}, this.globals, environment || {}, tree.bindings()), s = gensym();
      for (var k in bindings) if (has(bindings, k)) vars.push(k), values.push(bindings[k]);
      var code = map(function (v) {return v === 'this' ? '' : 'var ' + v + '=' + s + '.' + v}, vars).join(';') + ';return(' + tree.serialize() + ')';
      try {return (new Function(s, code)).call(bindings['this'], bindings)} catch (e) {throw new Error('Caught ' + e + ' while compiling ' + code)}});
// Generated by SDoc 






// Event listening API.
// Caterwaul can create pairs of listener/broadcast interfaces for events. For example, suppose we wanted to provide a facility for macros to issue compile-time warnings; one way to do this would
// be to create a 'warning' event and allow interested parties to listen for it. Here's how that might look:

// | caterwaul.event('warning');   // Sets up the interface
//   caterwaul.on_warning(function (w) {console.log('Warning: ' + w)});    // Adds a listener
//   caterwaul.warning('this is a test');                                  // Triggers all listeners with the given parameter

// The context (i.e. 'this') of each event listener is the caterwaul object.

  caterwaul_global.variadic('event', function (name) {
    var listeners = name + '_listeners', broadcast = 'on_' + name;
    return this.shallow(listeners, []).variadic(name,      function (l) {this.listeners.push(l); return this}).
                                         method(broadcast, function () {for (var ls = this[listeners], i = 0, l = ls.length; i < l; ++i) ls[i].apply(this, arguments); return this})});
// Generated by SDoc 





// Baking support.
// To "bake" a caterwaul function is to freeze its settings and apply long-run optimizations such as macroexpander compilation. Once a function is baked you can't do certain things, most notably
// adding macros. (Other restrictions may apply later as further optimizations are implemented.) You also can't re-bake a caterwaul instance.

  caterwaul_global.event('bake').on_bake(function () {this.on_bake(function () {throw new Error('cannot bake a caterwaul function more than once')})}).
                  method('method_until_baked', function (name, f) {return this.method(name, f).on_bake(function () {
                                                                          this.method(name, function () {throw new Error('cannot call ' + name + ' on a baked caterwaul')})})});
// Generated by SDoc 






// Macroexpansion.
// Caterwaul's main purpose is to transform code, and the way it does this is by using macroexpansion. Macroexpansion involves finding pieces of the syntax tree that have a particular form and
// changing them somehow. Normally this is done by first defining a pattern and then defining a function that returns something to replace occurrences of that pattern. For example:

// | caterwaul.macro('_a + _b', '_a * _b');

// This macro finds binary addition and replaces it with multiplication. In previous versions of caterwaul the macro would have been written using anonymous wildcards and a macroexpansion
// function, but caterwaul 1.0 now supports named pattern matching. If you write a function to generate the expansion, it will receive an object containing the match data:

// | var tree = caterwaul.parse('foo + bar');
//   caterwaul.macro('_a + _b', function (match) {
//     console.log(match);                                 // logs {_a: (foo), _b: (bar)}
//   });

// Inside the macroexpander 'this' is bound to the instance of caterwaul that is performing macroexpansion.

  (function () {

//   Pitfalls of macroexpansion.
//   Macroexpansion as described here can encode a lambda-calculus. The whole point of having macros is to make them capable, so I can't complain about that. But there are limits to how far I'm
//   willing to go down the pattern-matching path. Let's suppose the existence of the let-macro, for instance:

//   | let (x = y) in z   ->   (function (x) {return z}) (y)

//   If you write these macros:

//   | foo[x, y]   ->   let (x = y)
//     bar[x, y]   ->   x in y

//   Caterwaul is not required to expand bar[foo[x, y], z] into (function (x) {return z}) (y). It might just leave it at let (x = y) in z instead. The reason is that while the individual
//   macroexpansion outputs are macroexpanded, a fixed point is not run on macroexpansion in general. To get the extra macroexpansion you would have to wrap the whole expression in another macro,
//   in this case called 'expand':

//   | caterwaul.configure(function () {
//       this.rmacro('expand[_x]', fn[match][caterwaul.macroexpand(match._x)]);
//     });

//   This is an eager macro; by outputting the already-expanded contents, it gets another free pass through the macroexpander.

//   Things that are not guaranteed:

//   | 1. Reassembly of different pieces (see above).
//     2. Anything at all, if your macroexpansion function destructively modifies its syntax trees. Returning a replacement is one thing, but modifying one will break things.
//     3. Performance bounds.

// Macroexpansion behavior.
// Caterwaul exposes macroexpansion as a contained interface. This lets you write your own compilers with macroexpansion functionality, even if the syntax trees weren't created by Caterwaul.
// (Though you won't be able to precompile these.) In order for this to work, your syntax trees must:

// | 1. Look like arrays -- that is, have a .length property and be indexable by number (e.g. x[0], x[1], ..., x[x.length - 1])
//   2. Implement an rmap() method. This should perform a depth-first traversal of the syntax tree, invoking a callback function on each node. If the callback returns a value, that value should
//      be subsituted for the node passed in and traversal should continue on the next node (not the one that was grafted in). Otherwise traversal should descend into the unmodified node. The
//      rmap() method defined for Caterwaul syntax trees can be used as a reference implementation. (It's fairly straightforward.)
//   3. Implement a .data property. This represents an equivalence class for syntax nodes under ===. Right now there is no support for using other equivalence relations.
//   4. Implement an .is_wildcard() method. This should return a truthy value if your node represents a wildcard when used in a pattern.

// As of version 0.7.0 this compatibility may change without notice. The reason is that the macroexpansion logic used by Caterwaul is becoming more sophisticated to increase performance, which
// means that it may become arbitrarily optimized. (See sdoc::js::core/caterwaul.macroexpand-jit for information about additional features your nodes should support.)

//   Macro vs. final_macro.
//   Normally you want the output of a macro to be re-macroexpanded. For example, suppose you're mapping _a + _b to (_a).plus(_b). If you didn't re-expand the output of this macro, then applying
//   it to the expression 'x + y + z' would yield (x + y).plus(z), since macros are applied outside-in. Fortunately macro() takes care of this for you and re-expands output automatically.

//   There are some cases where you wouldn't want re-expansion. One of them is when you're assigning context-specific meaning to operators or other syntax nodes; in this case you want to control
//   the traversal process manually. Another case is if you were to define a literal macro:

//   | caterwaul.final_macro('literal(_x)', '_x')          // final_macro says "don't re-expand the output"

//   Under the hood the macro() method ultimately uses final_macro(), but wraps your macroexpander in a function that knows how to re-expand output. All re-expansion is done by the compiler that
//   is macroexpanding in the first place.

    caterwaul_global.shallow('macro_patterns',  []).
                     shallow('macro_expanders', []).

                      method('with_gensyms', function (t) {var gensyms = {}; return this.ensure_syntax(t).rmap(function (n) {
                                                             return /^gensym/.test(n.data) && new this.constructor(gensyms[n.data] || (gensyms[n.data] = gensym()), this)})}).

                      method('macroexpand',        function (t) {return this.ensure_syntax(t).rmap(this.macroexpand_single)}).
                      method('macroexpand_single', function (t) {return this.macro_expand_naive(t, this.macro_patterns, this.macro_expanders)}).

                     on_bake(function () {this.method('macroexpand_single', this.create_baked_macroexpander(this.macro_patterns, this.macro_expanders))}).

                      method('expander_from_string', function (expander) {var tree = this.parse(expander); return function (match) {return tree.replace(match)}}).
                      method('ensure_expander',      function (expander) {return expander.constructor === String      ? this.expander_from_string(expander) :
                                                                                 expander.constructor === this.syntax ? function (match) {return expander.replace(match)} :
                                                                                 expander.constructor === Function    ? expander : fail('unknown macroexpander format: ' + expander)}).
       right_variadic_binary('final_macro',
         function (pattern, expander) {return this.macro_patterns.push(this.ensure_syntax(pattern)), this.macro_expanders.push(this.ensure_expander(expander)), this}).

       right_variadic_binary('macro',
         function (pattern, expander) {expander = this.ensure_expander(expander);
                                       return this.final_macro(pattern, function () {var t = expander.apply(this, arguments); return t && this.macroexpand(t)})})})();
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

//   As of caterwaul 1.0 we delegate pattern matching to the tree implementation rather than having a static function to do it. The expected behavior is that x.match(y) returns null or another
//   falsy value if y doesn't match the pattern x, and it returns an object containing wildcard data if y does match x. Wildcards begin with an underscore; for example:

//   | qs[_a + _b].match(qs[3 + x])        // -> {_a: 3, _b: x}
//     qs[_a + _b].match(qs[3 / x])        // -> null

  caterwaul_global.method('macro_expand_naive', function (t, macros, expanders) {
                           var self = this;
                           return t.rmap(function (n) {for (var i = macros.length - 1, match, replacement; i >= 0; --i)
                                                         if ((match = macros[i].match(n)) && (replacement = expanders[i].call(self, match))) return replacement})});
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

//   | (, (_expr) (* (where) ([] ([ (=  (_var) (_value))))))               <- the macro patterns
//     (, (_expr) (* (where) ([] ([ (== (_var) (_value))))))

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
                                               for (var j = 0, lj = trees.length, skip; j < lj; ++j) if (skip = resolve_tree_path(trees[j], p).is_wildcard()) break;
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

//   | (a (b) (_c))
//     (a (_c) (b))

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

    wildcard_paths = function (t) {for (var r = t.is_wildcard() ? [''] : [], i = 0, l = t.length; i < l; ++i)
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

      non_wildcard_node_count = function (tree) {var r = 0; tree.reach(function (node) {r += ! node.is_wildcard()}); return r},

//     Invocations of the macroexpander should be fast, so there's some kind of interesting logic to quickly match wildcards with a minimum of array consing. This optimization requires a
//     simplifying assumption that all _ nodes are leaf nodes, but this is generally true. (It's possible to build macro patterns that don't have this property, but they won't, and never would
//     have, behaved properly.) The idea is that once we have a fully-specified macro pattern we can simply go through each visited path, grab the direct children of each node, and detect
//     wildcards. We then encode these wildcard paths as hard-coded offsets from the tree variables. So, for example:

//     | (+ (/ (_a) (b)) (* (a) (_b)))
//       visited: [0], [0][1], [1], [1][0]
//       children: (_a), (b), (a), (_b)
//       parameters: {_a: paths[0][0], _b: paths[1][1]}

//     Note that a new object is consed per macroexpander invocation. I'm not reusing the array from last time because (1) it's too much work, and (2) the fallthrough-macro case is already fairly
//     expensive and uncommon; a new cons isn't going to make much difference at that point.

      path_reference_object_template = caterwaul_global.parse('{_elements}'),
      variable_value_pair_template   = caterwaul_global.parse('_variable: _value'),
      generate_path_reference_object = function (pattern, variables, paths) {for (var refs = [], i = 0, l = paths.length; i < l; ++i)
                                                                               refs.push(variable_value_pair_template.replace({_variable: resolve_tree_path(pattern, paths[i]).data,
                                                                                                                                  _value: generate_path_reference(variables, paths[i])}));
                                                                             return path_reference_object_template.replace({_elements: refs.length ? new caterwaul_global.syntax(',', refs) :
                                                                                                                                                     undefined})},

      macroexpander_invocation_template = caterwaul_global.parse('if (result = _expander.apply(this, _path_reference_object)) return result'),
      generate_macroexpander_invocation = function (pattern_data, pattern, variables) {return macroexpander_invocation_template.replace(
                                                   {_expander:              new caterwaul_global.ref(pattern_data[pattern.id()].expander),
                                                    _path_reference_object: generate_path_reference_object(pattern, variables, pattern_data[pattern.id()].wildcard_paths)})},

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






// Macro forms.
// Before version 1.0 most caterwaul macros were defined ad-hoc; as such the standard library felt chaotic and irregular. Caterwaul 1.0 introduces macro-patterns, which are abstractions to make
// it easier to define regular and predictable syntax macros. Starting with caterwaul 1.0, many macros are defined in terms of their meaning rather than their appearance. For examples of this,
// see sdoc::js::behaviors/core/adverb (for a macro form definition), sdoc::js::behaviors/core/words (for macro definitions), and sdoc::js::behaviors/core/javascript-forms (for form definitions).

//   Defining a macro form.
//   You can define a new macro form using caterwaul's macro_form() method. This takes the name of the form to define and a function that accepts a name, definition, and form and performs the
//   actual macro definition. For example, this is how you might define adverbs as described above:

//   | caterwaul.macro_form('adverb', function (name, definition, form) {
//       this.rmacro(form.replace({_adverb: name}), definition);
//     });

//   The function you give it will be invoked for each new adverb or adverb form. This function is also bound as a method called 'define_adverb'.

  caterwaul_global.
    method('macro_form', function () {for (var i = 0, l = arguments.length - 1; i < l; ++i) this.define_macro_form(arguments[i], arguments[l]); return this}).
    method('define_macro_form', function (name, define) {
      var names = name + 's', form = name + '_form', forms = name + '_forms', define_name = 'define_' + name;

      return this.
        shallow(names, []).method(name, function () {
          for (var fs = this[forms], def = this[define_name], i = 0, l = arguments.length - 1, definition = this.ensure_expander(arguments[l]), lj = fs.length; i < l; ++i) {
            for (var name = arguments[i], j = 0; j < lj; ++j) def.call(this, name, definition, fs[j]);
            this[names].push({name: name, definition: definition})}
          return this}).

        shallow(forms, []).method(form, function () {
          for (var xs = this[names], def = this[define_name], i = 0, l = arguments.length, lj = xs.length; i < l; ++i) {
            for (var form = this.ensure_syntax(arguments[i]), j = 0; j < lj; ++j) def.call(this, xs[j].name, xs[j].definition, form);
            this[forms].push(form)}
          return this}).

         method(define_name, function () {return define.apply(this, arguments), this})});
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
//         this.macro(qs[foo], qs[bar]);
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
//           this.macro(gensym_1, function () {
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

    var nontrivial_function_pattern         = caterwaul_global.parse('function (_args) {_body}'),
        trivial_function_pattern            = caterwaul_global.parse('function () {_body}'),
        nontrivial_function_gensym_template = caterwaul_global.parse('function (_args, _gensym) {_body}'),
        trivial_function_gensym_template    = caterwaul_global.parse('function (_gensym) {_body}'),

        mark_nontrivial_function_macro = function (references) {return function (match) {
                                           var s      = gensym(),
                                               result = nontrivial_function_gensym_template.replace({_args: match._args, _gensym: s, _body: annotate_functions_in(match._body, references)});
                                           return references[s] = {tree: result}, result}},

        mark_trivial_function_macro    = function (references) {return function (match) {
                                           var s = gensym(), result = trivial_function_gensym_template.replace({_gensym: s, _body: annotate_functions_in(match._body, references)});
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

    nontrivial_gensym_detection_pattern = caterwaul_global.parse('function (_args, _gensym) {_body}'),
    trivial_gensym_detection_pattern    = caterwaul_global.parse('function (_gensym) {_body}'),

    wrapped_compile = function (original, references) {return function (tree, environment) {
                        var matches = tree.match(nontrivial_gensym_detection_pattern) || tree.match(trivial_gensym_detection_pattern), k = matches && matches._gensym.data;

                        if (matches && references[k]) if (references[k].compiled) throw new Error('detected multiple compilations of ' + references[k].tree.serialize());
                                                      else                        references[k].compiled = tree, references[k].environment = merge({}, this.globals, environment);
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

      variables_for             = function (tree, environment, globals) {
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




caterwaul.field('version', '6a811c7393fc37a9e514e90087d555be').check_version();
// Generated by SDoc 




// Core behaviors.
// These are pulled from behaviors/core/ and add standard macros and code generation facilities to the core compiler.



// Core caterwaul behaviors | Spencer Tipping
// Licensed under the terms of the MIT source code license

// Core meta-behaviors.
// These provide methods required by other behaviors to be defined.



// Adverb macro forms | Spencer Tipping
// Licensed under the terms of the MIT source code license

// Introduction.
// Many macros in caterwaul function as adverbs from a linguistic point of view. Adverbs in English modify a process, but generally the process is more relevant than the adverb so we talk about
// it first. (Hence sentences such as 'go there if you need to' -- here 'if you need to' is the adverb, and it comes after the rest.)

  caterwaul.macro_form('adverb', 'modified_adverb', function (name, def, form) {this.macro(form.replace({it: name}), def)});
// Generated by SDoc 





// Adjective macro forms | Spencer Tipping
// Licensed under the terms of the MIT source code license

// Introduction.
// Unlike adverbs, adjectives generally wrap a value as opposed to modifying a verb. It's a subtle distinction, but adjectives are often more noticeable (they come before the noun in English),
// and they can have a very direct impact on the context of the values they modify. A regular adjective takes no parameters other than the thing it's modifying, whereas a modified adjective takes
// an extra modifier parameter. For example:

// | caterwaul.adjective('qs', function (tree) {return new this.ref(tree)});       // No modifiers, since qs[] requires no extra information
//   caterwaul.modified_adjective('mapped_through', '(_modifiers)(_expression)');  // We need to know what to map it through

  caterwaul.macro_form('adjective', 'modified_adjective', function (name, def, form) {this.macro(form.replace({it: name}), def)});
// Generated by SDoc 




// Language specializations.
// These provide configurations that specialize caterwaul to operate well with a given programming language. This is relevant because not all languages compile to Javascript the same way, and
// caterwaul should be able to adapt to the syntactic limitations of generated code (and thus be usable with non-Javascript languages like Coffeescript).



// Javascript macro forms | Spencer Tipping
// Licensed under the terms of the MIT source code license

// Introduction.
// This module creates macro forms optimized for hand-coded Javascript. They won't work well at all for Coffeescript or other variants that don't support the side-effect comma operator.

  caterwaul.configuration('core.js', function () {

// Adjective and adverb forms.
// These are designed to be fairly unusual in normal Javascript code (since we don't want collisions), but easy to type. Multiple precedence levels are provided to make it easier to avoid
// having to use grouping operators.

    this.adjective_form('it[_expression]', '_expression |it', '_expression /it').
         modified_adverb_form('it[_modifiers][_expression]', 'it[_modifiers] in _expression', 'it._modifiers[_expression]', 'it._modifiers in _expression',
                              '_expression, it[_modifiers]', '_expression |it[_modifiers]', '_expression /it[_modifiers]', '_expression -it[_modifiers', '_expression -it- _modifiers',
                              '_expression, it._modifiers',  '_expression |it._modifiers',  '_expression /it._modifiers',  '_expression -it._modifiers');

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

    this.macro('_string', function (match) {
      var s = match._string.data, q = s.charAt(0);
      if (q !== '\'' && q !== '"' || ! /#\{[^\}]+\}/.test(s)) return false;

      for (var pieces = [], i = 1, l = s.length - 1, brace_depth = 0, got_hash = false, start = 1, c; i < l; ++i)
        if (brace_depth) if ((c = s.charAt(i)) === '}')  --brace_depth || pieces.push(s.substring(start, i)) && (start = i + 1), got_hash = false;
                         else                            brace_depth += c === '{';
        else             if ((c = s.charAt(i)) === '#')  got_hash = true;
                         else if (c === '{' && got_hash) pieces.push(s.substring(start, i - 1)), start = i + 1, ++brace_depth;
                         else                            got_hash = false;

      pieces.push(s.substring(start, l));

      for (var escaped = new RegExp('\\\\' + q, 'g'), i = 0, l = pieces.length; i < l; ++i) if (i & 1) pieces[i] = this.parse(pieces[i].replace(escaped, q)).as('(');
                                                                                            else       pieces[i] = new this.syntax(q + pieces[i] + q);
      return new this.syntax('+', pieces).unflatten().as('(')});

//   Destructuring function creation.
//   This is a beautiful hack made possible by Internet Explorer. We can intercept cases of assigning into a function and rewrite them to create a function body. For example, f(x) = y becomes the
//   regular assignment f = function (x) {return y}. Because this macro is repeatedly applied we get currying for free.

    this.macro('_left(_args) = _right', '_left = (function (_args) {return _right})')});
// Generated by SDoc 




// Word definitions.
// These define basic words that are considered central to caterwaul.



// Quotation behavior | Spencer Tipping
// Licensed under the terms of the MIT source code license

// Introduction.
// Quotation is very important for defining macros. It enables the qs[] form in your code, which returns a piece of quoted syntax. qs is an adjective, and its exact rendition depends on which
// language port you're using. For the native JS port, it will be enabled in these forms:

// | qs[x]
//   x /qs

// Also available is qse[], which pre-expands the syntax tree before returning it.

  caterwaul.configuration('core.quote', function () {this.adjective('qs', function (match) {return new this.ref(match._expression)}).
                                                          adjective('qse', function (match) {return new this.ref(this.macroexpand(match._expression))})});
// Generated by SDoc 





// Common adjectives and adverbs | Spencer Tipping
// Licensed under the terms of the MIT source code license

// Introduction.
// This behavior installs a bunch of common words and sensible behaviors for them. The goal is to handle most Javascript syntactic cases by using words rather than Javascript primitive syntax.
// For example, constructing lambdas can be done with 'given' rather than the normal function() construct:

// | [1, 2, 3].map(x + 1, given[x])        // -> [1, 2, 3].map(function (x) {return x + 1})

// In this case, given[] is registered as a postfix binary adverb. Any postfix binary adverb forms added later will extend the possible uses of given[].

  caterwaul.configuration('core.words', function () {

// Scoping and referencing.
// These all impact scope or references somehow -- in other words, they create variable references but don't otherwise impact the nature of evaluation.

//   Function words.
//   These define functions in some form. given[] and bgiven[] are postfix adverbs to turn an expression into a function; given[] creates a regular closure while bgiven[] preserves the closure
//   binding. They're aliased to the more concise fn[] and fb[] for historical and ergonomic reasons. For example:

//   | var f = fn[x] in x + 1
//     var f = x + 1 |given[x];
//     var f = x + 1 |given.x;

    this.modified_adverb('given',  'from',  'fn', '(function (_modifiers) {return _expression})').
         modified_adverb('bgiven', 'bfrom', 'fb', '(function (t, f) {return (function () {return f.apply(t, arguments)})})(this, (function (_modifiers) {return _expression}))');

//   Side-effecting.
//   The goal here is to take an existing value, modify it somehow, and then return it without allocating an actual variable. This can be done using the /effect[] adverb, also written as /se[].
//   Older versions of caterwaul bound the variable as _; version 1.0 changes this convention to bind the variable to 'it'. For example:

//   | hash(k, v) = {} /effect[it[k] = v];
//     compose(f, g)(x) = g(x) -then- f(it);

    this.modified_adverb('effect', 'se',              '(function (it) {return (_modifiers), it}).call(this, (_expression))').
         modified_adverb('then',   're', 'returning', '(function (it) {return (_modifiers)}).call(this, (_expression))');

//   Scoping.
//   You can create local variables by using the where[] and bind[] adverbs. If you do this, the locals can all see each other since they're placed into a 'var' statement. For example:

//   | where[x = 10][alert(x)]
//     alert(x), where[x = 10]
//     bind[f(x) = x + 1] in alert(f(10))

    this.modified_adverb('where', 'bind', '(function () {var _modifiers; return (_expression)}).call(this)');

// Control flow modifiers.
// These impact how something gets evaluated.

//   Conditionals.
//   These impact whether an expression gets evaluated. x /when[y] evaluates to x when y is true, and y when y is false. Similarly, x /unless[y] evaluates to x when y is false, and !y when y is
//   true. A final option 'otherwise' is like || but can have different precedence:

//   | x = x /otherwise.y + z;

    this.modified_adverb('when',      '((_modifiers) && (_expression))').
         modified_adverb('unless',    '(! (_modifiers) && (_expression))').
         modified_adverb('otherwise', '((_expression) || (_modifiers))');

//   Collection-based loops.
//   These are compact postfix forms of common looping constructs. Rather than assuming a side-effect, each modifier returns an array of the results of the expression.

//   | console.log(it), over[[1, 2, 3]]            // logs 1, then 2, then 3
//     console.log(it), over_keys[{foo: 'bar'}]    // logs foo
//     console.log(it), over_values[{foo: 'bar'}]  // logs bar

    this.modified_adverb('over',        this.with_gensyms(
           '(function () {for (var gensym_xs = (_modifiers), gensym_result = [], gensym_i = 0, gensym_l = gensym_xs.length, it; gensym_i < gensym_l; ++gensym_i) ' +
                         '  it = gensym_xs[gensym_i], gensym_result.push(_expression); return gensym_result}).call(this)')).

         modified_adverb('over_keys',   this.with_gensyms(
           '(function () {var gensym_x = (_modifiers), gensym_result = []; ' +
                         'for (var it in gensym_x) Object.prototype.hasOwnProperty.call(gensym_x, it) && gensym_result.push(_expression); return gensym_result}).call(this)')).

         modified_adverb('over_values', this.with_gensyms(
           '(function () {var gensym_x = (_modifiers), gensym_result = [], it; ' +
                         'for (var gensym_k in gensym_x) Object.prototype.hasOwnProperty.call(gensym_x, gensym_k) && (it = gensym_x[gensym_k], gensym_result.push(_expression));' +
                         'return gensym_result}).call(this)'));

//   Condition-based loops.
//   These iterate until something is true or false, collecting the results of the expression and returning them as an array. For example:

//   | console.log(x), until[++x >= 10], where[x = 0]      // logs 1, 2, 3, 4, 5, 6, 7, 8, 9

    this.modified_adverb('until', this.with_gensyms('(function () {var gensym_result = []; while (! (_modifiers)) gensym_result.push(_expression); return gensym_result}).call(this)'))});
// Generated by SDoc 




// Libraries.
// These apply more advanced syntactic transforms to the code and can depend on the words defined above.



// Context-sensitive syntax tree traversal | Spencer Tipping
// Licensed under the terms of the MIT source code license

// Introduction.
// A recurring pattern in previous versions of caterwaul was to clone the global caterwaul function and set it up as a DSL processor by defining a macro that manually dictated tree traversal
// semantics. This was often difficult to implement because any context had to be encoded bottom-up and in terms of searching rather than top-down inference. This library tries to solve this
// problem by implementing a grammar-like structure for tree traversal.

//   Sequence DSL example.
//   Caterwaul 0.4 introduced the seq[] macro, which enabled most Javascript operators to be reinterpreted as sequence methods. Implementing this transform was fairly gnarly; each macro needed to
//   specify whether it would expand its left/right sides, and such rules could be only one layer deep. Many of the macros looked like this (converted to caterwaul 1.0 notation):

//   | _xs *[_body]   ->  _xs.map(_body, given[_, _i])
//     _xs *~[_body]  ->  qs[_xs.map(_body, given[_, _i])].replace({_xs: match._xs, _body: macroexpand(match._body)) /given.match

//   A more useful approach is to define semantic tags for different parse states and to use those tags to expand various regions of code. For example:

//   | _xs *[_body]   ->  _xs.map(_body, given[_, _i])
//     _xs *~[_body]  ->  _xs.map(seq[_body], given[_, _i])

//   Here the seq[] tag is used to indicate expansion by the named 'seq' transformer.

//   Alternation.
//   You can create alternatives to specify what happens if one macroexpander fails to match a tree. Like a packrat grammar, the first matching alternative is taken with no backtracking. This is
//   done by specifying alternatives in an array:

//   | _node._class -> ['dom_node[_node].addClass(_class)', 'html[_node]._class']

//   The actual mechanism here uses a truth check against the output of the caterwaul function's macroexpand_single() method, which returns a falsy value if no macros matched or the
//   macroexpansion failed to transform anything. (Presumably macros that match would elect to transform the syntax tree somehow.)

//   Default behaviors.
//   A significant advantage of using a structured approach to tree-parsing is that you can define the default behavior for non-matching cases. For many operator-overloading macros we want to
//   leave non-matching cases alone but continue diving through the syntax tree. This is done internally by using 'map' with a function:

//   | seq = caterwaul.grammar();
//     seq.on(null, seq);
// Generated by SDoc 





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





// Implicit lexical pattern | Spencer Tipping
// Licensed under the terms of the MIT source code license

// Introduction.
// Often expressions will be evaluated within some context that impacts their behavior. While adverbs can establish context by wrapping an expression somehow, sometimes it isn't sufficient to
// treat an expression as being opaque. For example, suppose we're writing unit tests and want to assert equivalence. We could say this:

// | [1, 2, 3].reverse() /must_be[[3, 2, 1]]

// But it isn't clear what kind of equivalence relation we should be using. In this case we need to bind a local variable to provide that default:

// | [1, 2, 3].reverse() /must_be[[3, 2, 1]] /where[the_equivalence_relation(x, y) = x.length === y.length && ...]
//   [1, 2, 3].reverse() /must_be[[3, 2, 1]] /under[caterwaul.unit.array_equivalence]              // a more concise way to say it

// This pattern of using the 'the_' prefix is what I'm calling the implicit lexical pattern. The idea is that you can have multiple the_ variables bound at once, and inner ones shadow outer ones
// (much like you'd expect in English). You can ask about one by just referring to it:

// | console.log(the_equivalence_relation)

//   Immutability.
//   You should never reassign one of these context variables! Rather, you should rebind it using an adverb. The reason for this is that they're really globals in a sense; they're defined
//   potentially far outside of their use site.
// Generated by SDoc 





// Unit testing behavior | Spencer Tipping
// Licensed under the terms of the MIT source code license

// Introduction.
// This behavior provides adjectives and adverbs useful for unit testing. It also makes use of the implicit pattern (a way to propagate settings through a lexical scope).
// Generated by SDoc 





// Code trace behavior | Spencer Tipping
// Licensed under the terms of the MIT source code license

// Introduction.
// The tracing configuration lets you create traces of code as it executes. It gives you a uniform interface to observe the evaluation of each expression in the program. To do this, first enable
// the 'trace' configuration, then add hooks. For example, here's a very simple profiler (it doesn't account for 'own time', just 'total time'):

// | var tracer  = caterwaul.clone('trace');
//   var timings = {};
//   var timers  = [];
//   tracer.on_before_trace(timings[expression.id()] = timings[expression.id()] || 0, timers.push(+new Date()), given[expression]).
//           on_after_trace(timings[expression.id()] += +new Date() - timers.pop(),                             given[expression, value]);

// Interface details.
// Tracing things involves modifying the generated expressions in a specific way. First, the tracer marks that an expression will be evaluated. This is done by invoking a 'start' function, which
// then alerts all of the before-evaluation listeners. Then the tracer evaluates the original expression, capturing its output and alerting listeners in the process. Listeners are free to use
// and/or modify this value, but doing so may change how the program runs. (Note that value types are immutable, so in this case no modification will be possible.)

// There is currently no way to catch errors generated by the code. This requires a more aggressive and much slower method of tracing, and most external Javascript debuggers can give you a
// reasonable stack trace. (You can also deduce the error location by observing the discrepancy between before and after events.)

// Here is the basic transformation applied to the code:

// | some_expression   ->   (before_hook(qs[some_expression]), after_hook(qs[some_expression], some_expression))

// Note that the tracer inserts itself as an after-step in the compilation process. This means that if you have other after-configurations, you should think about whether you want them to operate
// on the traced or untraced code. If untraced, then you should configure caterwaul with those configurations first:

// | caterwaul.clone('X trace')    // X sees untraced code, then trace takes X's output
//   caterwaul.clone('trace X')    // X sees traced code, which is probably not what you want

// Note that because tracing uses syntax refs you can't precompile traced code. Normally you wouldn't want to anyway, but it will throw an error if you do.

// The hard part.
// If Javascript were any kind of sane language this module would be trivial to implement. Unfortunately, however, it is fairly challenging, primarily because of two factors. One is the role of
// statement-mode constructs, which can't be wrapped directly inside function calls. The other is method invocation binding, which requires either (1) no record of the value of the method itself,
// or (2) caching of the object. In this case I've written a special function to handle the caching to reduce the complexity of the generated code.

  caterwaul.configuration('core.trace', function () {this.after(this.trace)}).shallow('trace', caterwaul.clone().configure(caterwaul.clone('core.js core.words core.quote')(function () {
    this.event('before_trace', 'after_trace').method('tmacro', this.macro(lhs, expand_traces(rhs)) /given[lhs, rhs]),

//   Expression-mode transformations.
//   Assuming that we're in expression context, here are the transforms that apply. Notationally, H[] means 'hook this', M[] means 'hook this method call', E[] means 'trace this expression
//   recursively', and S[] means 'trace this statement recursively'. It's essentially a context-free grammar over tree expressions.

    this.shallow('expression', this.clone(function () {
      this.variadic('assignment_operator', this.tmacro(qs[_x     = _y].replace({'=': op}), qs[H[_x           = E[_y]]].replace({'=': op})).
                                                tmacro(qs[_x[_y] = _z].replace({'=': op}), qs[H[E[_x][E[_y]] = E[_z]]].replace({'=': op})).
                                                tmacro(qs[_x._y  = _z].replace({'=': op}), qs[H[E[_x]._y     = E[_z]]].replace({'=': op})) | given.op).
           variadic('binary_operator',     this.tmacro(qs[_x + _y].replace({'+': op}), qs[H[E[_x] + E[_y]]].replace({'+': op}))            | given.op).
           variadic('unary_operator',      this.tmacro(qs[+_x].replace({'u+': 'u#{op}'}), qs[H[+T[_x]]].replace({'u+': 'u#{op}'}))         | given.op),

      this.tmacro('_x', 'H[_x]').                                                                                       // Base case: identifier or literal
           tmacro('(_x)', '(E[_x])').                                                                                   // Destructuring of parens
           tmacro('++_x', 'H[++_x]').tmacro('--_x', 'H[--_x]').tmacro('_x++', 'H[_x++]').tmacro('_x--', 'H[_x--]').     // Increment/decrement (can't trace original value)

           tmacro('_x, _y',                 'E[_x], E[_y]').                                                            // Preserve commas -- works in an argument list
           tmacro('_x._y',                  'H[E[_x]._y]').                                                             // No tracing for constant attributes
           tmacro('typeof _x',              'H[typeof _x]').                                                            // No tracing for typeof since the value may not exist
           tmacro('delete _x._y',           'H[delete E[_x]._y]').                                                      // Lvalue, so no tracing for the original
           tmacro('_o._m(_xs)',             'M[E[_o], _m, [E[_xs]]]').                                                  // Use M[] to provide correct binding via apply()
           tmacro('{_ps}',                  'H[{E[_ps]}]').                                                             // Hook the final object and distribute across k/v pairs (more)
           tmacro('_k: _v',                 '_k: E[_v]').                                                               // Ignore keys (which are constant)
           tmacro('[_xs]',                  'H[[E[_xs]]]').                                                             // Hook the final array and distribute across elements
           tmacro('_x ? _y : _z',           'H[E[_x] ? E[_y] : E[_z]]').
           tmacro('function (_xs) {_body}', 'H[function (_xs) {S[_body]}]'),                                            // Trace body in statement mode rather than expression mode

      this.assignment_operator(it) -over- qw('= += -= *= /= %= &= |= ^= <<= >>= >>>='),                                 // Use methods above to define these regular macros
      this.binary_operator(it)     -over- qw('() [] + - * / % < > <= >= == != === !== in instanceof ^ & | && ||'),
      this.unary_operator(it)      -over- qw('+ - void new')})),

//   Statement-mode transformations.
//   A lot of the time this will drop back into expression mode. However, there are a few cases where we need disambiguation. One is the var statement, where we can't hook the result of the
//   assignment. Another is the {} construct, which can be either a block or an object literal.

    this.shallow('statement', this.clone(function () {
      this.tmacro('_x',                                    'E[_x]').
           tmacro('{_x}',                                  '{S[_x]}').
           tmacro('_x; _y',                                'S[_x]; S[_y]').

           tmacro('function _f(_args) {_body}',            'function _f(_args) {S[_body]}').
           tmacro('_x, _y',                                'S[_x], S[_y]').
           tmacro('_x = _y',                               '_x = E[_y]').
           tmacro('var _xs',                               'var S[_xs]').
           tmacro('const _xs',                             'const S[_xs]').

           tmacro('if (_x) _y',                            'if (E[_x]) S[_y]').
           tmacro('if (_x) _y; else _z',                   'if (E[_x]) S[_y]; else S[_z]').
           tmacro('if (_x) {_y} else _z',                  'if (E[_x]) {S[_y]} else S[_z]').

           tmacro('switch (_c) {_body}',                   'switch (E[_c]) {S[_body]}').
           tmacro('with (_x) _y',                          'with (E[_x]) S[_y]').

           tmacro('for (_x) _y',                           'for (S[_x]) S[_y]').
           tmacro('for (_x; _y; _z) _body',                'for (S[_x]; E[_y]; E[_z]) S[_body]').
           tmacro('while (_x) y',                          'while (E[_x]) S[_y]').
           tmacro('do _x; while (_y)',                     'do S[_x]; while (E[_y])').
           tmacro('do {_x} while (_y)',                    'do {S[_x]} while (E[_y])').

           tmacro('try {_x} catch (_e) {_y}',              'try {S[_x]} catch (_e) {S[_y]}').
           tmacro('try {_x} catch (_e) {_y} finally {_z}', 'try {S[_x]} catch (_e) {S[_y]}').

           tmacro('return _x',                             'return E[_x]').
           tmacro('return',                                'return').
           tmacro('throw _x',                              'throw E[_x]').
           tmacro('break _label',                          'break _label').
           tmacro('break',                                 'break').
           tmacro('continue _label',                       'continue _label').
           tmacro('continue',                              'continue').
           tmacro('_label: _stuff',                        '_label: S[_stuff]')})),

    where[self                                                 = this,
          qw(s)                                                = s.split(/\s+/),

          expand_traces_in(tree)                               = 

          before_hook(tree)                                    = self.before_trace(tree),
          after_hook(tree, value)                              = self.after_trace(tree, value) -returning- value,
          after_method_hook(tree, object, method, parameters)  = self.before_trace(tree[0]) -then- self.after_trace(tree[0], resolved) -then-
                                                                 self.after_trace(tree, resolved.apply(object, parameters)) -where[resolved = object[method]],

          before_hook_ref                                      = new this.ref(before_hook),
          after_hook_ref                                       = new this.ref(after_hook),
          after_method_hook_ref                                = new this.ref(after_method_hook),

          expression_hook_template                             = qs[_before_hook(_tree, _index), _after_hook(_tree, _index, _expression)].as('('),
          expression_hook(tree, index)                         = expression_hook_template.replace({_before_hook: before_hook, _after_hook: after_hook, _tree: new self.ref(tree),
                                                                                                   _index: index.toString(), _expression: tree}),

          indirect_method_hook_template                        = qs[_before_hook(_tree, _index), _after_hook(_tree, _index, _object, _method, [_parameters])].as('('),
          quote_method_name(method)                            = '"#{method.data.replace(/"/g, "\\\"")}"',

          method_hook(tree, index, object, method, parameters) = indirect_method_hook_template.replace({_before_hook: this.before_method_hook, _after_hook: this.after_method_hook,
                                                                                                        _tree: new this.ref(tree), _index: index.toString(), _object: object, _method: method,
                                                                                                        _parameters: parameters}),

          direct_method_hook(tree, index, match)               = method_hook(tree, index, match._object, quote_method_name(match._method), match._parameters),
          indirect_method_hook(tree, index, match)             = method_hook(tree, index, match._object, match._method, match._parameters)]})));
// Generated by SDoc 



// Generated by SDoc 



// Generated by SDoc 
