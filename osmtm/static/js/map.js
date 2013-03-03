$('a[data-toggle="tab"]').on('shown', function (e) {
    if (e.target.id != 'task_tab') {
        return;
    }
    var map = L.map('leaflet');
    // create the tile layer with correct attribution
    var osmUrl='http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    var osmAttrib='Map data © OpenStreetMap contributors';
    var osm = new L.TileLayer(osmUrl, {attribution: osmAttrib});
    map.addLayer(osm);

    var layer = new L.geoJson(geometry);
    map.addLayer(layer);
    map.fitBounds(layer.getBounds());

    function getTaskTilesUrl(task_id) {
        return '/map/' + map_id + '/task/' + task_id + '/{z}/{x}/{y}.png';
    }
    var tiles = new L.TileLayer(getTaskTilesUrl($('#id_task')[0].value));
    map.addLayer(tiles);

    $('#id_task').change(function() {
        tiles._url = getTaskTilesUrl($(this)[0].value);
        tiles.redraw();
    });
});
