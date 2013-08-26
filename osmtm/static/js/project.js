var task_layer, tiles;
$('a[data-toggle="tab"]').on('shown', function (e) {
    if (e.target.id != 'map_tab') {
        return;
    }
    var map = L.map('leaflet');
    // create the tile layer with correct attribution
    var osmUrl='http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    var osmAttrib='Map data © OpenStreetMap contributors';
    var osm = new L.TileLayer(osmUrl, {attribution: osmAttrib});
    map.addLayer(osm);

    var layer = new L.geoJson(geometry);
    map.fitBounds(layer.getBounds());
    map.zoomOut();

    tiles = new L.TileLayer(
        '/project/' + project_id + '/{z}/{x}/{y}.png'
    );
    map.addLayer(tiles);

    task_layer = L.geoJson().addTo(map);

    var grid = new L.UtfGrid(
        '/project/' + project_id + '/{z}/{x}/{y}.json', {
        useJsonP: false
    });
    map.addLayer(grid);
    grid.on('click', function (e) {
        if (e.data && e.data.id) {
            location.hash = ["task", e.data.id].join('/');
        } else {
            clearSelection();
        }
    });
});

function clearSelection() {
    location.hash = "";
    task_layer.clearLayers();
    $('#task').empty();
}

function loadTask(id) {
    $('#map_tab').tab('show');
    $('#task').load(base_url + "task/" + id, null, function(response, status, request) {
        if (status != 'error') {
            task_layer.clearLayers();
            task_layer.addData(task_geometry);
        } else {
            alert("an error occured");
        }
    });
}

function startLoading() {
    console.info("show loading");
    //$('#task .loading').show();
}
function stopLoading() {
    //$('#task .loading').hide();
}

function onTaskAction(e) {

    var direction = e.data && e.data.direction;
    startLoading();
    $.getJSON(this.href, function(data) {
        stopLoading();

        tiles.redraw();
        //if (data.tile) {
            //var tile = data.tile;
            //loadTask(tile.x, tile.y, tile.z, direction);
            //return;
        //}
        //if (data.error_msg) {
            //$('#task_error_msg').html(data.error_msg).show()
                //.delay(3000)
                //.fadeOut();
            //return;
        //}
        //if (data.split_id) {
            //splitTask(data.split_id, data.new_tiles);
        //}
        //loadEmptyTask();
    });
    return false;
}
$(document).on('click', '#lock', {direction: 'next'}, onTaskAction);

Sammy(function() {
    this.get('#task/:id', function() {
        loadTask(this.params.id);
    });
}).run();
