var map = null,
    vectorLayer = null,
    tiles = null;

function updateSubmitBtnStatus() {
    var disabled = $('#geometry').val() === '';
    $('#id_submit')[0].disabled = disabled;
}

var map = L.map('leaflet').setView([0, 0], 0);
// create the tile layer with correct attribution
var osmUrl='http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
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

var vector = new L.LayerGroup();
map.on('draw:poly-created', function(e) {
    vector.addLayer(e.poly);
    $('#geometry').val(toGeoJSON(e.poly));
    updateSubmitBtnStatus();
});
map.on('drawing', function(e) {
    vector.clearLayers();
    $('#geometry').val('');
    updateSubmitBtnStatus();
});
map.addLayer(vector);


var toGeoJSON = function(polygon) {
    var json, type, latlng, latlngs = [], i;

    type = 'Polygon';
    polygon._latlngs.push(polygon._latlngs[0]);
    latlngs = LatLngsToCoords(polygon._latlngs, 1);
    return JSON.stringify({"type": type, "coordinates": [latlngs]});
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

$('input[name=osm]').change(function() {
    var formData = new FormData();
    formData.append('file', $('input[name=osm]')[0].files[0]);
    $.ajax({
        url: '/import_osm',  //Server script to process data
        type: 'POST',
        xhr: function() {  // Custom XMLHttpRequest
            var myXhr = $.ajaxSettings.xhr();
            if(myXhr.upload){ // Check if upload property exists
                myXhr.upload.addEventListener('progress',progressHandlingFunction, false); // For handling the progress of the upload
            }
            return myXhr;
        },
        //Ajax events
        //beforeSend: beforeSendHandler,
        success: function(response) {
            console.log("complete");
            var layer = new L.geoJson(response);
            map.fitBounds(layer.getBounds());
            map.zoomOut();
            map.addLayer(layer);
        },
        dataType: 'json',
        //error: errorHandler,
        // Form data
        data: formData,
        //Options to tell jQuery not to process data or worry about content-type.
        cache: false,
        contentType: false,
        processData: false
    });
});
function progressHandlingFunction(e){
    if(e.lengthComputable){
        console.log(e.loaded, e.total);
    }
}
