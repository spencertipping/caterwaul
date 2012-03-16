Rewrite grammar-based macro definition | Spencer Tipping
Licensed under the terms of the MIT source code license

# Introduction

I've been typing a lot of boilerplate every time I want to write a new Caterwaul DSL. But this is silly. This abstraction takes care of setting up the anonymization context and rewriting
structure. It's pretty easy to use: you just specify what your anonymous markers are and then give it a bunch of rules. It provides a function that automatically constructs rules from
pattern/replacement pairs, where the replacement can be either a syntax tree or a function. For example:

    var compiler = $('js_all');
    compiler.modifiers.foo = $.grammar('F', {initial: 'F[_x]'.qs}, given.rule in ['F[_x + _y]'.qs /-rule/ '_x * _y'.qs]);
    compiler('3 + 4 -foo'.qs).structure()    -> '(* (3) (4))'

Rules are matched from last to first as usual. The list of anonymization symbols can be specified as a space-delimited string or an array.

    caterwaul.module('std.grammar', 'js js_literals words', function ($) {
      $.grammar(anonymous_symbols, options, rule_cc) = "expand.call(expand, anon_pattern.replace({_x: _._expression})) -re- this(it) /when [it && this.constructor === Function]".qf

      -where [default_options = {fix: true, descend: true, initial: 'S[_x]'.qs},
              settings        = {} / default_options /-$.merge/ options,

              anon            = $.anonymizer(anonymous_symbols),
              anon_pattern    = anon(settings.initial),
              rule(p, e)      = $[settings.fix ? 'rereplacer' : 'replacer'](anon(p), e.constructor === $.syntax ? anon(e) : e),
              expand          = rule_cc(rule, anon) /!$.alternatives -re [settings.descend ? $(it) : it]]});