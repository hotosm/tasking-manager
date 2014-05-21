var map = null,
    vectorLayer = null,
    tiles = null;

function updateSubmitBtnStatus() {
    var disabled = $('#geometry').val() === '';
    $('#id_submit')[0].disabled = disabled;
}

var map = L.map('leaflet').setView([0, 0], 1);
// create the tile layer with correct attribution
var osmUrl='http://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png';
var osmAttrib='Map data © OpenStreetMap contributors';
var osm = new L.TileLayer(osmUrl, {attribution: osmAttrib, drawControl: true});
map.addLayer(osm);

var drawControl = new L.Control.Draw({
    position: 'topleft',
    rectangle: false,
    circle: false,
    marker: false,
    polyline: false,
    polygon: {
        title: 'Draw the area of interest'
    }
});
map.addControl(drawControl);

$('#draw').on('click', function() {
    var handler = drawControl.handlers.polygon;
    if (handler._enabled) {
        handler.disable();
        $(this).removeClass('active');
    } else {
        handler.enable();
        $(this).addClass('active');
    }
});

var vector = new L.geoJson();
map.on('draw:poly-created', function(e) {
    vector.addLayer(e.poly);
    map.fitBounds(vector.getBounds());
    $('#geometry').val(toGeoJSON(e.poly))
        .trigger('change');
    updateSubmitBtnStatus();
    $('#draw').removeClass('active');
});
map.on('drawing', function(e) {
    $('#draw').addClass('active');
    cancel();
});
map.addLayer(vector);

$('#geometry').change(function() {
    $('#help-step1').addClass("hidden");
    $('#partition').removeClass("hidden");
    changeTileSize(2);
    grid.show();
});

var toGeoJSON = function(polygon) {
    var json, type, latlng, latlngs = [], i;

    type = 'Polygon';
    polygon._latlngs.push(polygon._latlngs[0]);
    latlngs = LatLngsToCoords(polygon._latlngs, 1);
    return JSON.stringify({"type": "Feature", "geometry": {"type": 'Polygon', "coordinates": [latlngs]}});
};

var LatLngToCoords = function (LatLng, reverse) { // (LatLng, Boolean) -> Array
    var lat = parseFloat(reverse ? LatLng.lng : LatLng.lat),
        lng = parseFloat(reverse ? LatLng.lat : LatLng.lng);

    return [lng,lat];
};

var LatLngsToCoords = function (LatLngs, levelsDeep, reverse) { // (LatLngs, Number, Boolean) -> Array
    var coord,
        coords = [],
        i, len;

    for (i = 0, len = LatLngs.length; i < len; i++) {
        coord = levelsDeep ?
                LatLngToCoords(LatLngs[i], levelsDeep - 1, reverse) :
                LatLngToCoords(LatLngs[i], reverse);
        coords.push(coord);
    }

    return coords;
};

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

var grid = $('<div>');
$('#leaflet .leaflet-control-container').append(grid);
function changeTileSize(index) {
    var sizes = [64, 32, 16, 8, 4];
    grid.attr('class', 'grid' + sizes[index]);
    $('#zoom').val(map.getZoom() + 2 + index);
}

function cancel() {
    vector.clearLayers();
    $('#geometry').val('');
    updateSubmitBtnStatus();
    $('#help-step1').removeClass("hidden");
    $('#partition').addClass("hidden");
    grid.hide();
}
$('#cancel').click(function() {
    cancel();
    return false;
});

$('#import').click(function() {
    drawControl.handlers.polygon.disable();
    $('#draw').removeClass('active');
    $('input[name=import]').click();
    return false;
});
$('input[name=import]').change(function() {
    var file = $(this).val();
    if (file.substr(-4) != 'json') {
        alert("Please provide a .geojson file");
    } else {
        readAsText($(this)[0].files[0], function(err, text) {
            readFile(file, text, onImport);
        });
    }
});

function onImport(err, gj, warning) {
    if (gj && gj.features) {
        vector.addData(gj);
        map.fitBounds(vector.getBounds());
        window.setTimeout(function() {
            $('#geometry').val(JSON.stringify(gj)).trigger('change');
            updateSubmitBtnStatus();
        }, 500);
    }
}
$('#mainform').submit(function() {
    window.setTimeout(function() {
        $('#id_submit')
            .attr('disabled', 'disabled');
        $('#loading').show();
    }, 0);
});


// taken from the great GeoJSON.io
function readAsText(f, callback) {
    try {
        var reader = new FileReader();
        reader.readAsText(f);
        reader.onload = function(e) {
            if (e.target && e.target.result) callback(null, e.target.result);
            else callback({
                message: 'Dropped file could not be loaded'
            });
        };
        reader.onerror = function(e) {
            callback({
                message: 'Dropped file was unreadable'
            });
        };
    } catch (e) {
        callback({
            message: 'Dropped file was unreadable'
        });
    }
}

function readFile(f, text, callback) {
    try {
        var gj = JSON.parse(text);
        return callback(null, gj);
    } catch (e) {
        alert('invalid JSON');
    }
}
