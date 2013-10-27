$('#import').click(function() {
    $('input[name=import]').click();
    return false;
});

$('input[name=import]').change(function() {
    $('form').submit();
});
$('form').submit(function() {
    window.setTimeout(function() {
        $('#import').attr('disabled', 'disabled');
        $('#loading').show();
    }, 0);
});
