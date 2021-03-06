Rewrite grammar-based macro definition | Spencer Tipping
Licensed under the terms of the MIT source code license

# Introduction

I've been typing a lot of boilerplate every time I want to write a new Caterwaul DSL. But this is silly. This abstraction takes care of setting up the anonymization context and rewriting
structure. It's pretty easy to use: you just specify what your anonymous markers are and then give it a bunch of rules. It provides a function that automatically constructs rules from
pattern/replacement pairs, where the replacement can be either a syntax tree or a function. For example:

    $.modifiers.foo = $.grammar('F', 'F[_x]'.qs, given.rule in ['F[_x + _y]'.qs /-rule/ '_x * _y'.qs]);
    $('foo')('3 + 4 -foo').structure()    -> '(* (3) (4))'

    caterwaul.module('std.grammar', 'js js_literals words', function ($) {
      $.grammar(anonymous_symbols, initial_form, rule_cc) = "expand.call(expand, anon_pattern.replace({_x: _._expression})) -re- this(it) /when.it".qf

      -where [anon         = $.anonymizer(anonymous_symbols),
              anon_pattern = anon(initial_form),
              rule(p, e)   = $.rereplacer(anon(p), e.constructor === $.syntax ? anon(e) : e),
              expand       = $(rule_cc(rule, anon) /!$.alternatives)]});