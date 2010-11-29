$(caterwaul.clone('std continuation')(function () {
  var c = caterwaul.clone('std format');
  var simplify_gensym = {} /re[let[count = 0] in fn[g][_[g] || (_[g] = 'g#{++count}')]];

  var recompile = let*[parse_errors_for(code) = unwind_protect[e.toString()][! new Function(code)],
                      try_to_compile(c, code) = unwind_protect[e.toString()][c.macroexpand(c.parse(code))],
                              serialize(tree) = (tree.constructor === String ? tree : $('#minify').is(':checked') ? tree.serialize() :
                                                                                      $('#inspect').is(':checked') ? tree.inspect() : c.format(tree))
                                                /re[$('#gensyms').is(':checked') ? _.replace(/gensym_\w+/g, simplify_gensym) : _],
                     configuration(c, config) = $('##{config}').is(':checked') ? c.configure(config) : c,
                           create_caterwaul() = configuration(caterwaul.clone(), 'std') /re[configuration(_, 'opt') /re[
                                                       configuration(_, 'continuation') /re[configuration(_, 'seq') /re[configuration(_, 'montenegro')]]]]] in

  fn_[$('#output').val(let[code = $('#code').val(), c = create_caterwaul()] in (code && (parse_errors_for(code) || serialize(try_to_compile(c, code)))) || '')];

  $('#code').keyup(let[timeout = null] in fn_[timeout && clearTimeout(timeout), timeout = setTimeout(recompile, 200)]);
  $('input').change(recompile);

  $('li').click(fn_[$('#code').val('#{$("#code").val()}\n#{$(this).text()}'), recompile()]);
}));
