// Global management.
// Caterwaul creates a global symbol, caterwaul. Like jQuery, there's a mechanism to get the original one back if you don't want to replace it. You can call caterwaul.deglobalize() to return
// caterwaul and restore the global that was there when Caterwaul was loaded (might be useful in the unlikely event that someone else named their library Caterwaul). Note that deglobalize() is
// available only on the global caterwaul() function. It wouldn't make much sense for clones to inherit it.

  var caterwaul_global = caterwaul = (function () {var _caterwaul = typeof caterwaul === 'undefined' ? undefined : caterwaul;
                                                   return se(configurable(), function () {this.deglobalize = function () {caterwaul = _caterwaul; return this}})})();

// Uniqueness and identification.
// Caterwaul has a number of features that require it to be able to identify caterwaul functions and easily distinguish between them. These methods provide a way to do that.

  caterwaul_global.method('global', function () {return caterwaul_global}).method('id', function () {return this._id || (this._id = genint())}).
                    field('is_caterwaul', is_caterwaul).field('initializer', initializer).field('unique', unique).field('gensym', gensym).field('genint', genint).

                   method('reinitialize', function (transform, erase_configurations) {var c = transform(this.initializer), result = c(c, this.unique).deglobalize();
                                                                                      erase_configurations || (result.configurations = this.configurations); return result}).

// Magic.
// Sometimes you need to grab a unique value that is unlikely to exist elsewhere. Caterwaul gives you such a value given a string. These values are shared across all Caterwaul instances and are
// considered to be opaque. Because of the possibility of namespace collisions, you should name your magic after a configuration or otherwise prefix it somehow.

                   method('magic', (function (table) {return function (name) {return table[name] || (table[name] = {})}}));
// Generated by SDoc 