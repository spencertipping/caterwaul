caterwaul.tconfiguration('std', 'profile', function () {
  this.field('decompile',   profile('decompile',   this.decompile)),
  this.field('compile',     profile('compile',     this.compile)),
  this.field('macroexpand', profile('macroexpand', this.macroexpand)),

  where*[log                = typeof console !== 'undefined' ? console/mb/log : print,
         profile(name, f)() = l[start = +new Date(), result = f.apply(this, arguments)] in result /se[log('#{name}: #{+new Date() - start}ms')]]});
