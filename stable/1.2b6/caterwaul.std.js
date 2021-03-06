// Caterwaul standard library | Spencer Tipping
// Licensed under the terms of the MIT source code license

// Internal libraries.
// These operate on caterwaul in some way, but don't necessarily have an effect on generated code.

caterwaul.module( 'std.macro' ,function($) {var syntax_manipulator=function(base_case) {var result=function(x) {if(x.constructor===Array) {for(var i=0,l=x.length,ys= [ ] ;
i<l;
 ++i)ys.push(result(x[i] ) ) ;
return function(tree) {for(var i=ys.length-1,r;
i>=0;
 --i)if(r=ys[i] .call(this,tree) )return r} }else return x.constructor===String?result($.parse(x) ) :x.constructor===$.syntax?base_case.call(this,x) :x} ;
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

caterwaul.module( 'std.anon' ,function($) {$.anonymizer=function( ) {for(var translation_table= { } ,i=0,l=arguments.length;
i<l;
 ++i)translation_table[arguments[i] ] =$.gensym(arguments[i] ) ;
return function(node) {return $.parse(node) .replace(translation_table) } } } ) ;


// Language specializations.
// These provide configurations that specialize caterwaul to operate well with a given programming language. This is relevant because not all languages compile to Javascript the same way, and
// caterwaul should be able to adapt to the syntactic limitations of generated code (and thus be usable with non-Javascript languages like Coffeescript).

// Also included is a standard set of words that can be combined with the Javascript forms to produce useful macros. Together these form a base language that is used by other parts of the
// standard library.

caterwaul.module( 'std.js' ,function($) {$.js=function(macroexpander) {var string_interpolator=function(node) {var s=node.data,q=s.charAt(0) ,syntax=$.syntax;
if(q!== '\'' &&q!== '"' || ! /#\{[^\}]+\}/ .test(s) )return false;
for(var pieces= [ ] ,is_code= [ ] ,i=1,l=s.length-1,brace_depth=0,got_hash=false,start=1,c;
i<l;
 ++i)if(brace_depth)if( (c=s.charAt(i) ) === '}' ) --brace_depth|| (pieces.push(s.substring(start,i) ) ,is_code.push(true) ) && (start=i+1) ,got_hash=false;
else brace_depth+=c=== '{' ;
else if( (c=s.charAt(i) ) === '#' )got_hash=true;
else if(c=== '{' &&got_hash)pieces.push(s.substring(start,i-1) ) ,is_code.push(false) ,start=i+1, ++brace_depth;
else got_hash=false;
pieces.push(s.substring(start,l) ) ,is_code.push(false) ;
for(var quoted=new RegExp( '\\\\' +q, 'g' ) ,i=0,l=pieces.length;
i<l;
 ++i)pieces[i] =is_code[i] ?this($.parse(pieces[i] .replace(quoted,q) ) .as( '(' ) ) :new syntax(q+pieces[i] +q) ;
return new syntax( '+' ,pieces) .unflatten() .as( '(' ) } ;
var function_local_template=$.parse( 'var _x = _y' ) ,function_bind_pattern=$.parse( '_x = _y' ) ,function_result_pattern=$.parse( 'result' ) ,function_with_afters=$.parse( 'function (_formals) {_befores; var result = _result; _afters; return result}' ) ,function_without_afters=$.parse( 'function (_formals) {_befores; return _result}' ) ,function_assignment_template=$.parse( '_f = _x' ) ,function_is_result=function(n) {return n.is_empty() &&n.data=== 'result' } ,function_destructure=$.rereplacer( '_f(_xs) = _y' ,function(match) {for(var formals= [ ] ,befores= [ ] ,afters= [ ] ,ps=match._xs.flatten( ',' ) ,i=0,l=ps.length;
i<l;
 ++i) (afters.length||ps[i] .contains(function_is_result) ?afters:befores.length||ps[i] .length?befores:formals) .push(ps[i] ) ;
for(var contains_locals= [befores,afters] ,i=0,l=contains_locals.length;
i<l;
 ++i)for(var xs=contains_locals[i] ,j=0,lj=xs.length,m;
j<lj;
 ++j)xs[j] = (m=function_bind_pattern.match(xs[j] ) ) &&m._x.is_empty() ?function_local_template.replace(m) :xs[j] .as( '(' ) ;
var new_formals=formals.length?new $.syntax( ',' ,formals) .unflatten() :$.empty,new_befores=befores.length?new $.syntax( ';' ,befores) .unflatten() :$.empty,new_afters=afters.length?new $.syntax( ';' ,afters) .unflatten() :$.empty,template=function_assignment_template.replace( {_f:match._f,_x:afters.length?function_with_afters:function_without_afters} ) ;
return template.replace( {_formals:new_formals,_befores:new_befores,_afters:new_afters,_result:match._y} ) } ) ;
var infix_function=function(node) {var d=node.data,left,fn;
if( (d=== '/' ||d=== '|' ) && (left=node[0] ) .data===d&&left[1] &&left[1] .data=== 'u-' && (fn=left[1] [0] ) )return new $.syntax( '()' ,fn,this(node[0] [0] ) .flatten(d) .push(this(node[1] ) ) .with_data( ',' ) .unflatten() ) } ;
var infix_method=function(node) {var d=node.data,left,fn;
if( (d=== '/' ||d=== '|' ) && (left=node[0] ) .data===d&&left[1] &&left[1] .data=== 'u~' && (fn=left[1] [0] ) ) {var xs= [ ] .slice.call(this(node[0] [0] ) .flatten(d) ) ,object=xs.shift() ;
return new $.syntax( '()' ,new $.syntax( '.' ,new $.syntax( '(' ,object) ,fn) ,new $.syntax( ',' ,xs,this(node[1] ) ) .unflatten() ) } } ;
var postfix_function_template=$.parse( '_f(_x)' ) ,postfix_function=$.rereplacer( '_x /!_f' ,function(match) {return postfix_function_template.replace( {_f:match._f,_x:this(match._x) .flatten( '/' ) .with_data( ',' ) .unflatten() } ) } ) ;
var modified_literal_form=$.pattern( '_literal._modifier' ) ,lookup_literal_modifier=function(caterwaul,type,modifier) {var hash=caterwaul.literal_modifiers[type] ;
return hash.hasOwnProperty(modifier) &&hash[modifier] } ,literal_modifier=function(node) {var modified_literal=modified_literal_form.call(this,node) ,literal,expander;
if(modified_literal&& (literal=modified_literal._literal) && (expander=literal.is_identifier() ?lookup_literal_modifier(this, 'identifier' ,modified_literal._modifier.data) :literal.is_array() ?lookup_literal_modifier(this, 'array' ,modified_literal._modifier.data) :literal.is_regexp() ?lookup_literal_modifier(this, 'regexp' ,modified_literal._modifier.data) :literal.is_number() ?lookup_literal_modifier(this, 'number' ,modified_literal._modifier.data) :literal.is_string() ?lookup_literal_modifier(this, 'string' ,modified_literal._modifier.data) :null) )return expander.call(this,literal) } ;
var bracket_modifier_form=$.pattern( '_modifier[_expression]' ) ,slash_modifier_form=$.pattern( '_expression /_modifier' ) ,minus_modifier_form=$.pattern( '_expression -_modifier' ) ,in_modifier_form=$.pattern( '_modifier in _expression' ) ,pipe_modifier_form=$.pattern( '_expression |_modifier' ) ,comma_modifier_form=$.pattern( '_expression, _modifier' ) ,dot_parameters=$.pattern( '_modifier._parameters' ) ,bracket_parameters=$.pattern( '_modifier[_parameters]' ) ,parameterized_wickets=$.pattern( '_expression <_modifier> _parameters' ) ,parameterized_minus=$.pattern( '_expression -_modifier- _parameters' ) ,modifier=function(node) {var modifier,parameterized_match=parameterized_wickets.call(this,node) ||parameterized_minus.call(this,node) ;
if(parameterized_match&&this.parameterized_modifiers.hasOwnProperty(modifier=parameterized_match._modifier.data) ) {var r=this.parameterized_modifiers[modifier] .call(this,parameterized_match) ;
if(r)return r}var regular_match=bracket_modifier_form.call(this,node) ||slash_modifier_form.call(this,node) ||minus_modifier_form.call(this,node) ||in_modifier_form.call(this,node) ||pipe_modifier_form.call(this,node) ||comma_modifier_form.call(this,node) ;
if(regular_match) {var parameter_match=dot_parameters.call(this,regular_match._modifier) ||bracket_parameters.call(this,regular_match._modifier) ;
if(parameter_match) {regular_match._modifier=parameter_match._modifier;
regular_match._parameters=parameter_match._parameters;
return this.parameterized_modifiers.hasOwnProperty(modifier=regular_match._modifier.data) &&this.parameterized_modifiers[modifier] .call(this,regular_match) }else return this.modifiers.hasOwnProperty(modifier=regular_match._modifier.data) &&this.modifiers[modifier] .call(this,regular_match) } } ;
var each_node=function(node) {return string_interpolator.call(this,node) ||literal_modifier.call(this,node) ||node.length&& (modifier.call(this,node) ||function_destructure.call(this,node) ||infix_function.call(this,node) ||infix_method.call(this,node) ||postfix_function.call(this,node) ) } ,result=macroexpander?$(function(node) {return macroexpander.call(this,node) ||each_node.call(this,node) } ) :$(each_node) ;
result.modifiers= { } ;
result.parameterized_modifiers= { } ;
result.literal_modifiers= {regexp: { } ,array: { } ,string: { } ,number: { } ,identifier: { } } ;
return result} } ) ;

caterwaul.module( 'std.js-literals' ,function($) {$.js_literals=function(caterwaul_function) {var function_template=$.parse( 'function (_) {return _body}' ) ;
 (function(r) {r.x=$.reexpander(function(node) {return node.with_data(node.data.replace( /\s+/g , '' ) ) } ) ;
var call_exec_template=$.parse( '_regexp.exec(_)' ) ;
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
s.qs=function(node) {return new $.ref($.parse(node.as_unescaped_string() ) ) } ;
s.qf=$.reexpander(function(node) {return function_template.replace( {_body:$.parse(node.as_unescaped_string() ) } ) } ) } ) (caterwaul_function.literal_modifiers.string) ;
return caterwaul_function} } ) ;

caterwaul.module( 'std.words' ,function($) {var scope_template=$.parse( '(function () {var _variables; return (_expression)}).call(this)' ) ,trivial_node_template=$.parse( 'new caterwaul.syntax(_data)' ) ,nontrivial_node_template=$.parse( 'new caterwaul.syntax(_data, _xs)' ) ;
$.words=function(caterwaul_function) {$.merge(caterwaul_function.modifiers,$.words.modifiers) ;
$.merge(caterwaul_function.parameterized_modifiers,$.words.parameterized_modifiers) ;
return caterwaul_function} ;
$.syntax_to_expression=function(tree) {if(tree.length) {for(var comma=new $.syntax( ',' ) ,i=0,l=tree.length;
i<l;
 ++i)comma.push($.syntax_to_expression(tree[i] ) ) ;
return nontrivial_node_template.replace( {_data: '"' +tree.data.replace( /"/g , '\\"' ) .replace( /\n/g , '\\n' ) + '"' ,_xs:comma.unflatten() } ) }else return trivial_node_template.replace( {_data: '"' +tree.data.replace( /"/g , '\\"' ) .replace( /\n/g , '\\n' ) + '"' } ) } ;
$.words.modifiers= {qs:function(match) {return new $.expression_ref($.syntax_to_expression(match._expression) , 'qs' ) } ,qse:function(match) {return new $.expression_ref($.syntax_to_expression(this(match._expression) ) , 'qse' ) } ,reexpand:function(match) {return this(this(match._expression) ) } ,noexpand:function(match) {return match._expression} ,raise:$.reexpander( '(function () {throw _expression}).call(this)' ) ,eval:function(match) {return new $.ref($.compile(this(match._expression) ) , 'eval' ) } ,delay:$.reexpander( '(function (t, f) {return (function () {return f.call(t)})})(this, (function () {return _expression}))' ) ,lazy:$.reexpander( '(function (t, f, v, vc) {return (function () {return vc ? v : (vc = true, v = f.call(t))})})(this, (function () {return _expression}))' ) ,capture:function(match) {for(var comma=new $.syntax( ',' ) ,bindings=match._expression.flatten( ',' ) ,i=0,l=bindings.length;
i<l;
 ++i)comma.push(this(bindings[i] ) .with_data( ':' ) ) ;
return new $.syntax( '{' ,comma.unflatten() ) } ,wcapture:function(match) {for(var e=this(match._expression) ,comma=new $.syntax( ',' ) ,bindings=e.flatten( ',' ) ,node,i=0,l=bindings.length;
i<l;
 ++i) (node=this(bindings[i] ) ) [1] =node[0] ,comma.push(node.with_data( ':' ) ) ;
return scope_template.replace( {_variables:e,_expression:new $.syntax( '{' ,comma.unflatten() ) } ) } } ;
$.words.parameterized_modifiers= {given:$.reexpander( '(function (_parameters) {return _expression})' ) ,bgiven:$.reexpander( '(function (t, f) {return (function () {return f.apply(t, arguments)})})(this, (function (_parameters) {return _expression}))' ) ,rescue:$.reexpander( '(function () {try {return (_expression)} catch (e) {return (_parameters)}}).call(this)' ) ,se:$.reexpander( '(function (it) {return (_parameters), it}).call(this, (_expression))' ) ,re:$.reexpander( '(function (it) {return (_parameters)}).call(this, (_expression))' ) ,where:$.reexpander( '(function () {var _parameters; return (_expression)}).call(this)' ) ,using:$.reexpander(function(match) {var m=this(match._parameters) ,o=$.compile(m) ,comma=new $.syntax( ',' ) ,expression_ref=new $.expression_ref(m) ;
for(var k in o)Object.prototype.hasOwnProperty.call(o,k) && /^[_$a-zA-Z][_$0-9a-zA-Z]*$/ .test(k) && !this.modifiers.hasOwnProperty(k) && !this.parameterized_modifiers.hasOwnProperty(k) &&comma.push(new $.syntax( '=' ,k,new $.syntax( '.' ,expression_ref,k) ) ) ;
return scope_template.replace( {_variables:comma.unflatten() ,_expression:match._expression} ) } ) ,when:$.reexpander( '((_parameters) && (_expression))' ) ,and:$.reexpander( '((_expression) && (_parameters))' ) ,unless:$.reexpander( '(! (_parameters) && (_expression))' ) ,or:$.reexpander( '((_expression) || (_parameters))' ) } } ) ;


// Libraries.
// These apply more advanced syntactic transforms to the code and can depend on everything above.

caterwaul.module( 'std.seq' ,function($) { (function( ) {var anon=$.anonymizer( 'S' ) ,rule=function(p,e) {;
return $.rereplacer(p.constructor===String?anon(p) :p,e.constructor===String?anon(e) :e) } ,operator_macros= (function( ) {var loop_anon=$.anonymizer( 'x' , 'y' , 'i' , 'j' , 'l' , 'lj' , 'r' , 'o' , 'k' ) ,scope=anon( '(function (_xs) {var _x, _x0, _xi, _xl, _xr; _body}).call(this, S[_s])' ) ,scoped=function( /* unary , node */t) {;
return scope.replace( {_body:t} ) } ,expand=function( /* unary , node */s) {;
return s.replace( /@/g , 'Array.prototype.slice.call' ) .replace( /#/g , 'Object.prototype.hasOwnProperty.call' ) .replace( /%%/g , '.constructor' ) } ,form=function( /* unary , node */x) {;
return loop_anon( /* unary , node */scoped( /* unary , node */anon( /* unary , node */expand( /* unary , node */x) ) ) ) } ,map=form( 'for (var _xr = new _xs%%(), _xi = 0, _xl = _xs.length; _xi < _xl; ++_xi) _x = _xs[_xi], _xr.push((_f));               return _xr' ) ,each=form( 'for (var                    _xi = 0, _xl = _xs.length; _xi < _xl; ++_xi) _x = _xs[_xi], (_f);                         return _xs' ) ,flatmap=form( 'for (var _xr = new _xs%%(), _xi = 0, _xl = _xs.length; _xi < _xl; ++_xi) _x = _xs[_xi], _xr.push.apply(_xr, @((_f))); return _xr' ) ,iterate=form( 'for (var _x = _xs, _xi = 0, _x0, _xl;              _x0 = (_init); ++_xi) _x = (_f);                                   return _x' ) ,filter=form( 'for (var _xr = new _xs%%(), _xi = 0, _xl = _xs.length, _x0;     _xi < _xl; ++_xi) _x = _xs[_xi], (_f) && _xr.push(_x);        return _xr' ) ,filter_not=form( 'for (var _xr = new _xs%%(), _xi = 0, _xl = _xs.length, _x0;     _xi < _xl; ++_xi) _x = _xs[_xi], (_f) || _xr.push(_x);        return _xr' ) ,map_filter=form( 'for (var _xr = new _xs%%(), _xi = 0, _xl = _xs.length, _x0, _y; _xi < _xl; ++_xi) _x = _xs[_xi], (_y = (_f)) && _xr.push(_y); return _xr' ) ,imap_filter=form( 'for (var _xr = new _xs%%(), _xi = 0, _xl = _xs.length, _x0; _xi < _xl; ++_xi) _x = _xs[_xi], (_x0 = (_init)) && _xr.push(_f); return _xr' ) ,foldl=form( 'for (var _x0 = _xs[0], _xi = 1, _xl = _xs.length;            _xi < _xl; ++_xi) _x = _xs[_xi], _x0 = (_f); return _x0' ) ,foldr=form( 'for (var _xl = _xs.length, _xi = _xl - 2, _x0 = _xs[_xl - 1]; _xi >= 0; --_xi) _x = _xs[_xi], _x0 = (_f); return _x0' ) ,unfold=form( 'for (var _xr = [], _x = _xs, _xi = 0;                      _x !== null; ++_xi) _xr.push(_x), _x = (_f);   return _xr' ) ,ifoldl=form( 'for (var _x0 = (_init), _xi = 0, _xl = _xs.length;      _xi < _xl; ++_xi) _x = _xs[_xi], _x0 = (_f);     return _x0' ) ,ifoldr=form( 'for (var _xl = _xs.length - 1, _xi = _xl, _x0 = (_init); _xi >= 0; --_xi) _x = _xs[_xi], _x0 = (_f);     return _x0' ) ,iunfold=form( 'for (var _xr = [], _x = _xs, _xi = 0, _x0;          _x0 = (_init); ++_xi) _xr.push(_x), _x = (_f);       return _xr' ) ,exists=form( 'for (var _x = _xs[0], _xi = 0, _xl = _xs.length, x; _xi < _xl; ++_xi) {_x = _xs[_xi]; if (x = (_f)) return x} return false' ) ,not_exists=form( 'for (var _x = _xs[0], _xi = 0, _xl = _xs.length, x; _xi < _xl; ++_xi) {_x = _xs[_xi]; if (x = (_f)) return false} return true' ) ,concat=anon( '(S[_xs]).concat((S[_ys]))' ) ,zip=form( 'for (var _xr = (S[_ys]), pairs = [], i = 0, l = _xs.length; i < l; ++i) pairs.push([_xs[i], _xr[i]]); return pairs' ) ,cross=form( 'for (var _xr = (S[_ys]), pairs = [], i = 0, l = _xs.length, lj = _xr.length; i < l; ++i) ' + 'for (var j = 0; j < lj; ++j) pairs.push([_xs[i], _xr[j]]);' + 'return pairs' ) ,kmap=form( 'var _xr = new _xs%%();  for (var _x in _xs) if (#(_xs, _x)) _xr[_f] = _xs[_x]; return _xr' ) ,keach=form( '                        for (var _x in _xs) if (#(_xs, _x)) _f;                return _xs' ) ,kfilter=form( 'var _xr = new _xs%%();    for (var _x in _xs) if (#(_xs, _x) &&      (_f))  _xr[_x] = _xs[_x]; return _xr' ) ,kfilter_not=form( 'var _xr = new _xs%%();    for (var _x in _xs) if (#(_xs, _x) &&    ! (_f))  _xr[_x] = _xs[_x]; return _xr' ) ,kmap_filter=form( 'var _xr = new _xs%%(), x; for (var _x in _xs) if (#(_xs, _x) && (x = (_f))) _xr[x]  = _xs[_x]; return _xr' ) ,vmap=form( 'var _xr = new _xs%%();    for (var  k in _xs) if (#(_xs, k)) _x = _xs[k], _xr[k] = (_f); return _xr' ) ,veach=form( '                          for (var  k in _xs) if (#(_xs, k)) _x = _xs[k], _f;            return _xs' ) ,vfilter=form( 'var _xr = new _xs%%();    for (var  k in _xs) if (#(_xs, k)) _x = _xs[k],        (_f) && (_xr[k] = _x); return _xr' ) ,vfilter_not=form( 'var _xr = new _xs%%();    for (var  k in _xs) if (#(_xs, k)) _x = _xs[k],        (_f) || (_xr[k] = _x); return _xr' ) ,vmap_filter=form( 'var _xr = new _xs%%(), x; for (var  k in _xs) if (#(_xs, k)) _x = _xs[k], x = (_f), x && (_xr[k] =  x); return _xr' ) ;
return( (function( ) {var unrecognized=function( /* unary , node */reason) {;
return(function( ) {throw new Error(reason) } ) .call(this) } ,use_form=function(form,xs,body,init,vars) {;
return form?form.replace( {_f:body,_init:init} ) .replace($.merge( {_s:xs} ,vars) ) :unrecognized( ( 'unsupported sequence operator or modifiers used on ' + (body) + '' ) ) } ,operator_case=function( /* unary , node */forms) {;
return function( /* unary , node */match) {;
return(function( ) {var xs=match._xs,expander=this,form_function=function( /* unary , node */form) {;
return function(body,vars) {;
return use_form(form,xs,body,null,vars) } } ,iform_function=function( /* unary , node */form) {;
return function(body,init,vars) {;
return use_form(form,xs,body,init,vars) } } ,use=function(form,iform) {;
return function( /* unary , node */body) {;
return parse_body(body,expander,form_function(form) ,iform_function(iform) ) } } ;
return(parse_modifiers(match._thing,use(forms.normal,forms.inormal) ,use(forms.bang,forms.ibang) ,use(forms.tbang,forms.itbang) ) ) } ) .call(this) } } ,handle_map_forms=operator_case( {normal:map,bang:each,tbang:flatmap,itbang:iterate} ) ,handle_filter_forms=operator_case( {normal:filter,bang:filter_not,tbang:map_filter,itbang:imap_filter} ) ,handle_fold_forms=operator_case( {normal:foldl,bang:foldr,tbang:unfold,inormal:ifoldl,ibang:ifoldr,itbang:iunfold} ) ,handle_kmap_forms=operator_case( {normal:kmap,bang:keach} ) ,handle_kfilter_forms=operator_case( {normal:kfilter,bang:kfilter_not,tbang:kmap_filter} ) ,handle_vmap_forms=operator_case( {normal:vmap,bang:veach} ) ,handle_vfilter_forms=operator_case( {normal:vfilter,bang:vfilter_not,tbang:vmap_filter} ) ,handle_exists_forms=operator_case( {normal:exists,bang:not_exists} ) ,block=anon( '[_x]' ) ,block_with_variable=anon( '_var[_x]' ) ,block_with_init=anon( '[_init][_x]' ) ,block_with_variable_and_init=anon( '_var[_init][_x]' ) ,block_with_closure=anon( '+_x' ) ,block_with_seq=anon( '~_x' ) ,standard_names= {_x: 'x' ,_x0: 'x0' ,_xi: 'xi' ,_xl: 'xl' ,_xs: 'xs' ,_xr: 'xr' } ,prefixed_names=function( /* unary , node */p) {;
return{_x:p,_x0: ( '' + (p) + '0' ) ,_xi: ( '' + (p) + 'i' ) ,_xl: ( '' + (p) + 'l' ) ,_xs: ( '' + (p) + 's' ) ,_xr: ( '' + (p) + 'r' ) } } ,function_promotion=anon( '(_f).call({_x0: _x0, _xi: _xi, _xl: _xl, _xs: _xs, _xr: _xr}, _x)' ) ,promote_function=function( /* unary , node */f) {;
return function_promotion.replace( {_f:f} ) } ,closure_wrapper=anon( '(function (_x, _x0, _xi, _xl, _xs, _xr) {return _f}).call(this, _x, _x0, _xi, _xl, _xs, _xr)' ) ,close_body=function(vars,f) {;
return closure_wrapper.replace(vars) .replace( {_f:f} ) } ,seq_pattern=anon( 'S[_x]' ) ,promote_seq=function( /* unary , node */f) {;
return seq_pattern.replace( {_x:f} ) } ,parse_body=function(tree,expand,normal,init) {;
return(function( ) {var in_sequence_context=function( /* unary , node */f) {;
return expand.call(expand,promote_seq(f) ) } ,sequence_context_normal=function(f,names) {;
return normal(in_sequence_context(f) ,names) } ,sequence_context_init=function(f,init_expression,names) {;
return init(in_sequence_context(f) ,init_expression,names) } ,wrapping_normal=function(f,names) {;
return normal(close_body(names,f) ,names) } ,wrapping_init=function(f,init_expression,names) {;
return init(close_body(names,f) ,init_expression,names) } ,r=null;
return( ( (r=block_with_seq.match(tree) ) ?parse_body(r._x,expand,sequence_context_normal,sequence_context_init) : (r=block_with_closure.match(tree) ) ?parse_body(r._x,expand,wrapping_normal,wrapping_init) : (r=block_with_variable_and_init.match(tree) ) ?init(r._x,r._init,prefixed_names(r._var) ) : (r=block_with_init.match(tree) ) ?init(r._x,r._init,standard_names) : (r=block_with_variable.match(tree) ) ?normal(r._x,prefixed_names(r._var) ) : (r=block.match(tree) ) ?normal(r._x,standard_names) :normal(promote_function(tree) ,standard_names) ) ) } ) .call(this) } ,tbang_modifier=anon( '~!_x' ) ,bang_modifier=anon( '!_x' ) ,parse_modifiers=function(tree,normal,bang,tbang) {;
return(function( ) {var result=null;
return( ( (result=tbang_modifier.match(tree) ) ?tbang(result._x) : (result=bang_modifier.match(tree) ) ?bang(result._x) :normal(tree) ) ) } ) .call(this) } ;
return( [rule( 'S[_x]' , '_x' ) ,rule( 'S[_xs + _ys]' ,concat) ,rule( 'S[_xs ^ _ys]' ,zip) ,rule( 'S[_xs - _ys]' ,cross) ,rule( 'S[(_x)]' , '(S[_x])' ) ,rule( 'S[_x[_y]]' , 'S[_x][_y]' ) ,rule( 'S[_xs(_ys)]' , 'S[_xs](_ys)' ) ,rule( 'S[[_x]]' , '[_x]' ) ,rule( 'S[_x, _y]' , 'S[_x], S[_y]' ) ,rule( 'S[_xs._p]' , 'S[_xs]._p' ) ,rule( 'S[~[_x]]' , '[S[_x]]' ) ,rule( 'S[~_xs(_ys)]' , 'S[_xs](S[_ys])' ) ,rule( 'S[_x ? _y : _z]' , '(S[_x]) ? (S[_y]) : (S[_z])' ) ,rule( 'S[_x && _y]' , '(S[_x]) && (S[_y])' ) ,rule( 'S[_x || _y]' , '(S[_x]) || (S[_y])' ) ,rule( 'S[+_xs]' , 'Array.prototype.slice.call((_xs))' ) ,rule( 'S[_xs %_thing]' ,handle_filter_forms) ,rule( 'S[_xs *_thing]' ,handle_map_forms) ,rule( 'S[_xs /_thing]' ,handle_fold_forms) ,rule( 'S[_xs |_thing]' ,handle_exists_forms) ,rule( 'S[_xs %k*_thing]' ,handle_kmap_forms) ,rule( 'S[_xs %v*_thing]' ,handle_vmap_forms) ,rule( 'S[_xs %k%_thing]' ,handle_kfilter_forms) ,rule( 'S[_xs %v%_thing]' ,handle_vfilter_forms) ] ) } ) .call(this) ) } ) .call(this) ,word_macros= (function( ) {var n=function( /* unary , node */match) {;
return n_pattern.replace($.merge( {_l: '0' ,_step: '1' } ,match) ) } ,ni=function( /* unary , node */match) {;
return ni_pattern.replace($.merge( {_l: '0' ,_step: '1' } ,match) ) } ,n_pattern=anon( '(function (i, u, s) {if ((u - i) * s <= 0) return [];' + 'for (var r = [], d = u - i; d > 0 ? i <  u : i >  u; i += s) r.push(i); return r})((_l), (_u), (_step))' ) ,ni_pattern=anon( '(function (i, u, s) {if ((u - i) * s <= 0) return [];' + 'for (var r = [], d = u - i; d > 0 ? i <= u : i >= u; i += s) r.push(i); return r})((_l), (_u), (_step))' ) ,scope=anon( '(function (o) {_body}).call(this, (S[_o]))' ) ,scoped=function( /* unary , node */t) {;
return scope.replace( {_body:t} ) } ,form=function( /* unary , node */p) {;
return(function( ) {var tree=scoped(anon(p) ) ;
return( (function(match) {return tree.replace(match) } ) ) } ) .call(this) } ,keys=form( 'var ks = []; for (var k in o) Object.prototype.hasOwnProperty.call(o, k) && ks.push(k); return ks' ) ,values=form( 'var vs = []; for (var k in o) Object.prototype.hasOwnProperty.call(o, k) && vs.push(o[k]); return vs' ) ,pairs=form( 'var ps = []; for (var k in o) Object.prototype.hasOwnProperty.call(o, k) && ps.push([k, o[k]]); return ps' ) ,object=form( 'for (var r = {}, i = 0, l = o.length, x; i < l; ++i) x = o[i], r[x[0]] = x[1]; return r' ) ,mobject=form( 'for (var r = {}, i = 0, l = o.length, x; i < l; ++i) x = o[i], (r[x[0]] || (r[x[0]] = [])).push(x[1]); return r' ) ;
return( [rule( 'S[n[_u]]' ,n) ,rule( 'S[ni[_u]]' ,ni) ,rule( 'S[_o /keys]' ,keys) ,rule( 'S[_o |object]' ,object) ,rule( 'S[_o /mobject' ,mobject) ,rule( 'S[n[_l, _u]]' ,n) ,rule( 'S[ni[_l, _u]]' ,ni) ,rule( 'S[_o /values]' ,values) ,rule( 'S[_o -object]' ,object) ,rule( 'S[_o -mobject' ,mobject) ,rule( 'S[n[_l, _u, _step]]' ,n) ,rule( 'S[ni[_l, _u, _step]]' ,ni) ,rule( 'S[_o /pairs]' ,pairs) ,rule( 'S[_o /object]' ,object) ,rule( 'S[_o |mobject' ,mobject) ] ) } ) .call(this) ;
return($.seq=function( /* unary , node */caterwaul_function) {;
return(function( ) {var anon_pattern=anon( 'S[_x]' ) ,seq_expand=$($.alternatives(operator_macros.concat(word_macros) ) ) ;
return( (function(it) {return(it.modifiers.seq=function( /* unary , node */match) {;
return(function(it) {return( ( (it) && (this(it) ) ) ) } ) .call(this, (seq_expand.call(seq_expand,anon_pattern.replace( {_x:match._expression} ) ) ) ) } ) ,it} ) .call(this, (caterwaul_function) ) ) } ) .call(this) } ) } ) .call(this) } ) ;


  caterwaul.module('std', function ($) {$.js_all = function () {return this('js js_literals words seq')}});

// Generated by SDoc 
