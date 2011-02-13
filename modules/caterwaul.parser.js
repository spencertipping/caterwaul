// Caterwaul parser module | Spencer Tipping
// Licensed under the terms of the MIT source code license

// Introduction.
// The caterwaul parser uses a combinatory approach, much like Haskell's parser combinator library. The parser consumes elements from a finite input stream and emits the parse tree at each step.
// Note that parsers generated here are not at all insightful or necessarily performant. In particular, left-recursion isn't resolved, meaning that the parser will loop forever in this case.

//   Basis and acknowledgements.
//   This parser library is based heavily on Chris Double's JSParse (available at github.com/doublec/jsparse), which implements a memoized combinatory PEG parser. If you are looking for a simple
//   and well-designed parsing library, I highly recommend JSParse; it will be easier to use and more predictable than caterwaul.parser. Like JSParse, these parsers are memoized and use parsing
//   expression grammars. However, this parser is probably quite a lot slower.

// Internals.
// Memoization is restricted to a session rather than being global. This prevents the space leak that would otherwise occur if the parser outlived the result. Behind the scenes the parser
// promotes the input into a parse-state (very much like the ps() function in JSParse). Like other caterwaul libraries, this one uses non-macro constructs behind the scenes. You can easily get at
// this by accessing stuff inside the caterwaul.parser namespace.

  caterwaul.tconfiguration('std seq continuation memoize', 'parser.core', function () {
    this.namespace('parser') /se[_.parse_state(input, i, result, memo) = undefined /se[this.input = input, this.i = i, this.result = result, this.memo = memo],
                                 _.parse_state /se.s[s.from_input(input) = new _.parse_state(input, 0, null, {}),
                                                     s.prototype /se[_.accept(n, r) = new this.constructor(this.input, n, r, this.memo),
                                                                     _.toString()   = 'ps[#{this.input.substr(this.i)}, #{this.r}]']],

                                 _.memoize               = caterwaul.memoize.from(fn[c, as, f][k in m ? m[k] : (m[k] = f.apply(c, as)),
                                                                                               where[k = '#{f.original.memo_id}|#{as[0].i}', m = as[0].memo || (as[0].memo = {})]]),
                                 _.promote_non_states(f) = fn[state][f.call(this, state.constructor === _.parse_state ? state : _.parse_state.from_input(state))],
                                 _.identify(f)           = f /se[_.memo_id = caterwaul.gensym()],
                                 _.parser(f)             = _.promote_non_states(_.memoize(_.identify(f))),
                                 _.defparser(name, f)    = _.parsers[name]() = _.parser(f.apply(this, arguments)),
                                 _.parsers               = {}]}).

// Notation.
// Parsers are written as collections of named nonterminals. Each nonterminal contains a mandatory expansion and an optional binding:

// | peg[c('a') % c('b')]                                 // A grammar that recognizes the character 'a' followed by the character 'b'
//   peg[c('a') % c('b') >> fn[ab][ab[0] + ab[1]]]        // The same grammar, but the AST transformation step appends the two characters

// The >> notation is borrowed from Haskell (would have been >>=, but this requires a genuine lvalue on the left); the idea is that the optional binding is a monadic transform on the parse-state
// monad. (The only difference is that you don't have to re-wrap the result in a new parse state using 'return' as you would in Haskell -- the return here is implied.) The right-hand side of >>
// can be any expression that returns a function. It will be evaluated directly within its lexical context, so the peg[] macro is scope-transparent modulo gensyms and the namespace importing of
// caterwaul.parser.parsers.

// Parsers are transparent over parentheses. Only the operators described below are converted specially.

//   Strings.
//   Strings are parsable by using the c(x) function, which is named this because it matches a constant.

//   | peg[c('x')]                 // Parses the string 'x'
//     peg[c('foo bar')]           // Parses the string 'foo bar'
//     peg[c(['foo', 'bar'])]      // Parses either the string 'foo' or the string 'bar', in mostly-constant time in the size of the array (see below)
//     peg[c({foo: 1, bar: 2})]    // Parses either the string 'foo' or the string 'bar'; returns 1 if 'foo' matched, 2 if 'bar' matched (also in mostly-constant time)
//     peg[c(/\d+/, 1)]            // Parses strings of digits with a minimum length of 1. The parse is greedy, and the regexp's exec() method output is returned.
//     peg[c(fn[s][3])]            // Always takes three characters, regardless of what they are.

//   The c() function can take other arguments as well. One is an array of strings; in this case, it matches against any string in the array. (Matching time is O(l), where l is the number of
//   distinct lengths of strings.) Another is an object; if any directly-contained (!) attribute of the key is parsed and consumed, then the value associated with that key is returned. The time
//   for this algorithm is O(l), where l is the number of distinct lengths of the keys in the object.

//   Another option is specifying a regular expression with a minimum length. The rule is that the parser fails immediately if the regexp doesn't match the minimum length of characters. If it
//   does match, then the maximum matching length is found. This ends up performing O(log n) regexp-matches against the input, for a total runtime of O(n log n). (The algorithm here is an
//   interesting one: Repeatedly double the match length until matching fails, then binary split between the last success and the first failure.) Because of the relatively low performance of this
//   regexp approach, it may be faster to use a regular finite-automaton approach for routine parsing and lexing. Then again, O(log n) linear-time native code calls may be faster than O(n)
//   constant-time calls in practice.

//   Finally, you can also specify a function. If you do this, the function will be invoked on the input and the current offset, and should return the number of characters it intends to consume.
//   It returns a falsy value to indicate failure.

    tconfiguration('std seq continuation', 'parser.c', function () {
      this.configure('parser.core').parser.defparser('c', fn[x, l][
        x.constructor === String   ? fn[state][state.accept(state.i + x.length, x), when[x === state.input.substr(state.i, x.length)]] :
        x instanceof Array         ? l[index = index_entries(x)] in fn[state][check_index(index, state.input, state.i) /re[_ && state.accept(state.i + _.length, _)]] :
        x.constructor === RegExp   ? fn[state][fail_length(x, state.input, state.i, l) /re[_ > l && split_lengths(x, state.input, state.i, l, _)
                                                                                                    /re[state.accept(state.i + _, x.exec(state.input.substr(state.i, _)))]]] :
        x.constructor === Function ? fn[state][x.call(state, state.input, state.i) /re[_ && state.accept(state.i + _, state.input.substr(state.i, _))]] :
                                     l[index = index_entries(seq[sk[x]])] in fn[state][check_index(index, state.input, state.i) /re[_ && state.accept(state.i + _.length, x[_])]],

        where*[check_index(i, s, p) = seq[i |[_['@#{s}'] && s, where[s = s.substr(p, _.length)]]],
               index_entries(xs)    = l*[xsp = seq[~xs], ls = seq[sk[!(xsp *[[_.length, true]])] *[Number(_)]]] in
                                      seq[~ls.slice().sort(fn[x, y][y - x]) *~l[!(xsp %[_.length === l] *[['@#{_}', true]] + [['length', l]])]],

               fail_length(re, s, p, l)      = p + l < s.length && re.test(s.substr(p, l)) ? fail_length(re, s, p, l << 1) : l,
               split_lengths(re, s, p, l, u) = l*[b(cc, l, u) = l + 1 < u ? re.test(s.substr(p, u)) ? call/tail[b(cc, l + (u - l >> 1), u)] : call/tail[b(cc, l, u - (u - l >> 1))] : l] in
                                               call/cc[fn[cc][b(cc, l, u)]]]])}).

//   Sequences.
//   Denoted using the '%' operator. The resulting AST is flattened into a finite caterwaul sequence. For example:

//   | peg[c('a') % c('b') % c('c')]('abc')                     // -> ['a', 'b', 'c']
//     peg[c('a') % c('b') >> fn[xs][xs.join('/')]]('ab')       // -> 'a/b'

    tconfiguration('std opt seq continuation', 'parser.seq', function () {
      this.configure('parser.core').parser.defparser('seq', fn_[l[as = arguments] in fn[state][
        call/cc[fn[cc][opt.unroll[i, as.length][(state = as[i](state)) ? result.push(state.result) : cc(false)], state.accept(state.i, result)]], where[result = []]]])}).

//   Alternatives.
//   Denoted using the '/' operator. Alternation is transparent; that is, the chosen entry is returned identically. Entries are tried from left to right without backtracking. For example:

//   | peg[c('a') / c('b')]('a')        // -> 'a'

    tconfiguration('std seq', 'parser.alt', function () {
      this.configure('parser.core').parser.defparser('alt', fn_[l[as = seq[~arguments]] in fn[state][seq[as |[_(state)]]]])}).

//   Repetition.
//   Denoted using subscripted ranges, similar to the notation used in regular expressions. For example:

//   | peg[c('a')[0]]                   // Zero or more 'a's
//     peg[c('b')[1,4]                  // Between 1 and 4 'b's

    tconfiguration('std opt seq continuation', 'parser.times', function () {
      this.configure('parser.core').parser.defparser('times', fn[p, lower, upper][fn[state][
        call/cc[fn[cc][opt.unroll[i, lower][++count, (state = p(state)) ? result.push(state.result) : cc(false)], true]] &&
        call/cc[l*[loop(cc) = (! upper || count++ < upper) && p(state) /se[state = _, when[_]] ? result.push(state.result) && call/tail[loop(cc)] :
                                                                                                 cc(state.accept(state.i, result))] in loop], where[count = 0, result = []]]])}).

//   Optional things.
//   Denoted using arrays. Returns a tree of undefined if the option fails to match. For example:

//   | peg[c('a') % [c('b')] % c('c')]  // a followed by optional b followed by c

    tconfiguration('std seq continuation', 'parser.opt', function () {
      this.configure('parser.core').parser.defparser('opt', fn[p][fn[state][state.accept(n, r), where*[s = p(state), n = s ? s.i : state.i, r = s && s.result]]])}).

//   Positive and negative matches.
//   Denoted using unary + and -, respectively. These consume no input but make assertions:

//   | peg[c('a') % +c('b')]            // Matches an 'a' followed by a 'b', but consumes only the 'a'
//     peg[c('a') % -c('b')]            // Matches an 'a' followed by anything except 'b', but consumes only the 'a'

    tconfiguration('std seq continuation', 'parser.match', function () {
      this.configure('parser.core').parser /se[_.defparser('match',  fn[p][fn[state][p(state) /re[_  && state.accept(state.i, state.result)]]]),
                                               _.defparser('reject', fn[p][fn[state][p(state) /re[!_ && state.accept(state.i, null)]]])]}).

//   Binding.
//   This is fairly straightforward; a parser is 'bound' to a function by mapping through the function if it is successful. The function then returns a new result based on the old one. Binding is
//   denoted by the >> operator.

    tconfiguration('std seq continuation', 'parser.bind', function () {
      this.configure('parser.core').parser /se[_.defparser('bind', fn[p, f][fn[state][p(state) /re[_ && _.accept(_.i, f.call(_, _.result))]]])]}).

// DSL macro.
// Most of the time you'll want to use the peg[] macro rather than hand-coding the grammar. The macro both translates the tree and introduces all of the parsers as local variables (like a with()
// block, but much faster and doesn't earn the wrath of Douglas Crockford).

  tconfiguration('std seq continuation', 'parser.dsl', function () {
    this.configure('parser.core').rmacro(qs[peg[_]], fn[x][with_gensyms[_gs][qg[l*[_bindings, _gs = _parser] in fn_[_gs.apply(this, arguments) /re[_ && _.result]]]].replace({
                                                             _bindings: new this.syntax(',', seq[sp[this.parser.parsers] *[qs[_x = _y].replace({_x: _[0], _y: new outer.ref(_[1])})]]),
                                                             _parser:   this.parser.dsl.macroexpand(x)}),
                                                           where[outer = this]]),
    this.parser.dsl = caterwaul.global().clone() /se[
      _.macro(qs[_], fn[x][x]) /se.dsl[
        seq[sp[unary]  *![dsl.rmacro(_[1], fn[x][qs[_f(_x)].replace({_f: _[0], _x: x})])]],
        seq[sp[binary] %[_[1].constructor === String] *!op[dsl.rmacro(qs[_], fn[t][qs[_f(_t)].replace({_f: op[0], _t: t.flatten(op[1]) /se[_.data = ',']}), when[t.data === op[1]]])]]],

      _.macro(qs[_ >> _], fn[p, f][qs[bind(_p, _f)].replace({_p: this.macroexpand(p), _f: f})]),

      _.macro(qs[_].as('('), fn[x][_.macroexpand(x).as('(')]).rmacro(qs[_[_]],    fn[x, lower]       [qs[times(_x, _lower, 0)]     .replace({_x: x, _lower: lower})]).
                                                              rmacro(qs[_[_, _]], fn[x, lower, upper][qs[times(_x, _lower, _upper)].replace({_x: x, _lower: lower, _upper: upper})]),

      where*[unary = {opt: qs[[_]], match: qs[+_], reject: qs[-_]}, binary = {alt: '/', seq: '%'}]]}).

// Final configuration.
// Loads both the classes and the peg[] macro.

  configuration('parser', function () {
    this.configure('parser.core parser.c parser.seq parser.alt parser.times parser.opt parser.match parser.bind parser.dsl')});
// Generated by SDoc 
