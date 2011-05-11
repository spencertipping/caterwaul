// Parsing.
// There are two distinct parts to parsing Javascript. One is parsing the irregular statement-mode expressions such as 'if (condition) {...}' and 'function f(x) {...}'; the other is parsing
// expression-mode stuff like arithmetic operators. In Rebase I tried to model everything as an expression, but that failed sometimes because it required that each operator have fixed arity. In
// particular this was infeasible for keywords such as 'break', 'continue', 'return', and some others (any of these can be nullary or unary). It also involved creating a bizarre hack for 'case
// x:' inside a switch block. This hack made the expression passed in to 'case' unavailable, as it would be buried in a ':' node.

// Caterwaul fixes these problems by using a proper context-free grammar. However, it's much looser than most grammars because it doesn't need to validate anything. Correspondingly, it can be
// much faster as well. Instead of guessing and backtracking as a recursive-descent parser would, it classifies many different branches into the same basic structure and fills in the blanks. One
// example of this is the () {} pair, which occurs in a bunch of different constructs, including function () {}, if () {}, for () {}, etc. In fact, any time a () group is followed by a {} group
// we can grab the token that precedes () (along with perhaps one more in the case of function f () {}), and group that under whichever keyword is responsible.

//   Syntax folding.
//   The first thing to happen is that parenthetical, square bracket, and braced groups are folded up. This happens in a single pass that is linear in the number of tokens, and other foldable
//   tokens (including unary and binary operators) are indexed by associativity. The following pass runs through these indexes from high to low precedence and folds tokens into trees. By this
//   point all of the parentheticals have been replaced by proper nodes (here I include ?: groups in parentheticals, since they behave the same way). Finally, high-level rules are applied to the
//   remaining keywords, which are bound last. This forms a complete parse tree.

//   Doing all of this efficiently requires a linked list rather than an array. This gets built during the initial paren grouping stage. Arrays are used for the indexes, which are left-to-right
//   and are later processed in the order indicated by the operator associativity. That is, left-associative operators are processed 0 .. n and right associative are processed n .. 0. Keywords
//   are categorized by behavior and folded after all of the other operators. Semicolons are folded last, from left to right.

//   There are some corner cases due to Javascript's questionable heritage from C-style syntax. For example, most constructs take either syntax blocks or semicolon-delimited statements. Ideally,
//   else, while, and catch are associated with their containing if, do, and try blocks, respectively. This can be done easily, as the syntax is folded right-to-left. Another corner case would
//   come up if there were any binary operators with equal precedence and different associativity. Javascript doesn't have them however, and it wouldn't make much sense to; it would render
//   expressions such as 'a op1 b op2 c' ambiguous if op1 and op2 shared precedence but each wanted to bind first. (I mention this because at first I was worried about it, but now I realize it
//   isn't an issue.)

//   Notationally (for easier processing later on), a distinction is made between invocation and grouping, and between dereferencing and array literals. Dereferencing and function invocation are
//   placed into their own operators, where the left-hand side is the thing being invoked or dereferenced and the right-hand side is the paren-group or bracket-group that is responsible for the
//   operation. Also, commas inside these groups are flattened into a single variadic (possibly nullary) comma node so that you don't have to worry about the tree structure. This is the case for
//   all left-associative operators; right-associative operators preserve their hierarchical folding.

//   Parse/lex shared logic.
//   Lexing Javascript is not entirely straightforward, primarily because of regular expression literals. The first implementation of the lexer got things right 99% of the time by inferring the
//   role of a / by its preceding token. The problem comes in when you have a case like this:

//   | if (condition) /foo/.test(x)

//   In this case, (condition) will be incorrectly inferred to be a regular expression (since the close-paren terminates an expression, usually), and /foo/ will be interpreted as division by foo. 

//   We mark the position before a token and then just increment the position. The token, then, can be retrieved by taking a substring from the mark to the position. This eliminates the need for
//   intermediate concatenations. In a couple of cases I've gone ahead and done them anyway -- these are for operators, where we grab the longest contiguous substring that is defined. I'm not too
//   worried about the O(n^2) complexity due to concatenation; they're bounded by four characters.

//   OK, so why use charAt() instead of regular expressions? It's a matter of asymptotic performance. V8 implements great regular expressions (O(1) in the match length for the (.*)$ pattern), but
//   the substring() method is O(n) in the number of characters returned. Firefox implements O(1) substring() but O(n) regular expression matching. Since there are O(n) tokens per document of n
//   characters, any O(n) step makes lexing quadratic. So I have to use the only reliably constant-time method provided by strings, charAt() (or in this case, charCodeAt()).

//   Of course, building strings via concatenation is also O(n^2), so I also avoid that for any strings that could be long. This is achieved by using a mark to indicate where the substring
//   begins, and advancing i independently. The span between mark and i is the substring that will be selected, and since each substring both requires O(n) time and consumes n characters, the
//   lexer as a whole is O(n). (Though perhaps with a large constant.)

//   Parse function.
//   As mentioned earlier, the parser and lexer aren't distinct. The lexer does most of the heavy lifting; it matches parens and brackets, arranges tokens into a hierarchical linked list, and
//   provides an index of those tokens by their fold order. It does all of this by streaming tokens into a micro-parser whose language is grouping and that knows about the oddities required to
//   handle regular expression cases. In the same function, though as a distinct case, the operators are folded and the syntax is compiled into a coherent tree form.

//   The input to the parse function can be anything whose toString() produces valid Javascript code.

    caterwaul_global.parse = function (input) {

//     Lex variables.
//     s, obviously, is the string being lexed. mark indicates the position of the stream, while i is used for lookahead. The difference is later read into a token and pushed onto the result. c
//     is a temporary value used to store the current character code. re is true iff a slash would begin a regular expression. esc is a flag indicating whether the next character in a string or
//     regular expression literal is escaped. exp indicates whether we've seen the exponent marker in a number. close is used for parsing single and double quoted strings; it contains the
//     character code of the closing quotation mark. t is the token to be processed.

//     Parse variables.
//     grouping_stack and gs_top are used for paren/brace/etc. matching. head and parent mark two locations in the linked syntax tree; when a new group is created, parent points to the opener
//     (i.e. (, [, ?, or {), while head points to the most recently added child. (Hence the somewhat complex logic in push().) indexes[] determines reduction order, and contains references to the
//     nodes in the order in which they should be folded. invocation_nodes is an index of the nodes that will later need to be flattened.

//     The push() function manages the mechanics of adding a node to the initial linked structure. There are a few cases here; one is when we've just created a paren group and have no 'head'
//     node; in this case we append the node as 'head'. Another case is when 'head' exists; in that case we update head to be the new node, which gets added as a sibling of the old head.

        var s = input.toString(), mark = 0, c = 0, re = true, esc = false, dot = false, exp = false, close = 0, t = '', i = 0, l = s.length, cs = function (i) {return s.charCodeAt(i)},
            grouping_stack = [], gs_top = null, head = null, parent = null, indexes = map(function () {return []}, parse_reduce_order), invocation_nodes = [], all_nodes = [empty],
            new_node = function (n) {return all_nodes.push(n), n}, push = function (n) {return head ? head._sibling(head = n) : (head = n._append_to(parent)), new_node(n)},
            syntax_node = this.syntax;

//     Trivial case.
//     The empty string will break the lexer because we won't generate a token (since we're already at the end). To prevent this we return an empty syntax node immediately, since this is an
//     accurate representation of no input.

        if (l === 0) return empty;

//     Main lex loop.
//     This loop takes care of reading all of the tokens in the input stream. At the end, we'll have a linked node structure with paren groups. At the beginning, we set the mark to the current
//     position (we'll be incrementing i as we read characters), munch whitespace, and reset flags.

        while ((mark = i) < l) {
          while (lex_space[c = cs(i)] && i < l) mark = ++i;
          esc = exp = dot = t = false;

//       Miscellaneous lexing.
//       This includes bracket resetting (the top case, where an open-bracket of any sort triggers regexp mode) and comment removal. Both line and block comments are removed by comparing against
//       lex_slash, which represents /, and lex_star, which represents *.

            if                                        (lex_bracket[c])                                                                    {t = !! ++i; re = lex_opener[c]}
       else if (c === lex_slash && cs(i + 1) === lex_star && (i += 2)) {while (++i < l && cs(i) !== lex_slash || cs(i - 1) !== lex_star);  t = !  ++i}
       else if            (c === lex_slash && cs(i + 1) === lex_slash) {while                              (++i < l && ! lex_eol[cs(i)]);  t = false}

//       Regexp and string literal lexing.
//       These both take more or less the same form. The idea is that we have an opening delimiter, which can be ", ', or /; and we look for a closing delimiter that follows. It is syntactically
//       illegal for a string to occur anywhere that a slash would indicate division (and it is also illegal to follow a string literal with extra characters), so reusing the regular expression
//       logic for strings is not a problem. (This follows because we know ahead of time that the Javascript is valid.)

       else if (lex_quote[c] && (close = c) && re && ! (re = ! (t = s.charAt(i)))) {while (++i < l && (c = cs(i)) !== close || esc)  esc = ! esc && c === lex_back;
                                                                                    while     (++i < l && lex_regexp_suffix[cs(i)])                               ; t = true}

//       Numeric literal lexing.
//       This is far more complex than the above cases. Numbers have several different formats, each of which requires some custom logic. The reason we need to parse numbers so exactly is that it
//       influences how the rest of the stream is lexed. One example is '0.5.toString()', which is perfectly valid Javascript. What must be output here, though, is '0.5', '.', 'toString', '(',
//       ')'; so we have to keep track of the fact that we've seen one dot and stop lexing the number on the second.

//       Another case is exponent-notation: 3.0e10. The hard part here is that it's legal to put a + or - on the exponent, which normally terminates a number. Luckily we can safely skip over any
//       character that comes directly after an E or e (so long as we're really in exponent mode, which I'll get to momentarily), since there must be at least one digit after an exponent.

//       The final case, which restricts the logic somewhat, is hexadecimal numbers. These also contain the characters 'e' and 'E', but we cannot safely skip over the following character, and any
//       decimal point terminates the number (since '0x5.toString()' is also valid Javascript). The same follows for octal numbers; the leading zero indicates that there will be no decimal point,
//       which changes the lex mode (for example, '0644.toString()' is valid).

//       So, all this said, there are different logic branches here. One handles guaranteed integer cases such as hex/octal, and the other handles regular numbers. The first branch is triggered
//       whenever a number starts with zero and is followed by 'x' or a digit (for conciseness I call 'x' a digit), and the second case is triggered when '.' is followed by a digit, or when a
//       digit starts.

//       A trivial change, using regular expressions, would reduce this logic significantly. I chose to write it out longhand because (1) it's more fun that way, and (2) the regular expression
//       approach has theoretically quadratic time in the length of the numbers, whereas this approach keeps things linear. Whether or not that actually makes a difference I have no idea.

//       Finally, in response to a recently discovered failure case, a period must be followed by a digit if it starts a number. The failure is the string '.end', which will be lexed as '.en',
//       'd' if it is assumed to be a floating-point number. (In fact, any method or property beginning with 'e' will cause this problem.)

       else if                  (c === lex_zero && lex_integer[cs(i + 1)]) {while (++i < l && lex_integer[cs(i)]); re = ! (t = true)}
       else if (lex_float[c] && (c !== lex_dot || lex_decimal[cs(i + 1)])) {while (++i < l && (lex_decimal[c = cs(i)] || (dot ^ (dot |= c === lex_dot)) || (exp ^ (exp |= lex_exp[c] && ++i))));
                                                                            while (i < l && lex_decimal[cs(i)]) ++i; re = ! (t = true)}

//       Operator lexing.
//       The 're' flag is reused here. Some operators have both unary and binary modes, and as a heuristic (which happens to be accurate) we can assume that anytime we expect a regular
//       expression, a unary operator is intended. The only exception are ++ and --, which are always unary but sometimes are prefix and other times are postfix. If re is true, then the prefix
//       form is intended; otherwise, it is postfix. For this reason I've listed both '++' and 'u++' (same for --) in the operator tables; the lexer is actually doing more than its job here by
//       identifying the variants of these operators.

//       The only exception to the regular logic happens if the operator is postfix-unary. (e.g. ++, --.) If so, then the re flag must remain false, since expressions like 'x++ / 4' can be valid.

       else if (lex_punct[c] && (t = re ? 'u' : '', re = true)) {while (i < l && lex_punct[cs(i)] && has(lex_op, t + s.charAt(i)))  t += s.charAt(i++); re = ! has(lex_postfix_unary, t)}

//       Identifier lexing.
//       If nothing else matches, then the token is lexed as a regular identifier or Javascript keyword. The 're' flag is set depending on whether the keyword expects a value. The nuance here is
//       that you could write 'x / 5', and it is obvious that the / means division. But if you wrote 'return / 5', the / would be a regexp delimiter because return is an operator, not a value. So
//       at the very end, in addition to assigning t, we also set the re flag if the word turns out to be an operator.

       else {while (++i < l && lex_ident[cs(i)]); re = has(lex_op, t = s.substring(mark, i))}

//       Token unification.
//       t will contain true, false, or a string. If false, no token was lexed; this happens when we read a comment, for example. If true, the substring method should be used. (It's a shorthand to
//       avoid duplicated logic.) For reasons that are not entirely intuitive, the lexer sometimes produces the artifact 'u;'. This is never useful, so I have a case dedicated to removing it.

        if (i === mark) throw new Error('Caterwaul lex error at "' + s.substr(mark, 40) + '" with leading context "' + s.substr(mark - 40, 40) + '" (probably a Caterwaul bug)');
        if (t === false) continue;
        t = t === true ? s.substring(mark, i) : t === 'u;' ? ';' : t;

//       Grouping and operator indexing.
//       Now that we have a token, we need to see whether it affects grouping status. There are a couple of possibilities. If it's an opener, then we create a new group; if it's a matching closer
//       then we close the current group and pop out one layer. (We don't check for matching here. Any code provided to Caterwaul will already have been parsed by the host Javascript interpreter,
//       so we know that it is valid.)

//       All operator indexing is done uniformly, left-to-right. Note that the indexing isn't strictly by operator. It's by reduction order, which is arguably more important. That's what the
//       parse_inverse_order table does: it maps operator names to parse_reduce_order subscripts. (e.g. 'new' -> 2.)

        t === gs_top ? (grouping_stack.pop(), gs_top = grouping_stack[grouping_stack.length - 1], head = head ? head.p : parent, parent = null) :
                       (has(parse_group, t) ? (grouping_stack.push(gs_top = parse_group[t]), parent = push(new_node(new syntax_node(t))), head = null) : push(new_node(new syntax_node(t))),
                        has(parse_inverse_order, t) && indexes[parse_inverse_order[t]].push(head || parent));           // <- This is where the indexing happens

//       Regexp flag special cases.
//       Normally a () group wraps an expression, so a following / would indicate division. The only exception to this is when we have a block construct; in this case, the next token appears in
//       statement-mode, which means that it begins, not modifies, a value. We'll know that we have such a case if (1) the immediately-preceding token is a close-paren, and (2) a block-accepting
//       syntactic form occurs to its left.

//       With all this trouble over regular expressions, I had to wonder whether it was possible to do it more cleanly. I don't think it is, unfortunately. Even lexing the stream backwards fails
//       to resolve the ambiguity:

//       | for (var k in foo) /foo/g.test(k) && bar();

//       In this case we won't know it's a regexp until we hit the 'for' keyword (or perhaps 'var', if we're being clever -- but a 'with' or 'if' would require complete lookahead). A perfectly
//       valid alternative parse, minus the 'for' and 'var', is this:

//       | ((k in foo) / (foo) / (g.test(k))) && bar();

//       The only case where reverse-lexing is useful is when the regexp has no modifiers.

        re |= t === ')' && head.l && has(parse_r_until_block, head.l.data)}

//     Operator fold loop.
//     This is the second major part of the parser. Now that we've completed the lex process, we can fold operators and syntax, and take care of some exception cases.

//     First step: functions, calls, dots, and dereferences.
//     I'm treating this differently from the generalized operator folding because of the syntactic inference required for call and dereference detection. Nothing has been folded at this point
//     (with the exception of paren groups, which is appropriate), so if the node to the left of any ( or [ group is an operator, then the ( or [ is really a paren group or array literal. If, on
//     the other hand, it is another value, then the group is a function call or a dereference. This folding goes left-to-right. The reason we also process dot operators is that they share the same
//     precedence as calls and dereferences. Here's what a () or [] transform looks like:

//     |   quux <--> foo <--> ( <--> bar                              quux <--> () <--> bar
//                             \                                               /  \                  <-- This can be done by saying _.l.wrap(new node('()')).p.fold_r().
//                              bif <--> , <--> baz       -->               foo    (                     _.l.wrap() returns l again, .p gets the wrapping node, and fold_r adds a child to it.
//                                                                                  \
//                                                                                   bif <--> , <--> baz

//     This is actually merged into the for loop below, even though it happens before other steps do (see 'Ambiguous parse groups').

//     Second step: fold operators.
//     Now we can go through the list of operators, folding each according to precedence and associativity. Highest to lowest precedence here, which is just going forwards through the indexes[]
//     array. The parse_index_forward[] array indicates which indexes should be run left-to-right and which should go right-to-left.

        for (var i = 0, l = indexes.length, forward, _; _ = indexes[i], forward = parse_index_forward[i], i < l; ++i)
          for (var j = forward ? 0 : _.length - 1, lj = _.length, inc = forward ? 1 : -1, node, data, ll; forward ? j < lj : j >= 0; j += inc)

//       Binary node behavior.
//       The most common behavior is binary binding. This is the usual case for operators such as '+' or ',' -- they grab one or both of their immediate siblings regardless of what they are.
//       Operators in this class are considered to be 'fold_lr'; that is, they fold first their left sibling, then their right.

            if (has(parse_lr, data = (node = _[j]).data))  node._fold_lr();

//       Ambiguous parse groups.
//       As mentioned above, we need to determine whether grouping constructs are invocations or real groups. This happens to take place before other operators are parsed (which is good -- that way
//       it reflects the precedence of dereferencing and invocation). The only change we need to make is to discard the explicit parenthetical or square-bracket grouping for invocations or
//       dereferences, respectively. It doesn't make much sense to have a doubly-nested structure, where we have a node for invocation and another for the group on the right-hand side of that
//       invocation. Better is to modify the group in-place to represent an invocation.

//       We can't solve this problem here, but we can solve it after the parse has finished. I'm pushing these invocation nodes onto an index for the end.

//       Sometimes we have a paren group that doesn't represent a value. This is the case for most control flow constructs:

//       | for (var k in o) (...)

//       We need to detect this and not fold the (var k in o)(...) as an invocation, since doing so would seriously break the resulting syntax.

//       There is an even more pathological case to consider. Firefox and other SpiderMonkey-based runtimes rewrite anonymous functions without parentheses, so you end up with stuff like this:

//       | function () {} ()

//       In this case we need to encode an invocation. Fortunately by this point the function node is already folded.

       else if (has(parse_ambiguous_group, data) && node.l && ! ((ll = node.l.l) && has(parse_r_until_block, ll.data)) &&
               (node.l.data === '.' || (node.l.data === 'function' && node.l.length === 2) ||
                                       ! (has(lex_op, node.l.data) ||
                                          has(parse_not_a_value, node.l.data))))  invocation_nodes.push(node.l._wrap(new_node(new syntax_node(data + parse_group[data]))).p._fold_r());

//       Unary left and right-fold behavior.
//       Unary nodes have different fold directions. In this case, it just determines which side we grab the node from. I'm glad that Javascript doesn't allow stuff like '++x++', which would make
//       the logic here actually matter. Because there isn't that pathological case, exact rigidity isn't required.

       else if (has(parse_l, data))  node._fold_l();
       else if (has(parse_r, data))  node._fold_r();

//       Ternary operator behavior.
//       This is kind of interesting. If we have a ternary operator, then it will be treated first as a group; just like parentheses, for example. This is the case because the ternary syntax is
//       unambiguous for things in the middle. So, for example, '3 ? 4 : 5' initially parses out as a '?' node whose child is '4'. Its siblings are '3' and '5', so folding left and right is an
//       obvious requirement. The only problem is that the children will be in the wrong order. Instead of (3) (4) (5), we'll have (4) (3) (5). So after folding, we do a quick swap of the first two
//       to set the ordering straight.

       else if (has(parse_ternary, data))  {node._fold_lr(); var temp = node[1]; node[1] = node[0]; node[0] = temp}

//       Grab-until-block behavior.
//       Not quite as simple as it sounds. This is used for constructs such as 'if', 'function', etc. Each of these constructs takes the form '<construct> [identifier] () {}', but they can also
//       have variants that include '<construct> () {}', '<construct> () statement;', and most problematically '<construct> () ;'. Some of these constructs also have optional child components; for
//       example, 'if () {} else {}' should be represented by an 'if' whose children are '()', '{}', and 'else' (whose child is '{}'). The tricky part is that 'if' doesn't accept another 'if' as a
//       child (e.g. 'if () {} if () {}'), nor does it accept 'for' or any number of other things. This discrimination is encoded in the parse_accepts table.

//       There are some weird edge cases, as always. The most notable is what happens when we have nesting without blocks:

//       | if (foo) bar; else bif;

//       In this case we want to preserve the semicolon on the 'then' block -- that is, 'bar;' should be its child; so the semicolon is required. But the 'bif' in the 'else' case shouldn't have a
//       semicolon, since that separates top-level statements. Because desperate situations call for desperate measures, there's a hack specifically for this in the syntax tree serialization.

//       One more thing. Firefox rewrites syntax trees, and one of the optimizations it performs on object literals is removing quotation marks from regular words. This means that it will take the
//       object {'if': 4, 'for': 1, etc.} and render it as {if: 4, for: 1, etc.}. As you can imagine, this becomes a big problem as soon as the word 'function' is present in an object literal. To
//       prevent this from causing problems, I only collapse a node if it is not followed by a colon. (And the only case where any of these would legally be followed by a colon is as an object
//       key.)

       else if (has(parse_r_until_block, data) && node.r && node.r.data !== ':')
                                                 {for (var count = 0, limit = parse_r_until_block[data]; count < limit && node.r && ! has(parse_block, node.r.data); ++count) node._fold_r();
                                                  node.r && (node.r.data === ';' ? node.push(empty) : node._fold_r());
                                                  if (has(parse_accepts, data) && parse_accepts[data] === (node.r && node.r.r && node.r.r.data)) node._fold_r().pop()._fold_r();
                                             else if (has(parse_accepts, data) && parse_accepts[data] === (node.r && node.r.data))               node._fold_r()}

//       Optional right-fold behavior.
//       The return, throw, break, and continue keywords can each optionally take an expression. If the token to the right is an expression, then we take it, but if the token to the right is a
//       semicolon then the keyword should be nullary.

       else if (has(parse_r_optional, data))  node.r && node.r.data !== ';' && node._fold_r();

//     Third step.
//     Find all elements with right-pointers and wrap them with semicolon nodes. This is necessary because of certain constructs at the statement-level don't use semicolons; they use brace syntax
//     instead. (e.g. 'if (foo) {bar} baz()' is valid, even though no semicolon precedes 'baz()'.) By this point everything else will already be folded. Note that this does some weird things to
//     associativity; in general, you can't make assumptions about the exact layout of semicolon nodes. Fortunately semicolon is associative, so it doesn't matter in practice. And just in case,
//     these nodes are 'i;' rather than ';', meaning 'inferred semicolon' -- that way it's clear that they aren't original. (They also won't appear when you call toString() on the syntax tree.)

        for (var i = all_nodes.length - 1, _; i >= 0; --i)  (_ = all_nodes[i]).r && _._wrap(new_node(new syntax_node('i;'))).p._fold_r();

//     Fourth step.
//     Flatten out all of the invocation nodes. As explained earlier, they are nested such that the useful data on the right is two levels down. We need to grab the grouping construct on the
//     right-hand side and remove it so that only the invocation or dereference node exists. During the parse phase we built an index of all of these invocation nodes, so we can iterate through
//     just those now. I'm preserving the 'p' pointers, though they're probably not useful beyond here.

        for (var i = 0, l = invocation_nodes.length, _, child; i < l; ++i)  (child = (_ = invocation_nodes[i])[1] = _[1][0] || empty) && (child.p = _);

        while (head.p) head = head.p;

//     Fifth step.
//     Prevent a space leak by clearing out all of the 'p', 'l', and 'r' pointers.

        for (var i = all_nodes.length - 1, _; i >= 0; --i)  delete (_ = all_nodes[i]).p, delete _.l, delete _.r;
        return head};
// Generated by SDoc 
