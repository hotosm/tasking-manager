$('#import').click(function() {
    $('input[name=import]').click();
    return false;
});

$('input[name=import]').change(function() {
    $('form').submit();
});
