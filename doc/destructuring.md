# Destructuring binds

Destructuring binds are used to pull pieces out of an expression. Roughly, this corresponds to a kind of tree extraction; the destructuring expression's job is to identify some subset of nodes
and bind them within the context of a different expression. For example, here are some trivial cases:

    f([a, b])        /= a + b     <- destructuring over arrays
    f({x: a, y: b})  /= a + b     <- destructuring over objects
    f(a, b)          /= a + b     <- destructuring over arity
    f(new foo(a, b)) /= a + b     <- destructuring over construction

Each of these cases is written with /= instead of = to indicate that the mapping is piecewise, not complete. Caterwaul fuses piecewise operations into a single function, preferring
alternatives from last to first.

## Composable destructuring

Destructuring should apply across quasi-isomorphic abstraction. For cases where the abstraction isn't isomorphic, it can be coerced into a deterministic projection (similar to the process
for disambiguating PEGs). For example:

    f([a, b])    /= {x: a, y: b},
    g(f([a, b])) /= a + b,
    g({x: 5, y: 8})             <- returns 13

Destructuring should also respect runtime changes to those abstractions. For example:

    accept_objects()    = f({x: a, y: b}) /= new foo(a, b),
    accept_arrays()     = f([a, b]) /= new foo(a, b),
    f()                /= null,
    g(f([a, b]))       /= a + b,
    g(f({x: a, y: b})) /= a * b

The reassignment of f() needs to impact any destructuring binds made by g().

## Upper-bound of variance

There is a limit to how first-class destructuring binds can be. The set of variables introduced into a scope must be determined at compile-time and should be a runtime invariant. This
requires the macroexpander to have a complete set of binding combinators, most likely things like {} and []. It further requires that the macroexpander be able to generate code that handles
the detection and destructuring operations, making this also a runtime invariant.

## Implementation challenges

In order to use destructuring to implement an efficient parser, one would need to implement some sort of memoization stored in the parse state. Doing this requires two things. First, the
parse state needs to be communciated through the destructuring mechanism; second, the memo table must be updated as destructuring operations are occurring, regardless of whether they are
successful. (!) This means providing an interface by which side-effects can happen, ideally transparently, as intermediate results of the matching process.

This isn't as simple as it sounds because destructuring must be erased during compilation. So the interface into runtime state-space must be static. Therefore, destructuring is a wrapper
around method calls, not a simple assignment-statement generator:

    f(g(x))     = E[x]          <- caterwaul.unapply.fn(g)(v, o) = g.unapply(v)
    f(new g(x)) = E[x]          <- caterwaul.unapply.ctor(c)(v, o) = c.unnew(v)
    f([x])      = E[x]          <- caterwaul.unapply.array(pattern)(x', o)
    f({foo: x}) = E[x]          <- caterwaul.unapply.object(pattern)(x', o)     <- the role of 'o' is explained in 'Optimization'

More complex cases require some consideration:

    f([x, y, ..., z])           <- the unapply() method needs to be aware of the pattern

Patterns presented to unapply() methods must have their variable names addressed anonymously. This is a result of the variance bound discussed above. So the unapply() method for arrays would
be presented with an erased syntax tree like this:

    [_gensym_1, _gensym_2, ..., _gensym_3]

The unapply() method would then return an object of the form {_gensym_1: value_1, _gensym_2: value_2, _gensym_3: value_3}, or it would return a falsy value to indicate that the match is not
possible. This indirection is especially important when dealing with sub-patterns. For example:

    f([new foo(x)])             <- array unapply is presented with [_gensym], that _gensym is then used to unapply the constructor

The important thing here is that the array's unapply is unaware of the constructor's unapply. Unapplication homomorphism is another runtime invariant.

## Unapplication of functions

Function unapplication follows this relation:

    [f(x) = y] -> [f.unapply(y) = x]

Destructuring should be possible for each side of the equation; in other words, definition of an unapply() method is orthogonal to the destructuring step itself. For example:

    f([a, bs...]) = {x: a, y: bs}
    f.unapply({x: a, y: bs}) = [a, bs...]

This means that any destructuring syntax must also be usable to construct objects.

## Optimization

It's expensive to cons up a new object each time a function is called. Fortunately, we don't have to in certain cases. The same object can be reused for every invocation of a given function
because the match variables will quickly be assigned into locals. For example:

    f([a, b]) /= a + b          -> f(x, d = destructure(x, o), a = d._gensym_1, b = d._gensym_2, d._gensym_1 = null, d._gensym_2 = null) = a + b,
                                   where [destructure = caterwaul.unapply.array(qs[[_gensym_1, _gensym_2]]),
                                          o           = {_gensym_1: null, _gensym_2: null}]

This strategy fails for recursive destructuring, however. Consider what would happen if we said g(f(f(x))) /= E[x], for instance. The inner f() destructuring would side-effectfully
obliterate bindings from the outer invocation. Only non-recursive destructuring invocations are eligible for this optimization.