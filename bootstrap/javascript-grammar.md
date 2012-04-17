Javascript regexp grammar definition | Spencer Tipping
Licensed under the terms of the MIT source code license

# Introduction

This module defines a vanilla Javascript grammar in terms of mutually recursive regular expressions.

    caterwaul.module('javascript-grammar', ':all', function ($) {
      $.javascript_grammar = capture [program       = /l:@statement post:@ws data:$/,
                                      statement     = /@block | @with_semi | data:; | @statement_/,
                                      block         = /data:\{ l:@statement \}/,
                                      with_semi     = /l:@statement_ data:;/,
                                      statement_    = /@if_ | @for_iterator | @for_in | @while_ | @do_ | @switch_ | @throw_ | @try_ | @return_ | @break_ | @continue_ | @expressions/,
                                      if_           = /data:if pre:@ws \(cond:@expressions\) l:@statement r:@else_/,
                                      else_         = /data:else pre:@ws l:@statement | @ws/,
                                      for_iterator  = /data:for pre:@ws \(init:@statement cond:@expressions post_cond:@ws; inc:@expression\) l:@statement/,
                                      for_in        = /data:for pre:@ws \(var? variable:@identifier post_variable:@ws in cond:@expression\) l:@statement/,
                                      while_        = /data:while pre:@ws \(cond:@expressions\) l:@statement/,
                                      do_           = /data:do l:@statement while pre:@ws \(cond:@expressions\)/,
                                      switch_       = /data:switch pre:@ws \(cond:@expressions\) post:@ws \{l:@cases\}/,
                                      cases         = /l:@case_ r:@cases | l:@default_ r:@cases | @statement/,
                                      case_         = /pre:@ws data:case cond:@expressions \:/,
                                      default_      = /pre:@ws data:default post:@ws \:/,
                                      throw_        = /data:throw l:@expressions/,
                                      try_          = /data:try l:@statement (r: (@catch_ | @finally_))/,
                                      catch_        = /data:catch pre:@ws \(cond:@expressions\) r:@finally_/,
                                      finally_      = /data:finally l:@statement | @ws/,
                                      return_       = /data:return pre:@ws l:@expressions | return/,
                                      break_        = /data:break pre:@ws cond:@identifier | break/,
                                      continue_     = /data:continue pre:@ws cond:@identifier | break/,

                                      nontrivial_ws = /data:([\s]+) l:@ws | data:(\/\/) text:.* l:@ws | data:(\/\*) text:(([^*]|\*[^\/])*) \*\/ l:@ws/,
                                      ws            = /@nontrivial_ws | \s*/,

                                      expressions   = /l:@expression data:[,] r:@expressions | @expression/,

                                      expression    = /@unary | @binary | @group | @literal | @identifier | data:@nontrivial_ws l:@expression/,
                                      literal       = /@dstring | @sstring | @number | @regexp | @array | @object/,
                                      dstring       = /"([^\\"]|\\.)*"/,
                                      sstring       = /'([^\\']|\\.)*'/,
                                      number        = /-?0x[0-9a-fA-F]* | -?0[0-7]* | -?[0-9]*\.[0-9]*([eE][-+]?[0-9]+)? | -?[0-9]+(\.[0-9]*([eE][-+]?[0-9]+)?)?/,
                                      regexp        = /\/([^\\\/]|\\.)*\//,
                                      identifier    = /[A-Za-z$_][A-Za-z0-9$_]*/,

                                      atom          = /pre:@ws l:@literal post:@ws data:[.] r:@atom | pre:@ws l:@literal/,
                                      unary         = /pre:@ws data:(-- | \+\+ | - | \+ | ~ | ! | new | typeof | delete | void) r:@expression/,
                                      binary        = /l:@atom pre:@ws data:([-.+*\/%!=<>&|^?:] | instanceof | in) r:@expression/,

                                      group         = /data:\( l:@expressions \)/,
                                      array         = /data:\[ l:@expressions \]/,
                                      object        = /data:\{ l:@expressions \}/] /-caterwaul.regexp_grammar/ common_methods

      -where [traversal_for(name) = '_v, given[]'.qse /~replace/ {_v: name.split('') /['this'.qs]['_x._y()'.qs /~replace/ {_x: x0, _y: x}] /seq} /!$.compile,
              common_methods      = {}
                                    |-$.merge| ni[2, 5] *~!level *[[x, traversal_for(x)]] /object -seq
                                               -where [level(n) = 'l r'.qw *~![n > 1 ? level(n - 1) *y[x + y] -seq : [x]] -seq]]});