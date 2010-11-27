$(caterwaul.clone('std')(function () {
  var c = caterwaul.clone('std format');

  var recompile = let*[parse_errors_for = function (code) {try {return ! new Function(code)} catch (e) {return e.toString()}},
                         try_to_compile = function (c, code) {try {return c.macroexpand(c.parse(code))} catch (e) {return e.toString()}},
                              serialize = fn[tree][tree.constructor === String ? tree : $('#minify').is(':checked') ? tree.serialize() :
                                                                                       $('#inspect').is(':checked') ? tree.inspect() : c.format(tree)],
               configuration(c, config) = $('##{config}').is(':checked') ? c.configure(config) : c,
                       create_caterwaul = fn_[configuration(caterwaul.clone(), 'std') /re[configuration(_, 'opt') /re[
                                                     configuration(_, 'continuation') /re[configuration(_, 'seq') /re[configuration(_, 'montenegro.jquery')]]]]]] in

  fn_[$('#output').val(let[code = $('#code').val(), c = create_caterwaul()] in (code && (parse_errors_for(code) || serialize(try_to_compile(c, code)))) || '')];

  $('#code').keyup(let[timeout = null] in fn_[timeout && clearTimeout(timeout), timeout = setTimeout(recompile, 200)]);
  $('input').change(recompile);

  $('li').click(fn_[$('#code').val('#{$("#code").val()}\n#{$(this).text()}'), recompile()]);
}));
