Regular expression grammar compiler | Spencer Tipping
Licensed under the terms of the MIT source code license

# Introduction

This module converts regular expression grammar maps to string-isomorphic AST nodes. Variants are specified using a group containing a declaration: /(cond: expression)/ defines a variant named
'cond' that uses the 'expression' rule. Rules are specified in a hash.

Certain regular expression operators are not supported:

    1. Lookahead/negative lookahead.
    2. Greedy repetition.
    3. Most backslash-forms.
    4. Match groups in their normal context.
    5. Backreferences.
    6. Repetition of sub-steps.

Any unbound regions will be stored as gensym keys, later retrievable via 

    caterwaul.module('regexp-grammar-compiler', ':all', function ($) {
      $.regexp_grammar(rules) = rules /pairs *!visit -seq -re- classes
                        -where [parsed_rules             = {},
                                classes                  = {},

                                visit(pair)              = parsed_rules[pair[0]] -eq- pair[1] /-$.regexp/ {atom: 'word'} <then> classes[pair[0]] -eq- parser_for(parsed_rules[pair[0]])
                                                           /rescue ['failed to generate a parser for #{pair[1]}' /!process.stderr.write, e /raise],

                                parser_for(r)            = 'function (s) {var cons = {}; _stages; if (s) {s.cons = cons; return s}}'.qs /~replace/ {_stages: matching_stage_for(r, 's')},

                                matching_stage_for(t, v) = t /!is_substep        -re [it            ? substep(it, t, v)
                                                         : t /!is_inline_substep -re [it            ? inline_substep(it, t, v)

                                                         : t /!is_constant                          ? constant(t, v)
                                                         : t.data === '*'                           ? repetition(t, v)
                                                         : t.data === '?'                           ? optional(t, v)
                                                         : t.data === ','                           ? sequence(t, v)
                                                         : t.data === '('                           ? matching_stage_for(t[0], v)
                                                         : t.data === '|'                           ? alternate(t, v)
                                                         : t.is_character_class() || t.data === '.' ? character_class(t, v)
                                                                                                    : raise ['no matching form for #{t}']]],

                                substep(it, t, v)        = 'if (_v && (_v = _step(_v))) cons._name = _v.cons'.qse /~replace/ {_name: it._name.data, _step: it._step.data, _v: v},
                                inline_substep(it, t, v) = 'if (_v && (_v = _step(_v))) cons = _v.cons'.qse /~replace/ {_v: v, _step: it._step.data},
                                constant(t, v)           = 'if (_v && _v.s.substr(_v.i, _l) === _s) _v = {s:_v.s, i:_v.i+_l}; else _v = null'.qse
                                                           /~replace/ {_l: '#{t.data.length}', _s: $.syntax.from_string(t.data), _v: v},

                                repetition(t, v)         = 'var _last, _original = _v; while (_v) {_last = _v; _each}; _v = _last; if (_v) cons._name = _v.s.substring(_original.i, _v.i)'.qs
                                                           /~replace/ {_last: $.gensym('last'), _original: $.gensym('s'), _name: t.cons_name = $.gensym('repetition'), _v: v,
                                                                       _each: matching_stage_for(t[0], v)},

                                optional(t, v)           = 'var _temp = _v; _stage; if (_temp) _v = _temp, _v.cons._name = true'.qs
                                                           /~replace/ {_v: v, _temp: temp, _name: t.cons_name = $.gensym('optional_term'), _stage: matching_stage_for(t[0], temp)}
                                                           -where [temp = $.gensym(v)],

                                sequence(t, v)           = '_x; _y'.qs /~replace/ {_x: matching_stage_for(t[0], v), _y: matching_stage_for(t[1], v)},

                                alternate(t, v)          = 'var _temp = _v; _stage1; if (_temp) _v = _temp; else {_stage2}'.qs
                                                           /~replace/ {_v: v, _temp: temp, _stage1: matching_stage_for(t[0], temp), _stage2: matching_stage_for(t[1], v)}
                                                           -where [temp = $.gensym(v)],

                                character_class(t, v)    = 'if (_v && _regexp.test(_v.s.charAt(_v.i))) _v = {s: _v.s, i: _v.i + 1}; else _v = null'.qs /~replace/ {_v: v, _regexp: '/#{t}/'},

                                substep_pattern          = $.regexp(/(_name: _step)/, {atom: 'word'}),
                                inline_substep_pattern   = $.regexp(/(:_step)/, {atom: 'word'}),

                                is_substep(t)            = substep_pattern /~match/ t,
                                is_inline_substep(t)     = inline_substep_pattern /~match/ t,

                                is_constant(t)           = t.is_atom() && t.data !== '.']});