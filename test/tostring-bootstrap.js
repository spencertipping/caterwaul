// Serialization via serialize()

var n = function (s)    {return caterwaul.lex(s).join(' ').replace(/\s+/g, ' ').replace(/;\s*\}/g, '}')},
    s = function (s, i) {return eq(caterwaul.parse(s).serialize(), i)},
    i = function (f)    {return eq(n(caterwaul.decompile(f).serialize()),
                                   n(f.toString()))}; //.replace(/\s+/g, ''))};

// Hardcore test:

i(function () {
  var _caterwaul = this.caterwaul, _$c = this.$c,                            fn = function (x) {return new Function ('$0', '$1', '$2', '$3', '$4', 'return ' + x.replace(/@/g, 'this.'))},
              $c = function () {return $c.init.apply(this, arguments)},  gensym = (function (n) {return function () {return 'gensym' + (++n).serialize(36)}})(0),
              qw = fn('$0.split(/\\s+/)'),                                  own = Object.prototype.hasOwnProperty,
             has = function (o, p) {return own.call(o, p)},
             map = function (f, xs) {for (var i = 0, ys = [], l = xs.length; i < l; ++i) ys.push(f(xs[i])); return ys},
            hash = function (s) {for (var i = 0, xs = qw(s), o = {}, l = xs.length; i < l; ++i) o[xs[i]] = true; return o},
          extend = function (f) {for (var i = 1, p = f.prototype, l = arguments.length, _ = null; _ = arguments[i], i < l; ++i) for (var k in _) has(_, k) && (p[k] = _[k]); return f},
       lex_op = hash('. new ++ -- u++ u-- u+ u- typeof u~ u! ! * / % + - << >> >>> < > <= >= instanceof in == != === !== & ^ | && || ? = += -= *= /= %= &= |= ^= <<= >>= >>>= : , ' +
                     'return throw case var const break continue void ;'),
    lex_table = function (s) {for (var i = 0, xs = [false]; i < 8; ++i) xs = xs.concat(xs); for (var i = 0, l = s.length; i < l; ++i) xs[s.charCodeAt(i)] = true; return xs},
    lex_float = lex_table('.0123456789'),    lex_decimal = lex_table('0123456789'),  lex_integer = lex_table('0123456789abcdefABCDEFx'), lex_exp = lex_table('eE'),
    lex_space = lex_table(' \n\r\t'),        lex_bracket = lex_table('()[]{}'),       lex_opener = lex_table('([{'),                   lex_punct = lex_table('+-*/%&|^!~=<>?:;.,'),
      lex_eol = lex_table('\n\r'),     lex_regexp_suffix = lex_table('gims'),          lex_quote = lex_table('\'"/'),                  lex_slash = '/'.charCodeAt(0),
     lex_star = '*'.charCodeAt(0),              lex_back = '\\'.charCodeAt(0),             lex_x = 'x'.charCodeAt(0),                    lex_dot = '.'.charCodeAt(0),
     lex_zero = '0'.charCodeAt(0),     lex_postfix_unary = hash('++ --'),              lex_ident = lex_table('$_abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'),
    lex = $c.lex = function (s) {
      var s = s.serialize(), mark = 0, cs = [], c = 0, re = true, esc = false, dot = false, exp = false, close = 0, t = '', ts = [],
          interned = {}, intern = function (s) {return interned['@' + s] || (interned['@' + s] = new String(s))};
      for (var i = 0, l = s.length; i < l || (i = 0); ++i) cs.push(s.charCodeAt(i));
      while ((mark = i) < l) {
        while (lex_space[c = cs[i]] && i < l) mark = ++i;
        esc = exp = dot = t = false;
        if                                        (lex_bracket[c])                                                                    {t = !! ++i; re = lex_opener[c]}
   else if (c === lex_slash && cs[i + 1] === lex_star && (i += 2)) {while (++i < l && cs[i] !== lex_slash || cs[i - 1] !== lex_star);  t = !  ++i}
   else if            (c === lex_slash && cs[i + 1] === lex_slash) {while                              (++i < l && ! lex_eol[cs[i]]);  t = false}
   else if (lex_quote[c] && (close = c) && re && ! (re = ! (t = s.charAt(i)))) {while (++i < l && (c = cs[i]) !== close || esc)  esc = ! esc && c === lex_back;
                                                                                while     (++i < l && lex_regexp_suffix[cs[i]])                               ; t = true}
   else if                (c === lex_zero && lex_integer[cs[i + 1]]) {while (++i < l && lex_integer[cs[i]]); re = ! (t = true)}
   else if (c === lex_dot && lex_decimal[cs[i + 1]] || lex_float[c]) {while (++i < l && (lex_decimal[c = cs[i]] || (dot ^ (dot |= c === lex_dot)) || (exp ^ (exp |= lex_exp[c] && ++i))));
                                                                      while (i < l && lex_decimal[cs[i]]) ++i; re = ! (t = true)}
   else if (lex_punct[c] && (t = re ? 'u' : '', re = true)) {while (i < l && lex_punct[cs[i]] && has(lex_op, t + s.charAt(i)))  t += s.charAt(i++); re = ! has(lex_postfix_unary, t)}
   else {while (++i < l && lex_ident[cs[i]]); re = has(lex_op, t = s.substring(mark, i))}
      t !== false && ts.push(intern(t === true ? s.substring(mark, i) : t));
    }
    return ts},
    parse_reduce_order = map(hash, ['[ . ( [] ()', 'function', 'new', 'u++ u-- ++ -- typeof u~ u! u+ u-', '* / %', '+ -', '<< >> >>>', '< > <= >= instanceof in', '== != === !==', '&', '^',
                                    '|', '&&', '||', 'case', '?', '= += -= *= /= %= &= |= ^= <<= >>= >>>=', ':', ',', 'return throw break continue', 'var const',
                                    'if else try catch finally for switch with while do', ';']),
parse_associates_right = hash('= += -= *= /= %= &= ^= |= <<= >>= >>>= ~ ! new typeof u+ u- -- ++ u-- u++ ? if else function try catch finally for switch case with while do'),
   parse_inverse_order = (function (xs) {for (var  o = {}, i = 0, l = xs.length; i < l; ++i) for (var k in xs[i]) has(xs[i], k) && (o[k] = i); return o}) (parse_reduce_order),
   parse_index_forward = (function (rs) {for (var xs = [], i = 0, l = rs.length, _ = null; _ = rs[i], xs[i] = true, i < l; ++i)
                                           for (var k in _) if (has(_, k) && (xs[i] = xs[i] && ! has(parse_associates_right, k))) break; return xs}) (parse_reduce_order),
              parse_lr = hash('[] . () * / % + - << >> >>> < > <= >= instanceof in == != === !== & ^ | && || = += -= *= /= %= &= |= ^= <<= >>= >>>= , ;'),
   parse_r_until_block = {'function':2, 'if':1, 'do':1, 'catch':1, 'try':1, 'for':1, 'while':1},    parse_accepts = {'if':'else', 'do':'while', 'catch':'finally', 'try':'catch'},
      parse_r_optional = hash('return throw break continue'),  parse_l = hash('++ --'),                   parse_r = hash('u+ u- u! u~ u++ u-- new typeof else finally var const void'),
           parse_block = hash('; {'),                    parse_k_empty = fn('[]'),                    parse_group = {'(':')', '[':']', '{':'}', '?':':'},  
 parse_ambiguous_group = hash('[ ('),                    parse_ternary = hash('?'),             parse_not_a_value = hash('function if for while catch'),
       parse_invisible = hash('() []'),
       syntax_node_inspect = fn('$0.inspect()'),  syntax_node_tostring = fn('$0 ? $0.serialize() : ""'),
               syntax_node = $c.syntax_node = extend (fn('@data = $0, @length = 0, @l = @r = @p = null'), {
                 replace: fn('($0.l = @l) && (@l.r = $0), ($0.r = @r) && (@r.l = $0), this'),    append_to: fn('$0 && $0.append(this), this'),                                           
                reparent: fn('@p && @p[0] === this && (@p[0] = $0), this'),                         fold_l: fn('@l && @append(@l.unlink(this)), this'),  fold_lr: fn('@fold_l().fold_r()'),
                  append: fn('(this[@length++] = $0).p = this'),                                    fold_r: fn('@r && @append(@r.unlink(this)), this'),  fold_rr: fn('@fold_r().fold_r()'),
                 sibling: fn('$0.p = @p, (@r = $0).l = this'),                                      unlink: fn('@l && (@l.r = @r), @r && (@r.l = @l), @l = @r = null, @reparent($0)'),
                    wrap: fn('$0.p = @replace($0).p, @reparent($0), @l = @r = null, @append_to($0)'),  pop: fn('--@length, this'),
                 inspect: function () {return (this.l ? '(left) <- ' : '') + '(' + this.data + (this.length ? ' ' + map(syntax_node_inspect, this).join(' ') : '') + ')' +
                                              (this.r ? ' -> ' + this.r.inspect() : '')},
                serialize: function () {var op = this.data, right = this.r ? '/* -> ' + this.r.serialize() + ' */' : '',
                                            s = has(parse_invisible, op) ? map(syntax_node_tostring, this).join('') :
                                                  has(parse_ternary, op) ? map(syntax_node_tostring, [this[0], op, this[1], parse_group[op], this[2]]).join('') :
                                                    has(parse_group, op) ? op + map(syntax_node_tostring, this).join('') + parse_group[op] :
                                                       has(parse_lr, op) ? map(syntax_node_tostring, [this[0], op, this[1]]).join('') :
                           has(parse_r, op) || has(parse_r_optional, op) ? op.replace(/^u/, '') + ' ' + this[0].serialize() :
                                            has(parse_r_until_block, op) ? op + ' ' + map(syntax_node_tostring, this).join('') :
                                                        has(parse_l, op) ? this[0].serialize() + op : op;
                                       return right ? s + right : s}}),
    parse = $c.parse = function (ts) {
      var grouping_stack = [], gs_top = null, head = null, parent = null, indexes = map(parse_k_empty, parse_reduce_order),
          push = function (n) {return head ? head.sibling(head = n) : (head = n.append_to(parent)), n};
      for (var i = 0, l = ts.length, _ = null; _ = ts[i], i < l; ++i) _ == gs_top          ? (grouping_stack.pop(), gs_top = grouping_stack[grouping_stack.length - 1],
                                                                                                                                            head = head ? head.p : parent, parent = null) :
                                                                      (has(parse_group, _) ? (grouping_stack.push(gs_top = parse_group[_]), parent = push(new syntax_node(_)), head = null) :
                                                                                              push(new syntax_node(_)),
                                                                       has(parse_inverse_order, _) && indexes[parse_inverse_order[_]].push(head || parent));
      for (var i = 0, i0 = indexes[0], l = i0.length, _ = null, _d = null, _l = null; _ = i0[i], _d = _ && _.data, _l = _ && _.l, i < l; ++i)
        if (_d == '.')                                                                                                               _.fold_lr();
   else if (has(parse_ambiguous_group, _d) && _l && (_l.data == '.' || ! (has(lex_op, _l.data) || has(parse_not_a_value, _l.data)))) _l.wrap(new syntax_node(_d + parse_group[_d])).p.fold_r();
      for (var i = 1, l = indexes.length, forward = null, _ = null; _ = indexes[i], forward = parse_index_forward[i], i < l; ++i)  
        for (var j = forward ? 0 : _.length - 1, lj = _.length, inc = forward ? 1 : -1, node = null, data = null; node = _[j], data = node && node.data, forward ? j < lj : j >= 0; j += inc)
          if (has(parse_lr, data)) node.fold_lr();
     else if (has(parse_l, data))  node.fold_l();
     else if (has(parse_r, data))  node.fold_r();
     else if (has(parse_ternary, data)) {node.fold_lr(); var temp = node[1]; node[1] = node[0]; node[0] = temp}
     else if (has(parse_r_until_block, data))  {for (var count = 0, limit = parse_r_until_block[data]; count < limit && node.r && ! has(parse_block, node.r.data); ++count) node.fold_r();
                                                node.fold_r();
                                                if (has(parse_accepts, data) && parse_accepts[data] == (node.r && node.r.r && node.r.r.data)) node.fold_r().pop().fold_r();
                                           else if (has(parse_accepts, data) && parse_accepts[data] == (node.r && node.r.data))               node.fold_r();
                                                if (node.r && node.r.data != ';')                                                             node.wrap(new syntax_node(';')).p.fold_r()}
     else if (has(parse_r_optional, data))  node.r && node.r.data != ';' && node.fold_r();
      while (head.p) head = head.p;
      return head;
    };
  this.caterwaul = this.$c = $c;
});

// Generated by SDoc 