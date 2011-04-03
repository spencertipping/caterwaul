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

//   The likelihood of _ occurring in the source is infinity because _ matches anything. Therefore it contains no information. If the probabilities were normalized, this value would be 1.

    var context_free_probability_model = function (tree) {var r = {}; tree.reach(function (node) {var d = node.data; r[d] = (r[d] || 0) + 1}); r._ = Infinity; return r},

//   Heterogeneous tree forms.
//   Most of the time heterogeneity doesn't matter. The reason for this is that there are few variadic nodes. However, they do sometimes come up. One case is 'return', which sometimes occurs
//   without a child. In this case we might have macro patterns like this:

//   | (return (foo))
//     (return)

//   We'll obviously have to compare the 'return' first, but what happens with the subtree in the first case? The answer is that the tree length is compared when the data is. This gives us an
//   extra bailout condition. So comparing the 'return' will eliminate one possibility or the other, since the length check will fail for one of them. So we have a nice invariant: All trees under
//   consideration will have the same shape.

//   This check isn't reflected in the traversal path construction below, but it is generated in the final pattern-matching code. It's also generated in the intermediate treeset object
//   representation.

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

//   Paths are represented as strings, each of whose characters' charCodes is an index into a subtree. The empty string refers to the root. I'm encoding it this way so that paths can be used as
//   hash keys, which makes it very fast to determine which paths have already been looked up.

//   Treeset partitions are returned as objects that map the arity and data to an array of trees. The arity is encoded as a single character whose charCode is the actual arity. So, for example,
//   partition_treeset() might return this object:

//   | {'\002+': [(+ (x) (y)), (+ (x) (z))],
//      '\002-': [(- (x) (y)), (- (x) (z))]}

    resolve_tree_path = function (tree,  path) {for (var i = 0, l = path.length; i < l; ++i) if (! (tree = tree[path.charCodeAt(i)])) return tree; return tree},
    partition_treeset = function (trees, path) {for (var r = {}, i = 0, l = trees.length, t, ti; i < l; ++i)
                                                  (t = resolve_path(ti = trees[i], path)) ? (t = String.fromCharCode(t.length) + (t = t.data)) : (t = ''), (r[t] || (r[t] = [])).push(ti);
                                                return r},

//   Pathfinder logic.
//   The idea here is to maintain a list of available paths given a treeset and a list of paths that we've already taken. (The rule is that we can append exactly one dereference to any path that
//   exists, but we can't end up with something we've already seen.) So there are two hashes. One stores visited paths, the other stores available paths to visit. This logic /should/ use a
//   minheap for good amortized performance, but I don't see this being much of a bottleneck so I'm being lazy and using a quadratic algorithm. (Won't be a problem unless you have huge macro
//   patterns.)

//   For optimization's sake the hash of visited paths maps each path to the arity of the tree that it points to. This makes it very easy to generate adjacent paths without doing a whole bunch of
//   path resolution. available_paths() returns an array of paths, each encoded as a string, and in no particular order. Note that this isn't well-defined for nodes that we haven't visited, since
//   sometimes nodes that share a path will have different arities. This gets resolved by partitioning, at which point the treeset is split into uniform-arity subsets.

    available_paths  = function (visited)             {var result = []; for (var k in visited) if (visited.hasOwnProperty(k)) for (var i = 0, l = visited[k], p; i < l; ++i)
                                                                          visited[p = k + String.fromCharCode(i)] || result.push(p); return result},

    path_probability = function (path,  trees, model) {for (var total = 0, uniques = {}, i = 0, l = trees.length; i < l; ++i) uniques[resolve_tree_path(trees[i], path).data] = true;
                                                       for (var k in uniques) total += model[k] || 0; return total},

    best_path        = function (paths, trees, model) {for (var min = Infinity, mi = 0, i = 0, l = paths.length, p; i < l; ++i)
                                                         if ((p = path_probability(paths[i], trees, model)) < min) min = p, mi = i; return mi}

//   Code generation.
//   This is the last step and it's where the algorithm finally comes together. Two big things are going on here. One is the traversal process, which combines available_paths, best_path, and
//   probability modeling into one coherent process that builds the piecewise traversal order. The other is the code generation process, which conses up a code tree according to the treeset
//   partitioning that guides the traversal. These two processes happen in parallel.

//   The original JIT design goes over a lot of the code generation, but I'm duplicating it here for clarity.

//     Partition encoding.
//     Each time we partition the tree set, we generate a switch() statement. The switch operates both on arity and on the data, just like the partitions would suggest. (However these two things
//     are separate conditionals, unlike their representation in the partition map.) The layout looks like this:

//     | switch (tree.length) {
//         case 0:
//           switch (tree.data) {
//             case 'foo': ...
//             case 'bar': ...
//           }
//           return false;
//         case 1:
//           switch (tree.data) {
//             case 'bif': ...
//             case 'baz': ...
//           }
//           return false;
//       }

//     No 'break' statements are emitted because each branch is guaranteed to terminate with a 'return'. (If 'return false' is reached, it means that the macro didn't match.)

//     Macroexpander invocation encoding.
//     The actual macroexpander functions are invoked by embedding ref nodes in the syntax tree. If one function fails, it's important to continue processing with whatever assumptions have been
//     made. (This is actually one of the trickier points of this implementation.)
// Generated by SDoc 
