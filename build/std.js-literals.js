caterwaul.module( 'std.js-literals' , (function(qs_h_xi3EZ$IGuo9jvIWM7$5BZ7,qs_i_xi3EZ$IGuo9jvIWM7$5BZ7) {var result_j_xi3EZ$IGuo9jvIWM7$5BZ7= (function($) {$.js_literals=function(caterwaul_function) {var function_template=qs_h_xi3EZ$IGuo9jvIWM7$5BZ7;
 (function(r) {r.x=$.reexpander(function(node) {return node.with_data(node.data.replace( /\s+/g , '' ) ) } ) ;
var call_exec_template=qs_i_xi3EZ$IGuo9jvIWM7$5BZ7;
r.qf=function(node) {return function_template.replace( {_body:call_exec_template.replace( {_regexp:node} ) } ) } } ) (caterwaul_function.literal_modifiers.regexp) ;
 (function(s) {s.qw=$.reexpander(function(node) {for(var array_node=new $.syntax( '[' ) ,comma=new $.syntax( ',' ) ,delimiter=node.data.charAt(0) ,pieces=node.as_escaped_string() .split( /\s+/ ) ,i=0,l=pieces.length;
i<l;
 ++i)comma.push(new $.syntax(delimiter+pieces[i] +delimiter) ) ;
return array_node.push(comma.unflatten() ) } ) ;
s.qh=$.reexpander(function(node) {for(var hash_node=new $.syntax( '{' ) ,comma=new $.syntax( ',' ) ,delimiter=node.data.charAt(0) ,pieces=node.as_escaped_string() .split( /\s+/ ) ,i=0,l=pieces.length;
i<l;
i+=2)comma.push(new $.syntax( ':' ,new $.syntax(delimiter+pieces[i] +delimiter) ,new $.syntax(delimiter+pieces[i+1] +delimiter) ) ) ;
return hash_node.push(comma.unflatten() ) } ) ;
s.qr=$.reexpander(function(node) {return node.with_data( '/' +node.as_escaped_string() .replace( /\//g , '\\/' ) + '/' ) } ) ;
s.qs=function(node) {return new $.expression_ref($.syntax_to_expression($.parse(node.as_unescaped_string() ) ) , 'qs' ) } ;
s.qf=$.reexpander(function(node) {return function_template.replace( {_body:$.parse(node.as_unescaped_string() ) } ) } ) } ) (caterwaul_function.literal_modifiers.string) ;
return caterwaul_function} } ) ;
result_j_xi3EZ$IGuo9jvIWM7$5BZ7.caterwaul_expression_ref_table= { "qs_h_xi3EZ$IGuo9jvIWM7$5BZ7" : ( "new caterwaul.syntax( \"function\" ,new caterwaul.syntax( \"(\" ,new caterwaul.syntax( \"_\" ) ) ,new caterwaul.syntax( \"{\" ,new caterwaul.syntax( \"return\" ,new caterwaul.syntax( \"_body\" ) ) ) )" ) , "qs_i_xi3EZ$IGuo9jvIWM7$5BZ7" : ( "new caterwaul.syntax( \"()\" ,new caterwaul.syntax( \".\" ,new caterwaul.syntax( \"_regexp\" ) ,new caterwaul.syntax( \"exec\" ) ) ,new caterwaul.syntax( \"_\" ) )" ) } ;
return(result_j_xi3EZ$IGuo9jvIWM7$5BZ7) } ) .call(this,new caterwaul.syntax( "function" ,new caterwaul.syntax( "(" ,new caterwaul.syntax( "_" ) ) ,new caterwaul.syntax( "{" ,new caterwaul.syntax( "return" ,new caterwaul.syntax( "_body" ) ) ) ) ,new caterwaul.syntax( "()" ,new caterwaul.syntax( "." ,new caterwaul.syntax( "_regexp" ) ,new caterwaul.syntax( "exec" ) ) ,new caterwaul.syntax( "_" ) ) ) ) ;
