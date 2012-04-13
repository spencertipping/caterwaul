Caterwaul core | Spencer Tipping
Licensed under the terms of the MIT source code license

# Introduction

Caterwaul 1.4 is a self-hosting reimplementation of the caterwaul compiler and standard library. It contains a number of improvements over previous versions:

    1. The parser reads comments and attaches them to nearby syntax nodes.
    2. Tree serialization produces human-readable output.
    3. The macroexpander is now contextualized rather than implicitly universal.
    4. Syntax trees use indexed data elements to accelerate comparisons.
    5. Syntax tree matching is highly optimized.

The standard library is mostly the same, but it has some subtle semantic differences. The largest one is that -seq is now allowed to fuse loops; this may change the way certain comprehensions
behave in pathological cases.

## Interoperability with Javascript

As before, caterwaul interoperates with Javascript by occupying a superset of Javascript's grammar:

    caterwaul(':all')(function () {return x, where [x = 10]});

Unlike before, caterwaul 1.4 allows you to define your own operators. The standard library does this to provide ||=, &&=, ::, :::, ->, =>, <-, etc. These won't work when using caterwaul from
inside Javascript; to use these you'll need to use the waul compiler.

    caterwaul(':all')(function () {

# Javascript backend

Caterwaul is primarily a Javascript program, so the Javascript backend is integrated into the core. As of 1.4, caterwaul generates human-readable code with comments. This is useful for
debugging and for using caterwaul to contribute to a Javascript codebase. The backend is written to generate code that is as performant and idiomatic as possible.

The new parser reads comments from the original source and stores them as node hints. It also tracks the input line/column, storing these on the node as well. This information is later used
for debugging and output annotation. For example, the resulting code could read something like this:

    var f = function (x) {return x + 1};  // Compiled from f(x) = x + 1 on line 485, column 8

To get this output, you would put 'Compiled from ..., column 8' as a hint on the '=' or 'var' node. Either will work; if 'var' has no hints, it will inherit its hint from the '='.

## Logical groups

Groups are used to cause related statements to be bundled together. This is useful for macros and it makes the resulting code look much nicer. A group can have a note; if it does, the note
is rendered at the top. Groups are delineated by paragraph breaks, which in code is usually two consecutive newlines. Apart from impacting the formatting, groups have the ability to return
values. This allows you to create a boundary that isn't a function. For example:

    '(function (x) {return x + _group})'.qs.replace({_group: $.group('var x = 10; x'.qs).hint('Use 10')})

This will work by merging the scopes nondestructively; each variable defined by a group is converted into a gensym to eliminate collisions. So the resulting code would be this:

    (function (x) {
      // Use 10
      var x1 = 10;
      return x + x1;
    })

# Parse trees

Syntax trees fall into two categories. One is the 'operator' category, which is used for any syntax tree with children. Operator trees contain a numeric 'data' attribute that indexes into a
table of predefined operators. The other category is 'identifier' trees, which have no children and have arbitrary string contents.

Tree classes are parser-specific and close over the operator table. You probably shouldn't mix trees from different parsers, though it will most likely work for basic use cases.

## Linking

Trees are singly-linked (parent->child). Parents link to children using named methods; these methods are:

    lhs()  <- for binary operators, returns the left-hand operand; for ternaries, returns the 'then' case; for right-unary, returns the operand
    rhs()  <- for binary operators, returns the right-hand operand; for ternaries, returns the 'else' case; for left-unary, returns the operand
    cond() <- for ternary operators, returns the conditional expression
    name() <- for named functions, returns the name as an identifier node

Statement block-mode constructs use 'cond' to mean 'the thing in parentheses':

    for (cond) {lhs}       if (cond) {lhs} [else {rhs}]
    while (cond) {lhs}     do {lhs} while (cond)
    try {lhs} rhs          catch (cond) lhs [finally {rhs}]
    with (cond) {lhs}      switch (cond) {lhs}
    function (cond) {lhs}  function name (cond) {lhs}
    return [cond]          var cond             <- important!
    break [cond]           continue [cond]
    throw [cond]           case cond

This layout has the desirable property that 'lhs' is always interpreted in statement mode, and 'cond' is usually interpreted in expression mode. The only exception is 'for', which allows for
two different interpretations of its conditional structure:

    for (init; cond; increment) {body}
    for (x in y) {body}

Return, throw, break, continue, var, and case all use 'cond' instead of 'lhs' because their argument is not in the same context. For instance, 'return {foo: bar}' causes {foo: bar} to be
interpreted as an expression, not a statement. Similarly, 'break foo' causes 'foo' to be interpreted as a label, not a statement.

## Hinting

Caterwaul syntax trees contain two kinds of hints. The first is the line number, useful for tracing errors back to their source. The second is a list of notes that will be compiled as
comments. This list is initially populated based on comments placed near the node. So, for example:

    foo + bar   // sum these two things

Here, '+' is annotated with the note 'sum these two things'. This note follows the '+' node through various code-generation phases and may appear as a comment in the final output code. Hints
are accessible via the .hint() method:

    node.hint('sum these two things')

Generally, the outermost hinted operator will determine the annotation for a given line. Only one annotation will be shown per line.

    where [$() = $.init.apply(this, arguments)]})();