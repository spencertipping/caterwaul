function (gensym_2_gmjcmg62_esep0v){caterwaul.tconfiguration('std','seq.core',function (){this.shallow('seq',{core:fn_[null]/se[_.prototype=[]/se.p[p.constructor=_]]})}).tconfiguration('std opt continuation','seq.finite.core',function (){this.configure('seq.core').seq.finite=fc[xs][this.length=this.l=xs?opt.unroll[i,xs.size?xs.size():xs.length][this[i]=xs[i]]:0]/se.c[c.prototype=new this.seq.core()/se[_.size()=this.l||this.length,_.slice()=[]/se[opt.unroll[i,this.size()][_.push(this[i])]],_.constructor=c]]}).tconfiguration('std opt continuation','seq.finite.serialization',function (){this.configure('seq.finite.core').seq.finite.prototype/se[_.toString()='seq[#{this.slice().join(", ")}]',_.join(x)=this.slice().join(x)]}).tconfiguration('std opt continuation','seq.finite.mutability',function (){l[push=Array.prototype.push,slice=Array.prototype.slice] in this.configure('seq.finite.core').seq.finite.prototype/se[_.push()=l[as=arguments] in opt.unroll[i,as.length][this[this.l++]=as[i]]/re[this.length=this.l,this],_.pop()=this[ --this.l]/se[delete this[this.length=this.l]],_.concat(xs)=new this.constructor(this)/se[_.push.apply(_,slice.call(xs))]]}).tconfiguration('std opt continuation','seq.finite.object',function (){l[own=Object.prototype.hasOwnProperty] in this.configure('seq.finite.core').seq.finite/se[_.keys(o,all)=new _()/se[(function (){for (var k in o)if (all||own.call(o,k))_.push(k)})()],_.values(o,all)=new _()/se[(function (){for (var k in o)if (all||own.call(o,k))_.push(o[k])})()],_.pairs(o,all)=new _()/se[(function (){for (var k in o)if (all||own.call(o,k))_.push([k,o[k]])})()],_.prototype.object(o)=(o||{})/se[this.each(fn[p][_[p[0]]=p[1]])]]}).tconfiguration('std opt continuation','seq.finite.traversal',function (){this.configure('seq.finite.core seq.finite.mutability').seq.finite.prototype/se[_.map(f)=new this.constructor()/se[opt.unroll[i,this.l][_.push(f.call(this,this[i],i))]],_.filter(f)=new this.constructor()/se[opt.unroll[i,this.l][_.push(this[i]),when[f.call(this,this[i],i)]]],_.each(f)=this/se[opt.unroll[i,_.l][f.call(_,_[i],i)]],_.reversed()=new this.constructor()/se[l[l=this.l] in opt.unroll[i,l][_.push(this[l-i-1])]],_.flat_map(f)=new this.constructor()/se[this.each(fn[x,xi][(f.call(this,x,xi)/re.xs[xs.each?xs:new this.constructor(xs)]).each(fn[x][_.push(x)])])],_.foldl(f,x)=l[x=arguments.length>1?x:this[0],xi=2-arguments.length][opt.unroll[i,this.l-xi][x=f.call(this,x,this[i+xi],i+xi)],x,when[this.l>=xi]],_.foldr(f,x)=l[x=arguments.length>1?x:this[this.l-1],xi=3-arguments.length,l=this.l][opt.unroll[i,l-(xi-1)][x=f.call(this,this[l-(i+xi)],x,l-(i+xi))],x,when[l>=xi-1]]]}).tconfiguration('std opt continuation','seq.finite.zip',function (){this.configure('seq.finite.traversal').seq.finite/se[_.prototype.zip()=l[as=new seq([this].concat(slice.call(arguments))),options={f:fn_[new seq(arguments)],outer:false}][caterwaul.util.merge(options,as.pop()),when[as[as.size()-1].constructor===Object],l[l=as.map(fn[x][x.size?x.size():x.length]).foldl(options.outer?fn[x,y][Math.max(x,y)]:fn[x,y][Math.min(x,y)]),f=options.f] in new this.constructor()/se[opt.unroll[i,l][_.push(f.apply({i:i},as.map(fn[x][x[i]]).slice()))]]],where[seq=_,slice=Array.prototype.slice]]}).tconfiguration('std opt continuation','seq.finite.quantification',function (){this.configure('seq.finite.core').seq.finite.prototype/se[_.exists(f)=call/cc[fb[cc][opt.unroll[i,this.l][f.call(this,this[i],i)/re[_&&cc(_)]],false]],_.forall(f)= !this.exists(fn_[ !f.apply(this,arguments)])]}).tconfiguration('std opt continuation','seq.infinite.core',function (){this.configure('seq.core').seq.infinite=fn_[null]/se[_.prototype=new this.seq.core()/se[_.constructor=ctor],where[ctor=_]]/se[_.def(name,ctor,h,t)=i[name]=ctor/se[_.prototype=new i()/se[_.h=h,_.t=t,_.constructor=ctor]],where[i=_],_.def('cons',fn[h,t][this._h=h,this._t=t],fn_[this._h],fn_[this._t]),_.def('k',fn[x][this._x=x],fn_[this._x],fn_[this])]}).tconfiguration('std opt continuation','seq.infinite.y',function (){this.configure('seq.infinite.core').seq.infinite.def('y',fc[f,x][this._f=f,this._x=x],fn_[this._x],fn_[new this.constructor(this._f,this._f(this._x))])}).tconfiguration('std opt continuation','seq.infinite.transform',function (){this.configure('seq.infinite.core').seq.infinite/se[_.prototype.map(f)=new _.map(f,this),_.def('map',fc[f,xs][this._f=f,this._xs=xs],fn_[this._f(this._xs.h())],fn_[new this.constructor(this._f,this._xs.t())]),_.prototype.filter(f)=new _.filter(f,this),_.def('filter',fc[f,xs][this._f=f,this._xs=l*[next(s)(cc)=f(s.h())?cc(s):call/tail[next(s.t())(cc)]] in call/cc[next(xs)]],fn_[this._xs.h()],fn_[new this.constructor(this._f,this._xs.t())])]}).tconfiguration('std opt continuation','seq.infinite.traversal',function (){l[finite=this.configure('seq.finite.core seq.finite.mutability').seq.finite] in this.configure('seq.infinite.core').seq.infinite.prototype/se[_.drop(f)=l*[next(s)(cc)=f(s.h())?call/tail[next(s.t())(cc)]:cc(s)] in call/cc[next(this)],_.take(f)=l*[xs=new finite(),next(s)(cc)=l[h=s.h()][f(h)?(xs.push(h),call/tail[next(s.t())(cc)]):cc(xs)]] in call/cc[next(this)]]}).tconfiguration('std opt continuation','seq.numeric',function (){this.configure('seq.infinite.core seq.infinite.y seq.finite.core').seq/se[_.naturals_from(x)=new _.infinite.y(fn[n][n+1],x),_.naturals=_.naturals_from(0),_.n(l,u,s)=l[lower=arguments.length>1?l:0,upper=arguments.length>1?u:l][l[step=Math.abs(s||1)*(lower<upper?1: -1)] in new _.infinite.y(fn[n][n+step],lower).take(fn[x][(upper-lower)*(upper-x)>0])]]}).tconfiguration('std opt continuation','seq.dsl',function (){this.configure('seq.core seq.infinite.y seq.finite.core seq.finite.zip seq.finite.traversal seq.finite.mutability').seq.dsl=caterwaul.global().clone()/se[_.prefix_substitute(tree,prefix)=tree.rmap(fn[n][new n.constructor('#{prefix}#{n.data.substring(1)}'),when[n.data.charAt(0)==='_']]),_.define_functional(op,expansion,xs)=trees_for(op).map(fn[t,i][_.macro(t,fn[l,v,r][expansion.replace({_x:_.macroexpand(l),_y:i>=8?v:qs[fn[xs][y]].replace({fn:i&2?qs[fb]:qs[fn],xs:_.prefix_substitute(xs,i&1?v.data:'_'),y:(i&4?_.macroexpand:fn[x][x])(r||v)})})])]),_.define_functional/se[_('%',qs[_x.filter(_y)],qs[_,_i]),_('*',qs[_x.map(_y)],qs[_,_i]),_('/',qs[_x.foldl(_y)],qs[_,_0,_i]),_('%!',qs[_x.filter(c(_y))].replace({c:not}),qs[_,_i]),_('*!',qs[_x.each(_y)],qs[_,_i]),_('/!',qs[_x.foldr(_y)],qs[_,_0,_i]),_('&',qs[_x.forall(_y)],qs[_,_i]),_('|',qs[_x.exists(_y)],qs[_,_i]),_('-',qs[_x.flat_map(_y)],qs[_,_i]),_('>>',qs[_x.drop(_y)],qs[_]),_('<<',qs[_x.take(_y)],qs[_]),_('>>>',qs[new caterwaul.seq.infinite.y(_y,_x)],qs[_])],seq(qw('> < >= <= == !=')).each(fn[op][_.macro(qs[_+_].clone()/se[_.data=op],rxy(qs[qg[_x].size()+qg[_y].size()].clone()/se[_.data=op]))]),l[e(x)=_.macroexpand(x)] in _.macro/se[_(qs[_&&_],rxy(qse[qg[l[xp=_x][xp&&xp.size()?_y:xp]]])),_(qs[_||_],rxy(qse[qg[l[xp=_x][xp&&xp.size()?xp:_y]]])),_(qs[_===_],rxy(qs[qg[l[xp=_x,yp=_y][xp===yp||xp.size()===yp.size()&&xp.zip(yp).forall(fn[p][p[0]===p[1]])]]])),_(qs[_!==_],rxy(qs[qg[l[xp=_x,yp=_y][xp!==yp&&(xp.size()!==yp.size()||xp.zip(yp).exists(fn[p][p[0]!==p[1]]))]]])),_(qs[_^_],rxy(qs[_x.zip(_y)])),_(qs[_+_],rxy(qs[_x.concat(_y)])),_(qs[ !_],rxy(qs[_x.object()])),_(qs[_,_],rxy(qs[_x,_y])),_(qs[ ~_],rxy(qs[qg[new caterwaul.seq.finite(_x)]])),_(qs[_?_:_],fn[x,y,z][qs[x?y:z].replace({x:e(x),y:e(y),z:e(z)})]),l[rx(t)(x,y)=t.replace({_x:e(x),_y:y})][_(qs[_(_)],rx(qs[_x(_y)])),_(qs[_[_]],rx(qs[_x[_y]])),_(qs[_._],rx(qs[_x._y])),_(qs[_].as('('),rx(qs[qg[_x]]))],_(qs[ +_],fn[x][x]),l[rx(t)(x)=t.replace({x:x})][_(qs[N],fn_[qs[caterwaul.seq.naturals]]),_(qs[N[_]],rx(qs[caterwaul.seq.naturals_from(x)])),_(qs[n[_]],rx(qs[caterwaul.seq.n(x)]))],seq(qw('sk sv sp')).zip(qw('keys values pairs')).each(fb[p][_(qs[p[_]].replace({p:p[0]}),fn[x][qs[caterwaul.seq.finite.r(x)].replace({r:p[1],x:x})])])],this.rmacro(qs[seq[_]],_.macroexpand),where*[rxy(tree)(x,y)=tree.replace({_x:_.macroexpand(x),_y:y&&_.macroexpand(y)}),seq=fb[xs][new this.seq.finite(xs)],prepend(operator)(x)=qs[ -x].replace({x:x})/se[_.data=operator],tree_forms=l*[base=seq([qs[[_]],qs[_[_]]]),mod(fs,op)=fs.concat(fs.map(prepend(op)))] in mod(mod(base,'u-'),'u~').concat(seq([qs[ +_]])),template(op)(t)=qs[_+x].replace({x:t})/se[_.data=op],qw=caterwaul.util.qw,not=qs[qg[fn[f][fn_[ !f.apply(this,arguments)]]]],trees_for(op)=tree_forms/re[op.charAt(op.length-1)==='!'?_.map(prepend('u!')):_]/re[_.map(template(op.replace(/!$/,'')))]]]}).configuration('seq',function (){this.configure('seq.core seq.finite.core seq.finite.object seq.finite.mutability seq.finite.traversal seq.finite.zip seq.finite.quantification '+'seq.finite.serialization seq.infinite.core seq.infinite.y seq.infinite.transform seq.infinite.traversal '+'seq.numeric seq.dsl')});
}