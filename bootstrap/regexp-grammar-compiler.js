caterwaul.module( 'regexp-grammar-compiler' , (function(qs,qse,qse1,qse2,qs1,qs2,qs3,qs4,qs5) {var result= (function($) {$.regexp_grammar=function(rules) {;
return(function() {var parsed_rules= {} ,classes= {} ,visit=function(pair) {;
return(parsed_rules[pair[0] ] =$.regexp(pair[1] , {atom: 'word' } ) ,classes[pair[0] ] =parser_for(parsed_rules[pair[0] ] ) ) } ,parser_for=function(r) {;
return(qs) .replace( {_stages:matching_stage_for(r, 's' ) } ) } ,matching_stage_for=function(t,v) {;
return(function(it) {return it?substep(it,t,v) 
: (function(it) {return it?inline_substep(it,t,v) 
:is_constant(t) ?constant(t,v) 
:t.data=== '*?' ?repetition(t,v) 
:t.data=== '?' ?optional(t,v) 
:t.data=== ',' ?sequence(t,v) 
:t.data=== '(' ?matching_stage_for(t[0] ,v) 
:t.data=== '|' ?alternate(t,v) 
:t.is_character_class() ||t.data=== '.' ?character_class(t,v) 
: (function() {throw( 'no matching form for ' + (t) + '' ) } ) .call(this) } ) .call(this, (is_inline_substep(t) ) ) } ) .call(this, (is_substep(t) ) ) } ,substep=function(it,t,v) {;
return(qse) .replace( {_name:it._name.data,_step:it._step.data,_v:v} ) } ,inline_substep=function(it,t,v) {;
return(qse1) .replace( {_v:v,_step:it._step.data} ) } ,constant=function(t,v) {;
return(qse2) .replace( {_l: ( '' + (t.data.length) + '' ) ,_s:$.syntax.from_string(t.data) ,_v:v} ) } ,repetition=function(t,v) {;
return(qs1) .replace( {_last:$.gensym( 'last' ) ,_original:$.gensym( 's' ) ,_name:t.cons_name=$.gensym( 'repetition' ) ,_v:v,_each:matching_stage_for(t[0] ,v) } ) } ,optional=function(t,v) {;
return(function() {var temp=$.gensym(v) ;
return(qs2) .replace( {_v:v,_temp:temp,_name:t.cons_name=$.gensym( 'optional_term' ) ,_stage:matching_stage_for(t[0] ,temp) } ) } ) .call(this) } ,sequence=function(t,v) {;
return(qs3) .replace( {_x:matching_stage_for(t[0] ,v) ,_y:matching_stage_for(t[1] ,v) } ) } ,alternate=function(t,v) {;
return(function() {var temp=$.gensym(v) ;
return(qs4) .replace( {_v:v,_temp:temp,_stage1:matching_stage_for(t[0] ,temp) ,_stage2:matching_stage_for(t[1] ,v) } ) } ) .call(this) } ,character_class=function(t,v) {;
return(qs5) .replace( {_v:v,_regexp: ( '/' + (t) + '/' ) } ) } ,substep_pattern=$.regexp( /(_name: _step)/ , {atom: 'word' } ) ,inline_substep_pattern=$.regexp( /(:_step)/ , {atom: 'word' } ) ,is_substep=function(t) {;
return(substep_pattern) .match(t) } ,is_inline_substep=function(t) {;
return(inline_substep_pattern) .match(t) } ,is_constant=function(t) {;
return t.is_atom() &&t.data!== '.' } ;
return(function(it) {return classes} ) .call(this, ( (function(xs) {var x,x0,xi,xl,xr;
for(var xi=0,xl=xs.length;
xi<xl;
 ++xi)x=xs[xi] , (visit(x) ) ;
return xs} ) .call(this, (function(o) {var ps= [] ;
for(var k in o)Object.prototype.hasOwnProperty.call(o,k) &&ps.push( [k,o[k] ] ) ;
return ps} ) .call(this, (rules) ) ) ) ) } ) .call(this) } } ) ;
result.caterwaul_expression_ref_table= {qs: ( "new caterwaul.syntax( \"function\" ,new caterwaul.syntax( \"(\" ,new caterwaul.syntax( \"s\" ) ) ,new caterwaul.syntax( \"{\" ,new caterwaul.syntax( \";\" ,new caterwaul.syntax( \";\" ,new caterwaul.syntax( \"var\" ,new caterwaul.syntax( \"=\" ,new caterwaul.syntax( \"cons\" ) ,new caterwaul.syntax( \"{\" ,new caterwaul.syntax( \"\" ) ) ) ) ,new caterwaul.syntax( \"_stages\" ) ) ,new caterwaul.syntax( \"if\" ,new caterwaul.syntax( \"(\" ,new caterwaul.syntax( \"s\" ) ) ,new caterwaul.syntax( \"{\" ,new caterwaul.syntax( \";\" ,new caterwaul.syntax( \"=\" ,new caterwaul.syntax( \".\" ,new caterwaul.syntax( \"s\" ) ,new caterwaul.syntax( \"cons\" ) ) ,new caterwaul.syntax( \"cons\" ) ) ,new caterwaul.syntax( \"return\" ,new caterwaul.syntax( \"s\" ) ) ) ) ) ) ) )" ) ,qse: ( "new caterwaul.syntax( \"if\" ,new caterwaul.syntax( \"(\" ,new caterwaul.syntax( \"&&\" ,new caterwaul.syntax( \"_v\" ) ,new caterwaul.syntax( \"(\" ,new caterwaul.syntax( \"=\" ,new caterwaul.syntax( \"_v\" ) ,new caterwaul.syntax( \"()\" ,new caterwaul.syntax( \"_step\" ) ,new caterwaul.syntax( \"_v\" ) ) ) ) ) ) ,new caterwaul.syntax( \"=\" ,new caterwaul.syntax( \".\" ,new caterwaul.syntax( \"cons\" ) ,new caterwaul.syntax( \"_name\" ) ) ,new caterwaul.syntax( \".\" ,new caterwaul.syntax( \"_v\" ) ,new caterwaul.syntax( \"cons\" ) ) ) )" ) ,qse1: ( "new caterwaul.syntax( \"if\" ,new caterwaul.syntax( \"(\" ,new caterwaul.syntax( \"&&\" ,new caterwaul.syntax( \"_v\" ) ,new caterwaul.syntax( \"(\" ,new caterwaul.syntax( \"=\" ,new caterwaul.syntax( \"_v\" ) ,new caterwaul.syntax( \"()\" ,new caterwaul.syntax( \"_step\" ) ,new caterwaul.syntax( \"_v\" ) ) ) ) ) ) ,new caterwaul.syntax( \"=\" ,new caterwaul.syntax( \"cons\" ) ,new caterwaul.syntax( \".\" ,new caterwaul.syntax( \"_v\" ) ,new caterwaul.syntax( \"cons\" ) ) ) )" ) ,qse2: ( "new caterwaul.syntax( \"if\" ,new caterwaul.syntax( \"(\" ,new caterwaul.syntax( \"&&\" ,new caterwaul.syntax( \"_v\" ) ,new caterwaul.syntax( \"===\" ,new caterwaul.syntax( \"()\" ,new caterwaul.syntax( \".\" ,new caterwaul.syntax( \".\" ,new caterwaul.syntax( \"_v\" ) ,new caterwaul.syntax( \"s\" ) ) ,new caterwaul.syntax( \"substr\" ) ) ,new caterwaul.syntax( \",\" ,new caterwaul.syntax( \".\" ,new caterwaul.syntax( \"_v\" ) ,new caterwaul.syntax( \"i\" ) ) ,new caterwaul.syntax( \"_l\" ) ) ) ,new caterwaul.syntax( \"_s\" ) ) ) ) ,new caterwaul.syntax( \"=\" ,new caterwaul.syntax( \"_v\" ) ,new caterwaul.syntax( \"{\" ,new caterwaul.syntax( \",\" ,new caterwaul.syntax( \":\" ,new caterwaul.syntax( \"s\" ) ,new caterwaul.syntax( \".\" ,new caterwaul.syntax( \"_v\" ) ,new caterwaul.syntax( \"s\" ) ) ) ,new caterwaul.syntax( \":\" ,new caterwaul.syntax( \"i\" ) ,new caterwaul.syntax( \"+\" ,new caterwaul.syntax( \".\" ,new caterwaul.syntax( \"_v\" ) ,new caterwaul.syntax( \"i\" ) ) ,new caterwaul.syntax( \"_l\" ) ) ) ) ) ) ,new caterwaul.syntax( \"else\" ,new caterwaul.syntax( \"=\" ,new caterwaul.syntax( \"_v\" ) ,new caterwaul.syntax( \"null\" ) ) ) )" ) ,qs1: ( "new caterwaul.syntax( \";\" ,new caterwaul.syntax( \";\" ,new caterwaul.syntax( \";\" ,new caterwaul.syntax( \"var\" ,new caterwaul.syntax( \",\" ,new caterwaul.syntax( \"_last\" ) ,new caterwaul.syntax( \"=\" ,new caterwaul.syntax( \"_original\" ) ,new caterwaul.syntax( \"_v\" ) ) ) ) ,new caterwaul.syntax( \"while\" ,new caterwaul.syntax( \"(\" ,new caterwaul.syntax( \"_v\" ) ) ,new caterwaul.syntax( \"{\" ,new caterwaul.syntax( \";\" ,new caterwaul.syntax( \"=\" ,new caterwaul.syntax( \"_last\" ) ,new caterwaul.syntax( \"_v\" ) ) ,new caterwaul.syntax( \"_each\" ) ) ) ) ) ,new caterwaul.syntax( \"=\" ,new caterwaul.syntax( \"_v\" ) ,new caterwaul.syntax( \"_last\" ) ) ) ,new caterwaul.syntax( \"if\" ,new caterwaul.syntax( \"(\" ,new caterwaul.syntax( \"_v\" ) ) ,new caterwaul.syntax( \"=\" ,new caterwaul.syntax( \".\" ,new caterwaul.syntax( \"cons\" ) ,new caterwaul.syntax( \"_name\" ) ) ,new caterwaul.syntax( \"()\" ,new caterwaul.syntax( \".\" ,new caterwaul.syntax( \".\" ,new caterwaul.syntax( \"_v\" ) ,new caterwaul.syntax( \"s\" ) ) ,new caterwaul.syntax( \"substring\" ) ) ,new caterwaul.syntax( \",\" ,new caterwaul.syntax( \".\" ,new caterwaul.syntax( \"_original\" ) ,new caterwaul.syntax( \"i\" ) ) ,new caterwaul.syntax( \".\" ,new caterwaul.syntax( \"_v\" ) ,new caterwaul.syntax( \"i\" ) ) ) ) ) ) )" ) ,qs2: ( "new caterwaul.syntax( \";\" ,new caterwaul.syntax( \";\" ,new caterwaul.syntax( \"var\" ,new caterwaul.syntax( \"=\" ,new caterwaul.syntax( \"_temp\" ) ,new caterwaul.syntax( \"_v\" ) ) ) ,new caterwaul.syntax( \"_stage\" ) ) ,new caterwaul.syntax( \"if\" ,new caterwaul.syntax( \"(\" ,new caterwaul.syntax( \"_temp\" ) ) ,new caterwaul.syntax( \",\" ,new caterwaul.syntax( \"=\" ,new caterwaul.syntax( \"_v\" ) ,new caterwaul.syntax( \"_temp\" ) ) ,new caterwaul.syntax( \"=\" ,new caterwaul.syntax( \".\" ,new caterwaul.syntax( \".\" ,new caterwaul.syntax( \"_v\" ) ,new caterwaul.syntax( \"cons\" ) ) ,new caterwaul.syntax( \"_name\" ) ) ,new caterwaul.syntax( \"true\" ) ) ) ) )" ) ,qs3: ( "new caterwaul.syntax( \";\" ,new caterwaul.syntax( \"_x\" ) ,new caterwaul.syntax( \"_y\" ) )" ) ,qs4: ( "new caterwaul.syntax( \";\" ,new caterwaul.syntax( \";\" ,new caterwaul.syntax( \"var\" ,new caterwaul.syntax( \"=\" ,new caterwaul.syntax( \"_temp\" ) ,new caterwaul.syntax( \"_v\" ) ) ) ,new caterwaul.syntax( \"_stage1\" ) ) ,new caterwaul.syntax( \"if\" ,new caterwaul.syntax( \"(\" ,new caterwaul.syntax( \"_temp\" ) ) ,new caterwaul.syntax( \"=\" ,new caterwaul.syntax( \"_v\" ) ,new caterwaul.syntax( \"_temp\" ) ) ,new caterwaul.syntax( \"else\" ,new caterwaul.syntax( \"{\" ,new caterwaul.syntax( \"_stage2\" ) ) ) ) )" ) ,qs5: ( "new caterwaul.syntax( \"if\" ,new caterwaul.syntax( \"(\" ,new caterwaul.syntax( \"&&\" ,new caterwaul.syntax( \"_v\" ) ,new caterwaul.syntax( \"()\" ,new caterwaul.syntax( \".\" ,new caterwaul.syntax( \"_regexp\" ) ,new caterwaul.syntax( \"test\" ) ) ,new caterwaul.syntax( \"()\" ,new caterwaul.syntax( \".\" ,new caterwaul.syntax( \".\" ,new caterwaul.syntax( \"_v\" ) ,new caterwaul.syntax( \"s\" ) ) ,new caterwaul.syntax( \"charAt\" ) ) ,new caterwaul.syntax( \".\" ,new caterwaul.syntax( \"_v\" ) ,new caterwaul.syntax( \"i\" ) ) ) ) ) ) ,new caterwaul.syntax( \"=\" ,new caterwaul.syntax( \"_v\" ) ,new caterwaul.syntax( \"{\" ,new caterwaul.syntax( \",\" ,new caterwaul.syntax( \":\" ,new caterwaul.syntax( \"s\" ) ,new caterwaul.syntax( \".\" ,new caterwaul.syntax( \"_v\" ) ,new caterwaul.syntax( \"s\" ) ) ) ,new caterwaul.syntax( \":\" ,new caterwaul.syntax( \"i\" ) ,new caterwaul.syntax( \"+\" ,new caterwaul.syntax( \".\" ,new caterwaul.syntax( \"_v\" ) ,new caterwaul.syntax( \"i\" ) ) ,new caterwaul.syntax( \"1\" ) ) ) ) ) ) ,new caterwaul.syntax( \"else\" ,new caterwaul.syntax( \"=\" ,new caterwaul.syntax( \"_v\" ) ,new caterwaul.syntax( \"null\" ) ) ) )" ) } ;
return(result) } ) .call(this,new caterwaul.syntax( "function" ,new caterwaul.syntax( "(" ,new caterwaul.syntax( "s" ) ) ,new caterwaul.syntax( "{" ,new caterwaul.syntax( ";" ,new caterwaul.syntax( ";" ,new caterwaul.syntax( "var" ,new caterwaul.syntax( "=" ,new caterwaul.syntax( "cons" ) ,new caterwaul.syntax( "{" ,new caterwaul.syntax( "" ) ) ) ) ,new caterwaul.syntax( "_stages" ) ) ,new caterwaul.syntax( "if" ,new caterwaul.syntax( "(" ,new caterwaul.syntax( "s" ) ) ,new caterwaul.syntax( "{" ,new caterwaul.syntax( ";" ,new caterwaul.syntax( "=" ,new caterwaul.syntax( "." ,new caterwaul.syntax( "s" ) ,new caterwaul.syntax( "cons" ) ) ,new caterwaul.syntax( "cons" ) ) ,new caterwaul.syntax( "return" ,new caterwaul.syntax( "s" ) ) ) ) ) ) ) ) ,new caterwaul.syntax( "if" ,new caterwaul.syntax( "(" ,new caterwaul.syntax( "&&" ,new caterwaul.syntax( "_v" ) ,new caterwaul.syntax( "(" ,new caterwaul.syntax( "=" ,new caterwaul.syntax( "_v" ) ,new caterwaul.syntax( "()" ,new caterwaul.syntax( "_step" ) ,new caterwaul.syntax( "_v" ) ) ) ) ) ) ,new caterwaul.syntax( "=" ,new caterwaul.syntax( "." ,new caterwaul.syntax( "cons" ) ,new caterwaul.syntax( "_name" ) ) ,new caterwaul.syntax( "." ,new caterwaul.syntax( "_v" ) ,new caterwaul.syntax( "cons" ) ) ) ) ,new caterwaul.syntax( "if" ,new caterwaul.syntax( "(" ,new caterwaul.syntax( "&&" ,new caterwaul.syntax( "_v" ) ,new caterwaul.syntax( "(" ,new caterwaul.syntax( "=" ,new caterwaul.syntax( "_v" ) ,new caterwaul.syntax( "()" ,new caterwaul.syntax( "_step" ) ,new caterwaul.syntax( "_v" ) ) ) ) ) ) ,new caterwaul.syntax( "=" ,new caterwaul.syntax( "cons" ) ,new caterwaul.syntax( "." ,new caterwaul.syntax( "_v" ) ,new caterwaul.syntax( "cons" ) ) ) ) ,new caterwaul.syntax( "if" ,new caterwaul.syntax( "(" ,new caterwaul.syntax( "&&" ,new caterwaul.syntax( "_v" ) ,new caterwaul.syntax( "===" ,new caterwaul.syntax( "()" ,new caterwaul.syntax( "." ,new caterwaul.syntax( "." ,new caterwaul.syntax( "_v" ) ,new caterwaul.syntax( "s" ) ) ,new caterwaul.syntax( "substr" ) ) ,new caterwaul.syntax( "," ,new caterwaul.syntax( "." ,new caterwaul.syntax( "_v" ) ,new caterwaul.syntax( "i" ) ) ,new caterwaul.syntax( "_l" ) ) ) ,new caterwaul.syntax( "_s" ) ) ) ) ,new caterwaul.syntax( "=" ,new caterwaul.syntax( "_v" ) ,new caterwaul.syntax( "{" ,new caterwaul.syntax( "," ,new caterwaul.syntax( ":" ,new caterwaul.syntax( "s" ) ,new caterwaul.syntax( "." ,new caterwaul.syntax( "_v" ) ,new caterwaul.syntax( "s" ) ) ) ,new caterwaul.syntax( ":" ,new caterwaul.syntax( "i" ) ,new caterwaul.syntax( "+" ,new caterwaul.syntax( "." ,new caterwaul.syntax( "_v" ) ,new caterwaul.syntax( "i" ) ) ,new caterwaul.syntax( "_l" ) ) ) ) ) ) ,new caterwaul.syntax( "else" ,new caterwaul.syntax( "=" ,new caterwaul.syntax( "_v" ) ,new caterwaul.syntax( "null" ) ) ) ) ,new caterwaul.syntax( ";" ,new caterwaul.syntax( ";" ,new caterwaul.syntax( ";" ,new caterwaul.syntax( "var" ,new caterwaul.syntax( "," ,new caterwaul.syntax( "_last" ) ,new caterwaul.syntax( "=" ,new caterwaul.syntax( "_original" ) ,new caterwaul.syntax( "_v" ) ) ) ) ,new caterwaul.syntax( "while" ,new caterwaul.syntax( "(" ,new caterwaul.syntax( "_v" ) ) ,new caterwaul.syntax( "{" ,new caterwaul.syntax( ";" ,new caterwaul.syntax( "=" ,new caterwaul.syntax( "_last" ) ,new caterwaul.syntax( "_v" ) ) ,new caterwaul.syntax( "_each" ) ) ) ) ) ,new caterwaul.syntax( "=" ,new caterwaul.syntax( "_v" ) ,new caterwaul.syntax( "_last" ) ) ) ,new caterwaul.syntax( "if" ,new caterwaul.syntax( "(" ,new caterwaul.syntax( "_v" ) ) ,new caterwaul.syntax( "=" ,new caterwaul.syntax( "." ,new caterwaul.syntax( "cons" ) ,new caterwaul.syntax( "_name" ) ) ,new caterwaul.syntax( "()" ,new caterwaul.syntax( "." ,new caterwaul.syntax( "." ,new caterwaul.syntax( "_v" ) ,new caterwaul.syntax( "s" ) ) ,new caterwaul.syntax( "substring" ) ) ,new caterwaul.syntax( "," ,new caterwaul.syntax( "." ,new caterwaul.syntax( "_original" ) ,new caterwaul.syntax( "i" ) ) ,new caterwaul.syntax( "." ,new caterwaul.syntax( "_v" ) ,new caterwaul.syntax( "i" ) ) ) ) ) ) ) ,new caterwaul.syntax( ";" ,new caterwaul.syntax( ";" ,new caterwaul.syntax( "var" ,new caterwaul.syntax( "=" ,new caterwaul.syntax( "_temp" ) ,new caterwaul.syntax( "_v" ) ) ) ,new caterwaul.syntax( "_stage" ) ) ,new caterwaul.syntax( "if" ,new caterwaul.syntax( "(" ,new caterwaul.syntax( "_temp" ) ) ,new caterwaul.syntax( "," ,new caterwaul.syntax( "=" ,new caterwaul.syntax( "_v" ) ,new caterwaul.syntax( "_temp" ) ) ,new caterwaul.syntax( "=" ,new caterwaul.syntax( "." ,new caterwaul.syntax( "." ,new caterwaul.syntax( "_v" ) ,new caterwaul.syntax( "cons" ) ) ,new caterwaul.syntax( "_name" ) ) ,new caterwaul.syntax( "true" ) ) ) ) ) ,new caterwaul.syntax( ";" ,new caterwaul.syntax( "_x" ) ,new caterwaul.syntax( "_y" ) ) ,new caterwaul.syntax( ";" ,new caterwaul.syntax( ";" ,new caterwaul.syntax( "var" ,new caterwaul.syntax( "=" ,new caterwaul.syntax( "_temp" ) ,new caterwaul.syntax( "_v" ) ) ) ,new caterwaul.syntax( "_stage1" ) ) ,new caterwaul.syntax( "if" ,new caterwaul.syntax( "(" ,new caterwaul.syntax( "_temp" ) ) ,new caterwaul.syntax( "=" ,new caterwaul.syntax( "_v" ) ,new caterwaul.syntax( "_temp" ) ) ,new caterwaul.syntax( "else" ,new caterwaul.syntax( "{" ,new caterwaul.syntax( "_stage2" ) ) ) ) ) ,new caterwaul.syntax( "if" ,new caterwaul.syntax( "(" ,new caterwaul.syntax( "&&" ,new caterwaul.syntax( "_v" ) ,new caterwaul.syntax( "()" ,new caterwaul.syntax( "." ,new caterwaul.syntax( "_regexp" ) ,new caterwaul.syntax( "test" ) ) ,new caterwaul.syntax( "()" ,new caterwaul.syntax( "." ,new caterwaul.syntax( "." ,new caterwaul.syntax( "_v" ) ,new caterwaul.syntax( "s" ) ) ,new caterwaul.syntax( "charAt" ) ) ,new caterwaul.syntax( "." ,new caterwaul.syntax( "_v" ) ,new caterwaul.syntax( "i" ) ) ) ) ) ) ,new caterwaul.syntax( "=" ,new caterwaul.syntax( "_v" ) ,new caterwaul.syntax( "{" ,new caterwaul.syntax( "," ,new caterwaul.syntax( ":" ,new caterwaul.syntax( "s" ) ,new caterwaul.syntax( "." ,new caterwaul.syntax( "_v" ) ,new caterwaul.syntax( "s" ) ) ) ,new caterwaul.syntax( ":" ,new caterwaul.syntax( "i" ) ,new caterwaul.syntax( "+" ,new caterwaul.syntax( "." ,new caterwaul.syntax( "_v" ) ,new caterwaul.syntax( "i" ) ) ,new caterwaul.syntax( "1" ) ) ) ) ) ) ,new caterwaul.syntax( "else" ,new caterwaul.syntax( "=" ,new caterwaul.syntax( "_v" ) ,new caterwaul.syntax( "null" ) ) ) ) ) ) ;
