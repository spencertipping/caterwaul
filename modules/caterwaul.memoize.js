// Memoization module | Spencer Tipping
// Licensed under the terms of the MIT source code license

// Introduction.
// This memoizer is implemented a bit differently from Perl's memoize module; this one leaves more up to the user. To mitigate the difficulty involved in using it I've written a couple of default
// proxy functions. The basic model is that functions are assumed to map some 'state' (which obviously involves their arguments, but could involve other things as well) into either a return value
// or an exception. This memoization library lets you introduce a proxy around a function call:

// | var proxy = fn[invocation, f, fstate][f.apply(invocation.context, invocation.args)];  // Identity memoizer (does nothing)
//   var memoizer = caterwaul.memoize(proxy);
//   var fibonacci = memoizer(fn[x][x < 2 ? x : fibonacci(x - 1) + fibonacci(x - 2)]);     // Just as slow as ever

// Here the 'fstate' argument represents state specific to the function being memoized. 'f' isn't the real function; it's a wrapper that returns an object describing the return value. This object
// contains:

// | 1. The amount of time spent executing the function. This can be used later to expire memoized results.
//   2. Any exceptions thrown by the function.
//   3. Any value returned by the function.
// Generated by SDoc 
