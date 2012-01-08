caterwaul.module( 'std.anon' ,function($) {$.anonymizer=function( ) {for(var translation_table= { } ,i=0,l=arguments.length;
i<l;
 ++i)translation_table[arguments[i] ] =$.gensym(arguments[i] ) ;
return function(node) {return $.parse(node) .replace(translation_table) } } } ) ;
