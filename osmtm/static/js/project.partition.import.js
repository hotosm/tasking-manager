$('#import').click(function() {
    $('input[name=import]').click();
    return false;
});

$('input[name=import]').change(function() {
    if ($(this).val().substr(-8) != '.geojson') {
        alert("Please provide a .geojson file");
    } else {
        $('form').submit();
    }
});
$('form').submit(function() {
    window.setTimeout(function() {
        $('#import').attr('disabled', 'disabled');
        $('#loading').show();
    }, 0);
});
