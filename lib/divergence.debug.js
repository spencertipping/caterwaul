// Divergence debug module | Spencer Tipping <spencer@spencertipping.com>
// Licensed under the terms of the MIT source code license

// This debug module enables expression-level debugging and tracing for functions. It records history (controlled by history-recording commands) and lets you replay sequences of events or
// systematically search through them. Note that this can be arbitrarily memory-intensive; recording every single expression that goes through a system is an expensive way to debug things. To
// compensate it uses a sliding window that tracks only the last 10000 results. (This can be changed on a per-watcher basis.)

// It also keeps track of expressions that are reached but never evaluated. These are stored in an "unrequited" log, which is separate from the main event log since these events are usually more
// important. The unrequited log is a stack; when it gets an initialization signal an event is pushed, and when an expression is successfully evaluated an event is popped. Expressions that remain
// are erroneous or otherwise unevaluated.

// There is an interesting problem that arises with invasive debugging like this. If you have method calls such as toString(), which are evaluated automatically upon type coercion, then you could
// end up with an infinite loop. The best way around this is to first run the problematic code, logging the results, then deactivate the hook, and finally print the queue. This is less convenient
// than tracing directly, but the advantage is that toString() and any other functions that are run implicitly won't cause the debugger to enter an infinite loop.

d.rebase (function () {
  var t = d.debug = _ >$> d.debug.init (this, arguments), global = this, syn = x >$> new d.rebase.syntax(null, x),
    set = xs >$> xs * '$0.maps_to(true)'.fn() / d.init, qw = s >$> s.split(/\s+/), qs = set.compose(qw), start = new Date().getTime();

  d.functions ({traced: function (options) {var f = this.fn(), options = options || {}, tracer = options.tracer || d.trace, name = options.name || 'anonymous', count = 0;
                                            return d.init (function () {var c = ++count;
                                                                        tracer ('#{name} (#{c}) called on #{this} with [#{Array.prototype.slice.call (arguments).join (", ")}]');
                                                                        try       {var result = f.apply (this, arguments); tracer ('#{name} (#{c}) returned #{result}'); return result}
                                                                        catch (e) {tracer ('#{name} (#{c}) threw #{e}'); throw e}},
                                                           {original: f})}});

  d.init (t, {ring_buffer: '@size = $0, @elements = $1 || [], @position = -1'.ctor ({'<<': '@elements[@position = @position + 1 % @size] = $0, $_'.fn(),
                                                                               'to_array': '@elements.slice(@position + 1).concat (@elements.slice(0, @position + 1))'.fn()}),
                 reserved:  qs('break continue default eval'),   first_only: qs('.'),
                     stop:  qs('++ -- u++ u-- new'),            second_only: qs('function catch = : += -= *= /= %= ^= |= &= <<= >>= >>>= in'),
                     skip:  qs('{ ( [ , ; ?: case var if while for do switch return throw delete export import try finally void with else'),
        protected_resolve:  qs('[! .'),

                    event: '@node = $0, @value = $1, @time = new Date(), @hook = $2, @count = $3'.ctor (
                             {toString: _ >$> (this.is_before_evaluation() ? '(#{this.node}) is about to be evaluated' :
                                                                             '(#{this.node}) = (#{this.value}) at +#{this.time.getTime() - start} (event #{this.count})'),
                  is_before_evaluation: _ >$> (this.value === this.hook)}),

                    trace: (p, f) >$> new t.watcher().use_tracing(f && p).annotate (f || p),

                  watcher: (options >$> (this.name       = d.gensym ('hook'),
                                         this.events     = new t.ring_buffer (options && options.event_log_size || 10000),
                                         this.unrequited = [],
                                         this.predicate  = options && options.predicate || (0).fn())).ctor ({

                            use_logging: _ >$> (global[this.name] = this.hook_function (this.log.bind (this)), this),
                            use_tracing: p >$> (this.predicate = p || this.predicate, global[this.name] = this.hook_function (this.trace.bind (this)), this),

                           destroy_hook: function () {delete global[this.name]; this.installed_hook = null; return this},
                          activate_hook: _ >$> (global[this.name] && (global[this.name].active = true),  this),
                        deactivate_hook: _ >$> (global[this.name] && (global[this.name].active = false), this),
                            hook_active: _ >$> (global[this.name] && global[this.name].active),

                          hook_function: destination >$> (this |$> ((w, hook) >$> (hook = (index, value) >$> (hook.active && (
                                                                                                                value === hook ? w.unrequited.push (w.trace_points[index]) : w.unrequited.pop(),
                                                                                                                destination (new t.event (w.trace_points[index], value, hook, ++hook.count))),
                                                                                                              value),
                                                                                   hook.active = true,
                                                                                   hook.count  = 0,
                                                                                   hook))),

                          annotate_tree: function (v) {global[this.name] || (this.installed_hook = this.use_logging());
                                                       var $_ = this,  trace_points = this.trace_points = this.trace_points || [],
                                                                      annotate_node = (s, v) >$> syn('(') << (syn(',') <<
                                                                                                   (syn('(!') << $_.name << (syn('(') << (syn(',') << trace_points.length << $_.name))) << 
                                                                                                   (syn('(!') << $_.name << (syn('(') << (syn(',') << (trace_points.push(s) - 1) << v)))),
                                                                  annotate_children =     v  >$> (v.xs ? (v.xs * annotate_tree).fold ((x, y) >$> x << y, syn(v.op)) : v),
                                                                      annotate_tree =     v  >$> (! v || t.reserved[v] ? v :
                                                                                                          t.stop[v.op] ? annotate_node(v, v) :
                                                                                                          t.skip[v.op] ? annotate_children(v) :
                                                                                                    t.first_only[v.op] ? syn(v.op) << annotate_tree(v.xs[0]) << v.xs[1] :
                                                                                                   t.second_only[v.op] ? syn(v.op) << v.xs[0] << annotate_tree(v.xs[1]) :
                                                            v.op == '(!' && v.xs[0] && t.protected_resolve[v.xs[0].op] ? annotate_node (v,
                                                                                                                           syn(v.op) << (syn(v.xs[0].op) << annotate_tree(v.xs[0].xs[0]) <<
                                                                                                                                                            v.xs[0].xs[1]) <<
                                                                                                                                        annotate_tree (v.xs[1])) :
                                                                                                                ! v.xs ? /^@?[A-Za-z_$][A-Za-z0-9_$]*$/.test(v) ? annotate_node(v, v) : v :
                                                                                                                         annotate_node (v, annotate_children (v)));
                                                       return annotate_tree (v)},

                               annotate: f >$> d.rebase.deparse (this.annotate_local (f)),
                         annotate_local: f >$> this.annotate_tree (d.rebase.parse (f)).toString(),

                                  trace: e >$> ((this, this.hook_active()) |$> ((t, a) >$> (t.deactivate_hook(), t.predicate(e) && d.trace(e), a && t.activate_hook()))),
                                    log: e >$> (e ? this.events << e : this.events.to_array())})})}) ();