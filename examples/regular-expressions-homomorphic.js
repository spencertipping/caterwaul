d(/foo/)('foo')                   // => ['foo']
d(/foo/)(['foo', 'bar'])          // => [['foo'], null]
d(/foo/)('foo', 'food')           // => ['foo', 'foo']

d(/f(o)o/)('foo')                 // => ['foo', 'o']
d(/f(o)o/)(['foo', 'bar'])        // => [['foo', 'o'], null]
d(/fo(.)/)('foo', 'foad')         // => ['foo', 'o', 'foa', 'a']

d(/foo/)({bar: 'foo'})            // => {bar: ['foo']}
d(/foo/)({bar: 'bar'})            // => {bar: null}