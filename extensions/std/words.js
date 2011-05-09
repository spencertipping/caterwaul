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

// Error handling.
// Javascript in particular has clunky error handling constructs. These words provide error handling in expression context.

  language.modifier('wobbly', 'chuck', '(function () {throw _expression}).call(this)'),
  language.parameterized_modifier('failover', 'safely', '(function () {try {return (_expression)} catch (e) {return (_parameters)}}).call(this)'),

// Scoping and referencing.
// These all impact scope or references somehow -- in other words, they create variable references but don't otherwise impact the nature of evaluation.

//   Function words.
//   These define functions in some form. given[] and bgiven[] are modifiers to turn an expression into a function; given[] creates a regular closure while bgiven[] preserves the closure binding.
//   For example:

//   | var f = x + 1 |given[x];
//     var f = x + 1 |given.x;

    language.parameterized_modifier('given',  '(function (_parameters) {return _expression})'),
    language.parameterized_modifier('bgiven', '(function (t, f) {return (function () {return f.apply(t, arguments)})})(this, (function (_parameters) {return _expression}))'),

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
