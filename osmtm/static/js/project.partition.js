var map = L.map('leaflet');
// create the tile layer with correct attribution
var osmUrl='http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
var osmAttrib='Map data © OpenStreetMap contributors';
var osm = new L.TileLayer(osmUrl, {attribution: osmAttrib});
map.addLayer(osm);

var layer = new L.geoJson(geometry);
map.addLayer(layer);
map.fitBounds(layer.getBounds());

var grid = $('<div>');
$('#leaflet .leaflet-control-container').append(grid);

function changeTileSize(index) {
    var sizes = [64, 32, 16, 8, 4];
    grid.attr('class', 'grid' + sizes[index]);
    $('#zoom').val(map.getZoom() + 2 + index);
}

changeTileSize(2);

var i = 0;
var buttons = $('#tile_size button');
buttons.each(function(index, button) {
    //$(button).val(map.getZoom() + index + 2);
    $(button).click(function() {
        buttons.removeClass('active');
        $(this).addClass('active');
        changeTileSize(index);
        return false;
    });
});

$('#loading').hide();
$('form').submit(function() {
    window.setTimeout(function() {
        $('#id_submit')
            .attr('disabled', 'disabled');
        $('#loading').show();
    }, 0);
});

// check partition_type choice change
$('input[name=partition_type]').change(function() {
    // disable all input
    $("input[name=partition_type]").parent().siblings()
        .find('*').attr('disabled', true);
    // enable the chozen ones
    $(this).parent().siblings()
        .find('*').attr('disabled', false);
    if ($(this).val() == 'grid') {
        grid.show();
    } else {
        grid.hide();
    }
});
$('#import').click(function() {
    $('input[name=import]').click();
    return false;
});

$('input[name=import]').change(function() {
    $('form').submit();
});
