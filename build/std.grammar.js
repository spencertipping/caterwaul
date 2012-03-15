caterwaul.module( 'std.grammar' ,function($) {$.grammar=function(anonymous_symbols,options,rule_cc) {;
return(function( ) {var default_options= {fix:true,descend:true} ,settings=$.merge( { } ,default_options,options) ,anon=$.anonymizer(anonymous_symbols) ,anon_pattern=anon(options.initial) ,rule=function(p,e) {;
return $[settings.fix? 'rereplacer' : 'replacer' ] (anon(p) ,e.constructor===$.syntax?anon(e) :e) } ,expand= (function(it) {return(settings.descend?$(it) :it) } ) .call(this, ($.alternatives(rule_cc(rule,anon) ) ) ) ;
return(function(_) {return(function(it) {return( ( (it) && (this(it) ) ) ) } ) .call(this, (expand.call(expand,anon_pattern.replace( {_x:_._expression} ) ) ) ) } ) } ) .call(this) } } ) ;
