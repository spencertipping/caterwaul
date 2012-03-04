$(caterwaul('js_all jquery')(function () {
  $('body').append(top_button_row, board.div)
  -where [
    board           = life_board(30, 30),
    interval        = null,
    run_or_stop()   = interval ? stop_running()  -se- $(this).text('Run') :
                                 start_running() -se- $(this).text('Stop'),
    start_running() = interval = board.step /-setInterval/ 100,
    stop_running()  = interval /!clearInterval -se [interval = null],
    top_button_row  = jquery in div(
                        button.step('Step') /click(board.step),
                        button.run('Run')   /click(run_or_stop))]
  -where [
    life_board(x, y)    = {cells: cells,
                           div:   div_for(cells),
                           step:  step_function(cells)}
                          -where [cells = cells_for(x, y)],

    cells_for(x, y)     = n[x] *[n[y] *y[cell_for(x, y)] -seq] -seq,
    cell_for(x, y)      = jquery in div.cell *!x(x) *!y(y) %position(x, y)
                                                           %invert_on_click,
    position(x, y)(e)   = e.css({position: 'absolute',
                                 left: x * 12, width:  10,
                                 top:  y * 12, height: 10}),

    invert_on_click(e)  = e.mousedown("$(this).toggleClass('on')".qf),
    div_for(cs)         = jquery [div.board]
                          -se- cs *![x *![it.append(x)] -seq] /seq,
    step_function(cs)() =
      cs *![x *!update -seq] -seq
      -where [
        new_state(x, y) = on(x, y) ? count(x, y) -re [it >= 2 && it <= 3] :
                                     count(x, y) === 3,
        count(x, y)     = adjacent(x, y) /[x + x0] -seq,
        product(xs, ys) = xs *~![ys *y[[x, y]] -seq] -seq,
        offsets         = ~product(ni[-1, 1], ni[-1, 1]) %[x[0] || x[1]] -seq,
        adjacent(x, y)  = offsets *o[+on(x + o[0], y + o[1])] -seq,
        cell(x, y)      = cs[wrap(x, cs)] -re- it[wrap(y, it)],
        wrap(x, xs)     = (x + xs.length) % xs.length,
        on(x, y)        = cell(x, y).hasClass('on'),

        new_states      = cs *[x *y[new_state(xi, yi)] -seq] -seq,
        update(cell)    = cell.toggleClass('on',
                            new_states[cell.data('x')][cell.data('y')])]]}));