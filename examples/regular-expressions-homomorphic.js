d(/foo/)('foo')           // => ['foo']
d(/foo/)(['foo', 'bar'])  // => [['foo'], null]
d(/foo/)('foo', 'food')   // => ['foo', 'foo']