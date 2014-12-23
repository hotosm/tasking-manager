$().ready(function() {
    $('.flash').fadeIn().delay(2000).fadeOut(800);
    $('.timeago').timeago();


    $('.navbar .languages li a').on('click', function() {
        var language = $(this).text();

        $.ajax({
            url: base_url + 'user/prefered_language/' + language,
            complete: function(t) {
                location.reload();
            }
        });
        return false;
    });
    $('[rel=tooltip]').tooltip();
    $('[data-toggle="tooltip"]').tooltip();

    $('.markdown').on('click', function(event) {
      event.preventDefault();
      $.get(markdown_ref_url, function(data) {
        $('#markdown_cheat_sheet .modal-body').html(data);
        $('#markdown_cheat_sheet').modal();
      });
    });

    // ensure that any link on a different domain opens in a _blank target
    $(document).on('click', 'a', function(event) {
        var a = new RegExp('/' + window.location.host + '/');
        if(this.href && !a.test(this.href)) {
            event.preventDefault();
            event.stopPropagation();
            window.open(this.href, '_blank');
        }
    });

    $(document).on('click', function (e) {
      //only buttons
      if ($(e.target).data('toggle') !== 'popover' &&
          $(e.target).parents('.popover.in').length === 0) {
        $('[data-toggle="popover"]').popover('hide');
      }
    });
});

function hideTooltips() {
    $('[rel=tooltip]').tooltip('hide');
    $('[data-toggle=popover]').popover('hide');
}

$.fn.serializeObject = function()
{
    var o = {};
    var a = this.serializeArray();
    $.each(a, function() {
        if (o[this.name] !== undefined) {
            if (!o[this.name].push) {
                o[this.name] = [o[this.name]];
            }
            o[this.name].push(this.value || '');
        } else {
            o[this.name] = this.value || '';
        }
    });
    return o;
};

$.fn.slide = function(type) {
  // we hide tooltips since they may interact with transitions
  hideTooltips();
  var $container = $(this);
  var $active = $('<div class="item active">');
  $active.html($container.html());
  $container.html('').append($active);
  var direction = type == 'next' ? 'left' : 'right';
  var $next = $('<div>');
  if ($.support.transition) {
    $next.addClass(type);
    $next.offsetWidth; // force reflow
    $container.append($next);
    setTimeout(function() {
      $active.addClass(direction);
      $active.one($.support.transition.end, function (e) {
        $next.removeClass([type, direction].join(' ')).addClass('active');
        $active.remove();
        setTimeout(
          function () {
            $next.addClass('item');
            $container.trigger('slid');
          },
          0
        );
      });
    }, 200); // time to hide tooltips
  } else {
    setTimeout(
      function () {
        $next.addClass('item');
        $container.trigger('slid');
      },
      0
    );
  }
  return this;
};
