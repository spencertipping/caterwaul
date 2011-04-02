// JIT macroexpander.
// I started designing a JIT macroexpander with probability weighting, but the design was probably more complex than necessary. (It's in sdoc::js::core/caterwaul.macroexpander.jit-probabilistic
// if you're curious.) Probabilistic weighting definitely has merit for influencing the order of decisional cases, but it doesn't necessarily matter for deciding the order of comparisons. The
// reason for this is interesting and possibly incorrect.

//   Irrelevance of discrimination.
//   Suppose you have two macro trees, each with the same form (i.e. same arity of each node and same wildcard positions). I propose that the traversal order doesn't require any extensive
//   optimization beyond one thing: How much information is being gained per comparison? This is very different from discrimination, which was the focus of the probabilistic JIT macroexpander
//   design. Here is an example.

//   | (, (_) (* (where) ([] ([ (=  (_) (_))))))               <- the macro patterns
//     (, (_) (* (where) ([] ([ (== (_) (_))))))
//   
//   Suppose we run into a syntax tree that starts with ','. The likelihood of a comma occurring anyway is P(','), so we now have 1 / P(',') information. It doesn't matter that this fails to
//   discriminate between the two macro patterns. We needed to know it anyway if we were going to perform a match, and it let us jump out early if it wasn't there. The left-hand side of each
//   expansion tells us nothing, so we don't bother inspecting that yet. We instead go to the right-hand side, which we'll reject with probability (1 - P('*')). We then follow the right-hand side
//   recursively downwards, continuing to match the non-wildcard nodes.

//   Once all non-wildcard nodes are matched, we will have eliminated one macro pattern or the other. (This won't be true if we have overlapping macro definitions, but it is in this case.) At
//   that point we will have both verified the macro pattern and reduced the macro-space as much as possible.

//   Minimal-probability ordering.
//   Most syntax nodes don't match macro patterns. This is important; it means that we'll end up bailing out of a macro search most of the time. Therefore it's worthwhile to detect bailout cases
//   quickly. Fortunately there's an easy way to do this. When we're confronted with a tree, we order the comparisons so that we first look at the subtree that has the lowest likelihood of
//   occurring randomly in the code. For example:

//   | (+ (* (a) (_)) (% (a) (_)))                 <- the macro patterns
//     (+ (* (a) (_)) (/ (a) (_)))

//   Let's suppose that P('*') < P('%') + P('/'). That is, the code has more % and / operators combined than *. Then the first thing to check is the * node, then. This is more likely to give us a
//   bailout case than checking the other subtree. If this subtree matches, then we consider all of the next options. We take the lowest-probability comparison next, etc, until we have matched
//   against all of the positive-information components in the macro pattern. (Positive-information things are non-wildcards.)

//   Context-free probabilistic model.
//   When we're building the probabilistic model during the initial pass, we're not tracking anything about the context of each node. This ends up being kind of important for making assumptions
//   later on. For instance, it's tempting to try to strategically optimize the decision process to end up with faster rejection criteria. For example, if we had these macros:

//   | (+ (% (a) (_)) (* (_) (_)))
//     (+ (/ (a) (_)) (* (_) (_)))

//   It's arguably more useful to decide the [0] subtree first, even though it has a lower bailout probability. The reason is that it gets us to the (a) subtree, which has a very high probability
//   of bailout. However, we don't know what kind of context might be in the original syntax trees. It's entirely possible that every time you have a % node, its left-hand side is an (a) -- and
//   without tracking this in the probabilistic analysis we'd be incorrectly assuming that the two events were independent.

//   It's important to realize that the problem isn't entirely solved by using naive greedy optimization, but I feel like it represents the assumptions better than a more advanced strategy would.

//   Note that in implementation we don't adjust the probabilities to be between 0 and 1. The reason for this is that we don't actually care about the values themselves, just their ordering. And
//   of course the ordering is the same whether or not we normalize the values, so we can save a step.

    var context_free_probability_model = function (tree) {var result = {}; tree.reach(function (node) {var d = node.data; result[d] = (result[d] || 0) + 1}); return result},

//   Heterogeneous tree forms.
//   Most of the time heterogeneity doesn't matter. The reason for this is that there are few variadic nodes. However, they do sometimes come up. One case is 'return', which sometimes occurs
//   without a child. In this case we might have macro patterns like this:

//   | (return (foo))
//     (return)

//   We'll obviously have to compare the 'return' first, but what happens with the subtree in the first case? The answer is that the tree length is compared when the data is. This gives us an
//   extra bailout condition. So comparing the 'return' will eliminate one possibility or the other, since the length check will fail for one of them. So we have a nice invariant: All trees under
//   consideration will have the same shape.

//   This check isn't reflected in the traversal path construction below, but it is generated in the final pattern-matching code.

//   Traversal path.
//   The pattern matcher uses both depth-first and breadth-first traversal of the pattern space. The idea is that each motion through the tree is fairly expensive, so we do a comparison at each
//   point. However, we can decide which branch to progress down without losing progress. For example, suppose we have this:

//   | (+ (* (a) (b)) (/ (a) (b)))

//   The first comparison to happen is +, regardless of what the rest of the tree looks like. If we don't bail out, then without loss of generality suppose we take the * branch. At this point we
//   have two nodes stored in local variables; one is the root + node, and the other is the child * node. The total child set is now (a), (b), and (/ (a) (b)). We take whichever one of these
//   children is most likely to bail out, which let's suppose is (b). Because (b) has no children, we now have (a) and (/ (a) (b)). Now suppose that / is the next lowest-probability symbol; we
//   then visit that node, producing the children (a) and (b). (b) is the lower-probability one, so we test that, leaving the total child list at (a), (a). The order of these last two comparisons
//   doesn't matter.

//   We need an intermediate representation for the path-finder decisions. The reason is that these decisions are used to both (1) partition the tree set, and (2) generate code. (2) isn't
//   particularly difficult using just stack-local data, but (1) ends up being tricky because of the potential for breadth-first searching. The problem is a subtle one but is demonstrated by this
//   example:

//   | (+ (* (/ (a) (b)) (c)) (+ (a) (b)))
//     (+ (* (* (a) (b)) (c)) (- (a) (b)))

//   Suppose here that P('*') < P('+') + P('-'), so it makes sense to search subtree [0] first. Further, suppose that P('/') + P('*') < P('+') + P('-'), so we end up progressing into subtree
//   [0][0]. At this point we'll create a branch, so we have partitioned the original tree space into two fragments. As such, we need to know to ask for just the probability of '+' or '-' on its
//   own, not the sum, since we'll be able to bail out immediately if the wrong one is present. This kind of coupling means that we need to be able to query the original trees in their entirety
//   and from the root point. This in turn requires a logical path representation that can be used to both partition trees, and to later generate code to do the same thing. (An interesting
//   question is why we wouldn't use the JIT to do this for us. It would be a cool solution, but I think it would also be very slow to independently compile that many functions.)

//   For simplicity's sake I'm using arrays of numbers to represent paths. The empty array indicates the root node.

    resolve_path      = function (tree,  path) {for (var i = 0, l = path.length; i < l; ++i) if (! (tree = tree[path[i]])) return tree; return tree},
    partition_treeset = function (trees, path) {for (var r = {}, i = 0, l = trees.length, t, ti; i < l; ++i) (t = resolve_path(ti = trees[i], path)) ? (t = t.data) : (t = ''),
                                                                                                             (r[t] || (r[t] = [])).push(ti); return r},

//     
// Generated by SDoc 
