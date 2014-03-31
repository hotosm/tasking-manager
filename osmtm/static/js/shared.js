$().ready(function() {
    $('.flash').fadeIn().delay(2000).fadeOut(800);
    $('.timeago').timeago();


    $('.navbar .languages li a').on('click', function() {
        var language = $(this).text();

        $.ajax({
            url: '/user/prefered_language/' + language,
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
      $.get("/static/markdown_quick_ref.html", function(data) {
        $('#markdown_cheat_sheet .modal-body').html(data);
        $('#markdown_cheat_sheet').modal();
      });
    });

    // ensure that any link on a different domain opens in a _blank target
    $(document).on('click', 'a', function(event) {
        var a = new RegExp('/' + window.location.host + '/');
        if(!a.test(this.href)) {
            event.preventDefault();
            event.stopPropagation();
            window.open(this.href, '_blank');
        }
    });
});
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
