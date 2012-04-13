Caterwaul JS | Spencer Tipping
Licensed under the terms of the MIT source code license

# Introduction

Caterwaul is a compiler generator and programming language for Javascript. You can use it to parse and compile other languages as well.

    caterwaul.offline(':all', function () {
      (caterwaul = $) /-$.merge/ capture [

# Syntax trees

Caterwaul 1.4 uses a completely different strategy for managing syntax trees. Rather than being loosely-structured variadic nodes, syntax trees are now organized into two variants. The first
is a 'cons', which encodes its identity in its prototype. The second is an 'atom', which contains a string identifier. Unlike previous versions of caterwaul, parsing is now executed by syntax
trees. This reduces efficiency but provides a much richer interface for defining languages. Parsers are defined using annotated regular expression subsets:

    if_statement:     /if space \(cond\) then_part (else else_part)?/, then_part: /statement/, else_part: /statement/,
    for_statement:    /for space \(for_init cond; increment\) body/, for_init: /statement/,
    for_in_statement: /for space \(identifier in value\) body/,
    while_statement:  /while space \(cond\) body/, ...
    statement:        /if_statement | for_statement | for_in_statement | while_statement | .../,
    space:            /\s* space | \/\/.*\n space | \/\*((?!\*\/)[\S\s]\*\/ space/

Each nontrivial rule produces a separate cons class specialized to the given syntax form. These classes can convert bidirectionally and losslessly to strings. The following regexp constructs
are supported:

    1. Literals. These are just sequences of characters: /foo/. Metacharacters such as '.' are interpreted in the regexp sense.
    2. References. These are also just sequences of characters, but they name another rule and trigger recursive descent. 'space' in the example above is one such rule.
    3. Grouping. This is used only to modify the precedence of operators; the data from match groups is not recoverable specifically. (Every variant piece is recorded, so there would be no
       point.)
    4. Optional pieces: /x?/
    5. Character classes: /[...]/
    6. Unbounded repetition: /x+/, /x*/
    7. Negative lookahead: /(?!foo)/
    8. Some special characters, including \n, \s, and \S

Other regexp constructs are not parsed and therefore not supported. Whitespace within a regular expression is ignored, as are any flags.

## Variant encoding

Regexps are separated into constant and variant pieces. Here is how the pieces are broken out:

    1. x? creates a zero/one variant for x. This is encoded by a singular accessor x() whose return value is null/non-null.
    2. x* and x+ create plural variants for x. If x compiles into a string, then the accessor x() returns a string; otherwise x() returns an array.
    3. Literals don't create variants.
    4. 

    language(rules) = 