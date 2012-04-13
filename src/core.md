Caterwaul JS | Spencer Tipping
Licensed under the terms of the MIT source code license

# Introduction

Caterwaul 1.4 is a self-hosting reimplementation of the caterwaul compiler and standard library. It contains a number of improvements over previous versions:

    1. The parser reads comments and attaches them to nearby syntax nodes.
    2. The parser annotates each node with a line/column.
    3. Tree serialization produces human-readable output.
    4. The macroexpander is now contextualized rather than implicitly universal.
    5. Syntax trees use prototypes to implement polymorphic consing, accelerating comparisons.
    6. Syntax tree matching is highly optimized.

The standard library is mostly the same, but it has some subtle semantic differences. The largest one is that -seq is now allowed to fuse loops; this may change the way certain comprehensions
behave in pathological cases.

## Interoperability with Javascript

As before, caterwaul interoperates with Javascript by occupying a superset of Javascript's grammar:

    caterwaul.waul()(function () {return x, where [x = 10]});

Unlike before, caterwaul 1.4 allows you to define your own operators. The standard library does this to provide ||=, &&=, ::, :::, ->, =>, <-, etc. These won't work when using caterwaul from
inside Javascript; to use these you'll need to use the waul compiler.

    caterwaul.offline(':all', function () {

# Instantiation

Caterwaul 1.4 is much more extensible than previous versions. It allows you to change the lex and parse tables, which lets you define custom operators and block-level constructs. The tradeoff
is that the 'caterwaul' global is now a compiler-generator, not a compiler itself. A vanilla Javascript compiler is provided as 'caterwaul.js'; so, for instance:

    tree = caterwaul.js.parse('foo + bar')        <- here, foo + bar is parsed as Javascript
    caterwaul.js.compile(tree)                    <- 'foo + bar' is compiled as Javascript; this does not involve any macroexpansion
    caterwaul.js('foo + bar')                     <- parse, then compile

A caterwaul language compiler can be generated using the .waul() method:

    waul = caterwaul.waul({options})
    tree = waul.parse('foo :: bar')
    waul.compile(tree)                            <- compile() will macroexpand the tree automatically before passing it to caterwaul.js.compile()

# Syntax trees

Caterwaul 1.4 uses a completely different strategy for managing syntax trees. Rather than being loosely-structured variadic nodes, syntax trees are now organized into two variants. The first
is a 'cons', which encodes its identity in its prototype. The second is an 'atom', which contains a string identifier.

Unlike previous versions of caterwaul, parsing is now executed by syntax trees. This reduces efficiency but provides a much richer interface for defining languages. Parsers are defined using
annotated regular expressions, discussed below.

      $.syntax(forms) = ctor_for(forms)
      -where [

## Defining a syntax structure

Caterwaul uses a fairly canonical grammar description structure to define parsers. This provides uniform parsing and serialization, which is useful for preserving structure. For example,
here are some annotated regexp definitions:

    /foo/                                                                                       <- literally, the string 'foo'
    /(id:foo)/                                                                                  <- the string 'foo' stored as the accessor 'id()' on the resulting cons
    /if @ws \((cond:@expression)\) @ws (lhs:@statement) @ws (else @ws (rhs:@statement))?/       <- the actual definition of an 'if' construct
    /\{(lhs:@statements)\}|(lhs:@statement);(rhs:@statements)|(lhs:@statement)/                 <- the pseudo-definition of statements

The constructs supported are:

    1. Literal matching: /foo/
    2. Binding: (x:y)
    3. Recursive descent: @x
    4. Alternation: x|y
    5. Optional matching: x?

Repetition is supported only for constant terms; it isn't supported for things like recursive descent. The reason for this has to do with binding semantics and serialization; I didn't want
to spend too much time thinking about consing up array bindings, for instance. Also, backreferences are not supported. Bindings that do not get executed are set to null.

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

    where [$()            = $.init.apply(this, arguments),
           original_$     = typeof caterwaul === 'undefined' ? void 0 : caterwaul,

           generate_key() = n[22] *['ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789$_'.charAt(Math.random() * 64 >>> 0)] -seq -re- it.join(''),
           unique         = generate_key(),

           gensym         = "[_ || '', ++c /~toString/ 36, unique] /~join/ '_'".qf -where [c = 0],  is_gensym = "_.substr(_.length - 22) === unique".qf]});