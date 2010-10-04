" Vim syntax file
" Language:	JavaScript with Caterwaul extensions
" Maintainer:	Spencer Tipping <spencer@spencertipping.com>
" URL:		http://www.spencertipping.com/js-vim-highlighter/javascript.vim

if !exists("main_syntax")
  if version < 600
    syntax clear
  elseif exists("b:current_syntax")
    finish
  endif
  let main_syntax = 'javascript'
endif

syn case match

syn region    jsParenGroup              matchgroup=jsParen   start=/(/  end=/)/  contains=TOP
syn region    jsBracketGroup            matchgroup=jsBracket start=/\[/ end=/\]/ contains=TOP
syn region    jsBraceGroup              matchgroup=jsBrace   start=/{/  end=/}/  contains=TOP

syn match     jsColonLHS                /\w\+\s*:/
syn match     jsAssignment              /\w\+\s*=[^=]/ contains=jsOperator

syn match     jsNumber                  /-\?\(\d*\.\d\+\|\d\+\.\d*\|\d\+\)\([eE][+-]\?\d\{1,3\}\)\?\|-\?0x[0-9A-Fa-f]\+\|-\?0[0-7]\+/
syn region    jsStringD                 matchgroup=jsQuote start=/"/ skip=/\\\\\|\\"/ end=/"/ contains=jsStringEscape,jsCaterwaulEscape
syn region    jsStringS                 matchgroup=jsQuote start=/'/ skip=/\\\\\|\\'/ end=/'/ contains=jsStringEscape,jsCaterwaulEscape
syn region    jsRegexp                  matchgroup=jsQuote start=+/[^ ]+rs=e-1 skip=+\\\\\|\\/+ end=+/[gims]*\s*$+ end=+/[gims]*\s*[-+*/^%&|=<>;.,)\]}]+me=e-1 oneline contains=jsStringEscape
  
  syn match   jsStringEscape            /\\\d\{3\}\|\\u[0-9A-Za-z]\{4\}\|\\[a-z"'\\]/ contained
  syn match   jsCaterwaulEscape         /#{[^}]\+}/ contains=TOP

syn region    jsBlockComment            start=+/\*+ end=+\*/+ contains=@Spell,jsCommentTags
syn region    jsLineComment             start=+//+  end=+$+   contains=@Spell,jsCommentTags

  syn keyword jsCommentTags             TODO FIXME XXX TBD contained

syn region    jsVarBinding              matchgroup=jsVarBindingConstruct start=/var\s\|const\s/ end=/;/ contains=TOP
syn match     jsVarInBinding            /var\s\+\w\+\s\+in/ contains=jsVarBindingKeyword,jsOperator
syn region    jsParamBinding            matchgroup=jsBindingConstruct start=/\(function\|catch\)\s*(/ end=/)/ contains=jsOperator

  syn keyword jsVarBindingKeyword       const var contained
  syn keyword jsBindingKeyword          function catch contained
  syn match   jsBindingAssignment       /\w\+\s*=[^=]/ contains=jsOperator contained containedin=jsVarBinding
  syn match   jsExtraBindingAssignment  /\w\+\s*=[^=]/ contains=jsOperator contained containedin=jsCaterwaulLet,jsCaterwaulWhere

syn region    jsTernary                 matchgroup=jsTernaryOperator start=/?/ end=/:/ contains=TOP,jsColonLHS
syn match     jsOperator                /[-+*^%&\|!~;=><,.]\{1,4\}/

syn keyword   jsReservedToplevel        if else switch while for do break continue return with case default try catch finally throw delete void
syn keyword   jsOperator                in instanceof typeof new
syn keyword   jsBuiltinType             Array Boolean Date Function Number Object String RegExp
syn keyword   jsBuiltinLiteral          true false null undefined

syn keyword   jsBuiltinValue            this arguments
syn keyword   jsPrototype               prototype constructor

syn region    jsCaterwaulQs             matchgroup=jsCaterwaulMacro start=/qs\s*\[/           end=/]/ contains=TOP
syn region    jsCaterwaulFn             matchgroup=jsCaterwaulMacro start=/fn\s*\[/           end=/]/ contains=jsOperator
syn region    jsCaterwaulLet            matchgroup=jsCaterwaulMacro start=/let\s*\[/          end=/]/ contains=TOP,jsBindingAssignment
syn region    jsCaterwaulWhere          matchgroup=jsCaterwaulMacro start=/where\s*\[/        end=/]/ contains=TOP,jsBindingAssignment

syn region    jsCaterwaulFn_            matchgroup=jsCaterwaulMacro start=/fn_\s*\[/          end=/]/ contains=TOP
syn region    jsCaterwaulWhen           matchgroup=jsCaterwaulMacro start=/when\s*\[/         end=/]/ contains=TOP
syn region    jsCaterwaulUnless         matchgroup=jsCaterwaulMacro start=/unless\s*\[/       end=/]/ contains=TOP

syn region    jsCaterwaulDefmacro       matchgroup=jsCaterwaulMacro start=/defmacro\s*\[/     end=/]/ contains=TOP
syn region    jsCaterwaulWithGensyms    matchgroup=jsCaterwaulMacro start=/with_gensyms\s*\[/ end=/]/ contains=jsOperator

syn match     jsCaterwaulDfnParens      /([A-Za-z0-9$_, ]*)\s*>\$>/ contains=jsOperator,jsCaterwaulDfnSigil,jsParens
syn match     jsCaterwaulDfn            /\w\+\s*>\$>/               contains=jsOperator,jsCaterwaulDfnSigil
syn match     jsCaterwaulDfnSigil       />\$>/                      contained

syn match     jsParens                  /[()]/ contained

syn sync fromstart
syn sync maxlines=100

if main_syntax == "javascript"
  syn sync ccomment javaScriptComment
endif

hi def link jsCaterwaulDefmacro         Special
hi def link jsCaterwaulWithGensyms      Identifier

hi def link jsCaterwaulDfnParens        Identifier
hi def link jsCaterwaulDfn              Identifier
hi def link jsCaterwaulDfnSigil         Keyword

hi def link jsCaterwaulQs               Special
hi def link jsCaterwaulMacro            Special
hi def link jsCaterwaulFn               Identifier

hi def link jsLineComment               Comment
hi def link jsBlockComment              Comment
hi def link jsCommentTags               Todo

hi def link jsQuote                     Special
hi def link jsNumber                    Number
hi def link jsStringS                   String
hi def link jsStringD                   String
hi def link jsRegexp                    String
hi def link jsStringEscape              Special
hi def link jsCaterwaulEscape           Special
hi def link jsColonLHS                  Type

hi def link jsAssignment                Type

hi def link jsParen                     Special
hi def link jsParens                    Special
hi def link jsBracket                   Special
hi def link jsBrace                     Special
hi def link jsParenCloseError           Error
hi def link jsBracketCloseError         Error
hi def link jsBraceCloseError           Error

hi def link jsTernaryOperator           Special

hi def link jsVarInBinding              Type

hi def link jsVarBindingKeyword         Keyword
hi def link jsVarBindingConstruct       Keyword
hi def link jsBindingConstruct          Special
hi def link jsBindingKeyword            Keyword
hi def link jsBindingAssignment         Type
hi def link jsExtraBindingAssignment    Identifier
hi def link jsParamBinding              Identifier

hi def link jsReservedToplevel          Keyword
hi def link jsOperator                  Keyword
hi def link jsBuiltinType               Type
hi def link jsBuiltinLiteral            Special
hi def link jsBuiltinValue              Special
hi def link jsPrototype                 Special

let b:current_syntax = "javascript"
if main_syntax == 'javascript'
  unlet main_syntax
endif

" vim: ts=8
