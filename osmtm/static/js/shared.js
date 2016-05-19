$().ready(function() {
    $('.flash').fadeIn().delay(2000).fadeOut(800);
    $('.timeago').timeago();


    $('.navbar .languages li a').on('click', function() {
        var language = $(this).attr("href");

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

    // prepare the unread messages notification popover
    $('.navbar .username .badge').popover({
      placement: 'bottom',
      content: unreadMsgsI18n,
      trigger: 'manual',
      template: '<div class="popover text-danger unread"><div class="arrow"></div><div class="popover-inner"><div class="popover-content"><p></p></div></div></div>'
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

var checkMessageTimeout;
var lastMessageCheck = (new Date()).getTime();

function checkForMessages() {
  window.clearTimeout(checkMessageTimeout);
  checkMessageTimeout = window.setTimeout(checkForMessages, 30 * 1000);

  var now = (new Date()).getTime();
  var interval = now - lastMessageCheck;
  $.ajax({
    url: base_url + "user/messages/check",
    data: {
      interval: interval
    },
    success: function(data) {
      // check for any unread message
      if (data.unread) {
        notifyUnread(data.unread);
      }
      // check for new message until last check
      if (data.new_message) {
        // don't alert if the focus is on the current window
        // popover is enough
        if (!document.hasFocus || !document.hasFocus()) {
          // we use alert here to make sure the focus is on tasking manager
          alert(unreadMsgsI18n);
        }
      }
    },
    dataType: "json"}
  );
  lastMessageCheck = now;
}

// Update the unread badge and show popover
function notifyUnread(unreadMsgs) {
  $('.unread.badge').text(unreadMsgs);
  $('.navbar .username .badge').popover('show').next().velocity('callout.shake');
  $('.navbar .username').click(function() {
    $('.navbar .username .badge').popover('hide');
  });
}
