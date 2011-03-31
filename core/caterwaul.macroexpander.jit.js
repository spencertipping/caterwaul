// JIT macroexpander.
// The naive macroexpander, implemented in sdoc::js::core/caterwaul.macroexpander.naive, takes linear time both in the number of syntax nodes and the number of macros. For potentially deep
// pattern trees this becomes too slow for regular use. This macroexpander uses just-in-time compilation to optimize lookups against the macro table, eliminating most of the checks that would
// have failed.

//   Algorithm and use case analysis.
//   For n syntax nodes and k macro patterns, a naive approach performs O(nk) tree-match operations. Each match is O(n) in the complexity of the pattern tree. At first it seemed like this would
//   scale reasonably well, but version 0.6.7 of Caterwaul performed 750000 tree-match operations to load just the standard libraries. This ended up taking several seconds on some runtimes.

//   Hashing is an attractive solution because of the way macros are usually structured. It's unfortunate that the space of operator nodes is limited, but several different indexes in combination
//   can reduce the pattern space considerably. For example, here are some of the patterns used by the standard library:

//   | (* (l) ([] ([ (_)) (_)))
//     (* (let) ([] ([ (_)) (_)))
//     (, (_) (* (where) ([ (_))))
//     (, (_) ([] (unless) (_)))
//     (, (_) ([] (when) (_)))
//     (, (_) ([] (where) (_)))
//     (/ (/ (_) (mb)) (_))
//     (/ (_) ([] (. (cpb) (_)) (_)))
//     (/ (_) ([] (. (cps) (_)) (_)))
//     (/ (_) ([] (. (re) (_)) (_)))
//     (/ (_) ([] (. (se) (_)) (_)))

//   Just partitioning on the top node can save on average between 1/2 and 1/3 of the macro lookups. It's possible to do better though. An alternative strategy is to dive into the tree until we
//   hit a non-wildcard identifier and record its path. For example:

//   | (* (l) ([] ([ (_)) (_)))            -> l, [0]
//     (* (let) ([] ([ (_)) (_)))          -> let, [0]
//     (, (_) (* (where) ([ (_))))         -> where, [1][0]
//     (, (_) ([] (unless) (_)))           -> unless, [1][0]
//     (, (_) ([] (when) (_)))             -> when, [1][0]
//     (, (_) ([] (where) (_)))            -> where, [1][0]
//     (/ (/ (_) (mb)) (_))                -> mb, [0][1]
//     (/ (_) ([] (. (cpb) (_)) (_)))      -> cpb, [1][0][0]
//     (/ (_) ([] (. (cps) (_)) (_)))      -> cps, [1][0][0]
//     (/ (_) ([] (. (re) (_)) (_)))       -> re, [1][0][0]
//     (/ (_) ([] (. (se) (_)) (_)))       -> se, [1][0][0]

//   Note that we can't apply the same transformation to actual syntax nodes (since they may have identifiers all over the place), but that's ok. Each element in the table has a cost of
//   computation (more node traversal costs more), and it has a certain discrimination benefit (it reduces the number of comparisons we'll have to do later). Implicit in the discrimination
//   benefit is also the fact that deeper identifier embedding in the pattern indicates a pattern that is more difficult to reject quickly. This follows because there are many more identifiers
//   than operators, so statistically we expect to reject more patterns based on failed identifier matches than failed operator matches.

//   Implementation approaches.
//   Obviously it isn't terribly feasible to index every syntax node in every way, since we'll discover useful information about it just by querying its data. At that point we will have
//   partitioned the macro-space to a smaller subset, and some other test will then serve to partition it further. Taking the macro list above, for example, suppose we're matching against the
//   tree (, (+ (x) (1)) (* (where) ([ (= (x) (5))))). (This corresponds to the code 'x + 1, where*[x = 5]'.) Given the comma, we can immediately reduce the search space to querying for [1][0] to
//   find out which macro, if any, we should try to match against. After that we can verify the other nodes and construct the match array.

//   In general this procedure would be quite slow; there's a lot of decision-making going on here. However, this overhead vanishes if, rather than using higher-order logic to construct the match
//   function, we instead compile one tailored to the macro set. (Caterwaul /is/ a runtime compiler, after all :). In the case of this macro set we'd have something like this:

//   | var t1 = tree;
//     if (! t1) return false;                                             // Fail quickly if nodes don't exist
//     switch (t1.data) {                                                  // Check toplevel node -- this is the cheapest check we can do right now
//       case '*':
//         var t2 = t1[0];
//         if (! t2) return false;
//         switch (t2.data) {                                              // Check next node down
//           case 'let':
//             var t3 = t1[1];
//             if (! t3) return false;
//             var t4 = t3[0];
//             if (! t4) return false;
//             if (t3.data === '[]' && t4.data === '[') {                  // Just one pattern case left, so verify that the other elements match up
//               var p = [t4[0], t3[1]];                                   // Either of these can be undefined
//               return macroexpander_1.apply(this, p) || macroexpander_2.apply(this, p) || ...;
//             } else
//               return false;
//           // ...

//   This strategy is ideal because it performs inexpensive checks first, then dives down to do the more time-consuming ones. It also has the benefit that failover cases are still preserved; a
//   macro that returns a falsy replacement will trigger the next macro in the series, finally failing over to no alteration. This is done in what I believe to be the fastest possible way.

//   Note that I've omitted arity checks in the code above. This is generally safe to do; the alternative is to bail on unexpectedly undefined values, which is happening. However, it doesn't
//   handle the case where there is extra data on a node for whatever reason. The real macroexpander has one final check to make sure that the arity of each non-wildcard node matches the pattern.

//   Each decision costs a certain amount. Based on some benchmarks I've run that amount seems to be bounded in the length of the cases rather than the selector (see
//   hackery/macroexpander-indexing/switch-strings.js for details), which is ideal. However, V8 has a minor pathological inefficiency case with long selectors and many cases. (It doesn't seem to
//   optimize away some cases by using a failing length check.) Because of this, each switch statement needs to be guarded by a maximum-length check. Any strings longer than the maximum are
//   automatically discarded, since they would be (1) expensive to check in the worst case, and (2) they would fail each check anyway. (It's also cheap to do a length check because all of the
//   lengths are already known at compile-time.)

//   Constructing the checks.
//   
// Generated by SDoc 
