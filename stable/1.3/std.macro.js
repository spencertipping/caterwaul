caterwaul.module( 'std.macro' ,function($) {var syntax_manipulator=function(base_case) {var result=function(x) {if(x.constructor===Array) {for(var i=0,l=x.length,ys= [] ;
i<l;
 ++i)ys.push(result(x[i] ) ) ;
return function(tree) {for(var i=ys.length-1,r;
i>=0;
 --i)if(r=ys[i] .call(this,tree) )return r} }else return x.constructor===String?result($.parse(x) ) 
:x.constructor===$.syntax?base_case.call(this,x) 
:x} ;
return result} ;
$.pattern=syntax_manipulator(function(pattern) {return function(tree) {return pattern.match(tree) } } ) ;
$.expander=syntax_manipulator(function(expander) {return function(match) {return expander.replace(match) } } ) ;
$.alternatives=syntax_manipulator(function(alternative) {throw new Error( 'must use replacer functions with caterwaul.alternatives()' ) } ) ;
$.reexpander=function(expander) {var e=$.expander(expander) ;
return function(match) {var r=e.call(this,match) ;
return r&&this(r) } } ;
var composer=function(expander_base_case) {return function(pattern,expander) {var new_pattern=$.pattern(pattern) ,new_expander=expander_base_case(expander) ;
return function(tree) {var match=new_pattern.call(this,tree) ;
return match&&new_expander.call(this,match) } } } ;
$.replacer=composer($.expander) ;
$.rereplacer=composer($.reexpander) ;
$.macroexpand=function(tree) {return $($.alternatives(Array.prototype.slice.call(arguments,1) ) ) (tree) } } ) ;
