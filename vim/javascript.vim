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
setlocal iskeyword=48-57,95,36,A-Z,a-z

syn region    jsParenGroup              matchgroup=jsParen   start=/(/  end=/)/  contains=TOP
syn region    jsBracketGroup            matchgroup=jsBracket start=/\[/ end=/\]/ contains=TOP
syn region    jsBraceGroup              matchgroup=jsBrace   start=/{/  end=/}/  contains=TOP

syn match     jsAssignment              /\k\+\s*[-+*/^&|%<>]*=[^=]/ contains=jsOperator

syn match     jsIdentifier              /[A-Za-z$_][A-Za-z0-9$_]*/
syn match     jsNumber                  /-\?0x[0-9A-Fa-f]\+\|-\?\(\d*\.\d\+\|\d\+\.\d*\|\d\+\)\([eE][+-]\?\d\{1,3\}\)\?\|-\?0[0-7]\+/
syn region    jsStringD                 matchgroup=jsQuote start=/"/ skip=/\\\\\|\\"/ end=/"/ oneline contains=jsStringEscape,jsCaterwaulEscape
syn region    jsStringS                 matchgroup=jsQuote start=/'/ skip=/\\\\\|\\'/ end=/'/ oneline contains=jsStringEscape,jsCaterwaulEscape
syn region    jsRegexp                  matchgroup=jsQuote start=+/[^ ]+rs=e-1 skip=+\\\\\|\\/+ end=+/[gims]*\s*$+ end=+/[gims]*\s*[-+*/^%&|=<>;.,)\]}]+me=e-1 oneline contains=jsStringEscape
  
  syn match   jsStringEscape            /\\\d\{3\}\|\\u[0-9A-Za-z]\{4\}\|\\[a-z"'\\]/ contained
  syn match   jsCaterwaulEscape         /#{[^}]\+}/ contains=TOP

syn region    jsBlockComment            start=+/\*+ end=+\*/+ contains=@Spell,jsCommentTags
syn region    jsLineComment             start=+//+  end=+$+   contains=@Spell,jsCommentTags

  syn keyword jsCommentTags             TODO FIXME XXX TBD contained

syn match     jsColonLHS                /\k\+\s*:/
syn region    jsVarBinding              matchgroup=jsVarBindingConstruct start=/var\s\|const\s/ end=/;/ contains=TOP
syn match     jsVarInBinding            /var\s\+\k\+\s\+in/ contains=jsVarBindingKeyword,jsOperator
syn region    jsParamBinding            matchgroup=jsBindingConstruct start=/\(function\|catch\)\s*(/ end=/)/ contains=jsOperator

  syn keyword jsVarBindingKeyword       const var contained
  syn keyword jsBindingKeyword          function catch contained
  syn match   jsBindingAssignment       /\k\+\s*=[^=]/ contains=jsOperator contained containedin=jsVarBinding
  syn match   jsExtraBindingAssignment  /[A-Za-z0-9$_ ]\+\(([A-Za-z0-9$_, ]*)\)*\s*=[^=]/ contains=jsOperator,jsParens contained containedin=jsCaterwaulLet,jsCaterwaulWhere

syn region    jsTernary                 matchgroup=jsTernaryOperator start=/?/ end=/:/ contains=TOP,jsColonLHS
syn match     jsOperator                /[-+*^%&\|!~;=><,.]\{1,4\}/

syn keyword   jsReservedToplevel        if else switch while for do break continue return with case default try catch finally throw delete void
syn keyword   jsOperator                in instanceof typeof new
syn keyword   jsBuiltinType             Array Boolean Date Function Number Object String RegExp
syn keyword   jsBuiltinLiteral          true false null undefined

syn keyword   jsBuiltinValue            this arguments
syn keyword   jsPrototype               prototype constructor
syn keyword   jsCaterwaul               caterwaul

syn region    jsCaterwaulContinuation   matchgroup=jsCaterwaulMacro start=+call/\(cc\|tail\)\s*\[+ end=/]/ contains=TOP

syn region    jsCaterwaulQs             matchgroup=jsCaterwaulMacro start=/qs\s*\[/           end=/]/ contains=TOP
syn region    jsCaterwaulQg             matchgroup=jsCaterwaulMacro start=/qg\s*\[/           end=/]/ contains=TOP
syn region    jsCaterwaulFn             matchgroup=jsCaterwaulMacro start=/f[nb]\s*\[/        end=/]/ contains=jsOperator
syn region    jsCaterwaulLet            matchgroup=jsCaterwaulMacro start=/let\*\?\s*\[/      end=/]/ contains=TOP,jsBindingAssignment
syn region    jsCaterwaulWhere          matchgroup=jsCaterwaulMacro start=/where\*\?\s*\[/    end=/]/ contains=TOP,jsBindingAssignment

syn region    jsCaterwaulFn_            matchgroup=jsCaterwaulMacro start=/f[nb]_\s*\[/       end=/]/ contains=TOP
syn region    jsCaterwaulWhen           matchgroup=jsCaterwaulMacro start=/when\s*\[/         end=/]/ contains=TOP
syn region    jsCaterwaulUnless         matchgroup=jsCaterwaulMacro start=/unless\s*\[/       end=/]/ contains=TOP
syn region    jsCaterwaulCompileEval    matchgroup=jsCaterwaulMacro start=/compile_eval\s*\[/ end=/]/ contains=TOP

syn region    jsCaterwaulDefmacro       matchgroup=jsCaterwaulMacro start=/defmacro\s*\[/     end=/]/ contains=TOP
syn region    jsCaterwaulDefsubst       matchgroup=jsCaterwaulMacro start=/defsubst\s*\[/     end=/]/ contains=TOP
syn region    jsCaterwaulWithGensyms    matchgroup=jsCaterwaulMacro start=/with_gensyms\s*\[/ end=/]/ contains=jsOperator

syn match     jsCaterwaulDefsubstVar    /_\k\+/ contained containedin=jsCaterwaulDefsubst

syn match     jsCaterwaulDfnParens      /([A-Za-z0-9$_, ]*)\s*>\$>/ contains=jsOperator,jsCaterwaulDfnSigil,jsParens
syn match     jsCaterwaulDfn            /\k\+\s*>\$>/               contains=jsOperator,jsCaterwaulDfnSigil
syn match     jsCaterwaulDfnSigil       />\$>/                      contained

syn match     jsCaterwaulComplexOp      /\([-+*^%&\|<>]\{1,2\}\)[\k()\[\]]\+\1\|\([<>]\{1,2\}\)[^ ]\+[<>]\{1,2\}/
syn match     jsCaterwaulOperatorFn     /\$[-+*/^%&\|<>]\{1,2\}\$/

syn match     jsParens                  /[()]/ contained

syn sync fromstart
syn sync maxlines=100

if main_syntax == "javascript"
  syn sync ccomment javaScriptComment
endif

hi def link jsCaterwaulContinuation     Special

hi def link jsCaterwaulComplexOp        Special
hi def link jsCaterwaulOperatorFn       Special

hi def link jsCaterwaulDefmacro         Special
hi def link jsCaterwaulWithGensyms      Identifier
hi def link jsCaterwaulDefsubstVar      Identifier

hi def link jsCaterwaulDfnParens        Identifier
hi def link jsCaterwaulDfn              Identifier
hi def link jsCaterwaulDfnSigil         Keyword

hi def link jsCaterwaulQs               Special
hi def link jsCaterwaulMacro            Special
hi def link jsCaterwaulFn               Identifier

hi def link jsCaterwaul                 Type

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
