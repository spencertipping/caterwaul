// Caterwaul parser module | Spencer Tipping
// Licensed under the terms of the MIT source code license

// Introduction.
// The caterwaul parser uses a combinatory approach, much like Haskell's parser combinator library. The parser consumes elements from a finite input stream and emits the parse tree at each step.
// Note that parsers generated here are not at all insightful or necessarily performant. In particular, left-recursion isn't resolved, meaning that the parser will loop forever in this case.

//   Basis and acknowledgements.
//   This parser library is based heavily on Chris Double's JSParse (available at github.com/doublec/jsparse), which implements a memoized combinatory PEG parser. If you are looking for a simple
//   and well-designed parsing library, I highly recommend JSParse; it will be easier to use and more predictable than caterwaul.parser. Like JSParse, these parsers are memoized and use parsing
//   expression grammars.

// Internals.
// Memoization is restricted to a session rather than being global. This prevents the space leak that would otherwise occur if the parser outlived the result. Behind the scenes the parser
// promotes the input into a parse-state (very much like the ps() function in JSParse). Like other caterwaul libraries, this one uses non-macro constructs behind the scenes. You can easily get at
// this by accessing stuff inside the caterwaul.parser namespace.

  caterwaul.tconfiguration('std seq continuation memoize', 'parser.core', function () {
    this.namespace('parser') /se[_.parse_state(input, i, result, memo) = undefined /se[this.input = input, this.i = i, this.result = result, this.memo = memo],
                                 _.parse_state /se[_.from_input(input) = new _.parse_state(input, 0, null, {}),
                                                   _.prototype /se[
                                   _.accept(n, r) = new this.constructor(this.input, this.i + n, r, this.memo),
                                   _.then(state)  = this.accept(state.i - this.i, this.result instanceof Array ? this.result.concat([state.result]) : [this.result, state.result]),
                                   _.fail()       = false]],

                                 _.memoize                             = caterwaul.memoize.from(fn[c, as, f][m[f.id] || (m[f.id] = f.apply(c, as)), where[m = as[0].memo]]),
                                 _.identify(f)                         = f /se[_.id = caterwaul.gensym()],
                                 _.parser(f)                           = _.identify(_.memoize(f)),
                                 _.defparser(name, f)                  = _.parsers[name]() = _.parser(f.apply(this, arguments)),
                                 _.parsers                             = {}]}).

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

  tconfiguration('std seq continuation', 'parser.c', function () {
    this.configure('parser.core').parser.defparser('c', fn[x][fn[state][state.accept(x.length, x), when[x === state.input.substring(state.i, x.length)]]])}).

//   Sequences.
//   Denoted using the '%' operator. The resulting AST is flattened into a finite caterwaul sequence. For example:

//   | peg[c('a') % c('b') % c('c')]('abc')                     // -> ['a', 'b', 'c']
//     peg[c('a') % c('b')] >>= fn[xs][xs.join('/')]('ab')      // -> 'a/b'

  tconfiguration('std seq continuation', 'parser.seq', function () {
    this.configure('parser.core').parser.defparser('seq', fn_[l[as = seq[~arguments]] in fn[state][as.foldl(fn[st, f][st && st.then(f(st))], state)]])}).

//   Alternatives.
//   Denoted using the '/' operator. Alternation is transparent; that is, the chosen entry is returned identically. Entries are tried from left to right without backtracking. For example:

//   | peg[c('a') / c('b')]('a')                                // -> 'a'

  tconfiguration('std seq continuation', 'parser.alt', function () {
    this.configure('parser.core').parser.defparser('alt', fn_[l[as = seq[~arguments]] in fn[state][as.exists(fn[f][f(state)])]])}).

//   Repetition.
//   Denoted using subscripted ranges, similar to the notation used in regular expressions. For example:

//   | peg[c('a')[0]]                   // Zero or more 'a's
//     peg[c('b')[1,4]                  // Between 1 and 4 'b's

  tconfiguration('std seq continuation', 'parser.times', function () {
    this.configure('parser.core').parser.defparser('times', fn[p, lower, upper][fn[state][
      upper -= lower,
      call/cc[fn[cc][opt.unroll[i, lower][(state = p(state)) ? result.push(state.result) : cc(false)], true]] &&
      call/cc[l*[count = 0, loop(cc) = ++count < upper ? (state = p(state)) ? result.push(state.result) && call/tail[loop(cc)] : cc(false) : cc(state.accept(0, result))] in loop]]])}).

//   Optional things.
//   Denoted using arrays. Returns a tree of undefined if the option fails to match. For example:

//   | peg[c('a') % [c('b')] % c('c')]  // a followed by optional b followed by c

  tconfiguration('std seq continuation', 'parser.opt', function () {
    this.configure('parser.core').parser.defparser('opt', fn[p][fn[state][state.accept(n, r), where*[s = p(state), n = s && s.i - state.i, r = s && s.result]]])}).

//   Positive and negative matches.
//   Denoted using unary + and -, respectively. These consume no input but make assertions:

//   | peg[c('a') % +c('b')]            // Matches an 'a' followed by a 'b', but consumes only the 'a'
//     peg[c('a') % -c('b')]            // Matches an 'a' followed by anything except 'b', but consumes only the 'a'

  tconfiguration('std seq continuation', 'parser.match', function () {
    this.configure('parser.core').parser /se[_.defparser('match',  fn[p][fn[state][p(state) /re[_  && state.accept(0, _.result)]]]),
                                             _.defparser('reject', fn[p][fn[state][p(state) /re[!_ && state.accept(0, null)]]])]}).

//   Lazy matching.
//   Because all peg[] expressions eta-expand the functions they generate, you can refer to rules that don't exist at definition-time:

//   | parse('xyz'),
//     where*[rule1 = peg[c('x') / rule2 >>= fn_['x']],
//            rule2 = peg[c('X')],
//            parse = peg[rule1 % c('y') % c('z')]];
// Generated by SDoc 
