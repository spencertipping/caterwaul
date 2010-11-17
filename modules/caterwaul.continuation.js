// Continuation manipulation module | Spencer Tipping
// Licensed under the terms of the MIT source code license

// Introduction.
// This module provides macros to assist with continuations. The most widely-known case of continuation manipulation is probably continuation-passing-style conversion, which you use when you do
// nonblocking things such as AJAX. In this case the callback function is the continuation of the call. (I'm not going to fully explain continuations here, but
// http://en.wikipedia.org/wiki/Continuation is a good if intimidating place to start if you're into functional programming -- which I assume you are if you're using Caterwaul :).)

// Javascript's continuation support has some subtleties. First a bit of background: Most languages use asymmetric continuations; that is, the arity of functions is different from the arity of
// continuations. This is because most functions return only one value, whereas they can take many. Perl is as far as I know the only language to get this right, and even it has some weirdness
// when differentiating between scalar and list-context continuations. Anyway, Javascript is firmly asymmetric in its handling of continuations, which means that multiple-value callbacks require
// some supporting machinery before using them in a true continuation context.

// Another subtlety is how the implicit 'this' parameter is handled. Caterwaul's standard library treats a function's binding behavior more as an attribute of the function than of its invocation
// context (a step away from traditional Javascript). In the case of continuations, there are a couple of common cases:

// | 1. The continuation is a result of asynchronous communication or some such, and 'this' doesn't mean anything.
//   2. The continuation is an event callback or otherwise related to an object, so 'this' is important.

// This continuation library preserves Caterwaul's treatment of 'this'; that is, you define a continuation's binding when you create it.

//   Data flow as a graph.
//   In functional programming you can think of data flow in terms of a graph; a variable isn't a box in which to store something as much as it is a name for a link. For example, the expression
//   'let[a = 3, b = 5] in a * b + b' involves two edges, 'a' and 'b'. Each has a vertex of in-degree zero (the constants 3 and 5, respectively), forming this graph:

//   | (3) -> (*) <- (5)
//             |      V
//             +---> (+) -> (output)

//   Obviously this isn't quite how it works, since you can change a and b's values without retroactively affecting other expressions. But absent modification, at a semantic level you do get this
//   kind of data flow. Some things to note:

//   | 1. Nodes with just one outward edge can be inlined in expressions, whereas two or more edges require a temporary variable.
//     2. Nodes with no input edges are where evaluation begins.
//     3. There is always an output continuation that is not determined by the contents of an expression. (In other words, every expression returns a value, and you can send that value anywhere.)
//     4. A function is just an expression where some nodes have inputs that aren't a part of the graph.

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

// What you can do instead is eta-expand:

// | call/tail[fn[x][object.method(x)](5)];

// This will invoke object.method in the right context.

// Delimited continuations work because call/cc uses an internal while loop to forward parameters outside of the tail call. This keeps the stack bounded by a constant. Note that tail calls work
// only inside a call/cc context. You can use them elsewhere, but they will not do what you want. Also, tail calls really do have to be tail calls. You need to return the call/tail[...]
// expression in order for it to work, just like you'd have to do in Scheme or ML (except that in JS, return is explicit rather than implicit).

// Note that call/cc and call/tail are macros, not functions. The functions are available in normal Javascript form, however (no deep macro-magic is ultimately required to support delimited
// continuations). call/cc is stored as caterwaul.continuation.call_cc, and call/tail is caterwaul.continuation.call_tail. The invocation of call_tail is different from call/tail:

// | caterwaul.continuation.call_tail(f, arg1, arg2, ...);

  caterwaul.tconfiguration('std', 'continuation.delimited', function () {var magic = {};
    this.shallow('continuation', {call_cc: function (f) {var escaped = false, cc = function (x) {escaped = true; throw x}, frame = {magic: magic, continuation: f, parameters: [cc]};
                                                         try       {while ((frame = frame.continuation.apply(this, frame.parameters)) && frame && frame.magic === magic); return frame}
                                                         catch (e) {if (escaped) return e; else throw e}},
                                  call_tail: fn[f][{magic: magic, continuation: f, parameters: Array.prototype.slice.call(arguments, 1)}], magic: magic}).
         rmacro(qs[call/cc[_]],      fn[f]      [qs[qg[_call_cc(_f)]].         replace({_call_cc:   new this.ref(this.continuation.call_cc),   _f: f})]).
         rmacro(qs[call/tail[_(_)]], fn[f, args][qs[qg[_call_tail(_f, _args)]].replace({_call_tail: new this.ref(this.continuation.call_tail), _f: f, _args: args})])}).

// Graph operations.
// Normal expression-oriented programming gives you several ways to construct nodes, and variables and recursion let you form loops in the graph. However, there are several common problems for
// which variables and/or recursion (mostly just variables) are unnecessarily verbose.

//   Duplication.
//   Here's a common Javascript idiom:

//   | x && x.foo && x.foo.bar && x.foo.bar.bif

//   But since x, x.foo, and x.foo.bar are all local invariants, it would be nice to write this instead:

//   | x && it.foo && it.bar && it.baz
//     // which becomes ((x && it.foo) && it.bar) && it.baz due to left-associativity

//   Basically, because && specifies evaluation order anyway, you want to grab the value of the last thing computed and reuse it. Here's what the graph would look like (minus decisionals, which
//   are handled by && for us):

//   | (x) -[1]-> (.foo)
//      |            V
//      +--------> (&&) -[2]-> (.bar)
//                   |            V
//                   +--------> (&&) -[3]-> (.bif)
//                                |            V
//                                +--------> (&&) --> (output)

//   Here the arrows [1], [2], and [3] represent the duplication caused by 'it' in the original expression. (Each one also happens to be predicated on the truthiness of its inbound node, but only
//   because of && -- this is a bit of nonlocality that's hard to model in a continuation graph.)

//   Put into a completely different context, this is a fold (catamorphism) using &&, combined with an unfold (anamorphism) from x to x.property, where property varies depending on the unfold
//   step. Catamorphisms and anamorphisms are often present when continuation graphs have many nodes with in-degree and out-degree 2, respectively.

//   Absorption.
//   Javascript already provides a way to absorb values. The expression 'a, b' evaluates both and returns b, which corresponds roughly to this graph:

//   | (a) --> (black hole)
//     (b) --> (output)

//   Imperative programming relies heavily on this. (So does functional programming, but in a different sense. The K combinator is more of a way to create local black holes to accommodate for
//   excess duplication by other combinators than it is a way to evaluate something with side-effects.)

//   Anonymous implication.
//   The most common operation is an implication, which is invocation of a CPS-function along with its continuation. This is what happens when you make an AJAX call, for instance. So, for
//   example, here's a normal AJAX call and its corresponding CPS representation:

//   | // Using caterwaul.std:
//     $.getJSON('/some/url', fn[data][$.post('/data', data, fn[reply][console.log('Posted, and got #{reply}')])]);
//     $.getJSON('/other/url', fn[data][alert('Got #{data}')]);

//   | local['cps'][$.getJSON('/some/url') | $.post('/data', $0) | console.log('Posted, and got #{$0}'),
//                  $.getJSON('/other/url') | alert('Got #{data}')];

// End-user library.

  configuration('continuation', function () {this.configure('continuation.delimited')});

// Generated by SDoc 
