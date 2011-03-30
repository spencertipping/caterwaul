caterwaul.tconfiguration('std', 'profile', function () {
  this.field('decompile',   profile('decompile',   this.decompile)),
  this.field('compile',     profile('compile',     this.compile)),
  this.field('macroexpand', profile_args('macroexpand', this.macroexpand)),
  this.method('clone',      profile_args('clone',       this.clone)),
  this.method('configure',  profile_args('configure',   this.configure)),

  where*[log                     = typeof console !== 'undefined' ? console/mb/log : print,
         recursion               = {},
         enter(name)             = recursion[name] = (recursion[name] || 0) + 1,
         exit(name)              = --recursion[name],

         profile_args(name, f)() = l[args = arguments] in profile(name, f).apply(this, args) /se[log(Array.prototype.slice.call(args).join(', '))],
         profile(name, f)()      = l[start = +new Date(), result = f.apply(this, arguments)] in result /se[log('#{name} (#{enter(name)}): #{+new Date() - start}ms'), exit(name)]]});
