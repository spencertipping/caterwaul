// Divergence Improved | Spencer Tipping
// Licensed under the terms of the MIT source code license

// Divergence Improved implements a very small Lisp in JavaScript syntax. The syntax ends up looking much more like McCarthy's M-expressions than traditional S-expressions, due to the ease of
// embedding those in a JS-compatible grammar. Also, JavaScript convention makes square-bracket calls such as qs[foo] relatively uncommon, so I'm using that as the macro syntax (though of course
// you can define macros with other forms as well).

// By default, the only thing Divergence does is provide a quotation operator. For example:

// | divergence(function () {
//     return qs[x + 1];
//   });

// This function returns a syntax tree representing the expression 'x + 1'. The standard library provides additional constructs to enable macros and easy macro definitions.

this.preprocess || (this.preprocess = function (x) {return x});
preprocess (function () {

// Global management.
// Divergence creates a global symbol, divergence. Like jQuery, there's a mechanism to get the original one back if you don't want to replace it. You can call divergence.deglobalize() to return
// divergence and restore the global that was there when Divergence was loaded.

// The disgraceful hack in the fn() function is required because IE's eval() function doesn't return expressions. It is capable only of side-effecting, which we do by creating a temp variable to
// assign to and returning its modified value.

  var _divergence = this.divergence,                                fn = function () {eval('var r = (function($0, $1, $2, $3, $4){return ' + arguments[0] + '})'); return r},
                d = fn('d.init.apply(this, arguments)'),        gensym = (function (n) {return function () {return 'gensym' + (++n).toString(36)}}) (0),
               qw = fn('$0.split(/\\s+/)'),                     intern = (function (st, n) {return function (x) {return st[x] || (st[x] = ++n)}}) ({}, 0),
              own = Object.prototype.hasOwnProperty,               has = fn('own.call($0, $1)'),

              map = function (f, xs) {for (var i = 0, ys = [], l = xs.length; i < l; ++i) ys.push(f(xs[i])); return ys},
             hash = function (s) {for (var i = 0, xs = qw(s), o = {}, l = xs.length; i < l; ++i) o[xs[i]] = true; return o},

                                                              q_insert = fn('(this.left = $0).right = this, (this.right = $1).left = this'),
                                                              q_remove = fn('this.left.right = this.right, this.right.left = this.left, this'),
                                                              q_create = fn('this.left = $0, this.right = $1, this'),

     reduce_order = map(hash, ['[] . ()', 'new', 'l++ r++ l-- r-- typeof ~ ! u+ u-', '* / %', '+ -', '<< >> >>>', '< > <= >= instanceof in', '== != === !==', '&', '^', '|', '&&', '||', '?',
                               '= += -= *= /= %= &= |= ^= <<= >>= >>>=', ',']),

            right = hash('= += -= *= /= %= &= ^= |= <<= >>= >>>= ~ ! new typeof u+ u- l++ r++ l-- r-- ?'),
           prefix = hash('if function catch for switch with while do'),

// Old Rebase code that I'm keeping for reference. This will be gone in production:

// |                  unary: set(qw('u++ u-- ++ -- u+ u- u! u~ new typeof var case try finally throw return case else delete void import export ( [ { ?:')),
//                syntactic: set(qw('case var if while for do switch return throw delete export import try catch finally void with else function new typeof in instanceof')),
//                statement: set(qw('case var if while for do switch return throw delete export import try catch finally void with else')),
//                connected: set(qw('else catch finally')),                                                                       digit: set('0123456789.'.split('')),
//                    ident: set('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789$_'.split ('')),                  punct: set('+-*/%&|^!~=<>?:;.,'.split ('')),
//                    right: set(qw('= += -= *= /= %= &= ^= |= <<= >>= >>>= u~ u! new typeof u+ u- u++ u-- ++ -- ?')),          openers: {'(':')', '[':']', '{':'}', '?':':'},
//      implicit_assignment: set(qw('++ -- u++ u--')),                                                                       sandwiches: set(qw('$ $$ $$$ _ __ ___ _$ _$$ __$')),
//                  literal: set(qw('= ++ -- u++ u-- (! [! . ?: , ? u! ( { [ === !== == != ; : && ||')),                   sandwich_ops: set(qw('+ - * / % ^ | & << >> >>> < >')),
//            prefix_binary: set(qw('if function catch for switch with while')),                                                closers: {')':'(', ']':'[', '}':'{', ':':'?:'},
//             translations: {'u+':'+', 'u-':'-', 'u~':'~', 'u!':'!', 'u--':'--', 'u++':'++'},                                 arity_of: '$0.unary[$1] ? 1 : $1 == "?" ? 3 : 2'.fn(r),
//            lvalue_assign: set(qw('+= -= *= /= %= ^= |= &= <<= >>= >>>=')),                                            should_convert: '! ($0.literal[$1] || $0.syntactic[$1])'.fn(r),
//                no_spaces: set(qw('.')),

// Lexing.
// The lexer is for the most part straightforward. The only tricky bit is regular expression parsing, which requires the lexer to contextualize operators and operands. I've implemented this logic
// with an re flag that indicates whether the last token processed was an operator (if so, then we're expecting an operand and the next / delineates a regular expression).

// We mark the position before a token and then just increment the position. The token, then, can be retrieved by taking a substring from the mark to the position. This eliminates the need for
// intermediate concatenations. In a couple of cases I've gone ahead and done them anyway -- these are for operators, where we grab the longest contiguous substring that is defined. I'm not to
// worried about the O(n^2) complexity due to concatenation; they're bounded by four characters.

// OK, so why use charAt() instead of regular expressions? It's a matter of asymptotic performance. V8 implements great regular expressions (O(1) in the match length for the (.*)$ pattern), but
// the substring() method is O(n) in the number of characters returned. Firefox implements O(1) substring() but O(n) regular expression matching. Since there are O(n) tokens per document of n
// characters, any O(n) step makes lexing quadratic. So I have to use the only reliably constant-time method provided by strings, charAt() (or in this case, charCodeAt()).

// Of course, building strings via concatenation is also O(n^2), so I also avoid that for any strings that could be long. This is achieved by using a mark to indicate where the substring begins,
// and advancing i independently. The span between mark and i is the substring that will be selected, and since each substring both requires O(n) time and consumes n characters, the lexer as a
// whole is O(n). (Though perhaps with a large constant.)

//   Precomputed table values.
//   The lexer uses several character lookups, which I've optimized by using integer->boolean arrays. The idea is that instead of using string membership checking or a hash lookup, we use the
//   character codes and index into a numerical array. This is guaranteed to be O(1) for any sensible implementation, and is probably the fastest JS way we can do this. For space efficiency, only
//   the low 256 characters are indexed. High characters will trigger sparse arrays, which may degrade performance.

//   The lex_op table indicates which elements trigger regular expression mode. Elements that trigger this mode cause a following / to delimit a regular expression, whereas other elements would
//   cause a following / to indicate division.

             lex_op = hash('. new ++ -- u++ u-- u+ u- typeof u~ u! * / % + - << >> >>> < > <= >= instanceof in == != === !== & ^ | && || ? = += -= *= /= %= &= |= ^= <<= >>= >>>= : , ' +
                           'return throw case var const break continue'),

          lex_table = function (s) {for (var i = 0, xs = [false]; i < 8; ++i) xs = xs.concat(xs); for (var i = 0, l = s.length; i < l; ++i) xs[s.charCodeAt(i)] = true; return xs},
          lex_float = lex_table('.0123456789'),    lex_decimal = lex_table('0123456789'),  lex_integer = lex_table('0123456789abcdefABCDEFx'), lex_exp = lex_table('eE'),
          lex_space = lex_table(' \n\r\t'),        lex_bracket = lex_table('()[]{}'),       lex_opener = lex_table('([{'),                   lex_punct = lex_table('+-*/%&|^!~=<>?:;.,'),
            lex_eol = lex_table('\n\r'),     lex_regexp_suffix = lex_table('gims'),          lex_quote = lex_table('\'"/'),                  lex_slash = '/'.charCodeAt(0),
           lex_star = '*'.charCodeAt(0),              lex_back = '\\'.charCodeAt(0),             lex_x = 'x'.charCodeAt(0),                    lex_dot = '.'.charCodeAt(0),
           lex_zero = '0'.charCodeAt(0),     lex_postfix_unary = hash('++ --'),              lex_ident = lex_table('$_abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'),

//   Variable names.
//   s, obviously, is the string being lexed. mark indicates the position of the stream, while i is used for lookahead. The difference is later read into a token and pushed onto the result. c is
//   an array of character codes in s, such that cs[i] === s.charCodeAt(i). c is a temporary value used to store the current character code. re is true iff a slash would begin a regular
//   expression, otherwise false. esc is a flag indicating whether the next character in a string or regular expression literal is escaped. exp indicates whether we've seen the exponent marker in
//   a number. close is used for parsing single and double quoted strings; it contains the character code of the closing quotation mark. t is the token to be appended to ts, which is the
//   resulting token array. If t === false, then nothing is appended to the resulting array.

                lex = d.lex = function (s) {
                  var s = s.toString(), mark = 0, cs = [], c = 0, re = true, esc = false, dot = false, exp = false, close = 0, t = '', ts = [];
                  for (var i = 0, l = s.length; i < l || (i = 0); ++i) cs.push(s.charCodeAt(i));

//   Main lex loop.
//   Set the mark to the current position (we'll be incrementing i as we read characters), munch whitespace, and reset flags.

                  while ((mark = i) < l) {
                    while (lex_space[c = cs[i]] && i < l) mark = ++i;
                    esc = exp = dot = t = false;

//   Miscellaneous lexing.
//   This includes bracket resetting (the top case, where an open-bracket of any sort triggers regexp mode) and comment removal. Both line and block comments are removed by comparing against
//   lex_slash, which represents /, and lex_star, which represents *.

         if                                        (lex_bracket[c])                                                                    {t = !! ++i; re = lex_opener[c]}
    else if (c === lex_slash && cs[i + 1] === lex_star && (i += 2)) {while (++i < l && cs[i] !== lex_slash || cs[i - 1] !== lex_star);  t = !  ++i}
    else if            (c === lex_slash && cs[i + 1] === lex_slash) {while                              (++i < l && ! lex_eol[cs[i]]);  t = false}

//   Regexp and string literal lexing.
//   These both take more or less the same form. The idea is that we have an opening delimiter, which can be ", ', or /; and we look for a closing delimiter that follows. It is syntactically
//   illegal for a string to occur anywhere that a slash would indicate division (and it is also illegal to follow a string literal with extra characters), so reusing the regular expression logic
//   for strings is not a problem. (This follows because we know ahead of time that the JavaScript is valid.)

    else if (lex_quote[c] && (close = c) && re && ! (re = ! (t = s.charAt(i)))) {while (++i < l && (c = cs[i]) !== close || esc)  esc = ! esc && c === lex_back;
                                                                                 while     (++i < l && lex_regexp_suffix[cs[i]])                               ; t = true}

//   Numeric literal lexing.
//   This is far more complex than the above cases. Numbers have several different formats, each of which requires some custom logic. The reason we need to parse numbers so exactly is that it
//   influences how the rest of the stream is lexed. One example is '0.5.toString()', which is perfectly valid JavaScript. What must be output here, though, is '0.5', '.', 'toString', '(', ')';
//   so we have to keep track of the fact that we've seen one dot and stop lexing the number on the second.

//   Another case is exponent-notation: 3.0e10. The hard part here is that it's legal to put a + or - on the exponent, which normally terminates a number. Luckily we can safely skip over any
//   character that comes directly after an E or e (so long as we're really in exponent mode, which I'll get to momentarily), since there must be at least one digit after an exponent.

//   The final case, which restricts the logic somewhat, is hexadecimal numbers. These also contain the characters 'e' and 'E', but we cannot safely skip over the following character, and any
//   decimal point terminates the number (since '0x5.toString()' is also valid JavaScript). The same follows for octal numbers; the leading zero indicates that there will be no decimal point,
//   which changes the lex mode (for example, '0644.toString()' is valid).

//   So, all this said, there are different logic branches here. One handles guaranteed integer cases such as hex/octal, and the other handles regular numbers. The first branch is triggered
//   whenever a number starts with zero and is followed by 'x' or a digit (for conciseness I call 'x' a digit), and the second case is triggered when '.' is followed by a digit, or when a digit
//   starts.

//   A trivial change, using regular expressions, would reduce this logic significantly. I chose to write it out longhand because (1) it's more fun that way, and (2) the regular expression
//   approach has theoretically quadratic time in the length of the numbers, whereas this approach keeps things linear. Whether or not that actually makes a difference I have no idea.

    else if                (c === lex_zero && lex_integer[cs[i + 1]]) {while (++i < l && lex_integer[cs[i]]); re = ! (t = true)}

    else if (c === lex_dot && lex_decimal[cs[i + 1]] || lex_float[c]) {while (++i < l && (lex_decimal[c = cs[i]] || (dot ^ (dot |= c === lex_dot)) ||
                                                                                                                    (exp ^ (exp |= lex_exp[c] && ++i))));
                                                                       while (i < l && lex_decimal[cs[i]]) ++i; re = ! (t = true)}

//   Operator lexing.
//   The 're' flag is reused here. Some operators have both unary and binary modes, and as a heuristic (which happens to be accurate) we can assume that anytime we expect a regular expression, a
//   unary operator is intended. The only exception are ++ and --, which are always unary but sometimes are prefix and other times are postfix. If re is true, then the prefix form is intended;
//   otherwise, it is postfix. For this reason I've listed both '++' and 'u++' (same for --) in the operator tables; the lexer is actually doing more than its job here by identifying the variants
//   of these operators.

//   The only exception to the regular logic happens if the operator is postfix-unary. (e.g. ++, --.) If so, then the re flag must remain false, since expressions like 'x++ / 4' can be valid.

    else if (lex_punct[c] && (t = re ? 'u' : '', re = true)) {while (i < l && lex_punct[cs[i]] && has(lex_op, t + s.charAt(i)))  t += s.charAt(i++); re = ! has(lex_postfix_unary, t)}

//   Identifier lexing.
//   If nothing else matches, then the token is lexed as a regular identifier or JavaScript keyword. The 're' flag is set depending on whether the keyword expects a value. The nuance here is that
//   you could write 'x / 5', and it is obvious that the / means division. But if you wrote 'return / 5', the / would be a regexp delimiter because return is an operator, not a value. So at the
//   very end, in addition to assigning t, we also set the re flag if the word turns out to be an identifier.

    else {while (++i < l && lex_ident[cs[i]]); re = has(lex_op, t = s.substring(mark, i))}

//   Token collection.
//   t will contain true, false, or a string. If false, no token was lexed; this happens when we read a comment, for example. If true, the substring method should be used. (It's a shorthand to
//   avoid duplicated logic.)

                    t !== false && ts.push(t === true ? s.substring(mark, i) : t);
                  }
                  return ts};

// Parsing.
// (in a bit)

  divergence = d;

}) ();

// Generated by SDoc 