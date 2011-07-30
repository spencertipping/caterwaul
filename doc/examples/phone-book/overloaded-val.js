caterwaul.js_all()(function () {
  var original = $.fn.val;
  $.fn.overload_val(f) = this.data('overloaded-val', f);
  $.fn.val() = (this.data('overloaded-val') || original).apply(this, arguments);
})();