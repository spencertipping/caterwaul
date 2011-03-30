caterwaul.tconfiguration('std', 'profile', function () {
  this.field('decompile',  profile_all ? profile('decompile',      this.decompile) : this.decompile),
  this.field('compile',    profile_all ? profile('compile',        this.compile)   : this.compile),
  this.method('clone',     profile_all ? profile_args('clone',     this.clone)     : this.clone),
  this.method('configure', profile_all ? profile_args('configure', this.configure) : this.configure),

  this.method('macroexpand', profile_tree('macroexpand', this.macroexpand)),

  where*[profile_all                 = false,
  
         log_function                = typeof console !== 'undefined' ? console/mb/log : print,
         log(x)                      = log_function(x) /re[x],
         recursion                   = 0,
         icounts                     = [],
         timings                     = [],
         enter(name, c)              = '(#{recursion++} / #{icount(c) - icounts[icounts.length - 1] || 0} / #{+new Date() - timings[timings.length - 1] || 0}ms)'
                                       /se[icounts.push(icount(c)), timings.push(+new Date())],
         exit(name, c)               = '(#{--recursion} / #{icount(c) - icounts.pop()} / #{+new Date() - timings.pop()}ms)',

         icount(c)                   = c.invocation_count && c.invocation_count(),

         complexity_of(tree)         = l[total = 1] in tree.reach(fn_[++total]) /re[total],
         profile_tree(name, f)(tree) = profile(name, f).apply(this, arguments /se[log(tree.serialize())]) /se[log('#{complexity_of(tree)}: #{tree.serialize()}')],

         profile_args(name, f)()     = l[args = arguments] in profile(name, f).apply(this, args /se[log(Array.prototype.slice.call(args).join(', '))])
                                                              /se[log(Array.prototype.slice.call(args).join(', '))],

         profile(name, f)()          = log('entering #{name} #{enter(name, this)}') && f.apply(this, arguments) /se[log('#{name} #{exit(name, this)}')]]});
