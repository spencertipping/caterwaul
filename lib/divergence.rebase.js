// Divergence Rebase module | Spencer Tipping <spencer@spencertipping.com>
// Licensed under the terms of the MIT source code license

// Rebase is a Divergence module that takes operator invocations inside functions and rewrites them to be method invocations. Naturally, new meaning can be associated with these constructs; this
// is done by writing methods for them. For example, invocation of the '+' operator is translated into a call to the '+' method. Operator precedence is respected and follows the normal JavaScript
// rules.

// Certain constructs cannot be changed. These include assignment variants such as '+='; such variants are always expanded to their full forms (e.g. a += b becomes a = a + b, which becomes a =
// a['+'](b)). Others include the behavior of 'new', dot-lookups, indexed lookups, function calls, and statement-mode constructs such as 'if', 'for', etc. You can write macros that transform
// these things, but they will have strange limitations and might not behave as expected.

// Since JavaScript is dynamically typed, it isn't possible to know in advance whether an operator overloading replacement will impact a primitive value. This is one reason for the limitations
// described above. The other thing to realize is that those operators need to get replaced for standard things too -- so Number.prototype, String.prototype, and anything else that depends on
// standard operators will have a bunch of replacement functions that delegate to those operators.

// One more thing of importance. Some identifiers are treated specially and sandwiched between operators to form longer operators. They're defined in d.rebase.sandwiches. If an identifier appears
// as a key there (e.g. 'foo'), then it will be sandwiched between binary operators, resulting in the translation of things like 'a + foo + b' as 'a['+foo+'](b)'. This means that you can't use
// 'foo' normally anymore, so use this feature carefully.

(function () {
  var set            = '.fold({< $0[$1] = true, $0 >}, {})'.fn(),            last = '$0[$0.length - 1]'.fn(),  qw = '.split(/\\s+/)'.fn(),
        r = d.rebase =   function  () {return r.init.apply (this, arguments)},  $ = null,
        s            =   function (x) {if (x === undefined || x === null) return ''; var s = x.toString(); return s.charAt(0) === '@' ? s.substring (1) : s};

  d.init (r, {precedence: {'function':1, '[!':1, '.':1, '(!':1, 'new':2, 'u++':3, 'u--':3, '++':3, '--':3, 'typeof':3, 'u~':3, 'u!':3, '!':3, '~':3, 'u+':3, 'u-':3, '*':4, '/':4, '%':4,
                           '+':5, '-':5, '<<':6, '>>':6, '>>>':6, '<':7, '>':7, '<=':7, '>=':7, 'instanceof':7, 'in':7, '==':8, '!=':8, '===':8, '!==':8, '&':9, '^':10, '|':11, '&&':12,
                           '||':13, '?':14, '=':15, '+=':15, '-=':15, '*=':15, '/=':15, '%=':15, '&=':15, '|=':15, '^=':15, '<<=':15, '>>=':15, '>>>=':15, 'case':16, ':':17, ',':18, 'var':19,
                           'if':19, 'while':19, 'for':19, 'do':19, 'switch':19, 'return':19, 'throw':19, 'delete':19, 'export':19, 'import':19, 'try':19, 'catch':19, 'finally':19, 'void':19,
                           'with':19, 'else':19, '?:':20, ';':21, '{':22, '(':22, '[':22},

                   unary: set(qw('u++ u-- ++ -- u+ u- u! u~ new typeof var case try finally throw return case else delete void import export ( [ { ?:')),
               syntactic: set(qw('case var if while for do switch return throw delete export import try catch finally void with else function new typeof in instanceof')),
               statement: set(qw('case var if while for do switch return throw delete export import try catch finally void with else')),
               connected: set(qw('else catch finally')),                                                                       digit: set('0123456789.'.split('')),
                   ident: set('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789$_'.split ('')),                  punct: set('+-*/%&|^!~=<>?:;.,'.split ('')),
                   right: set(qw('= += -= *= /= %= &= ^= |= <<= >>= >>>= u~ u! new typeof u+ u- u++ u-- ++ -- ?')),          openers: {'(':')', '[':']', '{':'}', '?':':'},
     implicit_assignment: set(qw('++ -- u++ u--')),                                                                       sandwiches: set(qw('$ $$ $$$ _ __ ___ _$ _$$ __$')),
                 literal: set(qw('= ++ -- u++ u-- (! [! . ?: , ? u! ( { [ === !== == != ; : && ||')),                   sandwich_ops: set(qw('+ - * / % ^ | & << >> >>> < >')),
           prefix_binary: set(qw('if function catch for switch with while')),                                                closers: {')':'(', ']':'[', '}':'{', ':':'?:'},
            translations: {'u+':'+', 'u-':'-', 'u~':'~', 'u!':'!', 'u--':'--', 'u++':'++'},                                 arity_of: '$0.unary[$1] ? 1 : $1 == "?" ? 3 : 2'.fn(r),
           lvalue_assign: set(qw('+= -= *= /= %= ^= |= &= <<= >>= >>>=')),                                            should_convert: '! ($0.literal[$1] || $0.syntactic[$1])'.fn(r),
               no_spaces: set(qw('.')),

                alias_in: '$0.init ($1, $0.map ($2, {|h, k, v| k.maps_to (h[v] || v.fn()) |}.fn($1)))'.fn(d),

                    init: '$0.deparse($0.transform($0.parse($1)))'.fn(r),
                   local: '$0.transform($0.parse($1)).toString()'.fn(r),

//   Deparsing.
//   This is certainly the easiest part. All we have to do is follow some straightforward rules about how operators and such get serialized. Luckily this is all encapsulated into the toString
//   logic of the syntax tree.

                 deparse: 'eval($0.trace ? $0.trace ($1.toString()) : $1.toString())'.fn(r),

//   Tree transformation.
//   The goal here is to transform the tree in logical form before serializing it to a final function. The way I've chosen to go about this is to use a macro table and deep-map over the syntax
//   tree. Each node gets inspected, and mapping functions can modify nodes by returning alternative values. To save space and time, I'm having macros replace structures halfway destructively
//   rather than using a pure functional approach.

               translate: '$0.transform($0.parse($1)).toString()'.fn(r),
               transform: function (t) {if (t && t.op == '(!' && t.xs[0] == 'literal') return t.xs[1];
                                        var mapped = r.macros.fold ('$1($0) || $0', t);
                                        mapped && mapped.xs && (mapped.xs = mapped.xs.map ('$1 ? $0($1) : $1'.fn (r.transform)));
                                        return mapped},

//   Lexing.
//   The lexer is for the most part straightforward. The only tricky bit is regular expression parsing, which requires the lexer to contextualize operators and operands. I've implemented this
//   logic with a expect_re flag that indicates whether the last token processed was an operator (if so, then we're expecting an operand and the next / delineates a regular expression).

//   We mark the position before a token and then just increment the position. The token, then, can be retrieved by taking a substring from the mark to the position. This eliminates the need for
//   intermediate concatenations. In a couple of cases I've gone ahead and done them anyway -- these are for operators, where we grab the longest contiguous substring that is defined. I'm not to
//   worried about the O(n^2) complexity due to concatenation; they're bounded by four characters.

//   Retrieving the Cartesian coordinates of the token is not difficult provided that we have a list of line lengths. We can then convert that list to a cumulative measure to enable binary
//   searching. I realize this is more elaborate than necessary given that the lexer is streaming (and thus would never need to recover old line lengths), but having to keep track of each newline
//   that occurs while reading the input is probably more expensive than the overhead incurred by O(log n) jumps every so often.

                   parse: function (s) {var mark = 0, s = s.toString(), i = 0, $_ = '', l = s.length, token = '', expect_re = true, escaped = false, t = new r.syntax(null, '('),
                                                      c = s.charAt.bind (s), openers = [],
                                             precedence = r.precedence, ident = r.ident, punct = r.punct, digit = r.digit,
                                            line_breaks = [0].concat (s.split('\n').map('.length')), lb = 1,
                                          located_token = function () {var jump = lb << 1, l = 0, r = new String (token);
                                                                       while (jump >>= 1) mark >= line_breaks[l + jump] && (l += jump);
                                                                       return r.line = l + 1, r.character = mark - line_breaks[l], r};
                          while ((lb <<= 1) < line_breaks.length);
                          for (var j = 0, lj = line_breaks.length, total = -1; j < lj; ++j) line_breaks[j] = total += line_breaks[j] + 1;

                          while ((mark = i) < l && ($_ = c(i))) {
          escaped = token = '';

               if                                (' \n\r\t'.indexOf ($_) > -1)                                                             {++i; continue}
          else if                               ('([{?:}])'.indexOf ($_) > -1)                                                              expect_re = '([{:?'.indexOf ($_) > -1, ++i;
          else if                 ($_ === '/' && c(i + 1) === '*' && (i += 2)) {while       (c(++i) !== '/' || c(i - 1) !== '*' || ! ++i);  continue}
          else if                             ($_ === '/' && c(i + 1) === '/') {while             (($_ = c(++i)) !== '\n' && $_ !== '\r');  continue}
          else if ($_ === '/' && expect_re && ! (expect_re = ! (token = '/'))) {while                  (($_ = c(++i)) !== '/' || escaped)   escaped = ! escaped && $_ === '\\';
                                                                                while                                     (ident[c(++i)]);}
          else if              ($_ === '"' && ! (expect_re = ! (token = '"')))  while         (($_ = c(++i)) !== '"' || escaped || ! ++i)   escaped = ! escaped && $_ === '\\';
          else if              ($_ === "'" && ! (expect_re = ! (token = "'")))  while         (($_ = c(++i)) !== "'" || escaped || ! ++i)   escaped = ! escaped && $_ === '\\';
          else if                    (expect_re && punct[$_] && (token = 'u'))  while        (punct[$_ = c(i)] && precedence[token + $_])   token += $_, ++i;
          else if                            (punct[$_] && (expect_re = true))  while        (punct[$_ = c(i)] && precedence[token + $_])   token += $_, ++i;
          else                                                                 {while (ident[$_ = c(++i)] || digit[c(mark)] && digit[$_]);  expect_re = precedence.hasOwnProperty (token = s.substring (mark, i))}

          expect_re && token.charAt(0) === 'u' || (token = s.substring (mark, i));
          token in {} && (token = '@' + token);

               if         (t.is_value() && '[('.indexOf (token) > -1)  openers.push (t = t.push_op (token + '!').graft (located_token()));
          else if (($_ = r.closers[token]) && last(openers).op == $_)  t = openers.pop().parent, token === '}' && t.is_value() && r.statement[t.op] && (t = t.push_op(';'));
          else if                                     (token === '?')  openers.push (t = t.push_op (located_token()).graft ('?:'));
          else if                                  (r.openers[token])  openers.push (t = t.graft (located_token()));
          else if                                 (precedence[token])  t = t.push_op (located_token());
          else                                                         t.push_value (located_token());
                          }
                          return t.top()},

//   Incremental parsing.
//   As tokens are read from the lexer they are written into a parse tree. Unlike a traditional grammar with productions, this parse tree works in terms of operators and values. Each element in
//   the text is considered to have a certain precedence and to comprise part of an expression. This leads to a weird model and a much more general grammar than JavaScript's, but this is
//   acceptable because we know that by the time we see the code it will be valid.

//   The mechanics of this parser are fairly simple. We build a tree incrementally and include explicit nodes for parentheses (the role of these nodes will become apparent). Starting with the
//   root node, which has no particular identity, we add expressions and operators to this tree. The rules for this are:

//     | 1. When we add an expression to a tree, it is just added to the operand list. This will throw an error if there are too many operands.
//     | 2. When we add an operator to a tree, we check the precedence. If the new operator binds first, then it is added as a child, given a value, and returned. Otherwise we add it to the
//          parent.

                  syntax: '@parent = $0, @op = $1, @xs = $2 || [], $_'.ctor ({
                           is_value: '@xs.length >= $0.arity_of(@op)'.fn(r),
                                map: 'new $0.syntax(null, @op, @xs.map($1).map({|t, x| x.parent = t, x |}.fn($_)))'.fn(r),
                               find: '(@op == $0 || @xs.grep({|t, x| t == x |}.fn($0)).length ? [$_] : []).concat (@xs.flat_map({|t, v| v && v.xs && v.find(t) || [] |}.fn($0)))'.fn(),
                            replace: '@xs[$0] = $1, $1 && ($1.parent = $_), $_'.fn(),
                         push_value: '! @is_value() ? (@xs.push($0), $0) : ("The token " + $0 + " is one too many for the tree " + $_ + " in the context " + $_.top() + ".").fail()'.fn(),
                          with_node: '$0 && ($0.parent = $_), @push_value($0), $_'.fn(),
                            push_op: '$0.precedence[$1] - !! ($0.right[$1] || $0.syntactic[$1]) < $0.precedence[@op] ? @graft($1) : @hand_to_parent($1)'.fn(r),
                              graft: '@push_value(@is_value() ? new $0.syntax($_, $1).with_node(@xs.pop()) : new $0.syntax($_, $1))'.fn(r),
                     hand_to_parent: '@parent ? @parent.push_op($0) : ("Syntax trees should have a minimal-precedence container when parsing " + $0 + " at " + $_).fail()'.fn(),
                                top: '@parent ? @parent.top() : $_'.fn(),
                           toString:  function () {var left_in = function (x, ops) {return x.xs && x.xs[0] && (ops[x.xs[0].op] && x.xs[0].op ||
                                                                                                               x.xs[0].xs && x.xs[0].xs[1] && ops[x.xs[0].xs[1].op] && x.xs[0].xs[1].op)},
                                                      right_in = function (x, ops) {return x.xs && x.xs[1] && ops[x.xs[1].op] && x.xs[1].op},
                                                            $_ = '';
                                                   return '([{'.indexOf(this.op) > -1 ? this.op + s(this.xs[0]) + r.openers[this.op] :
                                                                      this.op ==  '?' ? s(this.xs[0]) + ' ? ' + s(this.xs[1].xs[0]) + ' : ' + s(this.xs[2]) :
                                                   this.op == '(!' || this.op == '[!' ? s(this.xs[0]) + s(this.xs[1]) :
                                                       r.implicit_assignment[this.op] ? '(' + (this.op.charAt(0) === 'u' ? this.op.substring(1) + s(this.xs[0]) : s(this.xs[0]) + this.op) + ')' :
                                             this.xs[1] && r.connected[this.xs[1].op] ? (($_ = s(this.xs[0])).charAt($_.length - 1) === '}' ? $_ + ' ' : $_ + ';') + s(this.xs[1]) :
                                                                     r.unary[this.op] ? (r.translations[this.op] || this.op) + ' ' + s(this.xs[0]) :
                                                             r.prefix_binary[this.op] ? this.op + ' ' + s(this.xs[0]) + ' ' + s(this.xs[1]) :
                                                                 r.no_spaces[this.op] ? s(this.xs[0]) + this.op + s(this.xs[1]) :
                                                                                        s(this.xs[0]) + ' ' + this.op + ' ' + s(this.xs[1])}}),

//   Macro support.
//   Macros are just functions from syntax to syntax. They should behave as the identity if they don't apply to something.

                  macros: [

//     Identifier sandwiching.
//     Certain identifiers can be sandwiched into binary operators as if they were part of the operator name. Most binary operators are candidates for sandwiching, and several identifiers are
//     included by default (see the sandwiches hash above). This could be optimized by using in-place rewriting, but using sandwich operators is not terribly common.

          function (e) {return e.xs && r.sandwich_ops[e.op] ?
            e.xs[1] && e.xs[1].op && r.sandwich_ops[e.xs[1].op] && r.sandwiches[e.xs[1].xs[0]] ? new r.syntax(e.parent, e.op + e.xs[1].xs[0] + e.xs[1].op, [e.xs[0], e.xs[1].xs[1]]) :
            e.xs[0] && e.xs[0].op && r.sandwich_ops[e.xs[0].op] && r.sandwiches[e.xs[0].xs[1]] ? new r.syntax(e.parent, e.xs[0].op + e.xs[0].xs[1] + e.op, [e.xs[0].xs[0], e.xs[1]]) :
            e : e},

//     Assignment expansion.
//     Since the left-hand side of +=, -=, etc. must be an lvalue, we can't say something like x['+='](y) and expect anything useful. So instead of overloading the operator, we just replace it with
//     the longhand x = x + y, and let the '+' operator get replaced by the method call.

          function (e) {return e.xs && r.lvalue_assign[e.op] ? new r.syntax(null, "=", [e.xs[0], new r.syntax(null, e.op.substring(0, e.op.length - 1), e.xs)]) : e},

//     Function notation.
//     To alleviate some of the notational overhead of JavaScript's function definitions, I'm using the operator >$> for this purpose. > takes a low precedence, but it's a good idea to
//     parenthesize each side just in case. You can use this operator without parentheses or with (though for multiple parameters you need them):

//       | x >$> x + 1             // valid
//       | (x) >$> x + 1           // valid
//       | (x, y) >$> x + 1        // valid
//       | x, y >$> x + 1          // parses as x, (y >$> x + 1)

//     Note that you can't say this:

//       | () >$> something

//     The reason is that JavaScript's grammar forbids the use of () as an expression. To get around it, you can bind a throwaway variable:

//       | _ >$> something

          function (e) {return e.op == '>$>' ? new r.syntax(e.parent, 'function').with_node (e.xs[0].op == '(' ? e.xs[0] : new r.syntax (null, '(', [e.xs[0]])).
                                                                                  with_node (new r.syntax (null, '{').with_node (new r.syntax (null, 'return').with_node (e.xs[1]))) : e},

//     Function preloading.
//     Since Rebase doesn't provide an expression-mode variable binding syntax (this would be difficult), binding variables becomes a matter of using functions. This has the advantage that you
//     end up with a proper lexical scope too.

//       | x |$> f === f(x)
//       | (x, y) |$> f === f (x, y)

          function (e) {return e.op == '|$>' ? new r.syntax(e.parent, '(!').with_node (e.xs[1]).with_node (e.xs[0].op == '(' ? e.xs[0] : new r.syntax(null, '(').with_node (e.xs[0])) : e},

//     Comments.
//     Structural comments can be useful for removing chunks of code or for getting comments through SpiderMonkey's parse-deparse cycle (SpiderMonkey, and perhaps other JS interpreters, removes
//     comments between evaling and serializing a function). Either way, the syntax is just like literal(), except that the result will be replaced with the value 'undefined' instead of evaluated
//     normally.

          function (e) {return e.op == '(!' && e.xs && e.xs[0] == 'comment' ? 'undefined' : e},

//     String interpolation.
//     One of Ruby and Perl's great features is string interpolation. We can add this to JavaScript quite easily by writing a macro that looks for string nodes and expands them to expressions
//     that build strings. Unfortunately we won't be able to distinguish between single and double-quoted strings because SpiderMonkey converts them all to double-quoted ones.

          function (e) {return e.charAt && '\'"'.indexOf(e.charAt(0)) > -1 && /#\{[^}]+\}/.test(e) ?
                               '(' + e.replace (/#\{([^}]+)\}/g, function (_, code) {return e.charAt(0) + '+(' + r.translate(code.replace(/\\(.)/g, '$1')) + ')+' + e.charAt(0)}) + ')' : e},

//     Operator overloading.
//     Once we're done with all of the preprocessing we can actually replace the operators with method calls. I'm cheating just a bit here; normally you would encase the operation inside a [ node
//     after wrapping it as a string. However, I'm being lazy and making the excuse that maybe later on you want to detect proper method calls from generated ones; so the right-hand side of the
//     [! will not be what you expect; rather, it will be a single string containing the text [">$$>"] (or some other operator).

          function (e) {return e.op && r.should_convert (e.op) ?
            new r.syntax(e.parent, "(!").with_node(new r.syntax(null, "[!", [e.xs[0], '["' + e.op + '"]'])).with_node(new r.syntax(null, '(', [e.xs[1]])) : e}]});

//   Operator compatibility.
//   We want to make sure that the default behavior of all normal operators is preserved. While we're at it we can give them typable names and form combinatory versions as well.

  var translate = '$0[$1] || $1'.fn(r.translations);
  d.operators = {binary: {transforms: {'$0': '"$_" + $0 + "$0"', '$0 + "_fn"': '"{|t, x| t.apply($_,@_)" + $0 + "x.apply($_,@_)|}.fn($_.fn(), $0.fn())"'},
                           operators: {plus:'+', minus:'-', times:'*', over:'/', modulo:'%', lt:'<', gt:'>', le:'<=', ge:'>=', eq:'==', ne:'!=', req:'===', rne:'!==', and:'&&', or:'||', xor:'^',
                                       bitand:'&', bitor:'|', then:',', lshift: '<<', rshift: '>>', rushift: '>>>'}},
                  unary: {transforms: {'$0': '$0($1) + "$_"'.fn(translate), '$0 + "_fn"': '"{|f| " + $0($1) + "f.fn.apply($_,@_)|}.fn($_.fn())"'.fn(translate)},
                           operators: {complement:'u~', negative:'u-', positive:'u+'}}};

  d.map (d.operators, function (_, os) {
    d.map (os.transforms, function (nt, vt) {d.functions (d.map (os.operators, function (n, v) {return d.init (nt.fn()(v).maps_to (vt.fn()(v).fn()), nt.fn()(n).maps_to (vt.fn()(v).fn()))}))})});

  r.alias_in (Array.prototype, {'*':'map', '%':'grep', '+':'concat', '/':'fold', '>>$-':'flat_map'});
              Array.prototype['<<'] = '@push($0), $_'.fn();

  r.alias_in (r.syntax.prototype, {'<<':'with_node', '*':'map'});

//   Divergence inline macro support.
//   Divergence promotes strings into functions with a macro mechanism very similar to the one here. Because of this, we can enable code transformation inside those inline macros, including
//   translating operators into method calls, etc. By default this isn't enabled (primarily so that users of this library have a very easy way to disable operator overloading etc.) but you can
//   enable it like this:

  r.enable_inline_macro = (function (enabled) {return function () {enabled || (enabled = !! d.inline_macros.push ('$0.toString()'.compose (r.transform).compose (r.parse)))}}) (false)}) ();