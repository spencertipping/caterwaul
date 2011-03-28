// Caterwaul interactive shell | Spencer Tipping
// Licensed under the terms of the MIT source code license

// Introduction.
// This page provides the user with an interactive way to execute Caterwaul code. It compiles code, shows macroexpansions, and allows the user to inspect return values in some detail. If I've
// done my job correctly, it should be useful to (1) learn Caterwaul, and (2) drop onto a webserver to have a quick and powerful way to access APIs for troubleshooting.

// UI structure.
// Like most REPLs, this interface provides a prompt and a history area. Unlike most REPLs, though, the interface macroexpands the user's code in realtime. It also maintains a list of variables
// defined by the user and lets the user interactively inspect objects, arrays, and other values.

$(caterwaul.clone('std format seq continuation montenegro')(function () {
  $('body').append(log, prompt),
  setTimeout(fn_[$('.prompt .input').focus()], 0),

  where*[caterwaul_global = caterwaul.clone('std seq continuation opt montenegro parser'),

         input_syntax_check_delay = 100,
         up_arrow_keycode         = 38,
         down_arrow_keycode       = 40,

         prompt = html[div.prompt(input.input.fixed.large, pre.macroexpansion.fixed.large *readonly('true'))]
                  /se.p[p.find('.input').keyup(restart_timer).
                                         keyup(fn[e][navigate_through_history(e), when[e.which === up_arrow_keycode || e.which === down_arrow_keycode]]).
                                         enter_key(fn[e][result($(this).val())]),

                        where*[edit_history                = seq[~[]],
                               edit_index                  = 0,

                               navigate_through_history(e) = e.which === up_arrow_keycode ? history_up() : history_down(),
                               history_up()                = edit_index > 0                   && stash_current_entry() && load_new_entry(edit_index - 1),
                               history_down()              = edit_index < edit_history.size() && stash_current_entry() && load_new_entry(edit_index + 1),
                               history_append(text)        = edit_index = edit_history.push(text).size(),
                               stash_current_entry()       = edit_history /se[_[edit_index] = p.find('.input').val(), when[edit_index < _.size()]],
                               load_new_entry(index)       = p.find('.input') /se[_.val(edit_history[edit_index = index] || '')],

                               timer                       = null,
                               do_timer_action()           = p.find('.macroexpansion').text(macroexpand(p.find('.input').val())),
                               restart_timer()             = timer /se[_ && clearTimeout(_), timer = setTimeout(do_timer_action, input_syntax_check_delay)],

                               syntax_errors(s)            = unwind_protect[e.toString()][new Function('return (#{s})') && ''],
                               macroexpand(code)           = syntax_errors(code) || caterwaul.format(caterwaul_global(caterwaul.parse(code))),

                               result(text)                = compile_into_function(text) /se[_ ? accept_input(text, _) : reject_input()],
                               compile_into_function(text) = unwind_protect[false][caterwaul_global('function () {return (#{text})}')],

                               accept_input(text, f)       = run_user_input(text, f) /se[history_append(text), p.find('.input, .macroexpansion').val('').text('')],
                               bombproof_execute(f)        = unwind_protect[{error: e}][{result: f()}],
                               run_user_input(text, f)     = l[result = bombproof_execute(f)][log_user_input(text), result.error ? log_error(result.error) : log_value(result.result)],

                               reject_input(f)             = null,

                               after_log()                 = setTimeout(fn_[$(window).scrollTop($('#log').children() /re[_[_.length - 2]] /re[$(_).offset().top])], 0),

                               log_error(e)                = $('#log').append(html[div.error(pre.fixed /text(e.toString()))])                      /se[after_log()],
                               log_user_input(s)           = $('#log').append(html[div.input(pre.fixed /text(s))])                                 /se[after_log()],
                               log_value(v)                = $('#log').append(html[div.value(pre.fixed /text(v == null ? '' + v : v.toString()))]) /se[after_log()]]],

         log = html[div *id('log')]]}));
// Generated by SDoc 
