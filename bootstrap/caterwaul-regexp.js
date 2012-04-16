caterwaul.module( 'regexp' ,function($) { (function() {var regexp_ctor=function() {var xs=arguments;
return(function() {var data=xs[0] ,context=xs[1] ;
return data instanceof this.constructor? (function(it) {return it.data=data.data,it.length=0,it.context=data.context,it} ) .call(this, (this) ) 
: (function(it) {return it.data=data,it.length=0,it.context=context, (function(xs) {var x,x0,xi,xl,xr;
for(var xi=0,xl=xs.length;
xi<xl;
 ++xi)x=xs[xi] , (it.push(x) ) ;
return xs} ) .call(this,Array.prototype.slice.call(xs,2) ) ,it} ) .call(this, (this) ) } ) .call(this) } ,regexp_methods= {i:function() {;
return this.context.flags.i} ,m:function() {;
return this.context.flags.m} ,g:function() {;
return this.context.flags.g} ,concat:function(x) {;
return new this.constructor( ',' ,this.context,this,x) } ,match_groups:function() {;
return this.context.groups} ,referenced_group:function() {;
return this.context.groups[this[0] .data-1] } ,is_zero_width:function() {;
return/^[\^\$]$|^\\[Bb]$/ .test(this.data) ||this.is_positive_lookahead() ||this.is_negative_lookahead() } ,is_one_or_more:function() {;
return this.length&& /^\+\??$/ .test(this.data) } ,is_zero_or_more:function() {;
return this.length&& /^\*\??$/ .test(this.data) } ,is_optional:function() {;
return this.length&& /^\?$/ .test(this.data) } ,is_non_greedy:function() {;
return this.length&& /.\?$/ .test(this.data) } ,is_repetition:function() {;
return this.length&& /^[\+\*\{]\??$|^\?$/ .test(this.data) } ,is_wildcard:function() {;
return this.is_atom() && /^_/ .test(this.data) } ,leaf_nodes_only:function() {;
return false} ,without_metadata:function() {;
return this} ,repeated_child:function() {;
return/^\{/ .test(this.data) ?this[2] 
:this[0] } ,is_character_class:function() {;
return/^\[/ .test(this.data) } ,is_single_escape:function() {;
return/^\\.+$/ .test(this.data) } ,is_range:function() {;
return/^-$/ .test(this.data) &&this.length===2} ,is_atom:function() {;
return!this.length} ,is_any_group:function() {;
return/^\(/ .test(this.data) } ,is_group:function() {;
return/^\($/ .test(this.data) } ,is_forgetful:function() {;
return/^\(\?:$/ .test(this.data) } ,is_positive_lookahead:function() {;
return/^\(\?=$/ .test(this.data) } ,is_negative_lookahead:function() {;
return/^\(\?!$/ .test(this.data) } ,is_backreference:function() {;
return/^\\$/ .test(this.data) } ,is_disjunction:function() {;
return/^\|$/ .test(this.data) &&this.length===2} ,is_join:function() {;
return/^,$/ .test(this.data) &&this.length===2} ,lower_limit:function() {;
return/^\+\??$/ .test(this.data) ?1
: /^\*\??$|^\?$/ .test(this.data) ?0
: /^\{/ .test(this.data) ?this[0] .data
: (function() {throw new Error( ( 'lower limit is undefined for nonrepetitive node ' + (this) + '' ) ) } ) .call(this) } ,upper_limit:function() {;
return/^[\*\+]\??$/ .test(this.data) ?Infinity
: /^\?$/ .test(this.data) ?1
: /^\{/ .test(this.data) ?this[1] .data
: (function() {throw new Error( ( 'upper limit is undefined for nonrepetitive node ' + (this) + '' ) ) } ) .call(this) } ,minimum_length:function() {;
return this.is_zero_width() ?0
:this.is_single_escape() ||this.is_character_class() ?1
:this.is_repetition() ?this.lower_limit() *this.repeated_child() .minimum_length() 
:this.is_group() ||this.is_forgetful() ?this[0] .minimum_length() 
:this.is_backreference() ?this.referenced_group() .minimum_length() 
:this.is_disjunction() ?Math.min(this[0] .minimum_length() ,this[1] .minimum_length() ) 
:this.is_join() ?this[0] .minimum_length() +this[1] .minimum_length() 
:this.data.length} ,toString:function() {;
return this.is_any_group() ?this.data+this[0] .toString() + ')' 
:this.is_character_class() ?this.data+this[0] .toString() + ']' 
:this.is_range() ? ( '' + (this[0] .toString() ) + '-' + (this[1] .toString() ) + '' ) 
:this.is_zero_or_more() ||this.is_one_or_more() ||this.is_optional() ?this[0] .toString() +this.data
:this.is_repetition() ?this[2] .toString() + (this[0] .data===this[1] .data? ( '{' + (this[0] .data) + '}' ) 
:this[1] .data===Infinity? ( '{' + (this[0] .data) + ',}' ) 
: ( '{' + (this[0] .data) + ',' + (this[1] .data) + '}' ) ) 
:this.is_zero_width() ?this.data
:this.is_backreference() ? ( '\\' + (this[0] .data) + '' ) 
:this.is_disjunction() ? ( '' + (this[0] .toString() ) + '|' + (this[1] .toString() ) + '' ) 
:this.is_join() ? ( '' + (this[0] .toString() ) + '' + (this[1] .toString() ) + '' ) 
:this.data} } ,regexp_compile=function(r) {;
return new RegExp(r.toString() , [r.i() ? 'i' 
: '' ,r.m() ? 'm' 
: '' ,r.g() ? 'g' 
: '' ] .join( '' ) ) } ,regexp_parse=function(r,options) {;
return(function() {var settings=$.merge( {atom: 'character' } ,options) ,pieces= /^\/(.*)\/([gim]*)$/ .exec(r.toString() ) || /^(.*)$/ .exec(r.toString() ) ,s=pieces[1] ,flags= (function(it) {return{i: /i/ .test(it) ,m: /m/ .test(it) ,g: /g/ .test(it) } } ) .call(this, (pieces[2] ) ) ,context= {groups: [] ,flags:flags} ,added_groups= {} ,add_group=function(node,p) {;
return!added_groups[p.i] && (function(it) {return added_groups[p.i] =true,it} ) .call(this, (context.groups.push(node) ) ) } ,node=function() {var xs=arguments;
return xs[0] === ',' &&xs[2] === '' ?xs[1] 
: (function(it) {return(function(xs) {var x,x0,xi,xl,xr;
for(var xi=0,xl=xs.length;
xi<xl;
 ++xi)x=xs[xi] , (it.push(x) ) ;
return xs} ) .call(this,Array.prototype.slice.call(xs,1) ) ,it} ) .call(this, (new $.regexp.syntax(xs[0] ,context) ) ) } ,oneof=function(c) {;
return function(p) {;
return p.i<s.length&&c.indexOf(s.charAt(p.i) ) !== -1&& {v:s.charAt(p.i) ,i:p.i+1} } } ,string=function(cs) {;
return function(p) {;
return p.i<s.length&&s.substr(p.i,cs.length) ===cs&& {v:s.substr(p.i,cs.length) ,i:p.i+cs.length} } } ,not=function(n,f) {;
return function(p) {;
return p.i>=s.length||f(p) ?false
: {v:s.substr(p.i,n) ,i:p.i+n} } } ,any=function(n) {;
return function(p) {;
return p.i<s.length&& {v:s.substr(p.i,n) ,i:p.i+n} } } ,alt=function() {var ps=arguments;
return function(p) {;
return(function(xs) {var x,x0,xi,xl,xr;
for(var x=xs[0] ,xi=0,xl=xs.length,x1;
xi<xl;
 ++xi) {x=xs[xi] ;
if(x1= (x(p) ) )return x1}return false} ) .call(this,ps) } } ,many=function(f) {;
return function(p) {;
return(function(it) {return it.length>1&& {v: (function(xs) {var x,x0,xi,xl,xr;
for(var xr=new xs.constructor() ,xi=0,xl=xs.length;
xi<xl;
 ++xi)x=xs[xi] ,xr.push( (x.v) ) ;
return xr} ) .call(this,it.slice(1) ) ,i:it[it.length-1] .i} } ) .call(this, ( (function(xs) {var x,x0,xi,xl,xr;
for(var xr= [] ,x=xs,xi=0;
x!==null;
 ++xi)xr.push(x) ,x= (f(x) ||null) ;
return xr} ) .call(this,p) ) ) } } ,join=function() {var ps=arguments;
return function(p) {;
return(function() {var ns= [] ;
return(function(it) {return it&& {v:ns,i:it.i} } ) .call(this, ( (function(xs) {var x,x0,xi,xl,xr;
for(var x0= (p) ,xi=0,xl=xs.length;
xi<xl;
 ++xi)x=xs[xi] ,x0= (x0&& (function(it) {return it&&ns.push(it.v) ,it} ) .call(this, (x(x0) ) ) ) ;
return x0} ) .call(this,ps) ) ) } ) .call(this) } } ,zero=function(p) {;
return p} ,map=function(parser,f) {;
return function(p) {;
return(function() {var result=parser(p) ;
return result&& {v:f.call(result,result.v) ,i:result.i} } ) .call(this) } } ,ident=oneof( '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_' ) ,digit=oneof( '0123456789' ) ,hex=oneof( '0123456789ABCDEFabcdef' ) ,number=map(many(digit) ,function(_) {return+_.join( '' ) } ) ,end=function(p) {;
return p.i===s.length&&p} ,toplevel=function(p) {;
return toplevel(p) } ,term=function(p) {;
return term(p) } ,atom=function(p) {;
return atom(p) } ,maybe_munch_spaces=settings.atom=== 'word' ?alt(many(oneof( ' ' ) ) ,zero) 
:zero,toplevel= (function() {var no_pipes=function(p) {;
return no_pipes(p) } ,no_pipes=alt(map(join(term,no_pipes) ,function(_) {return node( ',' ,_[0] ,_[1] ) } ) ,term,map(maybe_munch_spaces,function(_) {return'' } ) ) ;
return alt(map(join(no_pipes,oneof( '|' ) ,toplevel) ,function(_) {return node( '|' ,_[0] ,_[2] ) } ) ,no_pipes) } ) .call(this) ,term= (function() {var star=map(oneof( '*' ) ,node) ,plus=map(oneof( '+' ) ,node) ,question_mark=map(oneof( '?' ) ,node) ,repetition=alt(map(join(oneof( '{' ) ,number,oneof( '}' ) ) ,function(_) {return node( '{' ,node(_[1] ) ,node(_[1] ) ) } ) ,map(join(oneof( '{' ) ,number,oneof( ',' ) ,oneof( '}' ) ) ,function(_) {return node( '{' ,node(_[1] ) ,node(Infinity) ) } ) ,map(join(oneof( '{' ) ,number,oneof( ',' ) ,number,oneof( '}' ) ) ,function(_) {return node( '{' ,node(_[1] ) ,node(_[3] ) ) } ) ) ,modifier=alt(star,plus,repetition) ,non_greedy=oneof( '?' ) ,modifiers=alt(map(join(modifier,non_greedy) ,function(_) {return(function(it) {return it.data+=_[1] ,it} ) .call(this, (_[0] ) ) } ) ,modifier,question_mark) ;
return alt(map(join(atom,modifiers,maybe_munch_spaces) ,function(_) {return(function(it) {return it.push(_[0] ) ,it} ) .call(this, (_[1] ) ) } ) ,atom) } ) .call(this) ,atom= (function() {var positive_lookahead=map(join(string( '(?=' ) ,maybe_munch_spaces,toplevel,string( ')' ) ) ,function(_) {return node( '(?=' ,_[2] ) } ) ,negative_lookahead=map(join(string( '(?!' ) ,maybe_munch_spaces,toplevel,string( ')' ) ) ,function(_) {return node( '(?!' ,_[2] ) } ) ,forgetful_group=map(join(string( '(?:' ) ,maybe_munch_spaces,toplevel,string( ')' ) ) ,function(_) {return node( '(?:' ,_[2] ) } ) ,group=map(join(string( '(' ) ,maybe_munch_spaces,toplevel,string( ')' ) ) ,function(_) {return(function(it) {return add_group(it,this) ,it} ) .call(this, (node( '(' ,_[2] ) ) ) } ) ,word=map(many(ident) ,function(_) {return node(_.join( '' ) ) } ) ,character_class=function(p) {;
return character_class(p) } ,character_class= (function() {var each=alt(map(join(any(1) ,oneof( '-' ) ,any(1) ) ,function(_) {return node( '-' ,node(_[0] ) ,node(_[2] ) ) } ) ,map(join(oneof( '\\' ) ,any(1) ) ,function(_) {return node(_.join( '' ) ) } ) ,map(not(1,oneof( ']' ) ) ,node) ) ;
return alt(map(join(each,character_class) ,function(_) {return node( ',' ,_[0] ,_[1] ) } ) ,each) } ) .call(this) ,character_not_in=map(join(string( '[^' ) ,character_class,string( ']' ) ) ,function(_) {return node( '[^' ,_[1] ) } ) ,character_in=map(join(string( '[' ) ,character_class,string( ']' ) ) ,function(_) {return node( '[' ,_[1] ) } ) ,zero_width=map(oneof( '^$' ) ,node) ,escaped=map(join(oneof( '\\' ) ,oneof( 'BbWwSsDdfnrtv0*+.?|()[]{}\\$^' ) ) ,function(_) {return node(_.join( '' ) ) } ) ,escaped_slash=map(string( '\\/' ) ,function(_) {return node( '/' ) } ) ,control=map(join(string( '\\c' ) ,any(1) ) ,function(_) {return node(_.join( '' ) ) } ) ,hex_code=map(join(string( '\\x' ) ,hex,hex) ,function(_) {return node(_.join( '' ) ) } ) ,unicode=map(join(string( '\\u' ) ,hex,hex,hex,hex) ,function(_) {return node(_.join( '' ) ) } ) ,backreference=function(p) {;
return(function() {var single_digit_backreference=map(join(oneof( '\\' ) ,digit) , (function(xs) {return node( '\\' ,node( +xs[1] ) ) } ) ) ;
return(function(it) {return it&&it.v<=context.groups.length? {v:node( '\\' ,node(it.v) ) ,i:it.i} 
:single_digit_backreference(p) } ) .call(this, (map(join(oneof( '\\' ) ,digit,digit) ,function(_) {return+ ( '' + (_[1] ) + '' + (_[2] ) + '' ) } ) (p) ) ) } ) .call(this) } ,dot=map(oneof( '.' ) ,node) ,other=map(not(1,oneof( ')|+*?{' ) ) ,node) ,maybe_word=settings.atom=== 'word' ?alt(word,other) 
:other,nontrivial_thing=alt(positive_lookahead,negative_lookahead,forgetful_group,group,character_not_in,character_in,zero_width,escaped,escaped_slash,control,hex_code,unicode,backreference,dot,maybe_word) ,base=map(join(maybe_munch_spaces,nontrivial_thing,maybe_munch_spaces) ,function(_) {return _[1] } ) ;
return base} ) .call(this) ;
return(function(it) {return it?it.v[0] 
: (function() {throw new Error( ( 'caterwaul.regexp(): failed to parse ' + (r.toString() ) + '' ) ) } ) .call(this) } ) .call(this, (join(toplevel,end) ( {i:0} ) ) ) } ) .call(this) } ;
return $.regexp=function(r,options) {;
return $.regexp.parse.apply(this,arguments) } ,$.regexp.syntax=$.syntax_subclass(regexp_ctor,regexp_methods) ,$.regexp.parse=regexp_parse,$.regexp.compile=regexp_compile} ) .call(this) } ) ;
