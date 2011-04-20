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
                              '_expression, it._modifiers',  '_expression |it._modifiers',  '_expression /it._modifiers',  '_expression -it._modifiers', '_expression <it> _modifiers');

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
    this.event('before_trace', 'after_trace'),

//   Expression-mode transformations.
//   Assuming that we're in expression context, here are the transforms that apply. Notationally, H[] means 'hook this', M[] means 'hook this method call', E[] means 'trace this expression
//   recursively', and S[] means 'trace this statement recursively'. It's essentially a context-free grammar over tree expressions.

//   Note that assignment_operator, binary_operator, and unary_operator don't technically need to be variadic in this case. I've just defined them this way because it's generally what you'd want
//   to do with unary methods that might reasonably be called repeatedly on different arguments.

    this.shallow('expression', expression.after(trace_directive_expander).configure(function () {
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
           tmacro('_o._m(_xs)',             'D[E[_o], _m, [E[_xs]]]').                                                  // Use D[] to indicate direct method binding
           tmacro('_o[_m](_xs)',            'I[E[_o], E[_m], [E[_xs]]]').                                               // Use I[] to indicate indirect method binding
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

//   There's some interesting stuff going on with = and commas. The reason is that sometimes you have var definitions, and they contain = and , trees that can't be traced quite the same way that
//   they are in expressions. For example consider this:

//   | var x = 5, y = 6;

//   In this case we can't evaluate 'x = 5, y = 6' in expression context; if we did, it would produce H[x = H[5]], H[y = H[6]], and this is not valid Javascript within a var statement. Instead,
//   we have to produce x = H[5], y = H[6]. The statement-mode comma and equals rules do exactly that. Note that we don't lose anything by doing this because in statement context the result of an
//   assignment is never used anyway.

    this.shallow('statement', statement.after(trace_directive_expander).configure(function () {
      this.tmacro('_x',                                    'E[_x]').                         tmacro('for (_x) _y',                           'for (S[_x]) S[_y]').
           tmacro('{_x}',                                  '{S[_x]}').                       tmacro('for (_x; _y; _z) _body',                'for (S[_x]; E[_y]; E[_z]) S[_body]').
           tmacro('_x; _y',                                'S[_x]; S[_y]').                  tmacro('while (_x) y',                          'while (E[_x]) S[_y]').
                                                                                             tmacro('do _x; while (_y)',                     'do S[_x]; while (E[_y])').
           tmacro('function _f(_args) {_body}',            'function _f(_args) {S[_body]}'). tmacro('do {_x} while (_y)',                    'do {S[_x]} while (E[_y])').
           tmacro('_x, _y',                                'S[_x], S[_y]').
           tmacro('_x = _y',                               '_x = E[_y]').                    tmacro('try {_x} catch (_e) {_y}',              'try {S[_x]} catch (_e) {S[_y]}').
           tmacro('var _xs',                               'var S[_xs]').                    tmacro('try {_x} catch (_e) {_y} finally {_z}', 'try {S[_x]} catch (_e) {S[_y]} finally {S[_z]}').
           tmacro('const _xs',                             'const S[_xs]').                  tmacro('try {_x} finally {_y}',                 'try {S[_x]} finally {S[_y]}').

           tmacro('if (_x) _y',                            'if (E[_x]) S[_y]').              tmacro('return _x',                             'return E[_x]').
           tmacro('if (_x) _y; else _z',                   'if (E[_x]) S[_y]; else S[_z]').  tmacro('return',                                'return').
           tmacro('if (_x) {_y} else _z',                  'if (E[_x]) {S[_y]} else S[_z]'). tmacro('throw _x',                              'throw E[_x]').
                                                                                             tmacro('break _label',                          'break _label').
           tmacro('switch (_c) {_body}',                   'switch (E[_c]) {S[_body]}').     tmacro('break',                                 'break').
           tmacro('with (_x) _y',                          'with (E[_x]) S[_y]').            tmacro('continue _label',                       'continue _label').
                                                                                             tmacro('continue',                              'continue').
                                                                                             tmacro('_label: _stuff',                        '_label: S[_stuff]')})),

//   Hook generation.
//   Most of the actual hook generation code is fairly routine for JIT stuff. Where it gets interesting is the macro definitions that cause the code to be traversed. These aren't pre-expanded;
//   rather, they're converted into gensyms to avoid collisions with the code and then treated as macros. However, macroexpanding these definitions can't be done by the same macroexpander that
//   generates them. The reason is the existence of patterns like _x -> H[_x] -- this will loop forever, since _x matches H[_x].

//   Therefore, there's a separate caterwaul function that is preconfigured to handle the hook signals. This one recognizes the gensyms produced during the grammar expansion and creates the
//   actual hook definitions. This in turn kicks off more grammar expansions and so forth until the only expansions left are terminal ones. At this point the process halts.

    this.shallow('trace_directive_expander', trace_directive_expander.configure(function () {
      this.method('tmacro', this.macro(convert_trace_directives_in(lhs), rhs) /given[lhs, rhs]).

           tmacro('H[_x]',                              given.match in expression_hook(match._x)).
           tmacro('D[_object, _method, [_parameters]]', given.match in direct_method_hook  (qs[_object._method (_parameters)].replace(match), match)).
           tmacro('I[_object, _method, [_parameters]]', given.match in indirect_method_hook(qs[_object[_method](_parameters)].replace(match), match)).

           tmacro('E[_x]',                              given.match in expression(match._x)).
           tmacro('S[_x]',                              given.match in statement(match._x))})),

//   Entry point.
//   This is where we the trace function starts. We assume statement context, which is required for eval-style functionality to work correctly.

    this.final_macro('_x', statement(match._x) /given.match),

    where[self                                                = this,
          qw(s)                                               = s.split(/\s+/),

          // Tracing setup: caterwaul functions to carry out the trace annotations.
          trace_directive_aliases                             = {H: this.gensym(), M: this.gensym(), S: this.gensym(), E: this.gensym()} /effect[it[it[k]] = k, over_keys[it]],
          convert_trace_directives_in(tree)                   = self.ensure_syntax(tree).replace(trace_directive_aliases),

          with_tmacro()                                       = this.method('tmacro', this.final_macro(lhs, convert_trace_directives_in(rhs)) /given[lhs, rhs]),

          statement                                           = this.clone(with_tmacro),
          expression                                          = this.clone(with_tmacro),
          trace_directive_expander                            = this.clone(),

          // Hook methods: invoked from inside the generated code on runtime-generated values (though 'tree' is a ref to the syntax tree).
          before_hook(tree)                                   = self.before_trace(tree),
          after_hook(tree, value)                             = self.after_trace(tree, value) -returning- value,
          after_method_hook(tree, object, method, parameters) = self.before_trace(tree[0]) -then- self.after_trace(tree[0], resolved) -then-
                                                                self.after_trace(tree, resolved.apply(object, parameters)) -where[resolved = object[method]],

          before_hook_ref                                     = new this.ref(before_hook),
          after_hook_ref                                      = new this.ref(after_hook),
          after_method_hook_ref                               = new this.ref(after_method_hook),

          // Hook generators: called at compile-time to generate trees that refer to the hook methods above.
          expression_hook_template                            = qs[_before_hook(_tree), _after_hook(_tree, _expression)].as('('),
          expression_hook(tree)                               = expression_hook_template.replace({_before_hook: before_hook_ref, _after_hook: after_hook_ref, _tree: new self.ref(tree),
                                                                                                  _expression: tree.as('(')}),

          indirect_method_hook_template                       = qs[_before_hook(_tree), _after_hook(_tree, _object, _method, [_parameters])].as('('),
          quote_method_name(method)                           = '"#{method.data.replace(/"/g, "\\\"")}"',

          method_hook(tree, object, method, parameters)       = indirect_method_hook_template.replace({_before_hook: before_hook_ref, _after_hook: after_method_hook_ref,
                                                                                                       _tree: new self.ref(tree), _object: object, _method: method, _parameters: parameters}),

          direct_method_hook(tree, match)                     = method_hook(tree, match._object, quote_method_name(match._method), match._parameters),
          indirect_method_hook(tree, match)                   = method_hook(tree, match._object, match._method, match._parameters)]})));
// Generated by SDoc 



// Generated by SDoc 
