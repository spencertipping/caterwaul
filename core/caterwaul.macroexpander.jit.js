// JIT macroexpander.
// This macroexpander examines the syntax trees used as macro patterns, constructs a breadth-first decision tree, and JITs a custom macroexpander function for those trees. Because this is a
// fairly tine-consuming operation the process is memoized in the macro list.

// At first I was using a context-free probabilistic model to optimize the order of decisions, but this requires knowing something about the syntax tree -- which means that each macroexpand()
// call involves generating a new function. This proved to be very expensive (worse than naive macroexpansion!), so I'm going with a model that can be used without knowing anything about the
// syntax trees being transformed.

// For history's sake I've left some of the theoretical notes involving probability, but in practice we don't know what the probability will be when we're building the decision tree.

  var jit_macroexpander = (function () {

//   Irrelevance of discrimination.
//   Suppose you have two macro trees, each with the same form (i.e. same arity of each node and same wildcard positions). I propose that the traversal order doesn't require any extensive
//   optimization beyond one thing: How much information is being gained per comparison? This is very different from discrimination, which was the focus of the probabilistic JIT macroexpander
//   design. Here is an example.

//   | (, (_) (* (where) ([] ([ (=  (_) (_))))))               <- the macro patterns
//     (, (_) (* (where) ([] ([ (== (_) (_))))))

//   Suppose we run into a syntax tree that starts with ','. The likelihood of a comma occurring anyway is P(','), so we now have 1 / P(',') information. It doesn't matter that this fails to
//   discriminate between the two macro patterns. We needed to know it anyway if we were going to perform a match, and it let us jump out early if it wasn't there. The left-hand side of each
//   expansion tells us nothing, so we don't bother inspecting that yet. We instead go to the right-hand side, which we'll reject with probability (1 - P('*')). We then follow the right-hand side
//   recursively downwards, continuing to match the non-wildcard nodes.

//   Once all non-wildcard nodes are matched, we will have eliminated one macro pattern or the other. (This won't be true if we have overlapping macro definitions, but it is in this case.) At
//   that point we will have both verified the macro pattern and reduced the macro-space as much as possible.

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

//   Suppose here that we search subtree [0] first. Further, suppose that we end up progressing into subtree [0][0]. At this point we'll create a branch, so we have partitioned the original tree
//   space into two fragments. As such, we need to know to ask for just the probability of '+' or '-' on its own, not the sum, since we'll be able to bail out immediately if the wrong one is
//   present. This kind of coupling means that we need to be able to query the original trees in their entirety and from the root point. This in turn requires a logical path representation that
//   can be used to both partition trees, and to later generate code to do the same thing. (An interesting question is why we wouldn't use the JIT to do this for us. It would be a cool solution,
//   but I think it would also be very slow to independently compile that many functions.)

//   Paths are represented as strings, each of whose characters' charCodes is an index into a subtree. The empty string refers to the root. I'm encoding it this way so that paths can be used as
//   hash keys, which makes it very fast to determine which paths have already been looked up. Also, most macro paths will be fewer than five characters, so even on eager-consing runtimes the
//   quadratic nature of it isn't that bad.

//   Treeset partitions are returned as objects that map the arity and data to an array of trees. The arity is encoded as a single character whose charCode is the actual arity. So, for example,
//   partition_treeset() might return this object:

//   | {'\002+': [(+ (x) (y)), (+ (x) (z))],
//      '\002-': [(- (x) (y)), (- (x) (z))]}

    var resolve_tree_path = function (tree,  path) {for (var i = 0, l = path.length; i < l; ++i) if (! (tree = tree[path.charCodeAt(i)])) return tree; return tree},
        partition_treeset = function (trees, path) {for (var r = {}, i = 0, l = trees.length, t, ti; i < l; ++i)
                                                        (t = resolve_tree_path(ti = trees[i], path)) ? (t = String.fromCharCode(t.length) + t.data) : (t = ''), (r[t] || (r[t] = [])).push(ti);
                                                    return r},

//   Pathfinder logic.
//   For optimization's sake the hash of visited paths maps each path to the arity of the tree that it points to. This makes it very easy to generate adjacent paths without doing a whole bunch of
//   path resolution.

//   Partitioning is done by visit_path, which first partitions the tree-space along the path, and then returns new visited[] hashes along with the partitions. The visited[] hash ends up being
//   split because different partitions will have different traversal orders. In practice this means that we copy visited[] into several new hashes. The other reason we need to split visited[] is
//   that the arity of the path may be different per partition. So the result of visit_path looks like this:

//   | {'aritydata': {visited: {new_visited_hash}, trees: [...]},
//      'aritydata': ...}

//   The base case is when there is no visited history; then we return '' to get the process started with the root path.

//   As explained in 'Full specification detection', next_path needs to skip over any paths that refer to wildcards.

    next_path = function (visited, trees) {if (! visited) return '';
                                           for (var k in visited) if (visited.hasOwnProperty(k)) for (var i = 0, l = visited[k], p; i < l; ++i)
                                             if (! ((p = k + String.fromCharCode(i)) in visited)) {
                                               for (var j = 0, lj = trees.length, skip; j < lj; ++j) if (skip = resolve_tree_path(trees[j], p).data === '_') break;
                                               if (! skip) return p}},

    visit_path = function (path, visited, trees) {var partitions = partition_treeset(trees, path), kv = function (k, v) {var r = {}; r[k] = v; return r};
                                                  for (var k in partitions) if (partitions.hasOwnProperty(k))
                                                      partitions[k] = {trees: partitions[k], visited: merge({}, visited, kv(path, k.charCodeAt(0)))};
                                                  return partitions},

//   Full specification detection.
//   Sometimes no path resolves the treeset. At that point one or more trees are fully specified, so we need to find and remove those trees from the list. This will produce an array of results
//   [treeset, treeset, treeset, ...]. The property is that each treeset will contain trees that either (1) are all fully specified with respect to the set of visited paths, or (2) are all not
//   fully specified with respect to the paths. Order is also preserved from the original treeset.

//   Note that the first treeset always represents trees which are not fully specified, then each subsequent treeset alternates in its specification. This way you can use a shorthand such as i&1
//   to determine whether a given treeset is final. (Because of all of this, the first treeset may be empty. All other ones, if they exist, will be populated.)

//   This is actually a much more straightforward task than it sounds like, because the number of non-wildcard nodes for each tree is already stored in pattern_data. This means that we just need
//   to find trees for which the number of non-wildcard nodes equals the number of visited paths.

//   There's a kind of pathological case that also needs to be considered. Suppose you've got a couple of macro patterns like this:

//   | (a (b) (_))
//     (a (_) (b))

//   In this case we may very well have to try both even though technically neither tree will be specified yet (and hence we don't think there's any ambiguity). The way to address this is to make
//   sure that any trees we put into an 'unspecified' partition are all unspecified in the same place. So the two trees above would go into separate partitions, even though they're both
//   unspecified. Then next_path() will be able to provide a single path that increases specificity, not one that hits a wildcard.

//   This case can be recognized because non-wildcards will occur in different positions. A greedy algorithm will suffice; the idea is that we build a list of indexes that refer to non-wildcards
//   and intersect it with each tree we consider. If the next tree results in a zero list then we defer it to the next partition. The way I'm doing this is finishing off the current partition,
//   inserting an empty fully-specified partition, and then kicking off a new partition of unspecified trees. This probably isn't the most efficient way to go about it, but the code generator
//   knows how to deal with empty partitions gracefully.

    split_treeset_on_specification = function (trees, pattern_data, visited) {
                                       var r = [], visited_count = 0, available_paths = {}, available_count = 0;
                                       if (visited != null) {for (var k in visited) if (visited.hasOwnProperty(k)) {
                                                              ++visited_count;
                                                              for (var i = 0, l = visited[k]; i < l; ++i) available_paths[k + String.fromCharCode(i)] = ++available_count}}
                                       else available_paths = {'': available_count = 1};

                                       for (var p = [], s = false, remaining_paths = null, remaining_count = 0, i = 0, l = trees.length, t, td; i < l; ++i)
                                         if (((td = pattern_data[(t = trees[i]).id()]).non_wildcards === visited_count) !== s) r.push(p), p = [t], s = !s, remaining_paths = null;
                                         else if (s) p.push(t);
                                         else {
                                           if (remaining_paths === null) remaining_paths = merge({}, available_paths), remaining_count = available_count;
                                           for (var ps = td.wildcard_paths, j = 0, lj = ps.length, pj; j < lj; ++j)
                                             remaining_count -= remaining_paths.hasOwnProperty(pj = ps[j]), delete remaining_paths[pj];
                                           if (remaining_count) p.push(t);
                                           else                 r.push(p), r.push([]), p = [t], remaining_paths = null}

                                       p.length && r.push(p);
                                       return r},

//   Pattern data.
//   We end up with lots of subarrays of the original pattern list. However, we need to be able to get back to the original expander for a given pattern, so we keep a hash of pattern data indexed
//   by the ID of the pattern tree. The pattern data consists of more than just the expander; we also store the number of non-wildcard nodes per pattern tree. This is used to determine which
//   trees are fully resolved. We also need a list of wildcard paths for each tree; this is used to efficiently construct the arrays that are passed into the expander functions.

//   By convention I call the result of this function pattern_data, which shadows this function definition. (Seems somehow appropriate to do it this way.)

    wildcard_paths = function (t) {for (var r = t.data === '_' ? [''] : [], i = 0, l = t.length; i < l; ++i)
                                     for (var ps = t[i] && wildcard_paths(t[i]), j = 0, lj = ps.length; j < lj; ++j) r.push(String.fromCharCode(i) + ps[j]);
                                   return r},

    pattern_data = function (ps, es) {for (var r = {}, i = 0, l = ps.length, p; i < l; ++i)
                                        r[(p = ps[i]).id()] = {expander: es[i], non_wildcards: non_wildcard_node_count(p), wildcard_paths: wildcard_paths(p)};
                                      return r},

//   Code generation.
//   This is the last step and it's where the algorithm finally comes together. Two big things are going on here. One is the traversal process, which uses next_path to build the piecewise
//   traversal order. The other is the code generation process, which conses up a code tree according to the treeset partitioning that guides the traversal. These two processes happen in
//   parallel.

//   The original JIT design goes over a lot of the code generation, but I'm duplicating it here for clarity. (There are also some changes in this design, though the ideas are the same since
//   they're both fundamentally just decision trees.)

//     Function body.
//     This is largely uninteresting, except that it provides the base context for path dereferencing (see 'Variable allocation' below). It also provides a temporary 'result' variable, which is
//     used by the macroexpander invocation code.

      pattern_match_function_template = parse('function (t) {var result; _body}'),
      empty_variable_mapping_table    = function () {return {'': 't'}},

//     Partition encoding.
//     Each time we partition the tree set, we generate a switch() statement. The switch operates both on arity and on the data, just like the partitions would suggest. (However these two things
//     are separate conditionals, unlike their representation in the partition map.) The layout looks like this:

//     | switch (tree.length) {
//         case 0:
//           switch (tree.data) {
//             case 'foo': ...
//             case 'bar': ...
//           }
//           break;
//         case 1:
//           switch (tree.data) {
//             case 'bif': ...
//             case 'baz': ...
//           }
//           break;
//       }

//     Note that we can't return false immediately after hitting a failing case. The reason has to do with overlapping macro definitions. If we have two macro definitions that would both
//     potentially match the input, we have to proceed to the second if the first one rejects the match.

      partition_template        = parse('switch (_value) {_cases}'),
      partition_branch_template = parse('case _value: _body; break'),

//     Attempting a macro match is kind of interesting. We need a way to use 'break' to escape from a match, so we construct a null while loop that lets us do this. Any 'break' will then send the
//     code into the sequential continuation, not escape from the function.

      single_macro_attempt_template = parse('do {_body} while (false)'),

//     Variable allocation.
//     Variables are allocated to hold temporary trees. This reduces the amount of dereferencing that must be done. If at any point we hit a variable that should have a value but doesn't, we bail
//     out of the pattern match. A table keeps track of path -> variable name mappings. The empty path always maps to 't', which is the input tree.

//     Incremental path references can be generated anytime we have a variable that is one dereference away from the given path. generate_incremental_path_reference does two things. First, it
//     creates a unique temporary name and stashes it into the path -> variable mapping, and then it returns a syntax tree that uses that unique name and existing entries in the path -> variable
//     mapping. The path's index is hard-coded. Note that if the path isn't properly adjacent you'll end up with an array instead of a syntax tree, and things will go downhill quickly from there.

      indexed_path_reference_template  = parse('_base[_index]'),
      absolute_path_reference_template = parse('_base'),
      generate_path_reference          = function (variables, path) {
                                           return variables[path] ? absolute_path_reference_template.replace({_base: variables[path]}) :
                                                                    indexed_path_reference_template .replace({_base: generate_path_reference(variables, path.substr(0, path.length - 1)),
                                                                                                              _index: '' + path.charCodeAt(path.length - 1)})},
      path_variable_template = parse('var _temp = _value; if (! _temp) break'),
      path_exists_template   = parse('null'),
      generate_path_variable = function (variables, path) {if (variables[path]) return path_exists_template;
                                                           var name = 't' + genint(), replacements = {_value: generate_path_reference(variables, path), _temp: name};
                                                           return variables[path] = name, path_variable_template.replace(replacements)},

//     Macroexpander invocation encoding.
//     The actual macroexpander functions are invoked by embedding ref nodes in the syntax tree. If one function fails, it's important to continue processing with whatever assumptions have been
//     made. (This is actually one of the trickier points of this implementation.) Detecting this isn't too bad though. It's done above by split_treeset_on_specification.

      non_wildcard_node_count = function (tree) {var r = 0; tree.reach(function (node) {r += node.data !== '_'}); return r},

//     Invocations of the macroexpander should be fast, so there's some kind of interesting logic to quickly match wildcards with a minimum of array consing. This optimization requires a
//     simplifying assumption that all _ nodes are leaf nodes, but this is generally true. (It's possible to build macro patterns that don't have this property, but they won't, and never would
//     have, behaved properly.) The idea is that once we have a fully-specified macro pattern we can simply go through each visited path, grab the direct children of each node, and detect
//     wildcards. We then encode these wildcard paths as hard-coded offsets from the tree variables. So, for example:

//     | (+ (/ (_) (b)) (* (a) (_)))
//       visited: [0], [0][1], [1], [1][0]
//       children: (_), (b), (a), (_)
//       parameters: [paths[0][0], paths[1][1]]

//     This requires a lexicographic sort of the paths to make sure the tree is traversed from left to right.

//     Note that a new array is consed per macroexpander invocation. I'm not reusing the array from last time because (1) it's too much work, and (2) the fallthrough-macro case is already fairly
//     expensive and uncommon; a new array cons isn't going to make much difference at that point.

      path_reference_array_template = parse('[_elements]'),
      generate_path_reference_array = function (variables, paths) {for (var refs = [], i = 0, l = paths.length; i < l; ++i) refs.push(generate_path_reference(variables, paths[i]));
                                                                   return path_reference_array_template.replace({_elements: refs.length > 1 ? new syntax_node(',', refs) : refs[0]})},

      macroexpander_invocation_template = parse('if (result = _expander.apply(this, _path_reference_array)) return result'),
      generate_macroexpander_invocation = function (pattern_data, pattern, variables) {return macroexpander_invocation_template.replace(
                                                   {_expander:             new ref(pattern_data[pattern.id()].expander),
                                                    _path_reference_array: generate_path_reference_array(variables, pattern_data[pattern.id()].wildcard_paths)})},

//     Multiple match handling.
//     When one or more macros are fully specified, we need to go through them in a particular order. Failover is handled gracefully; we just separate the macro patterns by a semicolon, since a
//     success side-effects via return and a failure's side-effect is its sequential continuation. (This is why we needed 'break' instead of 'return false' when generating case statements above.)

//     Here the pattern_data variable refers to a hash that maps each pattern's identity to some data about it, including which macroexpander belongs to the pattern in the first place. Note that
//     because I'm using identities this way, you can't add the same pattern (referentially speaking) to map to two different macroexpanders. It would be a weird thing to do, so I don't
//     anticipate that it would happen by accident. But it will cause bogus macroexpansion results if you do.

//       First case: underspecified trees.
//       In this case we create a switch on the tree length first. Then we subdivide into the data comparison. We create the tree-length switch() even if only one tree matches; the reason is that
//       we still need to know that the tree we're matching against has the right length, even if it doesn't narrow down the macro space at all.

        length_reference_template = parse('_value.length'),
        data_reference_template   = parse('_value.data'),

        generate_partitioned_switch = function (trees, visited, variables, pattern_data) {
                                        var path = next_path(visited, trees), partitions = visit_path(path, visited, trees), lengths = {}, length_pairs = [];
                                        for (var k in partitions) if (partitions.hasOwnProperty(k)) (lengths[k.charCodeAt(0)] || (lengths[k.charCodeAt(0)] = [])).push(k.substr(1));
                                        for (var k in lengths)    if (lengths.hasOwnProperty(k))    length_pairs.push([k, lengths[k]]);

                                        var new_variables = merge({}, variables), path_reference_variable = generate_path_variable(new_variables, path), variable = new_variables[path],
                                            length_reference = length_reference_template.replace({_value: variable}), data_reference = data_reference_template.replace({_value: variable});

                                        for (var length_cases = new syntax_node(';'), i = 0, l = length_pairs.length, pair; i < l; ++i) {
                                          for (var data_cases = new syntax_node(';'), length = (pair = length_pairs[i])[0], values = pair[1], j = 0, lj = values.length, p, v; j < lj; ++j)
                                            p = partitions[String.fromCharCode(length) + (v = values[j])],
                                            data_cases.push(partition_branch_template.replace({_value: '"' + v.replace(/([\\"])/g, '\\$1') + '"',
                                                                                               _body:  generate_decision_tree(p.trees, path, p.visited, new_variables, pattern_data)}));
                                          lj &&
                                          length_cases.push(partition_branch_template.replace({_value: '' + length_pairs[i][0],
                                                                                               _body:  partition_template.replace({_value: data_reference, _cases: data_cases})}))}
                                        return single_macro_attempt_template.replace({_body:
                                                 new syntax_node(';', path_reference_variable,
                                                                      length_cases.length ? partition_template.replace({_value: length_reference, _cases: length_cases}) : [])})},

//       Second case: specified trees (base case).
//       This is fairly simple. We just generate a sequence of invocations, since each tree has all of the constants assumed.

        generate_unpartitioned_sequence = function (trees, variables, pattern_data) {for (var r = new syntax_node(';'), i = 0, l = trees.length; i < l; ++i)
                                                                                       r.push(generate_macroexpander_invocation(pattern_data, trees[i], variables));
                                                                                     return r},

//       Inductive step.
//       This is where we delegate either to the partitioned switch logic or the sequential sequence logic.

        generate_decision_tree = function (trees, path, visited, variables, pattern_data) {
                                   for (var r = new syntax_node(';'), sts = split_treeset_on_specification(trees, pattern_data, visited), i = 0, l = sts.length; i < l; ++i)
                                     sts[i].length && r.push(i & 1 ? generate_unpartitioned_sequence(sts[i], variables, pattern_data) :
                                                                     generate_partitioned_switch(sts[i], visited, variables, pattern_data));
                                   return r};

//   Macroexpansion generator.
//   This is where all of the logic comes together. The only remotely weird thing we do here is reverse both the pattern and expansion lists so that the macros get applied in the right order.

    return function (patterns, expanders) {for (var i = patterns.length - 1, rps = [], res = []; i >= 0; --i) rps.push(patterns[i]), res.push(expanders[i]);
                                           return compile(pattern_match_function_template.replace(
                                             {_body: generate_decision_tree(rps, null, null, empty_variable_mapping_table(), pattern_data(rps, res))}))}})(),

  macro_expand_baked = function (t, f, context) {return t.rmap(function (n) {return f.call(context, n)})};
// Generated by SDoc 
