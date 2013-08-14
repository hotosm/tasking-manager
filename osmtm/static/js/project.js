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

    $('#id_task').change(function() {
        tiles._url = getTaskTilesUrl($(this)[0].value);
        tiles.redraw();
    });

    var grid = new L.UtfGrid(
        '/project/' + project_id + '/{z}/{x}/{y}.json', {
        useJsonP: false
    });
    map.addLayer(grid);
    grid.on('mouseover', function (e) {
        console.log('hover: ' + e.data.x);
    });
});
