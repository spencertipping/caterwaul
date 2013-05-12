" Caterwaul VIM highlighter | Spencer Tipping
" Licensed under the terms of the MIT source code license

" Language:       Javascript with Caterwaul extensions
" Maintainer:     Spencer Tipping <spencer@spencertipping.com>
" URL:            http://caterwauljs.org/build/caterwaul.vim

if !exists("main_syntax")
  if version < 600
    syntax clear
  elseif exists("b:current_syntax")
    finish
  endif
  let main_syntax = 'caterwaul'
endif

syn case match
setlocal iskeyword=48-57,95,36,A-Z,a-z,@

syn region    jsWaulComment             start=/#/ end=/$/
syn region    jsNodeShebang             start=/\%^#!/ end=/$/

syn region    jsParenGroup              matchgroup=jsParen   start=/(/  end=/)/  contains=TOP
syn region    jsBracketGroup            matchgroup=jsBracket start=/\[/ end=/\]/ contains=TOP
syn region    jsBraceGroup              matchgroup=jsBrace   start=/{/  end=/}/  contains=TOP

syn region    jsTernary                 matchgroup=jsTernaryOperator start=/?/ end=/:/ contains=TOP,jsColonLHS
syn match     jsOperator                /[-+*^%&\|!~;=><,]\{1,4\}/
syn match     jsDot                     /\./

syn keyword   jsReservedToplevel        if else switch while for do break continue return with case default try catch finally throw delete void
syn keyword   jsOperator                in instanceof typeof new
syn keyword   jsBuiltinType             Array Boolean Date Function Number Object String RegExp
syn keyword   jsBuiltinLiteral          true false null undefined

syn keyword   jsBuiltinValue            this arguments
syn keyword   jsPrototype               prototype constructor

syn match     jsAssignment              /\k\+\s*[-+*/^&|%<>]*=[^=]\@=/ contains=jsOperator

syn match     jsWordPrefix              /[-\/|,<]\k\@=/

syn match     jsIdentifier              /[A-Za-z$_][A-Za-z0-9$@_]*/ contains=jsMetadata
syn match     jsMetadata                /@[A-Za-z0-9$@_]*/ contained
syn match     jsWildcard                /\<_[A-Za-z0-9$_@]\+\>/
syn match     jsNumber                  /-\?0x[0-9A-Fa-f]\+\|-\?\(\d*\.\d\+\|\d\+\.\d*\|\d\+\)\([eE][+-]\?\d\{1,3\}\)\?\|-\?0[0-7]\+/
syn region    jsStringD                 matchgroup=jsQuote start=/"/ skip=/\\\\\|\\"/ end=/"/ oneline keepend contains=jsStringEscape,jsCaterwaulEscape
syn region    jsStringS                 matchgroup=jsQuote start=/'/ skip=/\\\\\|\\'/ end=/'/ oneline keepend contains=jsStringEscape,jsCaterwaulEscape
syn region    jsRegexp                  matchgroup=jsQuote start=+/[^/ ]+rs=e-1 skip=+\\\\\|\\/+ end=+/[gims]*[^-~\+!\/A-Za-z0-9 #(\[{]\@=+ oneline contains=jsRegexpSpecial

syn region    jsCodeString              matchgroup=jsCodeQuote start=/\z(['"]\)/ end=/\z1\.qf\>/ skip=/\\./ oneline keepend contains=TOP
syn match     jsCodeStringVariable      /\<_\>/ containedin=jsCodeString contained

  syn match   jsRegexpSpecial           /\\[sSbBwWdDnr\\\[\]]\|[+*|?]\|\[\([^]\\\/]\|\\.\)\+\]/ contained

  syn match   jsStringEscape            /\\\d\{3\}\|\\u[0-9A-Za-z]\{4\}\|\\[a-z"'\\]/ contained
  syn region  jsCaterwaulEscape         start=/#{/ end=/}/                            contained contains=TOP,jsWaulComment keepend
  syn match   jsCaterwaulNumericHex     /\<x[0-9a-f_]\+\>/
  syn match   jsCaterwaulNumericBinary  /\<b[01_]\+\>/

syn match     jsColonLHS                /\k\+\s*:/
syn region    jsVarBinding              matchgroup=jsVarBindingConstruct start=/\<var\>\|\<const\>/ end=/;/ contains=TOP
syn match     jsVarInBinding            /var\s\+\k\+\s\+in/ contains=jsVarBindingKeyword,jsOperator
syn region    jsParamBinding            matchgroup=jsBindingConstruct start=/\(function\|catch\)\s*(/ end=/)/ contains=jsOperator

  syn keyword jsVarBindingKeyword       const var contained
  syn keyword jsBindingKeyword          function catch contained
  syn match   jsBindingAssignment       /\k\+\s*=\([^=]\|$\)\@=/ contains=jsOperator contained containedin=jsVarBinding
  syn match   jsExtraBindingAssignment  /\k\+\s*\(=\([^=]\|$\)\@=\|(.*=\([^=]\|$\)\)\@=/ contained containedin=jsBindingGroup

syn keyword   jsBindingMacro            where capture wcapture nextgroup=jsBindingGroup
syn keyword   jsFunctionMacro           given bgiven           nextgroup=jsFunctionGroup
syn keyword   jsQuotationMacro          qs qse qc qce          nextgroup=jsQuotationGroup
syn keyword   jsOtherMacro              raise seq noexpand reexpand eval ahead bitwise

syn keyword   jsParameterizedMacro      se re then and or when unless using rescue eq aeq oeq deq neq acq ocq dcq ncq nextgroup=jsModifierSuffix
syn match     jsModifierSuffix          /[->]/ contained

syn cluster   jsMacro                   add=jsBindingMacro,jsFunctionMacro,jsQuotationMacro,jsOtherMacro

syn match     jsLiteralModifier         /\.\(q[frwhs]\|qse\|x\)\>/

syn match     jsSeqFilter               /\/\(pairs\|keys\|values\)\>/
syn match     jsSeqFilter               /%[kv][\*%\/~!]/
syn match     jsSeqFilter               /[-\/|]m\?object\>/

syn region    jsBindingGroup            matchgroup=jsCaterwaulMacro start='\s*\[' end=']' contained contains=TOP
syn region    jsFunctionGroup           matchgroup=jsCaterwaulMacro start='\s*\[' end=']' contained
syn region    jsQuotationGroup          matchgroup=jsCaterwaulMacro start='\s*\[' end=']' contained contains=TOP

syn match     jsBindingGroup            /\.\k\+/ contained
syn match     jsFunctionGroup           /\.\k\+/ contained

syn match     jsParens                  /[()]/ contained
syn match     jsClosers                 /[\]})]/

syn match     jsCaterwaulInfixFunction  /\([|\/]\)[-~][^ \t\/|]\+\1/
syn match     jsCaterwaulUnaryFunction  +/![^ ,\]\)\}]\++

syn cluster   jsCaterwaulHtmlOps        contains=jsCaterwaulHtmlClass,jsCaterwaulHtmlSlash,jsCaterwaulHtmlMap,jsCaterwaulHtmlAttr,jsCaterwaulHtmlElement,jsCaterwaulHtmlParens
syn cluster   jsCaterwaulHtmlOps             add=jsCaterwaulHtmlArray,jsCaterwaulHtmlSlashB,jsCaterwaulHtmlAttrB,jsCaterwaulHtmlPlus,jsCaterwaulHtmlContains

syn region    jsCaterwaulHtmlPrefix1    matchgroup=jsCaterwaulMacro start=/\<jquery\s*\[/ end=/]/ contains=TOP,@jsCaterwaulHtmlGroups
syn match     jsCaterwaulHtmlPrefix2    /\<jquery\s\+in\s*/ nextgroup=@jsCaterwaulHtmlOps

syn cluster   jsCaterwaulHtmlGroups     contains=jsCaterwaulHtmlPrefix1,jsCaterwaulHtmlPrefix2

  syn match   jsCaterwaulHtmlClass      /[ \t\n]*\./                    contained nextgroup=jsCaterwaulHtmlClassName
  syn match   jsCaterwaulHtmlClassName  /[ \t\n]*\w\+/                  contained nextgroup=@jsCaterwaulHtmlOps
  syn match   jsCaterwaulHtmlSlash      /[ \t\n]*\/\s*\w\+/             contained nextgroup=@jsCaterwaulHtmlOps
  syn match   jsCaterwaulHtmlSlashB     /[ \t\n]*\/!\s*\w\+/            contained nextgroup=@jsCaterwaulHtmlOps
  syn match   jsCaterwaulHtmlAttr       /[ \t\n]*\*\s*\w\+/             contained nextgroup=@jsCaterwaulHtmlOps
  syn match   jsCaterwaulHtmlAttrB      /[ \t\n]*\*!\s*\w\+/            contained nextgroup=@jsCaterwaulHtmlOps
  syn match   jsCaterwaulHtmlMap        /[ \t\n]*%\s*[A-Za-z0-9$_\.]\+/ contained nextgroup=@jsCaterwaulHtmlOps

  syn match   jsCaterwaulHtmlPlus       /[ \t\n]*+\s*/                  contained nextgroup=@jsCaterwaulHtmlOps
  syn match   jsCaterwaulHtmlContains   /[ \t\n]*>\s*/                  contained nextgroup=@jsCaterwaulHtmlOps

  syn region  jsCaterwaulHtmlParens     matchgroup=jsParens start=/(/  end=/)/ contained nextgroup=@jsCaterwaulHtmlOps containedin=@jsCaterwaulHtmlGroups contains=jsCaterwaulHtmlElement,jsStringS,jsStringD
  syn region  jsCaterwaulHtmlArray      matchgroup=jsParens start=/\[/ end=/]/ contained nextgroup=@jsCaterwaulHtmlOps containedin=@jsCaterwaulHtmlGroups contains=TOP

  syn keyword jsCaterwaulHtmlElement    html head body meta script style link title div a span input button textarea option contained containedin=@jsCaterwaulHtmlGroups nextgroup=@jsCaterwaulHtmlOps
  syn keyword jsCaterwaulHtmlElement    table tbody tr td th thead tfoot img h1 h2 h3 h4 h5 h6 li ol ul noscript p pre samp contained containedin=@jsCaterwaulHtmlGroups nextgroup=@jsCaterwaulHtmlOps
  syn keyword jsCaterwaulHtmlElement    blockquote select form label iframe sub sup var code caption canvas audio video     contained containedin=@jsCaterwaulHtmlGroups nextgroup=@jsCaterwaulHtmlOps

syn region    jsBlockComment            start=+/\*+ end=+\*/+ contains=@Spell,jsCommentTags
syn region    jsLineComment             start=+//+  end=+$+   contains=@Spell,jsCommentTags

  syn keyword jsCommentTags             TODO FIXME XXX TBD contained

syn sync fromstart

if main_syntax == "caterwaul"
  syn sync ccomment javaScriptComment
endif

hi def link jsNodeShebang               Special

hi def link jsClosers                   Error

hi def link jsCaterwaulNumericHex       Number
hi def link jsCaterwaulNumericBinary    Number

hi def link jsCaterwaulHtmlElement      Keyword
hi def link jsCaterwaulHtmlClass        Special
hi def link jsCaterwaulHtmlClassName    Type
hi def link jsCaterwaulHtmlSlash        Special
hi def link jsCaterwaulHtmlSlashB       Special
hi def link jsCaterwaulHtmlMap          Special
hi def link jsCaterwaulHtmlAttr         Special
hi def link jsCaterwaulHtmlAttrB        Special
hi def link jsCaterwaulHtmlPlus         Special
hi def link jsCaterwaulHtmlContains     Special

hi def link jsCaterwaulHtmlPrefix2      Special

hi def link jsCaterwaulSeqVariable      Identifier

hi def link jsCaterwaulUnaryLeftOp      Special
hi def link jsCaterwaulComplexOp        Special
hi def link jsCaterwaulOperatorFn       Special

hi def link jsCaterwaulMacro            Special

hi def link jsCaterwaulInfixFunction    Type
hi def link jsCaterwaulUnaryFunction    Type

hi def link jsLiteralModifier           Special

hi def link jsSeqFilter                 Special

hi def link jsWordPrefix                Special

hi def link jsParameterizedMacro        Special
hi def link jsModifierSuffix            Special

hi def link jsBindingMacro              Special
hi def link jsFunctionMacro             Special
hi def link jsOtherMacro                Special
hi def link jsQuotationMacro            Special

hi def link jsFunctionGroup             Identifier

hi def link jsQuotationGroup            String

hi def link jsWaulComment               Comment
hi def link jsLineComment               Comment
hi def link jsBlockComment              Comment
hi def link jsCommentTags               Todo

hi def link jsCodeQuote                 Special
hi def link jsCodeStringVariable        Identifier

hi def link jsQuote                     Special
hi def link jsNumber                    Number
hi def link jsStringS                   String
hi def link jsStringD                   String
hi def link jsRegexp                    String
hi def link jsRegexpEscape              Special
hi def link jsRegexpSpecial             Special
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
hi def link jsDot                       Special
hi def link jsBuiltinType               Type
hi def link jsBuiltinLiteral            Special
hi def link jsBuiltinValue              Special
hi def link jsPrototype                 Special

hi def link jsWildcard                  Identifier
hi def link jsMetadata                  Type

let b:current_syntax = "caterwaul"
if main_syntax == 'caterwaul'
  unlet main_syntax
endif
