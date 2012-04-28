# Syntax tree structure

Caterwaul 1.3 used a loose and inefficient syntax tree model that more resembled high-level lexer output than it did an AST. 1.4 and forward parse things at a higher level, often accumulating
sub-terms into a single node. For example, caterwaul 1.3 parses 'if (x) {y}' as (if (( x) ({ y)), whereas 1.4 would parse it as (if x ({ y)). The syntactic preservation of things like the
block-as-braces is important for precise idiomatic rendering.

Manipulation in 1.4 should primarily be done by find/replace operations rather than map(). Searching through syntax trees can be made more efficient than map() will be, and building up a
find/replace pair could save some allocations (though a smarter map() implementation should help here as well).