Javascript regexp grammar definition | Spencer Tipping
Licensed under the terms of the MIT source code license

# Introduction

This module defines a vanilla Javascript grammar in terms of mutually recursive regular expressions.

    caterwaul.module('javascript-grammar', ':all', function ($) {
      $.javascript_grammar = capture [statement     = /@block | @with_semi | ; | @statement_/,
                                      block         = /\{ @statement \}/,
                                      with_semi     = /s:@statement_ ;/,
                                      statement_    = /@if_ | @for_iterator | @for_in | @while_ | @do_ | @switch_ | @throw_ | @try_ | @return_ | @break_ | @continue_ | @expression/,
                                      if_           = /if pre:@ws \(cond:@expression\) lhs:@statement rhs:@else_/,
                                      else_         = /else pre:@ws lhs:@statement | @ws/,
                                      for_iterator  = /for pre:@ws \(init:@statement cond:@expression post_cond:@ws; inc:@expression\) lhs:@statement/,
                                      for_in        = /for pre:@ws \(var? variable:@identifier post_variable:@ws in cond:@expression\) lhs:@statement/,
                                      while_        = /while pre:@ws \(cond:@expression\) lhs:@statement/,
                                      do_           = /do lhs:@statement while pre:@ws \(cond:@expression\)/,
                                      switch_       = /switch pre:@ws \(cond:@expression\) post:@ws \{cases:@cases\}/,
                                      cases         = /lhs:@case_ rhs:@cases | lhs:@default_ rhs:@cases | @statement/,
                                      case_         = /pre:@ws case cond:@expression \:/,
                                      default_      = /pre:@ws default post:@ws \:/,
                                      throw_        = /throw lhs:@expression/,
                                      try_          = /try lhs:@statement (rhs: (@catch_ | @finally_))/,
                                      catch_        = /catch pre:@ws \(cond:@expression\) rhs:@finally_/,
                                      finally_      = /finally lhs:@statement | @ws/,
                                      return_       = /return pre:@ws lhs:@expression | return/,
                                      break_        = /break pre:@ws cond:@identifier | break/,
                                      continue_     = /continue pre:@ws cond:@identifier | break/,

                                      ws            = /(spacing:[\s]+) rest:@ws | comment:@line_comment rest:@ws | comment:@block_comment rest:@ws | [\s]*/,
                                      line_comment  = /\/\/ text:.*/,
                                      block_comment = /\/\* (text:([^*]|\*[^\/])*) \*\//,

                                      expressions   = /lhs:@expression op:[,] rhs:@expressions | @expression/,

                                      expression    = /@unary | @binary | @group | @literal | @identifier/,
                                      literal       = /@dstring | @sstring | @number | @regexp | @array | @object/,
                                      dstring       = /"([^\\"]|\\.)*"/,
                                      sstring       = /'([^\\']|\\.)*'/,
                                      number        = /-?0x[0-9a-fA-F]* | -?0[0-7]* | -?[0-9]*\.[0-9]*([eE][-+]?[0-9]+)? | -?[0-9]+(\.[0-9]*([eE][-+]?[0-9]+)?)?/,
                                      regexp        = /\/([^\\\/]|\\.)*\//,
                                      identifier    = /[A-Za-z$_][A-Za-z0-9$_]*/,

                                      atom          = /pre:@ws lhs:@literal post:@ws op:[.] rhs:@atom | pre:@ws lhs:@literal/,
                                      unary         = /pre:@ws op:(-- | \+\+ | - | \+ | ~ | ! | new | typeof | delete | void) rhs:@expression/,
                                      binary        = /lhs:@atom pre:@ws op: ([-.+*\/%!=<>&|^?:] | instanceof | in) rhs:@expression/,

                                      group         = /\( x:@expressions \)/,
                                      array         = /\[ xs:@expressions \]/,
                                      object        = /\{ xs:@expressions \}/] /!caterwaul.regexp_grammar});