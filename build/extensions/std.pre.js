 (function($) {$.anonymizer=function( ) {for(var translation_table= { } ,i=0,l=arguments.length;
i<l;
 ++i)translation_table[arguments[i] ] =$.gensym() ;
return function(node) {return $.ensure_syntax(node) .replace(translation_table) } } } ) (caterwaul) ;
 (function($) {var loop_anon=$.anonymizer( 'i' , 'l' , 'xs' , 'result' ) ;
$.word_macros=function(language) {return[language.modifier( 'qs' ,function(match) {return new $.ref(match._expression) } ) ,language.modifier( 'qse' ,function(match) {return new $.ref(this.expand(match._expression) ) } ) ,language.modifier( 'wobbly' , 'chuck' , '(function () {throw _expression}).call(this)' ) ,language.parameterized_modifier( 'failover' , 'safely' , '(function () {try {return (_expression)} catch (e) {return (_parameters)}}).call(this)' ) ,language.parameterized_modifier( 'given' , 'from' , 'fn' , '(function (_parameters) {return _expression})' ) ,language.parameterized_modifier( 'bgiven' , 'bfrom' , 'fb' , '(function (t, f) {return (function () {return f.apply(t, arguments)})})(this, (function (_parameters) {return _expression}))' ) ,language.parameterized_modifier( 'effect' , 'se' , '(function (it) {return (_parameters), it}).call(this, (_expression))' ) ,language.parameterized_modifier( 'then' , 're' , 'returning' , '(function (it) {return (_parameters)}).call(this, (_expression))' ) ,language.parameterized_modifier( 'where' , 'bind' , '(function () {var _parameters; return (_expression)}).call(this)' ) ,language.parameterized_modifier( 'when' , '((_parameters) && (_expression))' ) ,language.parameterized_modifier( 'unless' , '(! (_parameters) && (_expression))' ) ,language.parameterized_modifier( 'otherwise' , '((_expression) || (_parameters))' ) ,language.parameterized_modifier( 'when_defined' , '((_parameters) != null && (_expression))' ) ,language.parameterized_modifier( 'unless_defined' , '((_parameters) == null && (_expression))' ) ,language.parameterized_modifier( 'over' ,loop_anon( '(function () {for (var xs = (_parameters), result = [], i = 0, l = xs.length, it; i < l; ++i)' + 'it = xs[i], result.push(_expression); return result}).call(this)' ) ) ,language.parameterized_modifier( 'over_keys' ,loop_anon( '(function () {var x = (_parameters), result = []; ' + 'for (var it in x) Object.prototype.hasOwnProperty.call(x, it) && result.push(_expression); return result}).call(this)' ) ) ,language.parameterized_modifier( 'over_values' ,loop_anon( '(function () {var x = (_parameters), result = [], it; ' + 'for (var k in x) Object.prototype.hasOwnProperty.call(x, k) && (it = x[k], result.push(_expression));' + 'return result}).call(this)' ) ) ,language.parameterized_modifier( 'until' ,loop_anon( '(function () {var result = []; while (! (_parameters)) result.push(_expression); return result}).call(this)' ) ) ] } } ) (caterwaul) ;
 (function($) {$.js=function( ) {var macro=function(name,expander) {return function(template) {return $.macro($.parse(template) .replace( {_modifiers:$.parse(name) } ) ,expander) } } ;
var macros=function(name,expander) {return function(template) {return result.modifier($.parse(template) .replace( {_modifiers:$.parse(name) } ) ,expander) } } ;
var result= {modifier:this.right_variadic(function(name,expander) {return $.map(macro(name,expander) , [ '_expression /_modifiers' , '_expression -_modifiers' , '_expression |_modifiers' , '_modifiers[_expression]' , '_modifiers in _expression' , '_expression, _modifiers' ] ) } ) ,parameterized_modifier:this.right_variadic(function(name,expander) {return[$.map(macros(name,expander) , [ '_modifiers[_parameters]' , '_modifiers._parameters' ] ) ,$.map(macro(name,expander) , [ '_expression <_modifiers> _parameters' , '_expression -_modifiers- _parameters' ] ) ] } ) ,macros: [function(node) {var s=node.data,q=s.charAt(0) ,syntax=$.syntax;
if(q!== '\'' &&q!== '"' || ! /#\{[^\}]+\}/ .test(s) )return false;
for(var pieces= [ ] ,i=1,l=s.length-1,brace_depth=0,got_hash=false,start=1,c;
i<l;
 ++i)if(brace_depth)if( (c=s.charAt(i) ) === '}' ) --brace_depth||pieces.push(s.substring(start,i) ) && (start=i+1) ,got_hash=false;
else brace_depth+=c=== '{' ;
else if( (c=s.charAt(i) ) === '#' )got_hash=true;
else if(c=== '{' &&got_hash)pieces.push(s.substring(start,i-1) ) ,start=i+1, ++brace_depth;
else got_hash=false;
pieces.push(s.substring(start,l) ) ;
for(var quoted=new RegExp( '\\\\' +q, 'g' ) ,i=0,l=pieces.length;
i<l;
 ++i)pieces[i] =i&1?this.expand($.parse(pieces[i] .replace(quoted,q) ) .as( '(' ) ) :new syntax(q+pieces[i] +q) ;
return new syntax( '+' ,pieces) .unflatten() .as( '(' ) } ,this.macro( '_left(_args) = _right' , '_left = (function (_args) {return _right})' ) ,this.macro( '_left(_var = arguments) = _right' , '_left = (function () {var _var = arguments; return _right})' ) ] } ;
return result} } ) (caterwaul) ;
caterwaul.js_base=function( ) {var js=this.js() ;
return this.clone() .macros(this.word_macros(js) ,js.macros) } ;
caterwaul.js_base() (caterwaul.precompiled_internal( (function( ) {null;
return(function($) {$.seq_macro= (function(language) {return language.modifier( 'seq' , (function( ) {var seq_expand=$.seq() ;
return( (function(tree) {return this.expand(seq_expand(tree._expression) ) } ) ) } ) .call(this) ) } ) ;
$.seq= (function() {return(function( ) {var anon=$.anonymizer( 'S' ) ,rule= (function(p,e) {return $.macro(anon(p) ,e.constructor===Function? (function(match) {return this.expand(e.call(this,match) ) } ) :anon(e) ) } ) ,operator_macros= (function( ) {var operator_pattern= (function(op,normal,bang,tbang) {return(function( ) {var template= (function(p) {return anon(p) .replace( { '+' :op} ) } ) ,trule= (function(p,e) {return rule(template(p) ,e.constructor===Function?e:template(e) ) } ) ,context_conversions= [trule( 'S[_xs +~[_f]]' , 'S[_xs +[S[_f]]]' ) ,trule( 'S[_xs +~_var[_f]]' , 'S[_xs +_var[S[_f]]]' ) ,trule( 'S[_xs +!~[_f]]' , 'S[_xs +![S[_f]]]' ) ,trule( 'S[_xs +!~_var[_f]]' , 'S[_xs +!_var[S[_f]]]' ) ,trule( 'S[_xs +~!~[_f]]' , 'S[_xs +~![S[_f]]]' ) ,trule( 'S[_xs +~!~_var[_f]]' , 'S[_xs +~!_var[S[_f]]]' ) ] ;
return( (function(it) {return(it.concat(context_conversions) ) } ) .call(this, ( (function(it) {return( ( (tbang) && (it.push(trule( 'S[_xs +~![_f]]' ,tbang) ,trule( 'S[_xs +~!_var[_f]]' ,tbang) ) ) ) ) ,it} ) .call(this, ( (function(it) {return( ( (bang) && (it.push(trule( 'S[_xs +![_f]]' ,bang) ,trule( 'S[_xs +!_var[_f]]' ,bang) ) ) ) ) ,it} ) .call(this, ( (function(it) {return(it.push(trule( 'S[_xs +[_f]]' ,normal) ,trule( 'S[_xs +_var[_f]]' ,normal) ) ) ,it} ) .call(this, ( [ ] ) ) ) ) ) ) ) ) ) } ) .call(this) } ) ,binary_operator= (function(op,f) {return(function( ) {var t= (function(pattern) {return anon(pattern) .replace( { '+' :op} ) } ) ;
return(rule(t( 'S[_xs + _ys]' ) ,f) ) } ) .call(this) } ) ,loop_anon=$.anonymizer( 'xs' , 'ys' , 'x' , 'y' , 'i' , 'j' , 'l' , 'lj' ) ,loop_form= (function(x) {return loop_anon(scoped(anon(x) ) ) } ) ,scope=anon( '(function (xs) {_body}).call(this, S[_xs])' ) ,scoped= (function(tree) {return scope.replace( {_body:tree} ) } ) ,op_form= (function(pattern) {return(function( ) {var form=loop_form(pattern) ;
return( (function(match) {return form.replace(variables_for(match) ) } ) ) } ) .call(this) } ) ,map=op_form( 'for (var ys = [], _xi = 0, _xl = xs.length, _x; _xi < _xl; ++_xi) _x = xs[_xi], ys.push((_f));                  return ys' ) ,each=op_form( 'for (var          _xi = 0, _xl = xs.length, _x; _xi < _xl; ++_xi) _x = xs[_xi], (_f);                           return xs' ) ,flatmap=op_form( 'for (var ys = [], _xi = 0, _xl = xs.length, _x; _xi < _xl; ++_xi) _x = xs[_xi], ys.push.apply(ys, (_f));        return ys' ) ,filter=op_form( 'for (var ys = [], _xi = 0, _xl = xs.length, _x; _xi < _xl; ++_xi) _x = xs[_xi], (_f) && ys.push(_x);            return ys' ) ,filter_not=op_form( 'for (var ys = [], _xi = 0, _xl = xs.length, _x; _xi < _xl; ++_xi) _x = xs[_xi], (_f) || ys.push(_x);            return ys' ) ,map_filter=op_form( 'for (var ys = [], _xi = 0, _xl = xs.length, _x, _y; _xi < _xl; ++_xi) _x = xs[_xi], (_y = (_f)) && ys.push(_y); return ys' ) ,foldl=op_form( 'for (var _x = xs[0], _xi = 1, _xl = xs.length, _x0;            _xi < _xl; ++_xi) _x0 = xs[_xi], _x = (_f);      return _x' ) ,foldr=op_form( 'for (var _xl = xs.length - 1, _xi = _xl - 1, _x0 = xs[_xl], _x; _xi >= 0; --_xi) _x = xs[_xi], _x0 = (_f);      return _x0' ) ,exists=op_form( 'for (var _x = xs[0], _xi = 0, _xl = xs.length, x; _xi < _xl; ++_xi) {_x = xs[_xi]; if (y = (_f)) return y} return false' ) ,concat=op_form( 'return xs.concat(S[_ys])' ) ,zip=op_form( 'for (var ys = S[_ys], pairs = [], i = 0, l = xs.length; i < l; ++i) pairs.push([xs[i], ys[i]]); return pairs' ) ,cross=op_form( 'for (var ys = S[_ys], pairs = [], i = 0, l = xs.length, lj = ys.length; i < l; ++i) ' + 'for (var j = 0; j < lj; ++j) pairs.push([xs[i], ys[j]]);' + 'return pairs' ) ,variables_for= (function(m) {return $.merge( { } ,m,prefixed_hash(m._var) ) } ) ,prefixed_hash= (function(p) {return(function( ) {var name=p&&p.data|| 'x' ;
return( {_x:name,_xi: ( '' + (name) + 'i' ) ,_xl: ( '' + (name) + 'l' ) ,_x0: ( '' + (name) + '0' ) } ) } ) .call(this) } ) ;
return( [rule( 'S[_x]' , '_x' ) ,rule( 'S[_x, _y]' , 'S[_x], S[_y]' ) ,operator_pattern( '|' ,exists) ,operator_pattern( '*' ,map,each,flatmap) ,binary_operator( '+' ,concat) ,operator_pattern( '%' ,filter,filter_not,map_filter) ,binary_operator( '-' ,cross) ,operator_pattern( '/' ,foldl,foldr) ,binary_operator( '^' ,zip) ] ) } ) .call(this) ,word_macros= (function( ) {var n= (function(match) {return n_pattern.replace($.merge( {_lower: '0' ,_step: '1' } ,match) ) } ) ,n_pattern=anon( '(function () {for (var r = [], i = _lower, u = _upper, d = u - i; d > 0 ? i < u : i > u; i += _step) r.push(i); return r})()' ) ,scope=$.parse( '(function () {_body}).call(this)' ) ,scoped= (function(t) {return scope.replace( {_body:t} ) } ) ,form= (function(p) {return(function(match) {return scoped(anon(p) ) .replace(match) } ) } ) ,keys=form( 'var ks = [], o = S[_o]; for (var k in o) Object.prototype.hasOwnProperty.call(o, k) && ks.push(k); return ks' ) ,values=form( 'var vs = [], o = S[_o]; for (var k in o) Object.prototype.hasOwnProperty.call(o, k) && vs.push(o[k]); return vs' ) ,pairs=form( 'var ps = [], o = S[_o]; for (var k in o) Object.prototype.hasOwnProperty.call(o, k) && ps.push([k, o[k]]); return ps' ) ,object=form( 'for (var o = {}, xs = S[_xs], i = 0, l = xs.length, x; i < l; ++i) x = xs[i], o[x[0]] = x[1]; return o' ) ;
return( [rule( 'S[n[_upper]]' ,n) ,rule( 'S[_o /keys]' ,keys) ,rule( 'S[n[_lower, _upper]]' ,n) ,rule( 'S[_o /values]' ,values) ,rule( 'S[n[_lower, _upper, _step]]' ,n) ,rule( 'S[_o /pairs]' ,pairs) ,rule( 'S[_xs |object]' ,object) ] ) } ) .call(this) ;
return( (function(it) {return(it.init_function= (function(tree) {return this.macroexpand(anon( 'S[_x]' ) .replace( {_x:tree} ) ) } ) ) ,it} ) .call(this, ($.clone() .macros(operator_macros,word_macros) ) ) ) } ) .call(this) } ) } ) } ) .call(this) ) ) (caterwaul) ;
caterwaul.js_all=function( ) {var js=this.js() ;
return this.clone() .macros(this.word_macros(js) ,js.macros,this.seq_macro(js) ) } ;
