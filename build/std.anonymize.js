caterwaul.module( 'std.anon' ,function($) {$.anonymizer=function() {var xs=arguments;
return(function() {var table= (function(o) {for(var r= {} ,i=0,l=o.length,x;
i<l;
 ++i)x=o[i] ,r[x[0] ] =x[1] ;
return r} ) .call(this, ( (function(xs) {var x,x0,xi,xl,xr;
for(var xr=new xs.constructor() ,xi=0,xl=xs.length;
xi<xl;
 ++xi)x=xs[xi] ,xr.push( ( [x,$.gensym(x) ] ) ) ;
return xr} ) .call(this, (function(xs) {var x,x0,xi,xl,xr;
for(var xr=new xs.constructor() ,xi=0,xl=xs.length;
xi<xl;
 ++xi)x=xs[xi] ,xr.push.apply(xr,Array.prototype.slice.call( (x.constructor===Array?x
:x.split( ' ' ) ) ) ) ;
return xr} ) .call(this,Array.prototype.slice.call( (xs) ) ) ) ) ) ;
return(function(_) {return function() {return unescape_string(this.as_escaped_string() ) } } ) } ) .call(this) } } ) ;
