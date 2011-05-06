// Unit/integration testing behavior | Spencer Tipping
// Licensed under the terms of the MIT source code license

// Introduction.
// This behavior provides words that are useful for unit testing. It also creates functions on caterwaul to define and handle unit tests. For example, using the unit testing library you can do
// stuff like this:

// | caterwaul.test(function () {
//     'foo'.length -should_be- 3;
//     'foo' -should_not_be- 'bar';
//     // etc
//   });

caterwaul.js_base()(function ($) {
  $.assert(condition, message) = condition || wobbly[new Error(message)];

  $.assertions = {should_be:     given[a, b, statement] in $.assert(a === b, '#{statement.toString()}: #{a} !== #{b}'),
                  should_not_be: given[a, b, statement] in $.assert(a !== b, '#{statement.toString()}: #{a} === #{b}')};

  $.test_case_gensym     = $.gensym();
  $.test_words(language) = $.map(assertion_method, ['should_be', 'should_not_be'])
                           -where [assertion_method(name) = language.parameterized_modifier(name, given.match in qs[caterwaul.assertions._name(_expression, _parameters, _ref)].
                                                                                                                   replace({_expression: match._expression, _parameters: match._parameters,
                                                                                                                            _name: name, _ref: new $.ref(match._)}))];

  $.test_base() = this.clone() -effect- it.macros((it.macros() || []).concat(it.test_words(it.js())));
  $.test(f)     = this.test_base()(f)()})(caterwaul);
// Generated by SDoc 