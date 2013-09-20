$().ready(function() {
    $('#flash').fadeIn().delay(2000).fadeOut(400);
    $('.timeago').timeago();


    $('#languages li a').on('click', function() {
        var language = $(this).text();

        $.ajax({
            url: '/user/prefered_language/' + language,
            complete: function(t) {
                location.reload();
            }
        });
        return false;
    });
});
