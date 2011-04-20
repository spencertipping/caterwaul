// Event listening API.
// Caterwaul can create pairs of listener/broadcast interfaces for events. For example, suppose we wanted to provide a facility for macros to issue compile-time warnings; one way to do this would
// be to create a 'warning' event and allow interested parties to listen for it. Here's how that might look:

// | caterwaul.event('warning');   // Sets up the interface
//   caterwaul.on_warning(function (w) {console.log('Warning: ' + w)});    // Adds a listener
//   caterwaul.warning('this is a test');                                  // Triggers all listeners with the given parameter

// The context (i.e. 'this') of each event listener is the caterwaul object.

  caterwaul_global.variadic('event', function (name) {
    var listeners = name + '_listeners', new_listener = 'on_' + name;
    return this.shallow(listeners, []).variadic(new_listener, function (l) {this[listeners].push(l); return this}).
                                         method(name,         function ()  {for (var ls = this[listeners], i = 0, l = ls.length; i < l; ++i) ls[i].apply(this, arguments); return this})});
// Generated by SDoc 
