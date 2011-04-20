// Environment-dependent compilation.
// It's possible to bind variables from 'here' (i.e. this runtime environment) inside a compiled function. The way we do it is to create a closure using a gensym. (Another reason that gensyms
// must really be unique.) Here's the idea. We use the Function constructor to create an outer function, bind a bunch of variables directly within that scope, and return the function we're
// compiling. The variables correspond to gensyms placed in the code, so the code will have closure over those variables.

// An optional second parameter 'environment' can contain a hash of variable->value bindings. These will be defined as locals within the compiled function.

// New in caterwaul 0.6.5 is the ability to specify a 'this' binding to set the context of the expression being evaluated.

// Caterwaul 1.0 introduces the 'globals' attribute, which lets you set global variables that will automatically be present when compiling syntax trees. Note that using this feature can prevent
// precompilation, since the global references may not be serializable (and they are included in precompiled code).

  caterwaul_global.shallow('globals', {}).method('compile',
    function (tree, environment) {var vars = [], values = [], bindings = merge({}, this.globals, environment || {}, tree.bindings()), s = gensym();
                                  for (var k in bindings) if (own.call(bindings, k)) vars.push(k), values.push(bindings[k]);
                                  var code = map(function (v) {return v === 'this' ? '' : 'var ' + v + '=' + s + '.' + v}, vars).join(';') + ';return(' + tree.serialize() + ')';
                                  try {return (new Function(s, code)).call(bindings['this'], bindings)} catch (e) {throw new Error('caught ' + e + ' while compiling ' + code)}});
// Generated by SDoc 
