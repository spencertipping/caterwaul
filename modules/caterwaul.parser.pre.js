function (gensym_2_gmjcm818_65npr5){caterwaul.tconfiguration('std seq continuation memoize','parser.core',function (){this.namespace('parser')/se[_.parse_state(input,i,result,memo)=undefined/se[this.input=input,this.i=i,this.result=result,this.memo=memo],_.parse_state/se.s[s.from_input(input)=new _.parse_state(input,0,null,{}),s.prototype/se[_.accept(i,r)=new this.constructor(this.input,i,r,this.memo),_.has_input()=this.i<this.input.length,_.toString()='ps[#{this.input.substr(this.i)}, #{this.result}]']],_.memoize=caterwaul.memoize.from(fn[c,as,f][k in m?m[k]:(m[k]=f.apply(c,as)),where[k='#{f.original.memo_id}|#{as[0].i}',m=as[0].memo||(as[0].memo={})]]),_.promote_non_states(f)=fn[state][state instanceof _.parse_state?f.call(this,state):f.call(this,_.parse_state.from_input(state))/re[_&&_.result]],_.identify(f)=f/se[_.memo_id=caterwaul.gensym()],_.parser(f)=_.promote_non_states(_.memoize(_.identify(f))),_.defparser(name,f)=_.parsers[name]()=_.parser(f.apply(this,arguments)),_.parsers={}]}).tconfiguration('std seq continuation','parser.c',function (){this.configure('parser.core').parser.defparser('c',fn[x,l][x.constructor===String?fn[st][st.accept(st.i+x.length,x),when[x===st.input.substr(st.i,x.length)]]:x instanceof Array?l[index=index_entries(x)] in fn[st][check_index(index,st.input,st.i)/re[_&&st.accept(st.i+_.length,_)]]:x.constructor===RegExp?l[x=add_absolute_anchors_to(x)] in fn[st][fail_length(x,st.input,st.i,l)/re[_>l&&split_lengths(x,st.input,st.i,l,_)/re[st.accept(st.i+_,x.exec(st.input.substr(st.i,_)))]]]:x.constructor===Function?fn[st][x.call(st,st.input,st.i)/re[_&&st.accept(st.i+_,st.input.substr(st.i,_))]]:l[index=index_entries(seq[sk[x]])] in fn[st][check_index(index,st.input,st.i)/re[_&&st.accept(st.i+_.length,x[_])]],where*[check_index(i,s,p)=seq[i|[_['@#{s}']&&s,where[s=s.substr(p,_.length)]]],index_entries(xs)=l*[xsp=seq[ ~xs],ls=seq[sk[seq[ !(xsp*[[_.length,true]])]]*[Number(_)]]] in seq[ ~ls.slice().sort(fn[x,y][y-x])* ~l[ !(xsp%[_.length===l]*[['@#{_}',true]]+[['length',l]])]],add_absolute_anchors_to(x)=l[parts=/^\/(.*)\/(\w*)$/.exec(x.toString())] in new RegExp('^#{parts[1]}$',parts[2]),fail_length(re,s,p,l)=re.test(s.substr(p,l))?p+(l<<1)<=s.length?fail_length(re,s,p,l<<1):l<<1:l,split_lengths(re,s,p,l,u)=l*[b(l,u)=l+1<u?(l+(u-l>>1))/re.m[re.test(s.substr(p,m))?b(m,u):b(l,m)]:l] in b(l,u)]])}).tconfiguration('std opt seq continuation','parser.seq',function (){this.configure('parser.core').parser.defparser('seq',fn_[l[as=arguments] in fn[state][call/cc[fn[cc][opt.unroll[i,as.length][(state=as[i](state))?result.push(state.result):cc(false)],state.accept(state.i,result)]],where[result=[]]]])}).tconfiguration('std opt seq continuation','parser.alt',function (){this.configure('parser.core').parser.defparser('alt',fn_[l[as=seq[ ~arguments]] in fn[state][seq[as|[_(state)]]]])}).tconfiguration('std opt seq continuation','parser.times',function (){this.configure('parser.core').parser.defparser('times',fn[p,lower,upper][fn[state][call/cc[fn[cc][opt.unroll[i,lower][ ++count,(state=p(state))?result.push(state.result):cc(false)],true]]&&call/cc[l*[loop(cc)=( !upper||count++<upper)&&state.has_input()&&p(state)/se[state=_,when[_]]?result.push(state.result)&&call/tail[loop(cc)]:cc(state.accept(state.i,result))] in loop],where[count=0,result=[]]]])}).tconfiguration('std opt seq continuation','parser.opt',function (){this.configure('parser.core').parser.defparser('opt',fn[p][fn[state][state.accept(n,r),where*[s=p(state),n=s?s.i:state.i,r=s&&s.result]]])}).tconfiguration('std opt seq continuation','parser.match',function (){this.configure('parser.core').parser/se[_.defparser('match',fn[p][fn[state][p(state)/re[_&&state.accept(state.i,state.result)]]]),_.defparser('reject',fn[p][fn[state][p(state)/re[ !_&&state.accept(state.i,null)]]])]}).tconfiguration('std opt seq continuation','parser.bind',function (){this.configure('parser.core').parser/se[_.defparser('bind',fn[p,f][fn[state][p(state)/re[_&&_.accept(_.i,f.call(_,_.result))]]])]}).tconfiguration('std opt seq continuation','parser.dsl',function (){this.configure('parser.core').rmacro(qs[peg[_]],fn[x][qs[qg[l*[_bindings][_parser]]].replace({_bindings:new this.syntax(',',seq[sp[this.parser.parsers]*[qs[_x=_y].replace({_x:_[0],_y:new outer.ref(_[1])})]]),_parser:this.parser.dsl.macroexpand(x)}),where[outer=this]]),this.parser.dsl=caterwaul.global().clone()/se.dsl[dsl.macro/se[_(qs[_(_)],fn[x,y][qs[_x(_y)].replace({_x:e(x),_y:y})]),_(qs[_/_],fb('/','alt')),_(qs[_%_],fb('%','seq')),_(qs[_>>_],b('bind')),_(qs[[_]],u('opt')),_(qs[_].as('('),fn[x][e(x).as('(')]),_(qs[_[_]],fn[x,l][qs[times(_x,_l)].replace({_x:e(x),_l:l})]),_(qs[_[_,_]],fn[x,l,u][qs[times(_x,_l,_u)].replace({_x:e(x),_l:l,_u:u})]),where*[e=dsl.macroexpand,fb(op,name)(x,y)=qs[_name(_x,_y)].replace({_name:name,_x:x.flatten(op).map(e)/se[_.data=','],_y:e(y)}),b(name)(x,y)=qs[_name(_x,_y)].replace({_name:name,_x:e(x),_y:y}),u(name)(x)=qs[_name(_x)].replace({_name:name,_x:e(x)})]]]}).configuration('parser',function (){this.configure('parser.core parser.c parser.seq parser.alt parser.times parser.opt parser.match parser.bind parser.dsl')});
}