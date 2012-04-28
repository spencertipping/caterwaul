# Grammar compilation process

Caterwaul 1.3 and prior had a hand-coded parser; this has all of the properties of a parser that had been compiled offline. The advantage of an online grammar compiler is that you can add
custom rules at runtime, useful when doing things like parsing heredocs. The major disadvantage is the speed tradeoff -- JIT-compiling Javascript code is slow.

The initial bootstrap implementation uses regexps as grammar input. The reason is that regexps map directly onto PEGs. But I've also been considering other implementations, in particular
things like using destructuring binds as a way to parse things. For example (and please forgive the notation; I'm sure it will change):

    statement('if',  whitespace(pre), expression(cond), statement(lhs)) = 'if #{pre} (#{cond}) #{lhs}'.x,
    statement('var', statement(lhs)) = 'var #{lhs}'.x,
    statement('for', whitespace(pre), statement(init), expression(cond), expression(inc), statement(body)) = 'for #{pre} (#{init} #{cond}; #{inc}) #{body}'