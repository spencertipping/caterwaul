// Code walking library | Spencer Tipping
// Licensed under the terms of the MIT source code license

// Introduction.
// This module abstracts out some code common to tree walkers. Code walkers are similar to regular macros, but they generally have a bit more context. For example, Montenegro
// (http://github.com/spencertipping/montenegro) defines a markup language for HTML that includes context-sensitivity:

// | html[div.foo > div.bar]       // A <div> within another <div>
//   html[div.foo >= div.bar]      // The value div.bar within a <div> -- we stopped walking on the right-hand side of >=.

// The right-hand side is processed differently depending on the operator. Taking the naive approach of using regular functions gives you a regular language over tree traversal; that is, you can
// say things like this (abstractly):

// | f(left > right)  = f(left) > f(right)
//   f(left >= right) = f(left) >= right

// At present I can't imagine a situation when you would need context-free or universal traversal over syntax trees. Both are supported, however, in case you want uber-powerful traversal
// functionality. For example, here's a tree walker that transforms nodes with a prime number of unary negations:

// | f(n)(qs[-_]) = 
// Generated by SDoc 