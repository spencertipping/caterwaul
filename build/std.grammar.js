 caterwaul . module ('std.grammar' ,(function (  qs) {var result=( function ($) { 
  $.grammar =  function ( anonymous_symbols , options , rule_cc) {   ; return  ( function ( ) { var default_options = {fix: true, descend: true, initial: qs},
          settings        =$.merge ( { } , default_options , options),

          anon            = $.anonymizer (anonymous_symbols),
          anon_pattern    = anon (settings.initial), 
          rule =  function ( p , e) {   ; return  $ [settings.fix ? 'rereplacer': 'replacer'] (anon (p), e.constructor === $.syntax ? anon (e): e)},
          expand          = ( function ( it) { return settings.descend ? $ (it): it}) . call ( this , (  $.alternatives (   rule_cc (rule, anon)))) ; return  function ( _) { return  ( function ( it) { return this.constructor === Function ? it &&  this (it): it}) . call ( this , ( expand.call (expand, ( anon_pattern) .replace (  _))))}}) . call ( this)}});result.caterwaul_expression_ref_table =  {  qs : ( "new caterwaul.syntax ( \"[]\", new caterwaul.syntax ( \"S\") ,new caterwaul.syntax ( \"_expression\")).prefix ( \" \")")};return(result)}).call (this,  new caterwaul.syntax ( "[]", new caterwaul.syntax ( "S") ,new caterwaul.syntax ( "_expression")).prefix ( " "))) ; 