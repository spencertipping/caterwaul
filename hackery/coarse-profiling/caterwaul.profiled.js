caterwaul.tconfiguration('std', 'profile', function () {
  this.field('decompile',  this.decompile),
  this.field('compile',    this.compile),
  this.method('clone',     this.clone),
  this.method('configure', this.configure),

  this.method('macroexpand', profile('macroexpand', this.macroexpand)),

  where*[log_function                = typeof console !== 'undefined' ? console/mb/log : print,
         log(x)                      = log_function(x) /re[x],
         icount(c)                   = c.invocation_count && c.invocation_count(),

         total_icount                = 0,
         total_complexity            = 0,

         complexity_of(tree)         = l[total = 1] in tree.reach(fn_[++total]) /re[total],

         profile(name, f)(t)         = f.apply(this, arguments) /se[log('#{total_icount += icount(this)} #{total_complexity += complexity_of(t)}')]]});
