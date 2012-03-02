caterwaul.module( 'std.grammar' ,function($) {$.grammar=function(anonymous_symbols,initial_form,rule_cc) {;
return(function( ) {var anon=$.anonymizer(anonymous_symbols) ,anon_pattern=anon(initial_form) ,rule=function(p,e) {;
return $.rereplacer(anon(p) ,e.constructor===$.syntax?anon(e) :e) } ,expand=$($.alternatives(rule_cc(rule,anon) ) ) ;
return(function(_) {return(function(it) {return( ( (it) && (this(it) ) ) ) } ) .call(this, (expand.call(expand,anon_pattern.replace( {_x:_._expression} ) ) ) ) } ) } ) .call(this) } } ) ;
