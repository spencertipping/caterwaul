caterwaul.tconfiguration('std', 'profile', function () {
  this.field('decompile',  this.decompile),
  this.field('compile',    this.compile),
  this.method('clone',     this.clone),
  this.method('configure', this.configure),

  this.method('macroexpand', profile('macroexpand', this.macroexpand)),

  setTimeout(fn_[log(total_complexity)], 0),

  where*[log_function                = typeof console !== 'undefined' ? console/mb/log : print,
         log(x)                      = log_function(x) /re[x],
         icount(c)                   = c.invocation_count && c.invocation_count(),

         total_complexity            = 0,

         icount_stack                = [],

         enter(c, t)                 = icount_stack.push(icount(c)),
         exit(c, t)                  = log('#{complexity_of(t)} #{(icount(c) - icount_stack.pop()) / c.macro_patterns.length}')
                                       /se[icount_stack.length || (total_complexity += complexity_of(t))],

         complexity_of(tree)         = l[total = 1] in tree.reach(fn_[++total]) /re[total],
         profile(name, f)(t)         = enter(this, t) && f.apply(this, arguments) /se[exit(this, t)]]});
