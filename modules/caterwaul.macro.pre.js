caterwaul.tconfiguration('std.qs std.fn std.bind','macro.defmacro',function (){l[wildcard=fn[n][n.data.constructor===String&&n.data.charAt(0)==='_'&&'_']] in this.macro(qs[defmacro[_][_]],fn[pattern,expansion][this.rmacro(pattern,this.compile(this.macroexpand(expansion))),qs[null]]).macro(qs[defsubst[_][_]],fn[pattern,expansion][this.rmacro(pattern.rmap(wildcard),l[wildcards=pattern.collect(wildcard)] in fn_[l[hash={},as=arguments][this.util.map(fn[v,i][hash[v.data]=as[i]],wildcards),expansion.replace(hash)]]),qs[null]])}).tconfiguration('std.qs std.fn std.bind','macro.with_gensyms',function (){this.rmacro(qs[with_gensyms[_][_]],fn[vars,expansion][l[bindings={}][vars.flatten(',').each(fb[v][bindings[v.data]=this.gensym()]),qs[qs[_]].replace({_:expansion.replace(bindings)})]])}).tconfiguration('std.qs std.fn','macro.compile_eval',function (){this.macro(qs[compile_eval[_]],fn[e][new this.ref(this.compile(this.macroexpand(qs[fn_[_]].replace({_:e}))).call(this))])}).configuration('macro',function (){this.configure('macro.defmacro macro.with_gensyms macro.compile_eval')});
