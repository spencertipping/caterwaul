// Caterwaul interactive shell | Spencer Tipping
// Licensed under the terms of the MIT source code license

// Introduction.
// This page provides the user with an interactive way to execute Caterwaul code. It compiles code, shows macroexpansions, and allows the user to inspect return values in some detail. If I've
// done my job correctly, it should be useful to (1) learn Caterwaul, and (2) drop onto a webserver to have a quick and powerful way to access APIs for troubleshooting.

// UI structure.
// Like most REPLs, this interface provides a prompt and a history area. Unlike most REPLs, though, the interface macroexpands the user's code in realtime. It also maintains a list of variables
// defined by the user and lets the user interactively inspect objects, arrays, and other values.

shell = caterwaul.clone('std format seq continuation montenegro')(function (options) {
  options = options || {};

  return html[div.shell(div.log(prompt))],

  where*[caterwaul_global = caterwaul.clone('std seq continuation opt montenegro parser'),

         input_syntax_check_delay = options.syntax_check_delay   || 30,
         up_arrow_keycode         = options.history_up_keycode   || 38,
         down_arrow_keycode       = options.history_down_keycode || 40,

         value_inspector(v)       = html[div.inspector]
                                    /se.i[i.append(specific()),
                                    
                                          where*[nullish_inspector(v)     = html[div.nullish_inspector(pre /text('' + v))],
                                                 array_inspector(v)       = html[div.array_inspector(span.bracket('['), seq[~v *+value_inspector], span.bracket(']'))],
                                                 regexp_inspector(v)      = html[div.regexp_inspector(pre /text(v.toString()), div.interact)]
                                                                            /se.i[i.find('.interact').append(html[input /keyup(test) /change(test) /blur(test)]),
                                                                                  where*[test() = i.find('input') /se[_.css({color: v.test(_.val()) ? 'green' : 'red'})]]],
                                                 html_inspector(v)        = html[div.html_inspector(pre /text(v.outerHTML))],
                                                 boxed_inspector(v)       = html[div.boxed_inspector(primitive_inspector(v), object_inspector(v))],
                                                 function_inspector(v)    = html[div.function_inspector(pre /text(caterwaul.clone('format').format(caterwaul.parse(v.toString()))))],
                                                 object_inspector(v)      = html[div.object_inspector(table)]
                                                                            /se.i[i.find('table').append(rows()),
                                                                                  where*[rows()    = seq[sp[v] *[row(_[0], _[1])]],
                                                                                         row(k, v) = html[tr(td.key /text(k), td.value(value_inspector(v)))]]],
                                                 primitive_inspector(v)   = html[div.primitive_inspector(pre /text('' + v))],

                                                 specific()               = v instanceof RegExp                                                                        ? regexp_inspector(v) :
                                                                            v instanceof Function                                                                      ? function_inspector(v) :
                                                                            typeof v === 'object' ? v == null                                                          ? nullish_inspector(v) :
                                                                                                    v instanceof Array || 'length' in v && v.length - 1 in v           ? array_inspector(v) :
                                                                                                    v instanceof HTMLElement                                           ? html_inspector(v) :
                                                                                                    v instanceof String || v instanceof Number || v instanceof Boolean ? boxed_inspector(v) :
                                                                                                                                                                         object_inspector(v) :
                                                                                                    primitive_inspector(v)]],

         prompt = html[div.prompt(input.input.fixed.large, pre.macroexpansion.fixed.large *readonly('true'))]
                  /se.p[p.find('.input').keyup(restart_timer).
                                         keyup(fn[e][navigate_through_history(e), when[e.which === up_arrow_keycode || e.which === down_arrow_keycode]]).
                                         enter_key(fn[e][result($(this).val())]),

                        where*[edit_history                = seq[~[]],
                               edit_index                  = 0,

                               event(name)                 = l[f = options[name]][f && f.apply(this, seq[~arguments].slice(1))],

                               navigate_through_history(e) = e.which === up_arrow_keycode ? history_up() : history_down(),
                               history_up()                = edit_index > 0                   && stash_current_entry() && load_new_entry(edit_index - 1),
                               history_down()              = edit_index < edit_history.size() && stash_current_entry() && load_new_entry(edit_index + 1),
                               history_append(text)        = edit_index = edit_history.push(text).size(),
                               stash_current_entry()       = edit_history /se[_[edit_index] = p.find('.input').val(), when[edit_index < _.size()]],
                               load_new_entry(index)       = p.find('.input') /se[_.val(edit_history[edit_index = index] || '')],

                               timer                       = null,
                               do_timer_action()           = l[expanded = macroexpand(p.find('.input').val())][event('macroexpansion', expanded), p.find('.macroexpansion').text(expanded)],
                               restart_timer()             = timer /se[_ && clearTimeout(_), timer = setTimeout(do_timer_action, input_syntax_check_delay)],

                               syntax_errors(s)            = s ? unwind_protect[e.toString()][new Function('return (#{s})') && ''] : ' ',
                               macroexpand(code)           = syntax_errors(code) || caterwaul.format(caterwaul_global(caterwaul.parse(code))),

                               result(text)                = compile_into_function(text) /se[_ ? accept_input(text, _) : reject_input()],
                               compile_into_function(text) = unwind_protect[false][caterwaul_global('function () {return (#{text})}', environment)],

                               accept_input(text, f)       = run_user_input(text, f) /se[history_append(text), clear_fields(), event('input_accepted', text, f)],
                               bombproof_execute(f)        = unwind_protect[{error: e}][{result: f()}],
                               clear_fields()              = p.find('.input, .macroexpansion').val('').text(''),
                               run_user_input(text, f)     = log_user_input(text) /se[l[result = bombproof_execute(f)][result.error ? log_error(result.error) : log_value(result.result)]],

                               reject_input(f)             = event('input_rejected', f),

                               adjust_scrolling()          = p.up('.shell').scrollTop(l[h = p.up('.shell').height()] in p.parent().height() - h),
                               after_log()                 = event('appended_to_log') /se[setTimeout(adjust_scrolling, 0)],

                               log_error(e)                = e /se[p.before(html[div.error(value_inspector(e))]) /se[after_log()]],
                               log_user_input(s)           = s /se[p.before(html[div.input(pre.fixed /text(s))]) /se[after_log()]],
                               log_value(v)                = v /se[p.before(html[div.value(value_inspector(v))]) /se[after_log()]],

                               console_object()            = caterwaul.util.merge({}, logging_functions(), timing_functions()),
                               logging_functions()         = {log: log_value, error: log_error},
                               timing_functions()          = {profile: fn[f][l[start = +new Date()] in f() /se[log_value('#{+new Date() - start}ms')]]},
                               environment                 = caterwaul.util.merge(options.environment || {}, {console: console_object()})]]]});
// Generated by SDoc 
