$().ready(function() {
    $('#flash').fadeIn().delay(2000).fadeOut(400);
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
