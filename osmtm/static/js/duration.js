(function ( $ ) {
  $.fn.duration = function() {
    return this.each(function() {
      var el = $(this);
      var duration = el.attr('title');
      el.html(moment.duration(duration).humanize());
    });
  };
}( jQuery ));
