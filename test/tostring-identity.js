// Serialization via serialize()

var n = function (s)    {return caterwaul.lex(s).join(' ')},
    s = function (s, i) {return eq(caterwaul.parse(s).serialize(), i)},
    i = function (f)    {return eq(n(caterwaul.decompile(f).serialize()),
                                   n(f.toString()))};

// Simple tests:

i(function(){return 5});
i(function(x){return function(y) {return x + y}});
i(function () {var x = 5; return x});

// Generated by SDoc 