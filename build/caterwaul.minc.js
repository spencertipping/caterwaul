(function(f){return f(f)})(function(initializer,key,undefined){(function(f){return f(f)})(function(initializer){var calls_init=function(){var f=function(){return f.init.apply(f,arguments)
};return f},original_global=typeof caterwaul==="undefined"?undefined:caterwaul,caterwaul_global=calls_init();caterwaul_global.deglobalize=function(){caterwaul=original_global;
return caterwaul_global};caterwaul_global.core_initializer=initializer;caterwaul_global.merge=(function(o){for(var k in o){if(o.hasOwnProperty(k)){return true}}})({toString:true})?function(o){for(var i=1,l=arguments.length,_;
i<l;++i){if(_=arguments[i]){for(var k in _){if(has(_,k)){o[k]=_[k]}}}}return o}:function(o){for(var i=1,l=arguments.length,_;i<l;++i){if(_=arguments[i]){for(var k in _){if(has(_,k)){o[k]=_[k]
}}if(_.toString&&!/\[native code\]/.test(_.toString.toString())){o.toString=_.toString}}}return o},caterwaul_global.modules=[];caterwaul_global.module=function(name,transform,f){if(arguments.length===1){return caterwaul_global[name+"_initializer"]
}if(!(name+"_initializer" in caterwaul_global)){caterwaul_global.modules.push(name)}f||(f=transform,transform=null);(caterwaul_global[name+"_initializer"]=transform?caterwaul_global(transform)(f):f)(caterwaul_global);
return caterwaul_global};return caterwaul=caterwaul_global});var qw=function(x){return x.split(/\s+/)},se=function(x,f){return f&&f.call(x,x)||x},fail=function(m){throw new Error(m)
},unique=key||(function(){for(var xs=[],d="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789$_",i=21,n;i>=0;--i){xs.push(d.charAt(Math.random()*64>>>0))
}return xs.join("")})(),gensym=(function(c){return function(name){return[name||"",(++c).toString(36),unique].join("_")}})(0),is_gensym=function(s){return s.substr(s.length-22)===unique
},bind=function(f,t){return function(){return f.apply(t,arguments)}},map=function(f,xs){for(var i=0,ys=[],l=xs.length;i<l;++i){ys.push(f(xs[i],i))}return ys},rmap=function(f,xs){return map(function(x){return x instanceof Array?rmap(f,x):f(x)
})},hash=function(s){for(var i=0,xs=qw(s),o={},l=xs.length;i<l;++i){o[xs[i]]=true}return annotate_keys(o)},max_length_key=gensym("hash"),annotate_keys=function(o){var max=0;
for(var k in o){own.call(o,k)&&(max=k.length>max?k.length:max)}o[max_length_key]=max;return o},has=function(o,p){return p!=null&&!(p.length>o[max_length_key])&&own.call(o,p)
},own=Object.prototype.hasOwnProperty,caterwaul_global=caterwaul.merge(caterwaul,{map:map,rmap:rmap,gensym:gensym,is_gensym:is_gensym}),lex_op=hash(". new ++ -- u++ u-- u+ u- typeof u~ u! ! * / % + - << >> >>> < > <= >= instanceof in == != === !== & ^ | && || ? = += -= *= /= %= &= |= ^= <<= >>= >>>= : , return throw case var const break continue void else u; ;"),lex_table=function(s){for(var i=0,xs=[false];
i<8;++i){xs.push.apply(xs,xs)}for(var i=0,l=s.length;i<l;++i){xs[s.charCodeAt(i)]=true}return xs},lex_float=lex_table(".0123456789"),lex_decimal=lex_table("0123456789"),lex_integer=lex_table("0123456789abcdefABCDEFx"),lex_exp=lex_table("eE"),lex_space=lex_table(" \n\r\t"),lex_bracket=lex_table("()[]{}?:"),lex_opener=lex_table("([{?:"),lex_punct=lex_table("+-*/%&|^!~=<>?:;.,"),lex_eol=lex_table("\n\r"),lex_regexp_suffix=lex_table("gims"),lex_quote=lex_table("'\"/"),lex_slash="/".charCodeAt(0),lex_zero="0".charCodeAt(0),lex_postfix_unary=hash("++ --"),lex_ident=lex_table("$_abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"),lex_star="*".charCodeAt(0),lex_back="\\".charCodeAt(0),lex_x="x".charCodeAt(0),lex_dot=".".charCodeAt(0),lex_hash="#".charCodeAt(0),parse_reduce_order=map(hash,["function","( [ . [] ()","new delete","u++ u-- ++ -- typeof u~ u! u+ u-","* / %","+ -","<< >> >>>","< > <= >= instanceof in","== != === !==","&","^","|","&&","||","case","? = += -= *= /= %= &= |= ^= <<= >>= >>>=",":",",","return throw break continue void","var const","if else try catch finally for switch with while do",";"]),parse_associates_right=hash("= += -= *= /= %= &= ^= |= <<= >>= >>>= ~ ! new typeof u+ u- -- ++ u-- u++ ? if else function try catch finally for switch case with while do"),parse_inverse_order=(function(xs){for(var o={},i=0,l=xs.length;
i<l;++i){for(var k in xs[i]){has(xs[i],k)&&(o[k]=i)}}return annotate_keys(o)})(parse_reduce_order),parse_index_forward=(function(rs){for(var xs=[],i=0,l=rs.length,_=null;
_=rs[i],xs[i]=true,i<l;++i){for(var k in _){if(has(_,k)&&(xs[i]=xs[i]&&!has(parse_associates_right,k))){break}}}return xs})(parse_reduce_order),parse_lr=hash("[] . () * / % + - << >> >>> < > <= >= instanceof in == != === !== & ^ | && || = += -= *= /= %= &= |= ^= <<= >>= >>>= , : ;"),parse_r_until_block=annotate_keys({"function":2,"if":1,"do":1,"catch":1,"try":1,"for":1,"while":1,"with":1,"switch":1}),parse_accepts=annotate_keys({"if":"else","do":"while","catch":"finally","try":"catch"}),parse_invocation=hash("[] ()"),parse_r_optional=hash("return throw break continue else"),parse_r=hash("u+ u- u! u~ u++ u-- new typeof finally case var const void delete"),parse_block=hash("; {"),parse_invisible=hash("i;"),parse_l=hash("++ --"),parse_group=annotate_keys({"(":")","[":"]","{":"}","?":":"}),parse_ambiguous_group=hash("[ ("),parse_ternary=hash("?"),parse_not_a_value=hash("function if for while catch void delete new typeof in instanceof"),parse_also_expression=hash("function"),syntax_common=caterwaul_global.syntax_common={_replace:function(n){return(n.l=this.l)&&(this.l.r=n),(n.r=this.r)&&(this.r.l=n),this
},_append_to:function(n){return n&&n._append(this),this},_reparent:function(n){return this.p&&this.p[0]===this&&(this.p[0]=n),this},_fold_l:function(n){return this._append(this.l&&this.l._unlink(this)||empty)
},_append:function(n){return(this[this.length++]=n)&&(n.p=this),this},_fold_r:function(n){return this._append(this.r&&this.r._unlink(this)||empty)},_sibling:function(n){return n.p=this.p,(this.r=n).l=this
},_fold_lr:function(){return this._fold_l()._fold_r()},_fold_rr:function(){return this._fold_r()._fold_r()},_wrap:function(n){return n.p=this._replace(n).p,this._reparent(n),delete this.l,delete this.r,this._append_to(n)
},_unlink:function(n){return this.l&&(this.l.r=this.r),this.r&&(this.r.l=this.l),delete this.l,delete this.r,this._reparent(n)},pop:function(){return --this.length,this
},push:function(x){return this[this.length++]=x||empty,this},id:function(){var id=gensym("id");return(this.id=function(){return id})()},is_caterwaul_syntax:true,each:function(f){for(var i=0,l=this.length;
i<l;++i){f(this[i],i)}return this},map:function(f){for(var n=new this.constructor(this),i=0,l=this.length;i<l;++i){n.push(f(this[i],i)||this[i])}return n},reach:function(f){f(this);
this.each(function(n){n.reach(f)});return this},rmap:function(f){var r=f(this);return !r||r===this?this.map(function(n){return n.rmap(f)}):r===true?this:r.rmap===undefined?new this.constructor(r):r
},peach:function(f){this.each(function(n){n.peach(f)});f(this);return this},pmap:function(f){var t=this.map(function(n){return n.pmap(f)});return f(t)},clone:function(){return this.rmap(function(){return false
})},collect:function(p){var ns=[];this.reach(function(n){p(n)&&ns.push(n)});return ns},replace:function(rs){var r;return own.call(rs,this.data)&&(r=rs[this.data])?r.constructor===String?se(this.map(function(n){return n.replace(rs)
}),function(){this.data=r}):r:this.map(function(n){return n.replace(rs)})},repopulated_with:function(xs){return new this.constructor(this.data,xs)},with_data:function(d){return new this.constructor(d,Array.prototype.slice.call(this))
},change:function(i,x){return se(new this.constructor(this.data,Array.prototype.slice.call(this)),function(n){n[i]=x})},compose_single:function(i,f){return this.change(i,f(this[i]))
},slice:function(x1,x2){return new this.constructor(this.data,Array.prototype.slice.call(this,x1,x2))},traverse:function(f){f({entering:this});f({exiting:this.each(function(n){n.traverse(f)
})});return this},flatten:function(d){d=d||this.data;return d!==this.data?this.as(d):!(has(parse_lr,d)&&this.length)?this:has(parse_associates_right,d)?se(new this.constructor(d),bind(function(n){for(var i=this;
i&&i.data===d;i=i[1]){n.push(i[0])}n.push(i)},this)):se(new this.constructor(d),bind(function(n){for(var i=this,ns=[];i.data===d;i=i[0]){i[1]&&ns.push(i[1])}ns.push(i);
for(i=ns.length-1;i>=0;--i){n.push(ns[i])}},this))},unflatten:function(){var t=this,right=has(parse_associates_right,this.data);return this.length<=2?this:se(new this.constructor(this.data),function(n){if(right){for(var i=0,l=t.length-1;
i<l;++i){n=n.push(t[i]).push(i<l-2?new t.constructor(t.data):t[i])[1]}}else{for(var i=t.length-1;i>=1;--i){n=n.push(i>1?new t.constructor(t.data):t[0]).push(t[i])[0]
}}})},as:function(d){return this.data===d?this:new this.constructor(d).push(this)},bindings:function(hash){var result=hash||{};this.reach(function(n){if(n.binds_a_value){result[n.data]=n.value
}});return result},expressions:function(hash){var result=hash||{};this.reach(function(n){if(n.binds_an_expression){result[n.data]=n.e}});return result},contains:function(f){var result=f(this);
if(result){return result}for(var i=0,l=this.length;i<l;++i){if(result=this[i].contains(f)){return result}}},match:function(target,variables){target=target.constructor===String?caterwaul_global.parse(target):target;
variables||(variables={_:target});if(this.is_wildcard()){return variables[this.data]=target,variables}else{if(this.length===target.length&&this.data===target.data){for(var i=0,l=this.length;
i<l;++i){if(!this[i].match(target[i],variables)){return null}}return variables}}},toString:function(){var xs=[""];this.serialize(xs);return xs.join("")},structure:function(){if(this.length){return"("+['"'+this.data+'"'].concat(map(function(x){return x.structure()
},this)).join(" ")+")"}else{return this.data}}};caterwaul_global.syntax_subclass=function(ctor){var extensions=Array.prototype.slice.call(arguments,1),proxy=function(){return ctor.apply(this,arguments)
};caterwaul_global.merge.apply(this,[proxy.prototype,syntax_common].concat(extensions));proxy.prototype.constructor=proxy;return proxy};var parse_hex=caterwaul_global.parse_hex=function(digits){for(var result=0,i=0,l=digits.length,d;
i<l;++i){result*=16,result+=(d=digits.charCodeAt(i))<=58?d-48:(d&95)-55}return result},parse_octal=caterwaul_global.parse_octal=function(digits){for(var result=0,i=0,l=digits.length;
i<l;++i){result*=8,result+=digits.charCodeAt(i)-48}return result},unescape_string=caterwaul_global.unescape_string=function(s){for(var i=0,c,l=s.length,result=[],is_escaped=false;
i<l;++i){if(is_escaped){is_escaped=false,result.push((c=s.charAt(i))==="\\"?"\\":c==="n"?"\n":c==="r"?"\r":c==="b"?"\b":c==="f"?"\f":c==="0"?"\u0000":c==="t"?"\t":c==="v"?"\v":c==='"'||c==="'"?c:c==="x"?String.fromCharCode(parse_hex(s.substring(i,++i+1))):c==="u"?String.fromCharCode(parse_hex(s.substring(i,(i+=3)+1))):String.fromCharCode(parse_octal(s.substring(i,(i+=2)+1))))
}else{if((c=s.charAt(i))==="\\"){is_escaped=true}else{result.push(c)}}}return result.join("")};caterwaul_global.javascript_tree_type_methods={is_string:function(){return/['"]/.test(this.data.charAt(0))
},as_escaped_string:function(){return this.data.substr(1,this.data.length-2)},is_number:function(){return/^-?(0x|\d|\.\d+)/.test(this.data)},as_number:function(){return Number(this.data)
},is_boolean:function(){return this.data==="true"||this.data==="false"},as_boolean:function(){return this.data==="true"},is_regexp:function(){return/^\/./.test(this.data)
},as_escaped_regexp:function(){return this.data.substring(1,this.data.lastIndexOf("/"))},is_array:function(){return this.data==="["},as_unescaped_string:function(){return unescape_string(this.as_escaped_string())
},is_wildcard:function(){return this.data.charCodeAt(0)===95},is_identifier:function(){return this.length===0&&/^[A-Za-z_$]\w*$/.test(this.data)&&!this.is_boolean()&&!this.is_null_or_undefined()&&!has(lex_op,this.data)
},has_grouped_block:function(){return has(parse_r_until_block,this.data)},is_block:function(){return has(parse_block,this.data)},is_blockless_keyword:function(){return has(parse_r_optional,this.data)
},is_null_or_undefined:function(){return this.data==="null"||this.data==="undefined"},is_constant:function(){return this.is_number()||this.is_string()||this.is_boolean()||this.is_regexp()||this.is_null_or_undefined()
},left_is_lvalue:function(){return/=$/.test(this.data)||/\+\+$/.test(this.data)||/--$/.test(this.data)},is_empty:function(){return !this.length},has_parameter_list:function(){return this.data==="function"||this.data==="catch"
},has_lvalue_list:function(){return this.data==="var"||this.data==="const"},is_dereference:function(){return this.data==="."||this.data==="[]"},is_invocation:function(){return this.data==="()"
},is_contextualized_invocation:function(){return this.is_invocation()&&this[0].is_dereference()},is_invisible:function(){return has(parse_invisible,this.data)},is_binary_operator:function(){return has(parse_lr,this.data)
},is_prefix_unary_operator:function(){return has(parse_r,this.data)},is_postfix_unary_operator:function(){return has(parse_l,this.data)},is_unary_operator:function(){return this.is_prefix_unary_operator()||this.is_postfix_unary_operator()
},accepts:function(e){return has(parse_accepts,this.data)&&parse_accepts[this.data]===(e.data||e)}};caterwaul_global.javascript_tree_serialization_methods={ends_with_block:function(){var block=this[parse_r_until_block[this.data]];
return this.data==="{"||has(parse_r_until_block,this.data)&&(this.data!=="function"||this.length===3)&&block&&block.ends_with_block()},serialize:function(xs){var l=this.length,d=this.data,semi=";\n",push=function(x){if(lex_ident[xs[xs.length-1].charCodeAt(0)]===lex_ident[x.charCodeAt(0)]){xs.push(" ",x)
}else{xs.push(x)}};switch(l){case 0:if(has(parse_r_optional,d)){return push(d.replace(/^u/,""))}else{if(has(parse_group,d)){return push(d),push(parse_group[d])}else{return push(d)
}}case 1:if(has(parse_r,d)||has(parse_r_optional,d)){return push(d.replace(/^u/,"")),this[0].serialize(xs)}else{if(has(parse_group,d)){return push(d),this[0].serialize(xs),push(parse_group[d])
}else{if(has(parse_lr,d)){return push("/* unary "+d+" node */"),this[0].serialize(xs)}else{return this[0].serialize(xs),push(d)}}}case 2:if(has(parse_invocation,d)){return this[0].serialize(xs),push(d.charAt(0)),this[1].serialize(xs),push(d.charAt(1))
}else{if(has(parse_r_until_block,d)){return push(d),this[0].serialize(xs),this[1].serialize(xs)}else{if(has(parse_invisible,d)){return this[0].serialize(xs),this[1].serialize(xs)
}else{if(d===";"){return this[0].serialize(xs),push(semi),this[1].serialize(xs)}else{return this[0].serialize(xs),push(d),this[1].serialize(xs)}}}}default:if(has(parse_ternary,d)){return this[0].serialize(xs),push(d),this[1].serialize(xs),push(":"),this[2].serialize(xs)
}else{if(has(parse_r_until_block,d)){return this.accepts(this[2])&&!this[1].ends_with_block()?(push(d),this[0].serialize(xs),this[1].serialize(xs),push(semi),this[2].serialize(xs)):(push(d),this[0].serialize(xs),this[1].serialize(xs),this[2].serialize(xs))
}else{return this.unflatten().serialize(xs)}}}}};caterwaul_global.ref_common=caterwaul_global.merge({},caterwaul_global.javascript_tree_type_methods,caterwaul_global.javascript_tree_serialization_methods,{replace:function(replacements){var r;
return own.call(replacements,this.data)&&(r=replacements[this.data])?r.constructor===String?se(new this.constructor(this.value),function(){this.data=r}):r:this},length:0});
caterwaul_global.ref=caterwaul_global.syntax_subclass(function(value,name){if(value instanceof this.constructor){this.value=value.value,this.data=value.data}else{this.value=value,this.data=gensym(name&&name.constructor===String?name:"ref")
}},caterwaul_global.ref_common,{binds_a_value:true});caterwaul_global.expression_ref=caterwaul_global.syntax_subclass(function(e,name){if(e instanceof this.constructor){this.e=e.e,this.data=e.data
}else{this.e=e,this.data=gensym(name&&name.constructor===String?name:"e")}},caterwaul_global.ref_common,{binds_an_expression:true});caterwaul_global.opaque_tree=caterwaul_global.syntax_subclass(function(code){this.data=code instanceof this.constructor?code.data:code.toString()
},{serialize:function(xs){return xs.push(this.data),xs},parse:function(){return caterwaul_global.parse(this.data)}});caterwaul_global.syntax=caterwaul_global.syntax_subclass(function(data){if(data instanceof this.constructor){this.data=data.data,this.length=0
}else{this.data=data&&data.toString();this.length=0;for(var i=1,l=arguments.length,_;_=arguments[i],i<l;++i){for(var j=0,lj=_.length,it,c;_ instanceof Array?(it=_[j],j<lj):(it=_,!j);
++j){this._append((c=it.constructor)===String||c===Number||c===Boolean?new this.constructor(it):it)}}}},caterwaul_global.javascript_tree_type_methods,caterwaul_global.javascript_tree_serialization_methods);
var empty=caterwaul_global.empty=new caterwaul_global.syntax("");caterwaul_global.parse=function(input){if(input.constructor===caterwaul_global.syntax){return input
}var s=input.toString(),mark=0,c=0,re=true,esc=false,dot=false,exp=false,close=0,t="",i=0,l=s.length,cs=function(i){return s.charCodeAt(i)},grouping_stack=[],gs_top=null,head=null,parent=null,indexes=map(function(){return[]
},parse_reduce_order),invocation_nodes=[],all_nodes=[empty],new_node=function(n){return all_nodes.push(n),n},push=function(n){return head?head._sibling(head=n):(head=n._append_to(parent)),new_node(n)
},syntax_node=this.syntax,ternaries=[];if(l===0){return empty}while((mark=i)<l){while(lex_space[c=cs(i)]&&i<l){mark=++i}esc=exp=dot=t=false;if(lex_bracket[c]){t=!!++i;
re=lex_opener[c]}else{if(c===lex_slash&&cs(i+1)===lex_star&&(i+=2)){while(++i<l&&cs(i)!==lex_slash||cs(i-1)!==lex_star){}t=!++i}else{if(c===lex_slash&&cs(i+1)===lex_slash){while(++i<l&&!lex_eol[cs(i)]){}t=false
}else{if(c===lex_hash){while(++i<l&&!lex_eol[cs(i)]){}t=false}else{if(lex_quote[c]&&(close=c)&&re&&!(re=!(t=s.charAt(i)))){while(++i<l&&(c=cs(i))!==close||esc){esc=!esc&&c===lex_back
}while(++i<l&&lex_regexp_suffix[cs(i)]){}t=true}else{if(c===lex_zero&&lex_integer[cs(i+1)]){while(++i<l&&lex_integer[cs(i)]){}re=!(t=true)}else{if(lex_float[c]&&(c!==lex_dot||lex_decimal[cs(i+1)])){while(++i<l&&(lex_decimal[c=cs(i)]||(dot^(dot|=c===lex_dot))||(exp^(exp|=lex_exp[c]&&++i)))){}while(i<l&&lex_decimal[cs(i)]){++i
}re=!(t=true)}else{if(lex_punct[c]&&(t=re?"u":"",re=true)){while(i<l&&lex_punct[cs(i)]&&has(lex_op,t+s.charAt(i))){t+=s.charAt(i++)}re=!has(lex_postfix_unary,t)}else{while(++i<l&&(lex_ident[c=cs(i)]||c>127)){}re=has(lex_op,t=s.substring(mark,i))
}}}}}}}}if(i===mark){throw new Error('Caterwaul lex error at "'+s.substr(mark,40)+'" with leading context "'+s.substr(mark-40,40)+'" (probably a Caterwaul bug)')
}if(t===false){continue}t=t===true?s.substring(mark,i):t==="u;"?";":t;t===gs_top?(grouping_stack.pop(),gs_top=grouping_stack[grouping_stack.length-1],head=head?head.p:parent,parent=null):(has(parse_group,t)?(grouping_stack.push(gs_top=parse_group[t]),parent=push(new_node(new syntax_node(t))),head=null):push(new_node(new syntax_node(t))),has(parse_inverse_order,t)&&indexes[parse_inverse_order[t]].push(head||parent));
re|=t===")"&&head.l&&has(parse_r_until_block,head.l.data)}for(var i=0,l=indexes.length,forward,_;_=indexes[i],forward=parse_index_forward[i],i<l;++i){for(var j=forward?0:_.length-1,lj=_.length,inc=forward?1:-1,node,data,ll;
forward?j<lj:j>=0;j+=inc){if(has(parse_lr,data=(node=_[j]).data)){node._fold_lr()}else{if(has(parse_ambiguous_group,data)&&node.l&&!((ll=node.l.l)&&has(parse_r_until_block,ll.data))&&(node.l.data==="."||(node.l.data==="function"&&node.l.length===2)||!(has(lex_op,node.l.data)||has(parse_not_a_value,node.l.data)))){invocation_nodes.push(node.l._wrap(new_node(new syntax_node(data+parse_group[data]))).p._fold_r())
}else{if(has(parse_l,data)){node._fold_l()}else{if(has(parse_r,data)){node._fold_r()}else{if(has(parse_ternary,data)){node._fold_lr(),ternaries.push(node)}else{if(has(parse_r_until_block,data)&&node.r&&node.r.data!==":"){for(var count=0,limit=parse_r_until_block[data];
count<limit&&node.r&&!has(parse_block,node.r.data);++count){node._fold_r()}node.r&&(node.r.data===";"?node.push(empty):node._fold_r());if(has(parse_accepts,data)&&parse_accepts[data]===(node.r&&node.r.r&&node.r.r.data)){node._fold_r().pop()._fold_r()
}else{if(has(parse_accepts,data)&&parse_accepts[data]===(node.r&&node.r.data)){node._fold_r()}}}else{if(has(parse_r_optional,data)){node.r&&node.r.data!==";"&&node._fold_r()
}}}}}}}}}for(var i=all_nodes.length-1,_;i>=0;--i){(_=all_nodes[i]).r&&_._wrap(new_node(new syntax_node("i;"))).p._fold_r()}for(var i=0,l=invocation_nodes.length,_,child;
i<l;++i){(child=(_=invocation_nodes[i])[1]=_[1][0]||empty)&&(child.p=_)}for(var i=0,l=ternaries.length,_,n,temp;i<l;++i){n=(_=ternaries[i]).length,temp=_[0],_[0]=_[n-2],_[1]=temp,_[2]=_[n-1],_.length=3
}while(head.p){head=head.p}for(var i=all_nodes.length-1,_;i>=0;--i){delete (_=all_nodes[i]).p,delete _.l,delete _.r}return head};var bound_expression_template=caterwaul_global.parse("var _bindings; return(_expression)"),binding_template=caterwaul_global.parse("_variable = _base._variable"),undefined_binding=caterwaul_global.parse("undefined = void(0)"),late_bound_template=caterwaul_global.parse("(function (_bindings) {return(_body)}).call(this, _expressions)");
caterwaul_global.compile=function(tree,environment,options){options=caterwaul_global.merge({gensym_renaming:true},options);tree=caterwaul_global.late_bound_tree(tree);
var bindings=caterwaul_global.merge({},this._environment||{},environment||{},tree.bindings()),variables=[undefined_binding],s=gensym("base");for(var k in bindings){if(own.call(bindings,k)&&k!=="this"){variables.push(binding_template.replace({_variable:k,_base:s}))
}}var variable_definitions=new this.syntax(",",variables).unflatten(),function_body=bound_expression_template.replace({_bindings:variable_definitions,_expression:tree});
if(options.gensym_renaming){var renaming_table=this.gensym_rename_table(function_body);for(var k in bindings){own.call(bindings,k)&&(bindings[renaming_table[k]||k]=bindings[k])
}function_body=function_body.replace(renaming_table);s=renaming_table[s]}var code=function_body.toString();try{return(new Function(s,code)).call(bindings["this"],bindings)
}catch(e){throw new Error((e.message||e)+" while compiling "+code)}};caterwaul_global.late_bound_tree=function(tree,environment){var bindings=caterwaul_global.merge({},environment||{},tree.expressions()),variables=new caterwaul_global.syntax(","),expressions=new caterwaul_global.syntax(",");
for(var k in bindings){if(own.call(bindings,k)){variables.push(new caterwaul_global.syntax(k)),expressions.push(bindings[k])}}return variables.length?late_bound_template.replace({_bindings:variables.unflatten(),_expressions:expressions.unflatten(),_body:tree}):tree
};caterwaul_global.gensym_rename_table=function(tree){var names={},gensyms=[];tree.reach(function(node){var d=node.data;if(is_gensym(d)){names[d]||gensyms.push(d)
}names[d]=d.replace(/^(.*)_[a-z0-9]+_.{22}$/,"$1")||"anon"});var unseen_count={},next_unseen=function(name){if(!(name in names)){return name}var n=unseen_count[name]||0;
while(names[name+(++n).toString(36)]){}return name+(unseen_count[name]=n).toString(36)};for(var renamed={},i=0,l=gensyms.length,g;i<l;++i){renamed[g=gensyms[i]]||(names[renamed[g]=next_unseen(names[g])]=true)
}return renamed};var invoke_caterwaul_methods=function(methods){for(var ms=methods.split(/\s+/),i=1,l=ms.length,r=caterwaul_global[ms[0]]();i<l;++i){r=caterwaul_global[ms[i]](r)
}return r};caterwaul_global.init=function(macroexpander){macroexpander||(macroexpander=function(x){return true});return macroexpander.constructor===Function?se((function(){var result=function(f,environment,options){return typeof f==="function"||f.constructor===String?caterwaul_global.compile(result.call(result,caterwaul_global.parse(f)),environment,options):f.rmap(function(node){return macroexpander.call(result,node,environment,options)
})};return result})(),function(){this.global=caterwaul_global,this.macroexpander=macroexpander}):invoke_caterwaul_methods(macroexpander)};caterwaul_global.initializer=initializer;
caterwaul_global.clone=function(){return se(initializer(initializer,unique).deglobalize(),function(){for(var k in caterwaul_global){this[k]||(this[k]=caterwaul_global[k])
}})};var w_template=caterwaul_global.parse("(function (f) {return f(f)})(_x)"),module_template=caterwaul_global.parse("module(_name, _f)");caterwaul_global.replicator=function(options){if(options&&options.minimal_core_only){return w_template.replace({_x:new this.opaque_tree(this.core_initializer)})
}if(options&&options.core_only){return w_template.replace({_x:new this.opaque_tree(this.initializer)})}for(var i=0,ms=this.modules,c=[],l=ms.length;i<l;++i){c.push(module_template.replace({_name:"'"+ms[i]+"'",_f:new this.opaque_tree(this.module(ms[i]))}))
}for(var i=0,l=c.length,result=new this.syntax(".",w_template.replace({_x:new this.opaque_tree(this.initializer)}));i<l;++i){result.push(c[i])}return result.unflatten()
};return caterwaul=caterwaul_global});