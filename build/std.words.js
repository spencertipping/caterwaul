caterwaul.module( 'std.words' , (function (qs1,qs2,qs3,qs4,qs5,qs6,qs7,qs8,qs9,qsa,qsb,qsc,qsd,qsf,qsg,qsh,qsi,qsj) {var result= ( function ($) { (function () {var scope_template =qs1; return $.words =function (caterwaul_function) { ; return ($.merge(caterwaul_function.modifiers, $.words.modifiers) , $.merge(caterwaul_function.parameterized_modifiers, $.words.parameterized_modifiers) , caterwaul_function)} , $.words.modifiers = { qs:function (match) { ; return new $.expression_ref($.syntax_to_expression(match._expression) , 'qs')} , qse:function (match) { ; return new $.expression_ref($.syntax_to_expression(this(match._expression)) , 'qse')} , qc:function (match) { ; return $.compile(this(match._expression))} , qce:function (match) { ; return this($.compile(this(match._expression)))} , reexpand:function (match) { ; return this(this(match._expression))} , noexpand:function (match) { ; return match._expression} , raise: $.reexpander(qs2) , eval:function (match) { ; return new $.ref($.compile(this(match._expression)) , 'eval')} , ahead:function (match) { ; return new $.expression_ref(this(match._expression) , 'ahead')} , capture: function (match) {for (var comma = new $.syntax( ',') , bindings = match._expression.flatten( ',') , i = 0, l = bindings.length; i < l; ++i) comma.push(this(bindings[i]) .with_data( ':')) ; return new $.syntax( '{' , comma.unflatten())} , wcapture: function (match) {for (var e = this(match._expression) , comma = new $.syntax( ',') , bindings = e.flatten( ',') , node, i = 0, l = bindings.length; i < l; ++i) (node = this(bindings[i])) [1] = node[0] , comma.push(node.with_data( ':')) ; return scope_template.replace( {_variables: e, _expression: new $.syntax( '{' , comma.unflatten())})}} , $.words.parameterized_modifiers = { given: $.reexpander(qs3) , bgiven: $.reexpander(qs4) , rescue: $.reexpander(qs5) , se: $.reexpander(qs6) , re: $.reexpander(qs7) , then: $.reexpander(qs8) , eq: $.reexpander(qs9) , ocq: $.reexpander(qsa) , dcq: $.reexpander(qsb) , acq: $.reexpander(qsc) , ncq: $.reexpander(qsd) , where: $.reexpander(qsf) , using: $.reexpander(function (match) {var m = this(match._parameters) , o = $.compile(m) , comma = new $.syntax( ',') , expression_ref = new $.expression_ref(m) ; for (var k in o) Object.prototype.hasOwnProperty.call(o, k) && /^[_$a-zA-Z][_$0-9a-zA-Z]*$/ .test(k) && !this.modifiers.hasOwnProperty(k) && !this.parameterized_modifiers.hasOwnProperty(k) && comma.push(new $.syntax( '=' , k, new $.syntax( '.' , expression_ref, k))) ; return scope_template.replace( {_variables: comma.unflatten() , _expression: match._expression})}) , when: $.reexpander(qsg) , and: $.reexpander(qsh) , unless: $.reexpander(qsi) , or: $.reexpander(qsj)}}) .call(this)}) ;result.caterwaul_expression_ref_table = {qs1: ( "new caterwaul.syntax( \"()\" ,new caterwaul.syntax( \".\" ,new caterwaul.syntax( \"(\" ,new caterwaul.syntax( \"function\" ,new caterwaul.syntax( \"(\" ,new caterwaul.syntax( \"\")) .prefix( \" \") ,new caterwaul.syntax( \"{\" ,new caterwaul.syntax( \";\" ,new caterwaul.syntax( \"var\" ,new caterwaul.syntax( \"_variables\") .prefix( \" \")) ,new caterwaul.syntax( \"return\" ,new caterwaul.syntax( \"_expression\") .prefix( \" \")) .prefix( \" \"))) .prefix( \" \"))) ,new caterwaul.syntax( \"call\")) ,new caterwaul.syntax( \"this\"))") ,qs2: ( "new caterwaul.syntax( \"()\" ,new caterwaul.syntax( \".\" ,new caterwaul.syntax( \"(\" ,new caterwaul.syntax( \"function\" ,new caterwaul.syntax( \"(\" ,new caterwaul.syntax( \"\")) .prefix( \" \") ,new caterwaul.syntax( \"{\" ,new caterwaul.syntax( \"throw\" ,new caterwaul.syntax( \"_expression\") .prefix( \" \"))) .prefix( \" \"))) ,new caterwaul.syntax( \"call\")) ,new caterwaul.syntax( \"this\"))") ,qs3: ( "new caterwaul.syntax( \"(\" ,new caterwaul.syntax( \"function\" ,new caterwaul.syntax( \"(\" ,new caterwaul.syntax( \"_parameters\")) .prefix( \" \") ,new caterwaul.syntax( \"{\" ,new caterwaul.syntax( \"return\" ,new caterwaul.syntax( \"_expression\") .prefix( \" \"))) .prefix( \" \")))") ,qs4: ( "new caterwaul.syntax( \"()\" ,new caterwaul.syntax( \"(\" ,new caterwaul.syntax( \"function\" ,new caterwaul.syntax( \"(\" ,new caterwaul.syntax( \",\" ,new caterwaul.syntax( \"t\") ,new caterwaul.syntax( \"f\") .prefix( \" \"))) .prefix( \" \") ,new caterwaul.syntax( \"{\" ,new caterwaul.syntax( \"return\" ,new caterwaul.syntax( \"function\" ,new caterwaul.syntax( \"(\" ,new caterwaul.syntax( \"\")) .prefix( \" \") ,new caterwaul.syntax( \"{\" ,new caterwaul.syntax( \"return\" ,new caterwaul.syntax( \"()\" ,new caterwaul.syntax( \".\" ,new caterwaul.syntax( \"f\") .prefix( \" \") ,new caterwaul.syntax( \"apply\")) ,new caterwaul.syntax( \",\" ,new caterwaul.syntax( \"t\") ,new caterwaul.syntax( \"arguments\") .prefix( \" \"))))) .prefix( \" \")) .prefix( \" \"))) .prefix( \" \"))) ,new caterwaul.syntax( \",\" ,new caterwaul.syntax( \"this\") ,new caterwaul.syntax( \"function\" ,new caterwaul.syntax( \"(\" ,new caterwaul.syntax( \"_parameters\")) .prefix( \" \") ,new caterwaul.syntax( \"{\" ,new caterwaul.syntax( \"return\" ,new caterwaul.syntax( \"_expression\") .prefix( \" \"))) .prefix( \" \")) .prefix( \" \")))") ,qs5: ( "new caterwaul.syntax( \"()\" ,new caterwaul.syntax( \".\" ,new caterwaul.syntax( \"(\" ,new caterwaul.syntax( \"function\" ,new caterwaul.syntax( \"(\" ,new caterwaul.syntax( \"\")) .prefix( \" \") ,new caterwaul.syntax( \"{\" ,new caterwaul.syntax( \"try\" ,new caterwaul.syntax( \"{\" ,new caterwaul.syntax( \"return\" ,new caterwaul.syntax( \"_expression\") .prefix( \" \"))) .prefix( \" \") ,new caterwaul.syntax( \"catch\" ,new caterwaul.syntax( \"(\" ,new caterwaul.syntax( \"e\")) .prefix( \" \") ,new caterwaul.syntax( \"{\" ,new caterwaul.syntax( \"return\" ,new caterwaul.syntax( \"_parameters\") .prefix( \" \"))) .prefix( \" \")) .prefix( \" \"))) .prefix( \" \"))) ,new caterwaul.syntax( \"call\")) ,new caterwaul.syntax( \"this\"))") ,qs6: ( "new caterwaul.syntax( \"()\" ,new caterwaul.syntax( \".\" ,new caterwaul.syntax( \"(\" ,new caterwaul.syntax( \"function\" ,new caterwaul.syntax( \"(\" ,new caterwaul.syntax( \"it\")) .prefix( \" \") ,new caterwaul.syntax( \"{\" ,new caterwaul.syntax( \"return\" ,new caterwaul.syntax( \",\" ,new caterwaul.syntax( \"_parameters\") .prefix( \" \") ,new caterwaul.syntax( \"it\") .prefix( \" \")))) .prefix( \" \"))) ,new caterwaul.syntax( \"call\")) ,new caterwaul.syntax( \",\" ,new caterwaul.syntax( \"this\") ,new caterwaul.syntax( \"(\" ,new caterwaul.syntax( \"_expression\")) .prefix( \" \")))") ,qs7: ( "new caterwaul.syntax( \"()\" ,new caterwaul.syntax( \".\" ,new caterwaul.syntax( \"(\" ,new caterwaul.syntax( \"function\" ,new caterwaul.syntax( \"(\" ,new caterwaul.syntax( \"it\")) .prefix( \" \") ,new caterwaul.syntax( \"{\" ,new caterwaul.syntax( \"return\" ,new caterwaul.syntax( \"_parameters\") .prefix( \" \"))) .prefix( \" \"))) ,new caterwaul.syntax( \"call\")) ,new caterwaul.syntax( \",\" ,new caterwaul.syntax( \"this\") ,new caterwaul.syntax( \"(\" ,new caterwaul.syntax( \"_expression\")) .prefix( \" \")))") ,qs8: ( "new caterwaul.syntax( \"(\" ,new caterwaul.syntax( \",\" ,new caterwaul.syntax( \"_expression\") ,new caterwaul.syntax( \"_parameters\") .prefix( \" \")))") ,qs9: ( "new caterwaul.syntax( \"=\" ,new caterwaul.syntax( \"_expression\") ,new caterwaul.syntax( \"_parameters\") .prefix( \" \")) .prefix( \" \")") ,qsa: ( "new caterwaul.syntax( \"?\" ,new caterwaul.syntax( \"_expression\") ,new caterwaul.syntax( \"_expression\") .prefix( \" \") .infix( \" \") ,new caterwaul.syntax( \"=\" ,new caterwaul.syntax( \"_expression\") .prefix( \" \") ,new caterwaul.syntax( \"_parameters\") .prefix( \" \")) .prefix( \" \")) .prefix( \" \")") ,qsb: ( "new caterwaul.syntax( \"?\" ,new caterwaul.syntax( \"!==\" ,new caterwaul.syntax( \"_expression\") ,new caterwaul.syntax( \"void\" ,new caterwaul.syntax( \"0\") .prefix( \" \")) .prefix( \" \")) .prefix( \" \") ,new caterwaul.syntax( \"_expression\") .prefix( \" \") .infix( \" \") ,new caterwaul.syntax( \"=\" ,new caterwaul.syntax( \"_expression\") .prefix( \" \") ,new caterwaul.syntax( \"_parameters\") .prefix( \" \")) .prefix( \" \")) .prefix( \" \")") ,qsc: ( "new caterwaul.syntax( \"?\" ,new caterwaul.syntax( \"u!\" ,new caterwaul.syntax( \"_expression\")) ,new caterwaul.syntax( \"_expression\") .prefix( \" \") .infix( \" \") ,new caterwaul.syntax( \"=\" ,new caterwaul.syntax( \"_expression\") .prefix( \" \") ,new caterwaul.syntax( \"_parameters\") .prefix( \" \")) .prefix( \" \")) .prefix( \" \")") ,qsd: ( "new caterwaul.syntax( \"?\" ,new caterwaul.syntax( \"!=\" ,new caterwaul.syntax( \"_expression\") ,new caterwaul.syntax( \"void\" ,new caterwaul.syntax( \"0\") .prefix( \" \")) .prefix( \"  \")) .prefix( \" \") ,new caterwaul.syntax( \"_expression\") .prefix( \" \") .infix( \" \") ,new caterwaul.syntax( \"=\" ,new caterwaul.syntax( \"_expression\") .prefix( \" \") ,new caterwaul.syntax( \"_parameters\") .prefix( \" \")) .prefix( \" \")) .prefix( \" \")") ,qsf: ( "new caterwaul.syntax( \"()\" ,new caterwaul.syntax( \".\" ,new caterwaul.syntax( \"(\" ,new caterwaul.syntax( \"function\" ,new caterwaul.syntax( \"(\" ,new caterwaul.syntax( \"\")) .prefix( \" \") ,new caterwaul.syntax( \"{\" ,new caterwaul.syntax( \";\" ,new caterwaul.syntax( \"var\" ,new caterwaul.syntax( \"_parameters\") .prefix( \" \")) ,new caterwaul.syntax( \"return\" ,new caterwaul.syntax( \"_expression\") .prefix( \" \")) .prefix( \" \"))) .prefix( \" \"))) ,new caterwaul.syntax( \"call\")) ,new caterwaul.syntax( \"this\"))") ,qsg: ( "new caterwaul.syntax( \"&&\" ,new caterwaul.syntax( \"_parameters\") ,new caterwaul.syntax( \"_expression\") .prefix( \" \")) .prefix( \" \")") ,qsh: ( "new caterwaul.syntax( \"&&\" ,new caterwaul.syntax( \"_expression\") ,new caterwaul.syntax( \"_parameters\") .prefix( \" \")) .prefix( \" \")") ,qsi: ( "new caterwaul.syntax( \"&&\" ,new caterwaul.syntax( \"u!\" ,new caterwaul.syntax( \"_parameters\") .prefix( \" \")) ,new caterwaul.syntax( \"_expression\") .prefix( \" \")) .prefix( \" \")") ,qsj: ( "new caterwaul.syntax( \"||\" ,new caterwaul.syntax( \"_expression\") ,new caterwaul.syntax( \"_parameters\") .prefix( \" \")) .prefix( \" \")")} ;return(result)}) .call(this,new caterwaul.syntax( "()" ,new caterwaul.syntax( "." ,new caterwaul.syntax( "(" ,new caterwaul.syntax( "function" , (new caterwaul.syntax( "(" ,new caterwaul.syntax( ""))) .prefix( " ") , (new caterwaul.syntax( "{" ,new caterwaul.syntax( ";" ,new caterwaul.syntax( "var" , (new caterwaul.syntax( "_variables")) .prefix( " ")) , (new caterwaul.syntax( "return" , (new caterwaul.syntax( "_expression")) .prefix( " "))) .prefix( " ")))) .prefix( " "))) ,new caterwaul.syntax( "call")) ,new caterwaul.syntax( "this")) ,new caterwaul.syntax( "()" ,new caterwaul.syntax( "." ,new caterwaul.syntax( "(" ,new caterwaul.syntax( "function" , (new caterwaul.syntax( "(" ,new caterwaul.syntax( ""))) .prefix( " ") , (new caterwaul.syntax( "{" ,new caterwaul.syntax( "throw" , (new caterwaul.syntax( "_expression")) .prefix( " ")))) .prefix( " "))) ,new caterwaul.syntax( "call")) ,new caterwaul.syntax( "this")) ,new caterwaul.syntax( "(" ,new caterwaul.syntax( "function" , (new caterwaul.syntax( "(" ,new caterwaul.syntax( "_parameters"))) .prefix( " ") , (new caterwaul.syntax( "{" ,new caterwaul.syntax( "return" , (new caterwaul.syntax( "_expression")) .prefix( " ")))) .prefix( " "))) ,new caterwaul.syntax( "()" ,new caterwaul.syntax( "(" ,new caterwaul.syntax( "function" , (new caterwaul.syntax( "(" ,new caterwaul.syntax( "," ,new caterwaul.syntax( "t") , (new caterwaul.syntax( "f")) .prefix( " ")))) .prefix( " ") , (new caterwaul.syntax( "{" ,new caterwaul.syntax( "return" , (new caterwaul.syntax( "function" , (new caterwaul.syntax( "(" ,new caterwaul.syntax( ""))) .prefix( " ") , (new caterwaul.syntax( "{" ,new caterwaul.syntax( "return" ,new caterwaul.syntax( "()" ,new caterwaul.syntax( "." , (new caterwaul.syntax( "f")) .prefix( " ") ,new caterwaul.syntax( "apply")) ,new caterwaul.syntax( "," ,new caterwaul.syntax( "t") , (new caterwaul.syntax( "arguments")) .prefix( " ")))))) .prefix( " "))) .prefix( " ")))) .prefix( " "))) ,new caterwaul.syntax( "," ,new caterwaul.syntax( "this") , (new caterwaul.syntax( "function" , (new caterwaul.syntax( "(" ,new caterwaul.syntax( "_parameters"))) .prefix( " ") , (new caterwaul.syntax( "{" ,new caterwaul.syntax( "return" , (new caterwaul.syntax( "_expression")) .prefix( " ")))) .prefix( " "))) .prefix( " "))) ,new caterwaul.syntax( "()" ,new caterwaul.syntax( "." ,new caterwaul.syntax( "(" ,new caterwaul.syntax( "function" , (new caterwaul.syntax( "(" ,new caterwaul.syntax( ""))) .prefix( " ") , (new caterwaul.syntax( "{" ,new caterwaul.syntax( "try" , (new caterwaul.syntax( "{" ,new caterwaul.syntax( "return" , (new caterwaul.syntax( "_expression")) .prefix( " ")))) .prefix( " ") , (new caterwaul.syntax( "catch" , (new caterwaul.syntax( "(" ,new caterwaul.syntax( "e"))) .prefix( " ") , (new caterwaul.syntax( "{" ,new caterwaul.syntax( "return" , (new caterwaul.syntax( "_parameters")) .prefix( " ")))) .prefix( " "))) .prefix( " ")))) .prefix( " "))) ,new caterwaul.syntax( "call")) ,new caterwaul.syntax( "this")) ,new caterwaul.syntax( "()" ,new caterwaul.syntax( "." ,new caterwaul.syntax( "(" ,new caterwaul.syntax( "function" , (new caterwaul.syntax( "(" ,new caterwaul.syntax( "it"))) .prefix( " ") , (new caterwaul.syntax( "{" ,new caterwaul.syntax( "return" ,new caterwaul.syntax( "," , (new caterwaul.syntax( "_parameters")) .prefix( " ") , (new caterwaul.syntax( "it")) .prefix( " "))))) .prefix( " "))) ,new caterwaul.syntax( "call")) ,new caterwaul.syntax( "," ,new caterwaul.syntax( "this") , (new caterwaul.syntax( "(" ,new caterwaul.syntax( "_expression"))) .prefix( " "))) ,new caterwaul.syntax( "()" ,new caterwaul.syntax( "." ,new caterwaul.syntax( "(" ,new caterwaul.syntax( "function" , (new caterwaul.syntax( "(" ,new caterwaul.syntax( "it"))) .prefix( " ") , (new caterwaul.syntax( "{" ,new caterwaul.syntax( "return" , (new caterwaul.syntax( "_parameters")) .prefix( " ")))) .prefix( " "))) ,new caterwaul.syntax( "call")) ,new caterwaul.syntax( "," ,new caterwaul.syntax( "this") , (new caterwaul.syntax( "(" ,new caterwaul.syntax( "_expression"))) .prefix( " "))) ,new caterwaul.syntax( "(" ,new caterwaul.syntax( "," ,new caterwaul.syntax( "_expression") , (new caterwaul.syntax( "_parameters")) .prefix( " "))) , (new caterwaul.syntax( "=" ,new caterwaul.syntax( "_expression") , (new caterwaul.syntax( "_parameters")) .prefix( " "))) .prefix( " ") , (new caterwaul.syntax( "?" ,new caterwaul.syntax( "_expression") , (new caterwaul.syntax( "_expression")) .prefix( " ") .infix( " ") , (new caterwaul.syntax( "=" , (new caterwaul.syntax( "_expression")) .prefix( " ") , (new caterwaul.syntax( "_parameters")) .prefix( " "))) .prefix( " "))) .prefix( " ") , (new caterwaul.syntax( "?" , (new caterwaul.syntax( "!==" ,new caterwaul.syntax( "_expression") , (new caterwaul.syntax( "void" , (new caterwaul.syntax( "0")) .prefix( " "))) .prefix( " "))) .prefix( " ") , (new caterwaul.syntax( "_expression")) .prefix( " ") .infix( " ") , (new caterwaul.syntax( "=" , (new caterwaul.syntax( "_expression")) .prefix( " ") , (new caterwaul.syntax( "_parameters")) .prefix( " "))) .prefix( " "))) .prefix( " ") , (new caterwaul.syntax( "?" ,new caterwaul.syntax( "u!" ,new caterwaul.syntax( "_expression")) , (new caterwaul.syntax( "_expression")) .prefix( " ") .infix( " ") , (new caterwaul.syntax( "=" , (new caterwaul.syntax( "_expression")) .prefix( " ") , (new caterwaul.syntax( "_parameters")) .prefix( " "))) .prefix( " "))) .prefix( " ") , (new caterwaul.syntax( "?" , (new caterwaul.syntax( "!=" ,new caterwaul.syntax( "_expression") , (new caterwaul.syntax( "void" , (new caterwaul.syntax( "0")) .prefix( " "))) .prefix( "  "))) .prefix( " ") , (new caterwaul.syntax( "_expression")) .prefix( " ") .infix( " ") , (new caterwaul.syntax( "=" , (new caterwaul.syntax( "_expression")) .prefix( " ") , (new caterwaul.syntax( "_parameters")) .prefix( " "))) .prefix( " "))) .prefix( " ") ,new caterwaul.syntax( "()" ,new caterwaul.syntax( "." ,new caterwaul.syntax( "(" ,new caterwaul.syntax( "function" , (new caterwaul.syntax( "(" ,new caterwaul.syntax( ""))) .prefix( " ") , (new caterwaul.syntax( "{" ,new caterwaul.syntax( ";" ,new caterwaul.syntax( "var" , (new caterwaul.syntax( "_parameters")) .prefix( " ")) , (new caterwaul.syntax( "return" , (new caterwaul.syntax( "_expression")) .prefix( " "))) .prefix( " ")))) .prefix( " "))) ,new caterwaul.syntax( "call")) ,new caterwaul.syntax( "this")) , (new caterwaul.syntax( "&&" ,new caterwaul.syntax( "_parameters") , (new caterwaul.syntax( "_expression")) .prefix( " "))) .prefix( " ") , (new caterwaul.syntax( "&&" ,new caterwaul.syntax( "_expression") , (new caterwaul.syntax( "_parameters")) .prefix( " "))) .prefix( " ") , (new caterwaul.syntax( "&&" ,new caterwaul.syntax( "u!" , (new caterwaul.syntax( "_parameters")) .prefix( " ")) , (new caterwaul.syntax( "_expression")) .prefix( " "))) .prefix( " ") , (new caterwaul.syntax( "||" ,new caterwaul.syntax( "_expression") , (new caterwaul.syntax( "_parameters")) .prefix( " "))) .prefix( " "))) ;