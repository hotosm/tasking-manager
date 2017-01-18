(function ( $ ) {
  $.fn.timeago = function() {

    function refresh() {
      var el = $(this);
      var date = el.attr('title');
      el.text(moment(date).fromNow());
    }

    return this.each(function() {
      var refresh_el = $.proxy(refresh, this);
      refresh_el();
      this._timeagoInterval = setInterval(refresh_el, 60000);
    });
  };
}( jQuery ));
