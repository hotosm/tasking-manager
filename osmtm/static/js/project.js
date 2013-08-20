var task_layer;
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

    var tiles = new L.TileLayer(
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
    $('#task').load(base_url + "task/" + id, null, function() {
        task_layer.clearLayers();
        task_layer.addData(task_geometry);
    });
}

Sammy(function() {
    this.get('#task/:id', function() {
        loadTask(this.params.id);
    });
}).run();
