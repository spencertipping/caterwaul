caterwaul.module( 'std.words' , (function(qs_h_3UHR$MNUA8pbktqGZ4fb0_,qs_i_3UHR$MNUA8pbktqGZ4fb0_,qs_j_3UHR$MNUA8pbktqGZ4fb0_,qs_k_3UHR$MNUA8pbktqGZ4fb0_,qs_l_3UHR$MNUA8pbktqGZ4fb0_,qs_m_3UHR$MNUA8pbktqGZ4fb0_,qs_n_3UHR$MNUA8pbktqGZ4fb0_,qs_o_3UHR$MNUA8pbktqGZ4fb0_,qs_p_3UHR$MNUA8pbktqGZ4fb0_,qs_q_3UHR$MNUA8pbktqGZ4fb0_,qs_r_3UHR$MNUA8pbktqGZ4fb0_) {var result_s_3UHR$MNUA8pbktqGZ4fb0_= (function($) { (function( ) {var scope_template=qs_h_3UHR$MNUA8pbktqGZ4fb0_;
return($.words=function(caterwaul_function) {;
return($.merge(caterwaul_function.modifiers,$.words.modifiers) ,$.merge(caterwaul_function.parameterized_modifiers,$.words.parameterized_modifiers) ,caterwaul_function) } ,$.words.modifiers= {raise:$.reexpander(qs_i_3UHR$MNUA8pbktqGZ4fb0_) ,capture:function(match) {for(var comma=new $.syntax( ',' ) ,bindings=match._expression.flatten( ',' ) ,i=0,l=bindings.length;
i<l;
 ++i)comma.push(this(bindings[i] ) .with_data( ':' ) ) ;
return new $.syntax( '{' ,comma.unflatten() ) } ,wcapture:function(match) {for(var e=this(match._expression) ,comma=new $.syntax( ',' ) ,bindings=e.flatten( ',' ) ,node,i=0,l=bindings.length;
i<l;
 ++i) (node=this(bindings[i] ) ) [1] =node[0] ,comma.push(node.with_data( ':' ) ) ;
return scope_template.replace( {_variables:e,_expression:new $.syntax( '{' ,comma.unflatten() ) } ) } } ,$.words.parameterized_modifiers= {rescue:$.reexpander(qs_j_3UHR$MNUA8pbktqGZ4fb0_) ,se:$.reexpander(qs_k_3UHR$MNUA8pbktqGZ4fb0_) ,rei:$.reexpander(qs_l_3UHR$MNUA8pbktqGZ4fb0_) ,re:$.reexpander(qs_m_3UHR$MNUA8pbktqGZ4fb0_) ,where:$.reexpander(qs_n_3UHR$MNUA8pbktqGZ4fb0_) ,using:$.reexpander(function(match) {var m=this(match._parameters) ,o=$.compile(m) ,comma=new $.syntax( ',' ) ,expression_ref=new $.expression_ref(m) ;
for(var k in o)Object.prototype.hasOwnProperty.call(o,k) && /^[_$a-zA-Z][_$0-9a-zA-Z]*$/ .test(k) && !this.modifiers.hasOwnProperty(k) && !this.parameterized_modifiers.hasOwnProperty(k) &&comma.push(new $.syntax( '=' ,k,new $.syntax( '.' ,expression_ref,k) ) ) ;
return scope_template.replace( {_variables:comma.unflatten() ,_expression:match._expression} ) } ) ,when:$.reexpander(qs_o_3UHR$MNUA8pbktqGZ4fb0_) ,and:$.reexpander(qs_p_3UHR$MNUA8pbktqGZ4fb0_) ,unless:$.reexpander(qs_q_3UHR$MNUA8pbktqGZ4fb0_) ,or:$.reexpander(qs_r_3UHR$MNUA8pbktqGZ4fb0_) } ) } ) .call(this) } ) ;
result_s_3UHR$MNUA8pbktqGZ4fb0_.caterwaul_expression_ref_table= { "qs_h_3UHR$MNUA8pbktqGZ4fb0_" : ( "new caterwaul.syntax( \"()\" ,new caterwaul.syntax( \".\" ,new caterwaul.syntax( \"(\" ,new caterwaul.syntax( \"function\" ,new caterwaul.syntax( \"(\" ) ,new caterwaul.syntax( \"{\" ,new caterwaul.syntax( \";\" ,new caterwaul.syntax( \"var\" ,new caterwaul.syntax( \"_variables\" ) ) ,new caterwaul.syntax( \"return\" ,new caterwaul.syntax( \"(\" ,new caterwaul.syntax( \"_expression\" ) ) ) ) ) ) ) ,new caterwaul.syntax( \"call\" ) ) ,new caterwaul.syntax( \"this\" ) )" ) , "qs_i_3UHR$MNUA8pbktqGZ4fb0_" : ( "new caterwaul.syntax( \"()\" ,new caterwaul.syntax( \".\" ,new caterwaul.syntax( \"(\" ,new caterwaul.syntax( \"function\" ,new caterwaul.syntax( \"(\" ) ,new caterwaul.syntax( \"{\" ,new caterwaul.syntax( \"throw\" ,new caterwaul.syntax( \"_expression\" ) ) ) ) ) ,new caterwaul.syntax( \"call\" ) ) ,new caterwaul.syntax( \"this\" ) )" ) , "qs_j_3UHR$MNUA8pbktqGZ4fb0_" : ( "new caterwaul.syntax( \"()\" ,new caterwaul.syntax( \".\" ,new caterwaul.syntax( \"(\" ,new caterwaul.syntax( \"function\" ,new caterwaul.syntax( \"(\" ) ,new caterwaul.syntax( \"{\" ,new caterwaul.syntax( \"try\" ,new caterwaul.syntax( \"{\" ,new caterwaul.syntax( \"return\" ,new caterwaul.syntax( \"(\" ,new caterwaul.syntax( \"_expression\" ) ) ) ) ,new caterwaul.syntax( \"catch\" ,new caterwaul.syntax( \"(\" ,new caterwaul.syntax( \"e\" ) ) ,new caterwaul.syntax( \"{\" ,new caterwaul.syntax( \"return\" ,new caterwaul.syntax( \"(\" ,new caterwaul.syntax( \"_parameters\" ) ) ) ) ) ) ) ) ) ,new caterwaul.syntax( \"call\" ) ) ,new caterwaul.syntax( \"this\" ) )" ) , "qs_k_3UHR$MNUA8pbktqGZ4fb0_" : ( "new caterwaul.syntax( \"()\" ,new caterwaul.syntax( \".\" ,new caterwaul.syntax( \"(\" ,new caterwaul.syntax( \"function\" ,new caterwaul.syntax( \"(\" ,new caterwaul.syntax( \"it\" ) ) ,new caterwaul.syntax( \"{\" ,new caterwaul.syntax( \"return\" ,new caterwaul.syntax( \",\" ,new caterwaul.syntax( \"(\" ,new caterwaul.syntax( \"_parameters\" ) ) ,new caterwaul.syntax( \"it\" ) ) ) ) ) ) ,new caterwaul.syntax( \"call\" ) ) ,new caterwaul.syntax( \",\" ,new caterwaul.syntax( \"this\" ) ,new caterwaul.syntax( \"(\" ,new caterwaul.syntax( \"_expression\" ) ) ) )" ) , "qs_l_3UHR$MNUA8pbktqGZ4fb0_" : ( "new caterwaul.syntax( \"(\" ,new caterwaul.syntax( \",\" ,new caterwaul.syntax( \"(\" ,new caterwaul.syntax( \"_expression\" ) ) ,new caterwaul.syntax( \"(\" ,new caterwaul.syntax( \"_parameters\" ) ) ) )" ) , "qs_m_3UHR$MNUA8pbktqGZ4fb0_" : ( "new caterwaul.syntax( \"()\" ,new caterwaul.syntax( \".\" ,new caterwaul.syntax( \"(\" ,new caterwaul.syntax( \"function\" ,new caterwaul.syntax( \"(\" ,new caterwaul.syntax( \"it\" ) ) ,new caterwaul.syntax( \"{\" ,new caterwaul.syntax( \"return\" ,new caterwaul.syntax( \"(\" ,new caterwaul.syntax( \"_parameters\" ) ) ) ) ) ) ,new caterwaul.syntax( \"call\" ) ) ,new caterwaul.syntax( \",\" ,new caterwaul.syntax( \"this\" ) ,new caterwaul.syntax( \"(\" ,new caterwaul.syntax( \"_expression\" ) ) ) )" ) , "qs_n_3UHR$MNUA8pbktqGZ4fb0_" : ( "new caterwaul.syntax( \"()\" ,new caterwaul.syntax( \".\" ,new caterwaul.syntax( \"(\" ,new caterwaul.syntax( \"function\" ,new caterwaul.syntax( \"(\" ) ,new caterwaul.syntax( \"{\" ,new caterwaul.syntax( \";\" ,new caterwaul.syntax( \"var\" ,new caterwaul.syntax( \"_parameters\" ) ) ,new caterwaul.syntax( \"return\" ,new caterwaul.syntax( \"(\" ,new caterwaul.syntax( \"_expression\" ) ) ) ) ) ) ) ,new caterwaul.syntax( \"call\" ) ) ,new caterwaul.syntax( \"this\" ) )" ) , "qs_o_3UHR$MNUA8pbktqGZ4fb0_" : ( "new caterwaul.syntax( \"(\" ,new caterwaul.syntax( \"&&\" ,new caterwaul.syntax( \"(\" ,new caterwaul.syntax( \"_parameters\" ) ) ,new caterwaul.syntax( \"(\" ,new caterwaul.syntax( \"_expression\" ) ) ) )" ) , "qs_p_3UHR$MNUA8pbktqGZ4fb0_" : ( "new caterwaul.syntax( \"(\" ,new caterwaul.syntax( \"&&\" ,new caterwaul.syntax( \"(\" ,new caterwaul.syntax( \"_expression\" ) ) ,new caterwaul.syntax( \"(\" ,new caterwaul.syntax( \"_parameters\" ) ) ) )" ) , "qs_q_3UHR$MNUA8pbktqGZ4fb0_" : ( "new caterwaul.syntax( \"(\" ,new caterwaul.syntax( \"&&\" ,new caterwaul.syntax( \"u!\" ,new caterwaul.syntax( \"(\" ,new caterwaul.syntax( \"_parameters\" ) ) ) ,new caterwaul.syntax( \"(\" ,new caterwaul.syntax( \"_expression\" ) ) ) )" ) , "qs_r_3UHR$MNUA8pbktqGZ4fb0_" : ( "new caterwaul.syntax( \"(\" ,new caterwaul.syntax( \"||\" ,new caterwaul.syntax( \"(\" ,new caterwaul.syntax( \"_expression\" ) ) ,new caterwaul.syntax( \"(\" ,new caterwaul.syntax( \"_parameters\" ) ) ) )" ) } ;
return(result_s_3UHR$MNUA8pbktqGZ4fb0_) } ) .call(this,new caterwaul.syntax( "()" ,new caterwaul.syntax( "." ,new caterwaul.syntax( "(" ,new caterwaul.syntax( "function" ,new caterwaul.syntax( "(" ) ,new caterwaul.syntax( "{" ,new caterwaul.syntax( ";" ,new caterwaul.syntax( "var" ,new caterwaul.syntax( "_variables" ) ) ,new caterwaul.syntax( "return" ,new caterwaul.syntax( "(" ,new caterwaul.syntax( "_expression" ) ) ) ) ) ) ) ,new caterwaul.syntax( "call" ) ) ,new caterwaul.syntax( "this" ) ) ,new caterwaul.syntax( "()" ,new caterwaul.syntax( "." ,new caterwaul.syntax( "(" ,new caterwaul.syntax( "function" ,new caterwaul.syntax( "(" ) ,new caterwaul.syntax( "{" ,new caterwaul.syntax( "throw" ,new caterwaul.syntax( "_expression" ) ) ) ) ) ,new caterwaul.syntax( "call" ) ) ,new caterwaul.syntax( "this" ) ) ,new caterwaul.syntax( "()" ,new caterwaul.syntax( "." ,new caterwaul.syntax( "(" ,new caterwaul.syntax( "function" ,new caterwaul.syntax( "(" ) ,new caterwaul.syntax( "{" ,new caterwaul.syntax( "try" ,new caterwaul.syntax( "{" ,new caterwaul.syntax( "return" ,new caterwaul.syntax( "(" ,new caterwaul.syntax( "_expression" ) ) ) ) ,new caterwaul.syntax( "catch" ,new caterwaul.syntax( "(" ,new caterwaul.syntax( "e" ) ) ,new caterwaul.syntax( "{" ,new caterwaul.syntax( "return" ,new caterwaul.syntax( "(" ,new caterwaul.syntax( "_parameters" ) ) ) ) ) ) ) ) ) ,new caterwaul.syntax( "call" ) ) ,new caterwaul.syntax( "this" ) ) ,new caterwaul.syntax( "()" ,new caterwaul.syntax( "." ,new caterwaul.syntax( "(" ,new caterwaul.syntax( "function" ,new caterwaul.syntax( "(" ,new caterwaul.syntax( "it" ) ) ,new caterwaul.syntax( "{" ,new caterwaul.syntax( "return" ,new caterwaul.syntax( "," ,new caterwaul.syntax( "(" ,new caterwaul.syntax( "_parameters" ) ) ,new caterwaul.syntax( "it" ) ) ) ) ) ) ,new caterwaul.syntax( "call" ) ) ,new caterwaul.syntax( "," ,new caterwaul.syntax( "this" ) ,new caterwaul.syntax( "(" ,new caterwaul.syntax( "_expression" ) ) ) ) ,new caterwaul.syntax( "(" ,new caterwaul.syntax( "," ,new caterwaul.syntax( "(" ,new caterwaul.syntax( "_expression" ) ) ,new caterwaul.syntax( "(" ,new caterwaul.syntax( "_parameters" ) ) ) ) ,new caterwaul.syntax( "()" ,new caterwaul.syntax( "." ,new caterwaul.syntax( "(" ,new caterwaul.syntax( "function" ,new caterwaul.syntax( "(" ,new caterwaul.syntax( "it" ) ) ,new caterwaul.syntax( "{" ,new caterwaul.syntax( "return" ,new caterwaul.syntax( "(" ,new caterwaul.syntax( "_parameters" ) ) ) ) ) ) ,new caterwaul.syntax( "call" ) ) ,new caterwaul.syntax( "," ,new caterwaul.syntax( "this" ) ,new caterwaul.syntax( "(" ,new caterwaul.syntax( "_expression" ) ) ) ) ,new caterwaul.syntax( "()" ,new caterwaul.syntax( "." ,new caterwaul.syntax( "(" ,new caterwaul.syntax( "function" ,new caterwaul.syntax( "(" ) ,new caterwaul.syntax( "{" ,new caterwaul.syntax( ";" ,new caterwaul.syntax( "var" ,new caterwaul.syntax( "_parameters" ) ) ,new caterwaul.syntax( "return" ,new caterwaul.syntax( "(" ,new caterwaul.syntax( "_expression" ) ) ) ) ) ) ) ,new caterwaul.syntax( "call" ) ) ,new caterwaul.syntax( "this" ) ) ,new caterwaul.syntax( "(" ,new caterwaul.syntax( "&&" ,new caterwaul.syntax( "(" ,new caterwaul.syntax( "_parameters" ) ) ,new caterwaul.syntax( "(" ,new caterwaul.syntax( "_expression" ) ) ) ) ,new caterwaul.syntax( "(" ,new caterwaul.syntax( "&&" ,new caterwaul.syntax( "(" ,new caterwaul.syntax( "_expression" ) ) ,new caterwaul.syntax( "(" ,new caterwaul.syntax( "_parameters" ) ) ) ) ,new caterwaul.syntax( "(" ,new caterwaul.syntax( "&&" ,new caterwaul.syntax( "u!" ,new caterwaul.syntax( "(" ,new caterwaul.syntax( "_parameters" ) ) ) ,new caterwaul.syntax( "(" ,new caterwaul.syntax( "_expression" ) ) ) ) ,new caterwaul.syntax( "(" ,new caterwaul.syntax( "||" ,new caterwaul.syntax( "(" ,new caterwaul.syntax( "_expression" ) ) ,new caterwaul.syntax( "(" ,new caterwaul.syntax( "_parameters" ) ) ) ) ) ) ;