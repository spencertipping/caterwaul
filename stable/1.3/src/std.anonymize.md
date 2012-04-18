Symbol anonymization | Spencer Tipping
Licensed under the terms of the MIT source code license

# Introduction

A recurring pattern in previous versions of caterwaul was to clone the global caterwaul function and set it up as a DSL processor by defining a macro that manually dictated tree traversal
semantics. This was often difficult to implement because any context had to be encoded bottom-up and in terms of searching rather than top-down inference. This library tries to solve the
problem by implementing a grammar-like structure for tree traversal.

# Usage

To anonymize a set of macros you first need to create an anonymizer. This is easy; you just give it a list of symbols to anonymize and then use that anonymizer to transform a series of macros
(this process is non-destructive):

    var anonymize = caterwaul.anonymizer('X', 'Y', 'Z');     // caterwaul.anonymizer('X Y Z'.qw) works too
    var m = caterwaul.replacer(anonymize('X[foo]'), ...);    // Matches against gensym_1_aj49Az0_885nr1q[foo]

Each anonymizer uses a separate symbol table. This means that two anonymizers that match against 'A' (or any other macro pattern) will always map them to different gensyms.

    caterwaul.module('std.anon', 'js_all', function ($) {
      $.anonymizer(xs = arguments) = "$ /~parse/ _ /~replace/ table".qf -where [table = +xs *~![x.constructor === Array ? x : x.split(' ')] *[[x, $.gensym(x)]] /object -seq]});