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
                              '_expression, it[_modifiers]', '_expression |it[_modifiers]', '_expression /it[_modifiers]',
                              '_expression, it._modifiers',  '_expression |it._modifiers',  '_expression /it._modifiers');

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

  caterwaul.configuration('core.quote', function () {this.adjective('qs', function (match) {return new this.ref(match._expression)})});
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

    this.modified_adverb('given',  'fn', '(function (_modifiers) {return _expression})').
         modified_adverb('bgiven', 'fb', '(function (t, f) {return (function () {return f.apply(t, arguments)})})(this, (function (_modifiers) {return _expression}))');

//   Side-effecting.
//   The goal here is to take an existing value, modify it somehow, and then return it without allocating an actual variable. This can be done using the /effect[] adverb, also written as /se[].
//   Older versions of caterwaul bound the variable as _; version 1.0 changes this convention to bind the variable to 'it'. For example:

//   | hash(k, v) = {} /effect[it[k] = v];

    this.modified_adverb('effect', 'se', '(function (it) {return (_modifiers), it}).call(this, (_expression))');

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
//   true.

    this.modified_adverb('when',   '((_modifiers) && (_expression))').
         modified_adverb('unless', '(! (_modifiers) && (_expression))');

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



// Generated by SDoc 