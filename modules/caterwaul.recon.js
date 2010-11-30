// Caterwaul JS Recon module | Spencer Tipping
// Licensed under the terms of the MIT source code license

// Code reconnaissance.
// This is probably one of the coolest things about Caterwaul, especially on IE. It has the ability to annotate your source code and capture any value returned by any expression, including
// figuring out when any expression produces an error. This approach works at the large-scale; by capturing every value over a span of time, you can then go back through the history
// programmatically and pick out the ones of interest.

// Recon works by post-processing your macroexpanded code. It traverses the expression tree inserting calls to a new hook function. This hook function records the calls that it receives,
// allowing you to browse the execution history.

// So, for example, basic transformation works like this (where f1 ... f4 are monitor functions):

// | var foo = function (x) {return x + 1};    =>   var foo = f1(function (x) {return f4(f2(x) + f3(1))});

// This works for value-space, but errors can be difficult to find with just a value trace. Under a hypothetical (but not yet implemented) more aggressive transformation the code would become
// this:

// | var foo = function (x) {return x + 1};    =>   var foo = (function () {try {return f1(function (x) {
//                                                               return f4((function () {try {return ((function () {try {return f2(x)} catch (e) {e1(e); throw e}})() +
//                                                                                                    (function () {try {return f3(1)} catch (e) {e2(e); throw e}})())}
//                                                                                       catch (e) {e3(e); throw e}})());
//                                                               })}
//                                                               catch (e) {e4(e); throw e}})();

// It should be clear from this example that using aggressive error tracing is a much bigger deal than just using value tracing. Depending on your JS interpreter it could mean that your program
// becomes as much as 100x slower (and unfortunately it could also create stack overflows where there weren't any, since twice as many stack frames will be allocated). Also, you can triangulate
// the error position without wrapping everything in a try{} block. The way to do this is to look at the list of expressions that are still waiting to be evaluated. These, if followed
// backwards, lead directly to the error -- at least, provided that the error stops your program.

//   Annotating a function.
//   This is really easy. You create a recon function like this:

//   | var annotator = caterwaul.clone('std seq continuation recon');
//     var to_be_annotated = function () {...};
//     var annotated = annotator(to_be_annotated);

//   At this point, using the 'annotated' function will start recording to the annotator's event log. Note that to_be_annotated should /not/ be pre-macroexpanded! Hard references are valid only
//   the first time you compile a function, so the annotator is in fact a regular caterwaul function.

//   Event log API.
//   It's fairly straightforward to find out what happened in your program (presumably you have access to a shell of some sort at this point). All you have to do is refer to the annotator's log,
//   like this:

//   | caterwaul.recon.log.length

//   Because a recon log is a sequence (see caterwaul.seq.js.sdoc), you can also subscript the log as you would an array, e.g. recon.log[10], as well as querying it in various ways. Probably
//   you'll want to query it:

//   | caterwaul.recon.log.grep('_ + _')                 // Returns a sub-log of binary additions (the sub-log has the same interface as the main one, but fewer events)
//     caterwaul.recon.log.grep('foo(5, _)', 10)         // Invocations of 'foo' on 5 and something else, returning ten events around each match for context
//     caterwaul.recon.log.grep('let[x = _] in _')       // Grep patterns are macroexpanded for you, so this will match anything generated by let[x = _] in _ (underscores are preserved as wild)

//   | ...log.grep(fn[e][e.value === undefined])         // Greps events instead of patterns, creating a sub-log of events that were mapped to truthy values
//     ...log.grep(fn[e][e.value > 4], 100)              // Returns 100 context events around each match

//   | ...log.unpaired()                                 // Find events whose pair is unset -- this almost always indicates that an error occurred (or you used an escaping continuation, if your
//                                                       // JS interpreter supports those)

//   | ...log.each(f)                                    // Invokes f on each event and returns the log
//     ...log.map(f)                                     // Invokes f on each event and returns an array of results

//   The reason you can grep() on a string (which seems superfluous given the presence of qs[]) is that debugging is often done outside of caterwaul()ed functions, so qs[] is unavailable. The
//   simplest way to specify syntax is with a string that is then parsed (we're not going for super-high-performance in a debug shell).

//   Events contain several useful pieces of information. One is a reference to the syntax node that generated them (note that statement-level constructs such as 'if', 'for', etc. are not
//   traced due to JavaScript's syntactic limitations). Another is a reference to the value that was produced (though it may have been modified since -- Caterwaul can't keep track of the
//   original in the state it was in at the time of event generation). Finally, there is some event-specific information that is also tracked. This includes a sequence number (which is equal to
//   the index in the original log; that is, caterwaul.recon.log[0].sequence === 0) and a time offset. The time offset is the number of milliseconds since the debugger was invoked on the
//   function; it is not meaningful for profiling (since a bunch of extra machinery is running inside your code), but it does give you some indication of the real-time ordering of events, as
//   well as indicating where large delays are (e.g. AJAX calls).

//   | ...log[0].node            // A reference to the syntax node
//     ...log[0].value           // A reference to the value
//     ...log[0].pending         // Truthy if this event is a 'will be evaluated' event (see below)
//     ...log[0].error           // Any error that was produced when evaluating the expression -- only available for aggressive tracing
//     ...log[0].sequence        // The index of this event in the original log (for log[0], it will always be 0)
//     ...log[0].time            // The number of milliseconds that elapsed between the original caterwaul() call and the creation of this event
//     ...log[0].pair            // The complement event -- if this one is pending, then the pair contains the value, and vice versa

//   There are a few things to note when working with events. The most important one is that an event is created not just when a value is generated; it also signifies when a value is, at some
//   point, going to be generated. For example, given this expression:

//   | x + y * z()

//   These events will appear:

//   | 1. x + y * z() will be evaluated        5. y will be evaluated          9. z = function () {return 20}
//     2. x will be evaluated                  6. y = 10                      10. z() = 20
//     3. x = 4                                7. z() will be evaluated       11. y * z() = 200
//     4. y * z() will be evaluated            8. z will be evaluated         12. x + y * z() = 204

//   The 'will be evaluated' events obviously don't have values. These instead are 'pending', such that log[0].pending === true. Here, the 'pair' properties are set like this:

//   | 1 <-> 12, 2 <-> 3, 4 <-> 11, 5 <-> 6, 7 <-> 10, 8 <-> 9.

//   Now let's suppose that z() threw an error instead of returning a number. The event stream would contain only events 1-9; anything after that would have been unwound by the exception. For
//   cases like this, the unpaired() log method gives you the error trace:

//   | ...log.unpaired()         -> sub-log of events 1, 4, and 7, which are:  x + y * z() will be evaluated
//                                                                             y * z() will be evaluated
//                                                                             z() will be evaluated

//   Because you know that z evaluated successfully -- it was defined at the time of evaluation (otherwise it would also be unpaired), the cause must be the invocation of z. Ideally z is traced
//   as well, so you can tell exactly what about it failed.

//   Configuring the annotator.
//   The 'recon' configuration adds a function, caterwaul.recon, that performs the source code annotation. It's low-level; that is, it takes a syntax tree and returns an annotated syntax tree,
//   so generally you won't use it directly. But all configuration is done by calling configuration methods on the function. So, for example, to enable aggressive annotation:

//   Configuration options such as these determine the behavior of the caterwaul.recon annotator. I mentioned earlier that you don't use caterwaul.recon directly to annotate code; what happens
//   instead is that the caterwaul function's 'init' method (which is what caterwaul() does when you use it as a function) is augmented to do this for you. So all you have to do is something
//   like this:

//   | var c = caterwaul.clone('recon');
//     c(function () {...}) ();

//   The second line automatically adds debugging annotations to the function and then invokes it.

//   Something awesome: annotating Caterwaul itself.
//   Caterwaul gives you a copy of its initialization function and lets you reinitialize the library with a transformation of itself. For example:

//   | caterwaul.reinitialize(caterwaul.clone('recon'))                  // Returns the new caterwaul, leaving the global 'caterwaul' symbol intact (as long as you didn't break deglobalize())

//   Doing this can be useful for debugging macros, configurations, or other things.

  caterwaul.tconfiguration('std seq continuation', 'recon', function () {

//     Annotation logic.
//     In a reasonably orthogonal language such as Lisp, annotating nodes is relatively trivial. However, JavaScript doesn't provide syntactic uniformity, so we have to work around some
//     constructs. This includes everything at the statement-level (e.g. if, for, var, etc.), any lvalues (though subcomponents of those lvalues can be annotated), and custom annotation for
//     function invocations. (This has to do with the fact that invocation context determines function binding.)

//     Specifically, here is the traversal pattern (where A is the annotation function and f is the hook):

//     | A(identifier)        ->    f(identifier)
//       A(x op y)            ->    f(A(x) op A(y))
//       A(op x)              ->    f(op A(x))
//       A(x.y(z))            ->    f((function () {var _gensym_ = A(x); return A(_gensym_.y).call(_gensym_, z)})())
//       A(x[y](z))           ->    f((function () {var _gensym_ = A(x); return A(_gensym_[y]).call(_gensym_, z)})())
//       A(x(y))              ->    A(x)(A(y))
//       A(if (x) y) [else z] ->    if (A(x)) A(y)
//       A({n ...})           ->    {A(n.flatten())}
//       A(x [op]= y)         ->    x [op]= A(y)
//       A(x.y [op]= z)       ->    A(x).y [op]= A(z)
//       A(x[y] [op]= z)      ->    A(x)[y] [op]= A(z)
//       ...

    this /se[_.init(f, bindings) = _.compile(_.recon.annotate(_.macroexpand(_.decompile(f))), bindings),
             _.recon             = {} /se[_.log         = seq[~[]],
                                          _.annotate(t) = null /* TODO */]]});

// Generated by SDoc 
