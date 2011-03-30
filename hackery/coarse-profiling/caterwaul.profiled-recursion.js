caterwaul.tconfiguration('std', 'profile', function () {
  this.field('decompile',  this.decompile),
  this.field('compile',    this.compile),
  this.method('clone',     this.clone),
  this.method('configure', this.configure),

  this.method('macroexpand', profile('macroexpand', this.macroexpand)),

  setTimeout(fn_[log(icount(caterwaul))], 0),

  where*[log_function                = typeof console !== 'undefined' ? console/mb/log : print,
         log(x)                      = log_function(x) /re[x],
         recursion                   = 0,
         last_icount                 = 0,
         icounts                     = [],
         enter(name, c)              = '(#{icount_delta(c)} / #{icount(c) - icounts[icounts.length - 1] || 0})    ' /se[++recursion, icounts.push(icount(c))],
         exit(name, c)               = '(#{icount_delta(c)} / #{icount(c) - icounts.pop()})    ' /se[--recursion],

         spaces(n)                   = n ? ' ' + spaces(n - 1) : '',

         icount_delta(c)             = -(last_icount - icount(c) /se[last_icount = _]),
         icount(c)                   = c.invocation_count && c.invocation_count(),

         complexity_of(tree)         = l[total = 1] in tree.reach(fn_[++total]) /re[total],

         profile(name, f)(t)         = log('#{spaces(recursion)}#{name} #{enter(name, this)}: #{complexity_of(t)}: #{t.serialize()}') &&
                                       f.apply(this, arguments) /se[log('#{spaces(recursion - 1)}#{name} #{exit(name, this)}: #{complexity_of(_)}: #{_.serialize()}')]]});
