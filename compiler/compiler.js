$(caterwaul.clone('std')(function () {
  var c = caterwaul.clone('std format');

  var recompile = let[parse_errors_for = function (code) {try {return ! new Function(code)} catch (e) {return e.toString()}},
                        try_to_compile = function (c, code) {try {return c.macroexpand(c.parse(code))} catch (e) {return e.toString()}},
                             serialize = fn[tree][tree.constructor === String ? tree : $('#minify').is(':checked') ? tree.serialize() :
                                                                                      $('#inspect').is(':checked') ? tree.inspect() : c.format(tree)],
                      create_caterwaul = fn_[let*[c1 = $('#std').is(':checked') ? caterwaul.clone('std') : caterwaul.clone(), c2 = $('#opt').is(':checked') ? c1.configure('opt') : c1,
                                                  c3 = $('#error').is(':checked') ? c2.configure('error') : c2, c4 = $('#iter').is(':checked') ? c3.configure('iter') : c3,
                                                  c5 = $('#seq').is(':checked') ? c4.configure('seq') : c4, c6 = $('#continuation').is(':checked') ? c5.configure('continuation') : c5,
                                                  c7 = $('#montenegro').is(':checked') ? c6.configure('montenegro.jquery') : c6] in c7]] in
  fn_[$('#output').val(let[code = $('#code').val(), c = create_caterwaul()] in (code && (parse_errors_for(code) || serialize(try_to_compile(c, code)))) || '')];

  $('#code').keyup(let[timeout = null] in fn_[timeout && clearTimeout(timeout), timeout = setTimeout(recompile, 200)]);
  $('input').change(recompile);

  $('code > a').click(fn_[$('#code').val('#{$("#code").val()}\n#{$(this).text()}'), recompile()]);
}));
