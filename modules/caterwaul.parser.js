// Caterwaul parser module | Spencer Tipping
// Licensed under the terms of the MIT source code license

// Introduction.
// The caterwaul parser uses a combinatory approach, much like Haskell's parser combinator library. The parser consumes elements from a finite input stream and emits the parse tree at each step.
// Because Javascript runtimes aren't required to optimize tail calls, it internally uses CPS and the tail-call mechanism provided by the continuation library.

// Note that parsers generated here are not at all insightful or necessarily performant. In particular, left-recursion isn't resolved, meaning that the parser will loop forever in this case. (And
// consume arbitrarily much memory without causing a stack overflow, too, since it's in CPS.)

//   Basis and acknowledgements.
//   This parser library is based heavily on Chris Double's JSParse (available at github.com/doublec/jsparse), which implements a memoized combinatory PEG parser. If you are looking for a simple
//   and well-designed parsing library, I highly recommend JSParse; it will be easier to use and more predictable than caterwaul.parser. Like JSParse, these parsers are memoized and use parsing
//   expression grammars. Unlike JSParse, this library uses CPS-conversion and macros to prevent stack overflows (which can be a drawback in the case of accidental infinite left-recursion) and to
//   maximize expressiveness, respectively.

// Internals.
// Memoization is restricted to a session rather than being global. This prevents the space leak that would otherwise occur if the parser outlived the result. Behind the scenes the parser
// promotes the input into a parse-state (very much like the ps() function in JSParse). Like other caterwaul libraries, this one uses non-macro constructs behind the scenes. You can easily get at
// this by accessing stuff inside the caterwaul.parser namespace.

//   |caterwaul.tconfiguration('std seq continuation', 'parser.core', function () {
//     this.namespace('parser') /se[_.parse_state(input, position, result, memo) = undefined /se[this.input = input, this.position = position, this.result = result, this.memo = memo],
//                                  _.parse_state.from_input(input)              = new _.parse_state(input, 0, null, {}),
//                                  _.parsers                                    = {}]}).

// Notation.
// Parsers are written as collections of named nonterminals. Each nonterminal contains a mandatory expansion and an optional binding:

// | peg[c('a') % c('b')]                                  // A grammar that recognizes the character 'a' followed by the character 'b'
//   peg[c('a') % c('b') >>= fn[ab][ab[0] + ab[1]]]        // The same grammar, but the AST transformation step appends the two characters

// The >>= notation is borrowed from Haskell; the idea is that the optional binding is a monadic transform on the parse-state monad. (The only difference is that you don't have to re-wrap the
// result in a new parse state using 'return' as you would in Haskell -- the return here is implied.) The right-hand side of >>= can be any expression that returns a function. It will be
// evaluated directly within its lexical context, so the peg[] macro is scope-transparent modulo gensyms.

// Parsers are transparent over parentheses. Only the operators described below are converted specially.

//   Strings.
//   Strings are parsable by using the c(x) function, which is named this because it matches a constant.

//   | peg[c('x')]         // Parses the string 'x'
//     peg[c('foo bar')]   // Parses the string 'foo bar'

//   |tconfiguration('std seq continuation', 'parser.c', function () {
//     this.configure('parser.core').parser.parsers.c(x) =

//   Sequences.
//   Denoted using the '%' operator. The resulting AST is flattened into a finite caterwaul sequence. For example:

//   | peg[c('a') % c('b') % c('c')]('abc')                     // -> ['a', 'b', 'c']
//     peg[c('a') % c('b')] >>= fn[xs][xs.join('/')]('ab')      // -> 'a/b'

//   Alternatives.
//   Denoted using the '/' operator. Alternation is transparent; that is, the chosen entry is returned identically. Entries are tried from left to right without backtracking. For example:

//   | peg[c('a') / c('b')]('a')                                // -> 'a'

//   Repetition.
//   Denoted using subscripted ranges, similar to the notation used in regular expressions. For example:

//   | peg[c('a')[0]]                   // Zero or more 'a's
//     peg[c('b')[1,4]                  // Between 1 and 4 'b's

//   Optional things.
//   Denoted using arrays. Returns a tree of undefined if the option fails to match. For example:

//   | peg[c('a') % [c('b')] % c('c')]  // a followed by optional b followed by c

//   Negation.
//   Denoted using !:

//   | peg[!c('a')]                     // Any character that isn't an a

//   Positive and negative matches.
//   Denoted using unary + and -, respectively. These consume no input but make assertions:

//   | peg[c('a') % +c('b')]            // Matches an 'a' followed by a 'b', but consumes only the 'a'
//     peg[c('a') % -c('b')]            // Matches an 'a' followed by anything except 'b', but consumes only the 'a'

//   Lazy matching.
//   Because all peg[] expressions eta-expand the functions they generate, you can refer to rules that don't exist at definition-time:

//   | parse('xyz'),
//     where*[rule1 = peg[c('x') / rule2 >>= fn_['x']],
//            rule2 = peg[c('X')],
//            parse = peg[rule1 % c('y') % c('z')]];
// Generated by SDoc 
