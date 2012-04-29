caterwaul.module( 'javascript-grammar' , (function(qse,qs,qs1) {var result= (function($) {$.javascript_grammar= (function() {var traversal_for=function(name) {;
return $.compile( (qse) .replace( {_v: (function(xs) {var x,x0,xi,xl,xr;
for(var x0= (qs) ,xi=0,xl=xs.length;
xi<xl;
 ++xi)x=xs[xi] ,x0= ( (qs1) .replace( {_x:x0,_y:x} ) ) ;
return x0} ) .call(this,name.split( '' ) ) } ) ) } ,common_methods=$.merge( {} , (function() {var level=function(n) {;
return(function(xs) {var x,x0,xi,xl,xr;
for(var xr=new xs.constructor() ,xi=0,xl=xs.length;
xi<xl;
 ++xi)x=xs[xi] ,xr.push.apply(xr,Array.prototype.slice.call( (n>1? (function(ys) {var y,y0,yi,yl,yr;
for(var yr=new ys.constructor() ,yi=0,yl=ys.length;
yi<yl;
 ++yi)y=ys[yi] ,yr.push( (x+y) ) ;
return yr} ) .call(this,level(n-1) ) 
: [x] ) ) ) ;
return xr} ) .call(this, [ 'l' , 'r' ] ) } ;
return(function(o) {for(var r= {} ,i=0,l=o.length,x;
i<l;
 ++i)x=o[i] ,r[x[0] ] =x[1] ;
return r} ) .call(this, ( (function(xs) {var x,x0,xi,xl,xr;
for(var xr=new xs.constructor() ,xi=0,xl=xs.length;
xi<xl;
 ++xi)x=xs[xi] ,xr.push( ( [x,traversal_for(x) ] ) ) ;
return xr} ) .call(this, (function(xs1) {var x1,x01,xi1,xl1,xr1;
for(var xr1=new xs1.constructor() ,xi1=0,xl1=xs1.length;
xi1<xl1;
 ++xi1)x1=xs1[xi1] ,xr1.push.apply(xr1,Array.prototype.slice.call( (level(x1) ) ) ) ;
return xr1} ) .call(this, (function(i,u,s) {if( (u-i) *s<0|| !s)return[] ;
for(var r= [] ,d=u-i;
d>0?i<=u
:i>=u;
i+=s)r.push(i) ;
return r} ) ( (2) , (5) , (1) ) ) ) ) ) } ) .call(this) ) ;
return caterwaul.regexp_grammar( {program: /l:@statement data:$/ ,statement: /@block | @with_semi | data:; post:@ws | @statement_/ ,block: /data:\{ l:@statement \} post:@ws/ ,with_semi: /l:@statement_ data:; post:@ws/ ,statement_: /@if_ | @for_iterator | @for_in | @while_ | @do_ | @switch_ | @throw_ | @try_ | @return_ | @break_ | @continue_ | @var_ | @expressions/ ,if_: /data:if pre:@ws \(cond:@expressions\) l:@statement r:@else_/ ,else_: /data:else pre:@ws l:@statement | @ws/ ,for_iterator: /data:for pre:@ws \(init:@statement cond:@expressions post_cond:@ws; inc:@expression\) l:@statement/ ,for_in: /data:for pre:@ws \(var? variable:@identifier post_variable:@ws in cond:@expression\) l:@statement/ ,while_: /data:while pre:@ws \(cond:@expressions\) l:@statement/ ,do_: /data:do l:@statement while pre:@ws \(cond:@expressions\) post:@ws/ ,switch_: /data:switch pre:@ws \(cond:@expressions\) post:@ws \{l:@cases\}/ ,cases: /l:@case_ r:@cases | l:@default_ r:@cases | @statement/ ,case_: /pre:@ws data:case cond:@expressions \: post:@ws/ ,default_: /pre:@ws data:default post:@ws \:/ ,throw_: /data:throw l:@expressions/ ,try_: /data:try l:@statement r:(@catch_ | @finally_)/ ,catch_: /data:catch pre:@ws \(cond:@expressions\) r:@finally_/ ,finally_: /data:finally l:@statement | @ws/ ,return_: /data:return pre:@ws l:@expressions | return/ ,break_: /data:break pre:@ws cond:@identifier | break/ ,continue_: /data:continue pre:@ws cond:@identifier | break/ ,var_: /data:(var | const) pre:@ws l:@expression/ ,nontrivial_ws: /data:([\s]+) l:@ws | data:(\/\/) text:.* l:@ws | data:(\/\*) text:(([^*]|\*[^\/])*) \*\/ l:@ws/ ,ws: /@nontrivial_ws | \s*/ ,expressions: /l:@expression data:[,] r:@expressions | @expression | @ws/ ,expression: /@unary | @binary | @group | @literal | @identifier | data:@nontrivial_ws l:@expression/ ,literal: /@dstring | @sstring | @number | @regexp | @array | @object/ ,dstring: /"([^\\"]|\\.)*"/ ,sstring: /'([^\\']|\\.)*'/ ,number: /-?0x[0-9a-fA-F]* | -?0[0-7]* | -?[0-9]*\.[0-9]*([eE][-+]?[0-9]+)? | -?[0-9]+(\.[0-9]*([eE][-+]?[0-9]+)?)?/ ,regexp: /\/([^\\\/]|\\.)*\// ,identifier: /[A-Za-z$_][A-Za-z0-9$_]*/ ,atom: /pre:@ws l:@literal post:@ws data:[.] r:@atom | pre:@ws l:@literal/ ,unary: /pre:@ws data:(-- | \+\+ | - | \+ | ~ | ! | new | typeof | delete | void) r:@expression/ ,binary: /l:@atom pre:@ws data:([-.+*\/%!=<>&|^?:] | instanceof | in) r:@expression/ ,group: /data:\( l:@expressions \)/ ,array: /data:\[ l:@expressions \]/ ,object: /data:\{ l:@expressions \}/ } ,common_methods) } ) .call(this) } ) ;
result.caterwaul_expression_ref_table= {qse: ( "new caterwaul.syntax( \"(\" ,new caterwaul.syntax( \"function\" ,new caterwaul.syntax( \"(\" ,new caterwaul.syntax( \"\" ) ) ,new caterwaul.syntax( \"{\" ,new caterwaul.syntax( \"return\" ,new caterwaul.syntax( \"_v\" ) ) ) ) )" ) ,qs: ( "new caterwaul.syntax( \"this\" )" ) ,qs1: ( "new caterwaul.syntax( \"()\" ,new caterwaul.syntax( \".\" ,new caterwaul.syntax( \"_x\" ) ,new caterwaul.syntax( \"_y\" ) ) ,new caterwaul.syntax( \"\" ) )" ) } ;
return(result) } ) .call(this,new caterwaul.syntax( "(" ,new caterwaul.syntax( "function" ,new caterwaul.syntax( "(" ,new caterwaul.syntax( "" ) ) ,new caterwaul.syntax( "{" ,new caterwaul.syntax( "return" ,new caterwaul.syntax( "_v" ) ) ) ) ) ,new caterwaul.syntax( "this" ) ,new caterwaul.syntax( "()" ,new caterwaul.syntax( "." ,new caterwaul.syntax( "_x" ) ,new caterwaul.syntax( "_y" ) ) ,new caterwaul.syntax( "" ) ) ) ) ;