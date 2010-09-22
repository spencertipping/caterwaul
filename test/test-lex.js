var l = divergence.lex;

assert(l('foo').length === 1, 'foo: number of tokens');
assert(l('foo')[0] === 'foo', 'foo: correct token');
assert(l('foo bar').length === 2, 'foo bar: number of tokens');
assert(l('foo bar')[0] === 'foo', 'foo bar: correct token[0]');
assert(l('foo bar')[1] === 'bar', 'foo bar: correct token[1]');

assert(l('3.141592')[0] === '3.141592', '3.141592: single token');
assert(l('3')[0] === '3', '3: single token');
assert(l('3+5')[0] === '3', '3+5: correct token[0]');
assert(l('3+5')[1] === '+', '3+5: correct token[1]');
assert(l('3+5')[2] === '5', '3+5: correct token[2]');

assert(false, 'blow up');
