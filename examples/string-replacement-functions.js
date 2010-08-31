d('/foo/bar')('foobar')                 // => 'barbar'
d('/f(o)o/b$1r')('foobar')              // => 'borbar'

// Multiple replacements are also possible:
d('/foo/bar; /bif/baz')('foobif')       // => 'barbaz'

// And conditionals:
d('/foo/bar && /bif/baz')('foobif')     // => 'barbaz'
d('/foo/bar && /bif/baz')('forbif')     // => 'forbif'
d('/foo/bar || /bif/baz')('foobif')     // => 'barbif'