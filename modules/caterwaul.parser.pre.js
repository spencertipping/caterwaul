caterwaul.tconfiguration('std seq continuation memoize','parser.core',caterwaul.precompiled_internal((function (){var gensym_2_gmjt2sb3_bwlzjb=caterwaul.clone('std.qs std.qg std.bind std.lvalue std.cond std.fn std.obj std.ref std.string std seq.core seq.finite.core seq.finite.object seq.finite.mutability seq.finite.traversal seq.finite.zip seq.finite.quantification seq.finite.serialization seq.infinite.core seq.infinite.y seq.infinite.transform seq.infinite.traversal seq.numeric seq.dsl seq continuation.core continuation.unwind continuation.cps continuation.delimited continuation memoize');
var gensym_2_gmjt2sb3_bwlzjc=gensym_2_gmjt2sb3_bwlzjb;
return (function (gensym_2_gmjt2sb3_bwlzj0){((function (_){return _.parse_state=(function (input,i,result,memo){return ((function (_){return this.input=input,this.i=i,this.result=result,this.memo=memo,_})).call(this,undefined)}),((function (s){return s.from_input=(function (input){return new _.parse_state(input,0,null,{})}),((function (_){return _.accept=(function (i,r){return new this.constructor(this.input,i,r,this.memo)}),_.has_input=(function (){return this.i<this.input.length}),_.toString=(function (){return ('ps['+(this.input.substr(this.i))+', '+(this.result)+']')}),_})).call(this,s.prototype),s})).call(this,_.parse_state),_.memoize=gensym_2_gmjt2sb3_bwlzjb.memoize.from((function (c,as,f){return (function (k,m){return k in m?m[k]:(m[k]=f.apply(c,as))}).call(this,(''+(f.original.memo_id)+'|'+(as[0].i)+''),as[0].memo||(as[0].memo={}))})),_.promote_non_states=(function (f){return (function (state){return state instanceof _.parse_state?f.call(this,state):((function (_){return _&&_.result})).call(this,f.call(this,_.parse_state.from_input(state)))})}),_.identify=(function (f){return ((function (_){return _.memo_id=gensym_2_gmjt2sb3_bwlzjc.gensym(),_})).call(this,f)}),_.parser=(function (f){return _.promote_non_states(_.memoize(_.identify(f)))}),_.defparser=(function (name,f){return _.parsers[name]=(function (){return _.parser(f.apply(this,arguments))})}),_.parsers={},_})).call(this,this.namespace('parser'))})})())).tconfiguration('std seq continuation','parser.c',caterwaul.precompiled_internal((function (){var gensym_2_gmjt2sb3_bwlzje=caterwaul.clone('std.qs std.qg std.bind std.lvalue std.cond std.fn std.obj std.ref std.string std seq.core seq.finite.core seq.finite.object seq.finite.mutability seq.finite.traversal seq.finite.zip seq.finite.quantification seq.finite.serialization seq.infinite.core seq.infinite.y seq.infinite.transform seq.infinite.traversal seq.numeric seq.dsl seq continuation.core continuation.unwind continuation.cps continuation.delimited continuation');
var gensym_2_gmjt2sb3_bwlzjf=gensym_2_gmjt2sb3_bwlzje;
var gensym_2_gmjt2sb3_bwlzjg=gensym_2_gmjt2sb3_bwlzje;
var gensym_2_gmjt2sb3_bwlzjh=gensym_2_gmjt2sb3_bwlzje;
return (function (gensym_2_gmjt2sb3_bwlzj1){this.configure('parser.core').parser.defparser('c',(function (x,l){return (function (){var check_index=(function (i,s,p){return i.exists((function (_,_i){return (function (s){return _[('@'+(s)+'')]&&s}).call(this,s.substr(p,_.length))}))}),index_entries=(function (xs){return (function (){var xsp=(new gensym_2_gmjt2sb3_bwlzje.seq.finite(xs)),ls=gensym_2_gmjt2sb3_bwlzjf.seq.finite.keys((xsp.map((function (_,_i){return [_.length,true]}))).object()).map((function (_,_i){return Number(_)}));
return (new gensym_2_gmjt2sb3_bwlzjg.seq.finite(ls.slice().sort((function (x,y){return y-x})))).map((function (l,li){return (xsp.filter((function (_,_i){return _.length===l})).map((function (_,_i){return [('@'+(_)+''),true]})).concat([['length',l]])).object()}))}).call(this)}),add_absolute_anchors_to=(function (x){return (function (parts){return new RegExp(('^'+(parts[1])+'$'),parts[2])}).call(this,/^\/(.*)\/(\w*)$/.exec(x.toString()))}),fail_length=(function (re,s,p,l){return re.test(s.substr(p,l))?p+(l<<1)<=s.length?fail_length(re,s,p,l<<1):l<<1:l}),split_lengths=(function (re,s,p,l,u){return (function (){var b=(function (l,u){return l+1<u?((function (m){return re.test(s.substr(p,m))?b(m,u):b(l,m)})).call(this,(l+(u-l>>1))):l});
return b(l,u)}).call(this)});
return x.constructor===String?(function (st){return (x===st.input.substr(st.i,x.length))&&(st.accept(st.i+x.length,x))}):x instanceof Array?(function (index){return (function (st){return ((function (_){return _&&st.accept(st.i+_.length,_)})).call(this,check_index(index,st.input,st.i))})}).call(this,index_entries(x)):x.constructor===RegExp?(function (x){return (function (st){return ((function (_){return _>l&&((function (_){return st.accept(st.i+_,x.exec(st.input.substr(st.i,_)))})).call(this,split_lengths(x,st.input,st.i,l,_))})).call(this,fail_length(x,st.input,st.i,l))})}).call(this,add_absolute_anchors_to(x)):x.constructor===Function?(function (st){return ((function (_){return _&&st.accept(st.i+_,st.input.substr(st.i,_))})).call(this,x.call(st,st.input,st.i))}):(function (index){return (function (st){return ((function (_){return _&&st.accept(st.i+_.length,x[_])})).call(this,check_index(index,st.input,st.i))})}).call(this,index_entries(gensym_2_gmjt2sb3_bwlzjh.seq.finite.keys(x)))}).call(this)}))})})())).tconfiguration('std opt seq continuation','parser.seq',caterwaul.precompiled_internal((function (){var gensym_2_gmjt2sb3_bwlzjj=caterwaul.clone('std.qs std.qg std.bind std.lvalue std.cond std.fn std.obj std.ref std.string std opt.unroll opt seq.core seq.finite.core seq.finite.object seq.finite.mutability seq.finite.traversal seq.finite.zip seq.finite.quantification seq.finite.serialization seq.infinite.core seq.infinite.y seq.infinite.transform seq.infinite.traversal seq.numeric seq.dsl seq continuation.core continuation.unwind continuation.cps continuation.delimited continuation');
return (function (gensym_2_gmjt2sb3_bwlzj2){this.configure('parser.core').parser.defparser('seq',(function (){return (function (as){return (function (state){return (function (result){return (gensym_2_gmjt2sb3_bwlzjj.continuation.call_cc.call(this,(function (cc){return (function (gensym_2_gmjt2sb3_bwlzdp){for (var gensym_2_gmjt2sb3_bwlzdq=gensym_2_gmjt2sb3_bwlzdp>=0&&gensym_2_gmjt2sb3_bwlzdp>>3,gensym_2_gmjt2sb3_bwlzdr=gensym_2_gmjt2sb3_bwlzdp>=0&&gensym_2_gmjt2sb3_bwlzdp&7,i=0;
i<gensym_2_gmjt2sb3_bwlzdr;
 ++i)(state=as[i](state))?result.push(state.result):cc(false);
for (var gensym_2_gmjt2sb3_bwlzds=0;
gensym_2_gmjt2sb3_bwlzds<gensym_2_gmjt2sb3_bwlzdq;
 ++gensym_2_gmjt2sb3_bwlzds){(state=as[i](state))?result.push(state.result):cc(false);
i++;
(state=as[i](state))?result.push(state.result):cc(false);
i++;
(state=as[i](state))?result.push(state.result):cc(false);
i++;
(state=as[i](state))?result.push(state.result):cc(false);
i++;
(state=as[i](state))?result.push(state.result):cc(false);
i++;
(state=as[i](state))?result.push(state.result):cc(false);
i++;
(state=as[i](state))?result.push(state.result):cc(false);
i++;
(state=as[i](state))?result.push(state.result):cc(false);
i++};
return gensym_2_gmjt2sb3_bwlzdp}).call(this,as.length),state.accept(state.i,result)})))}).call(this,[])})}).call(this,arguments)}))})})())).tconfiguration('std opt seq continuation','parser.alt',caterwaul.precompiled_internal((function (){var gensym_2_gmjt2sb3_bwlzjl=caterwaul.clone('std.qs std.qg std.bind std.lvalue std.cond std.fn std.obj std.ref std.string std opt.unroll opt seq.core seq.finite.core seq.finite.object seq.finite.mutability seq.finite.traversal seq.finite.zip seq.finite.quantification seq.finite.serialization seq.infinite.core seq.infinite.y seq.infinite.transform seq.infinite.traversal seq.numeric seq.dsl seq continuation.core continuation.unwind continuation.cps continuation.delimited continuation');
return (function (gensym_2_gmjt2sb3_bwlzj3){this.configure('parser.core').parser.defparser('alt',(function (){return (function (as){return (function (state){return as.exists((function (_,_i){return _(state)}))})}).call(this,(new gensym_2_gmjt2sb3_bwlzjl.seq.finite(arguments)))}))})})())).tconfiguration('std opt seq continuation','parser.times',caterwaul.precompiled_internal((function (){var gensym_2_gmjt2sb3_bwlzjn=caterwaul.clone('std.qs std.qg std.bind std.lvalue std.cond std.fn std.obj std.ref std.string std opt.unroll opt seq.core seq.finite.core seq.finite.object seq.finite.mutability seq.finite.traversal seq.finite.zip seq.finite.quantification seq.finite.serialization seq.infinite.core seq.infinite.y seq.infinite.transform seq.infinite.traversal seq.numeric seq.dsl seq continuation.core continuation.unwind continuation.cps continuation.delimited continuation');
var gensym_2_gmjt2sb3_bwlzjo=gensym_2_gmjt2sb3_bwlzjn;
var gensym_2_gmjt2sb3_bwlzjp=gensym_2_gmjt2sb3_bwlzjn;
return (function (gensym_2_gmjt2sb3_bwlzj4){this.configure('parser.core').parser.defparser('times',(function (p,lower,upper){return (function (state){return (function (count,result){return (gensym_2_gmjt2sb3_bwlzjn.continuation.call_cc.call(this,(function (cc){return (function (gensym_2_gmjt2sb3_bwlzdp){for (var gensym_2_gmjt2sb3_bwlzdq=gensym_2_gmjt2sb3_bwlzdp>=0&&gensym_2_gmjt2sb3_bwlzdp>>3,gensym_2_gmjt2sb3_bwlzdr=gensym_2_gmjt2sb3_bwlzdp>=0&&gensym_2_gmjt2sb3_bwlzdp&7,i=0;
i<gensym_2_gmjt2sb3_bwlzdr;
 ++i) ++count,(state=p(state))?result.push(state.result):cc(false);
for (var gensym_2_gmjt2sb3_bwlzds=0;
gensym_2_gmjt2sb3_bwlzds<gensym_2_gmjt2sb3_bwlzdq;
 ++gensym_2_gmjt2sb3_bwlzds){ ++count,(state=p(state))?result.push(state.result):cc(false);
i++;
 ++count,(state=p(state))?result.push(state.result):cc(false);
i++;
 ++count,(state=p(state))?result.push(state.result):cc(false);
i++;
 ++count,(state=p(state))?result.push(state.result):cc(false);
i++;
 ++count,(state=p(state))?result.push(state.result):cc(false);
i++;
 ++count,(state=p(state))?result.push(state.result):cc(false);
i++;
 ++count,(state=p(state))?result.push(state.result):cc(false);
i++;
 ++count,(state=p(state))?result.push(state.result):cc(false);
i++};
return gensym_2_gmjt2sb3_bwlzdp}).call(this,lower),true})))&&(gensym_2_gmjt2sb3_bwlzjo.continuation.call_cc.call(this,(function (){var loop=(function (cc){return ( !upper||count++<upper)&&state.has_input()&&((function (_){return (_)&&(state=_),_})).call(this,p(state))?result.push(state.result)&&(gensym_2_gmjt2sb3_bwlzjp.continuation.call_tail.call(loop,cc)):cc(state.accept(state.i,result))});
return loop}).call(this)))}).call(this,0,[])})}))})})())).tconfiguration('std opt seq continuation','parser.opt',caterwaul.precompiled_internal((function (){null;
return (function (gensym_2_gmjt2sb3_bwlzj5){this.configure('parser.core').parser.defparser('opt',(function (p){return (function (state){return (function (){var s=p(state),n=s?s.i:state.i,r=s&&s.result;
return state.accept(n,r)}).call(this)})}))})})())).tconfiguration('std opt seq continuation','parser.match',caterwaul.precompiled_internal((function (){null;
return (function (gensym_2_gmjt2sb3_bwlzj6){((function (_){return _.defparser('match',(function (p){return (function (state){return ((function (_){return _&&state.accept(state.i,state.result)})).call(this,p(state))})})),_.defparser('reject',(function (p){return (function (state){return ((function (_){return  !_&&state.accept(state.i,null)})).call(this,p(state))})})),_})).call(this,this.configure('parser.core').parser)})})())).tconfiguration('std opt seq continuation','parser.bind',caterwaul.precompiled_internal((function (){null;
return (function (gensym_2_gmjt2sb3_bwlzj7){((function (_){return _.defparser('bind',(function (p,f){return (function (state){return ((function (_){return _&&_.accept(_.i,f.call(_,_.result))})).call(this,p(state))})})),_})).call(this,this.configure('parser.core').parser)})})())).tconfiguration('std opt seq continuation','parser.dsl',caterwaul.precompiled_internal((function (){var gensym_2_gmjt2sb3_bwlzju=caterwaul.parse('peg[_]');
var gensym_2_gmjt2sb3_bwlzjv=caterwaul.parse('qg[l*[_bindings][_parser]]');
var gensym_2_gmjt2sb3_bwlzjw=caterwaul.clone('std.qs std.qg std.bind std.lvalue std.cond std.fn std.obj std.ref std.string std opt.unroll opt seq.core seq.finite.core seq.finite.object seq.finite.mutability seq.finite.traversal seq.finite.zip seq.finite.quantification seq.finite.serialization seq.infinite.core seq.infinite.y seq.infinite.transform seq.infinite.traversal seq.numeric seq.dsl seq continuation.core continuation.unwind continuation.cps continuation.delimited continuation');
var gensym_2_gmjt2sb3_bwlzjx=caterwaul.parse('_x=_y');
var gensym_2_gmjt2sb3_bwlzjy=caterwaul.parse('_name(_x,_y)');
var gensym_2_gmjt2sb3_bwlzjz=caterwaul.parse('_name(_x,_y)');
var gensym_2_gmjt2sb3_bwlzk0=caterwaul.parse('_name(_x)');
var gensym_2_gmjt2sb3_bwlzk1=caterwaul.parse('_(_)');
var gensym_2_gmjt2sb3_bwlzk2=caterwaul.parse('_x(_y)');
var gensym_2_gmjt2sb3_bwlzk3=caterwaul.parse('_/_');
var gensym_2_gmjt2sb3_bwlzk4=caterwaul.parse('_%_');
var gensym_2_gmjt2sb3_bwlzk5=caterwaul.parse('_>>_');
var gensym_2_gmjt2sb3_bwlzk6=caterwaul.parse('[_]');
var gensym_2_gmjt2sb3_bwlzk7=caterwaul.parse('_');
var gensym_2_gmjt2sb3_bwlzk8=caterwaul.parse('_[_]');
var gensym_2_gmjt2sb3_bwlzk9=caterwaul.parse('times(_x,_l)');
var gensym_2_gmjt2sb3_bwlzka=caterwaul.parse('_[_,_]');
var gensym_2_gmjt2sb3_bwlzkb=caterwaul.parse('times(_x,_l,_u)');
var gensym_2_gmjt2sb3_bwlzkc=gensym_2_gmjt2sb3_bwlzjw;
return (function (gensym_2_gmjt2sb3_bwlzj8){this.configure('parser.core').rmacro(gensym_2_gmjt2sb3_bwlzju,(function (x){return (function (outer){return gensym_2_gmjt2sb3_bwlzjv.replace({_bindings:new this.syntax(',',gensym_2_gmjt2sb3_bwlzjw.seq.finite.pairs(this.parser.parsers).map((function (_,_i){return gensym_2_gmjt2sb3_bwlzjx.replace({_x:_[0],_y:new outer.ref(_[1])})}))),_parser:this.parser.dsl.macroexpand(x)})}).call(this,this)})),this.parser.dsl=((function (dsl){return ((function (_){return (function (){var e=dsl.macroexpand,fb=(function (op,name){return (function (x,y){return gensym_2_gmjt2sb3_bwlzjy.replace({_name:name,_x:((function (_){return _.data=',',_})).call(this,x.flatten(op).map(e)),_y:e(y)})})}),b=(function (name){return (function (x,y){return gensym_2_gmjt2sb3_bwlzjz.replace({_name:name,_x:e(x),_y:y})})}),u=(function (name){return (function (x){return gensym_2_gmjt2sb3_bwlzk0.replace({_name:name,_x:e(x)})})});
return _(gensym_2_gmjt2sb3_bwlzk1,(function (x,y){return gensym_2_gmjt2sb3_bwlzk2.replace({_x:e(x),_y:y})})),_(gensym_2_gmjt2sb3_bwlzk3,fb('/','alt')),_(gensym_2_gmjt2sb3_bwlzk4,fb('%','seq')),_(gensym_2_gmjt2sb3_bwlzk5,b('bind')),_(gensym_2_gmjt2sb3_bwlzk6,u('opt')),_(gensym_2_gmjt2sb3_bwlzk7.as('('),(function (x){return e(x).as('(')})),_(gensym_2_gmjt2sb3_bwlzk8,(function (x,l){return gensym_2_gmjt2sb3_bwlzk9.replace({_x:e(x),_l:l})})),_(gensym_2_gmjt2sb3_bwlzka,(function (x,l,u){return gensym_2_gmjt2sb3_bwlzkb.replace({_x:e(x),_l:l,_u:u})}))}).call(this),_})).call(this,dsl.macro),dsl})).call(this,gensym_2_gmjt2sb3_bwlzkc.global().clone())})})())).configuration('parser',function (gensym_2_gmjt2sb3_bwlzj9){this.configure('parser.core parser.c parser.seq parser.alt parser.times parser.opt parser.match parser.bind parser.dsl')});