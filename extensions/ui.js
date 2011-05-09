// Caterwaul UI macros | Spencer Tipping
// Licensed under the terms of the MIT source code license

// DOM libraries.
// Right now I've only got a set of combinators for jQuery.



// JQuery DOM combinators | Spencer Tipping
// Licensed under the terms of the MIT source code license

// Introduction.
// DOM drivers are macro systems that transform HAML-like markup into underlying DOM calls. For instance:

// | div.foo /jquery                       ->  $('<div>').addClass('foo')
//   table(tr(td('hi')), tbody) /jquery    ->  $('<table>').append($('<tr>').append($('<td>').append('hi')).add($('<tbody>')))

// None of the macroexpansions here rely on opaque syntax refs, so they can all be precompiled. Also, the generated code refers to jQuery rather than $ -- this gives you more flexibility about
// setting noConflict(). If you need to set noConflict(true) (which removes the global jQuery variable), you can bind it locally to make the DOM stuff work:

// | div.foo /jquery -where [jQuery = stashed_copy_of_jquery]

// Notation.
// Caterwaul didn't previously have a DOM plugin in its core distribution. The html[] macro in previous versions of caterwaul came from montenegro, a web framework I was developing in tandem with
// caterwaul. However, it's useful to have DOM functionality so I'm including it in the main caterwaul distribution.

// Most of the syntax is copied from the html[] macro in montenegro:

// | element.class                 ->  $('<element>').addClass('class')
//   element *foo('bar')           ->  $('<element>').attr('foo', 'bar')
//   element *!foo('bar')          ->  $('<element>').data('foo', 'bar')                                   <- new!
//   element /foo('bar')           ->  $('<element>').foo('bar')
//   element /!foo(bar)            ->  $('<element>').bind('foo', bar)                                     <- new!
//   +element                      ->  element                                                             <- new!
//   element %foo                  ->  foo($('<element>'))
//   element(child)                ->  $('<element>').append(child /jquery)                                <- here the /jquery marker indicates that 'child' will be re-expanded
//   element(child1, child2)       ->  $('<element>').append((child1 /jquery).add((child2 /jquery)))
//   element[child]                ->  $('<element>').append(child)                                        <- no re-expansion here
//   element[child1, child2]       ->  $('<element>').append(child1.add(child2))
//   element > child               ->  $('<element>').append(child /jquery)
//   element >= child              ->  $('<element>').append(child)
//   element1, element2            ->  (element1 /jquery).add((element2 /jquery))

// There's also some new syntax to make certain things easier. In particular, I didn't like the way nesting worked in previous versions, so this driver supports some new operators to make it more
// intuitive:

// | element1 + element2           ->  (element1 /jquery).add((element2 /jquery))

// The result of this operator is that you have options as far as nesting is concerned:

// | div.foo > span.first + span.second,   ->  <div class='foo'><span class='first'></span><span class='second'></span></div>
//   div.bar > span.third + span.fourth        <div class='bar'><span class='third'></span><span class='fourth'></span></div>

// Also, you can now dig through the DOM using HTML selectors. Here's what that looks like:

// | element >> div.foo               ->  element.filter('div.foo')
//   element >> _.foo                 ->  element.filter('*.foo')
//   element >>> div.foo              ->  element.find('div.foo')
//   element << div.foo               ->  element.parents('div.foo')
//   element >> div.foo /first        ->  element.filter('div.foo:first')
//   element >> div.foo /contains(x)  ->  element.filter('div.foo:contains("#{x}")')
//   element >> div.foo + div.bar     ->  element.filter('div.foo, div.bar')
//   element >> (span >> p)           ->  element.filter('span p')
//   element >> (span >>> p)          ->  element.filter('span p')
//   element >> (span > p)            ->  element.filter('span > p')
//   element >> span[foo]             ->  element.filter('span[foo]')
//   element >> span[data_bar]        ->  element.filter('span[data-bar]')                    <- note conversion of _ to -
//   element >> span[foo=x]           ->  element.filter('span[foo="#{string_escape(x)}"]')

// Note that this isn't really intended to be a replacement for jQuery's builtin methods; it's just an easy way to do some simple selection. I highly recommend using native jQuery selectors if
// you need something more powerful.

// You shouldn't try to get too elaborate with these; I'm not sure how much stuff jQuery's CSS parser can handle. Also note that CSS3's operator precedence differs from Javascript's. In
// particular, doing things like div > span + div > code is incorrect because it will be parsed as 'div > (span, div) > code' (though it may render properly as a CSS pattern). It's a good idea to
// parenthesize in this case, just to communicate your intent to whoever's reading your code. Caterwaul removes the parentheses to make it a valid CSS selector.

// Unlike the montenegro html[] macro, this one doesn't do any autodetection. The good part about this is that you can create custom HTML elements this way. For example:

// | my_element /jquery    ->  $('<my-element>')                   <- note the conversion of _ to -; this happens in class and attribute names too

caterwaul.js_base()(function ($) {
  $.jquery_macro(language, options) = language.modifier('jquery', this.expand(jquery_expand(match._expression)) -given.match -where [jquery_expand = $.jquery(options)]);

  $.jquery(options) = $.clone().macros(jquery_macros, string_macros, search_macros)
                      -effect [it.init_function(tree) = this.macroexpand(anon('J[_x]').replace({_x: tree}))]

//   Transforms.
//   There are a lot of stages here, but most of them are fairly trivial. The first, J[], is used to indicate that something needs to be expanded under the jquery grammar. This is responsible for
//   turning elements into jQuery calls, dot operators into classes, etc, and it does most of the heavy lifting. The other large stage is P[], which converts the pattern language into a jQuery
//   CSS selector.

//   The small stages are S[], which just turns something into a string with underscore-to-dash conversion; TS[], which turns something into a tag-string (e.g. TS[foo] = "<foo>"); and PS[], which
//   quotes a compiled pattern.

             -where [jq            = options && options.jquery_name || 'jQuery',
                     anon          = $.anonymizer('J', 'TS', 'S', 'P', 'PS'),

                     rule(p, e)    = $.macro(anon(p), e.constructor === Function ? this.expand(e.call(this, match)) -given.match : anon(e)),

                     hyphenate(s)  = s.replace(/_/g, '-'),

                     p             = bind [p_pattern = anon('P[_thing]')] in p_pattern.replace({_thing: node}) -given.node,

                     jquery_macros = [rule('J[_element]',                 given.match [match._element.is_constant() || match._element.length ?
                                                                                         wrap_in_jquery(match) :
                                                                                         become_dom_node(match)]

                                                                          -where [dom_node_template      = anon('#{jq}(TS[_element])'),
                                                                                  jquery_template        = anon('#{jq}("<span>" + (_element) + "</span>")'),
                                                                                  become_dom_node(match) = dom_node_template.replace(match),
                                                                                  wrap_in_jquery(match)  = jquery_template.replace(match)]),

                                      rule('J[_element._class]',          'J[_element].addClass(S[_class])'),

                                      rule('J[_element *_attr(_val)]',    'J[_element].attr(S[_attr], _val)'),
                                      rule('J[_element *!_name(_val)]',   'J[_element].data(S[_name], _val)'),
                                      rule('J[_element /_method(_args)]', 'J[_element]._method(_args)'),
                                      rule('J[_element /!_event(_args)]', 'J[_element].bind(S[_event], _args)'),
                                      rule('J[_element %_function]',      '_function(J[_element])'),

                                      rule('J[_element(_children)]',      'J[_element].append(J[_children])'),
                                      rule('J[_element[_children]]',      'J[_element].append(_children)'),
                                      rule('J[_element > _child]',        'J[_element].append(J[_child])'),
                                      rule('J[_element >= _child]',       'J[_element].append(_child)'),

                                      rule('J[_element1, _element2]',     'J[_element1].add(J[_element2])'),
                                      rule('J[_element1 + _element2]',    'J[_element1].add(J[_element2])'),

                                      rule('J[_element >> _pattern]',     'J[_element].filter(PS[_pattern])'),
                                      rule('J[_element >>> _pattern]',    'J[_element].find(PS[_pattern])'),
                                      rule('J[_element << _pattern]',     'J[_element].parents(PS[_pattern])'),

                                      rule('J[(_element)]',               '(J[_element])'),
                                      rule('J[[_element]]',               '[J[_element]]'),

                                      rule('J[+_expression]',             '_expression')],

                     string_macros = [rule('TS[_identifier]', string('<#{hyphenate(match._identifier.data)}>') -given.match),
                                      rule('S[_identifier]',  string(    hyphenate(match._identifier.data))    -given.match),
                                      rule('PS[_identifier]', string(this.expand(p(match._identifier)).data)   -given.match)]

                              -where [string(s) = new $.syntax('"' + s.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"')],

                     search_macros = [rule('P[_element]',                    new $.syntax(hyphenate(match._element.data -re [it === '_' ? '*' : it]))                         -given.match),
                                      rule('P[_element._class]',             new $.syntax('#{this.expand(p(match._element)).data}.#{hyphenate(match._class.data)}')           -given.match),

                                      rule('P[_element[_attributes]]',       new $.syntax('#{this.expand(p(match._element)).data}[#{this.expand(p(match._attributes))}]')     -given.match),
                                      rule('P[_attribute = _value]',         new $.syntax('#{this.expand(p(match._attribute)).data}="#' + '{#{interpolated(match._value)}}"') -given.match),

                                      rule('P[(_element)]',                 'P[_element]'),        // No paren support

                                      rule('P[_element1 +   _element2]',     binary(', ')),
                                      rule('P[_element1,    _element2]',     binary(', ')),
                                      rule('P[_element1 >>  _element2]',     binary(' ')),
                                      rule('P[_element1 >>> _element2]',     binary(' ')),
                                      rule('P[_element1 >   _element2]',     binary(' > ')),
                                      rule('P[_element1(_element2)]',        binary(' > ')),

                                      rule('P[_element /_selector]',         new $.syntax('#{this.expand(p(match._element)).data}:#{hyphenate(match._selector.data)}')        -given.match),
                                      rule('P[_element /_selector(_value)]', new $.syntax('#{this.expand(p(match._element)).data}:#{hyphenate(match._selector.data)}("#' +
                                                                                          '{#{interpolated(match._value)}")')                                                 -given.match)]

                              -where [interpolated(node) = '(#{node.toString()}).replace(/(\\)/g, "$1$1").replace(/(")/g, "\\$1")',
                                      binary(op)(match)  = new $.syntax('#{this.expand(p(match._element1)).data}#{op}#{this.expand(p(match._element2)).data}')]]})(caterwaul);
// Generated by SDoc 




  caterwaul.js_ui = function (existing) {var js = this.js();
                                         return this.clone().macros(existing.macros(), this.jquery_macro(js))};
// Generated by SDoc 
