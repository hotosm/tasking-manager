var map = L.map('leaflet');
// create the tile layer with correct attribution
var osmUrl='http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
var osmAttrib='Map data © OpenStreetMap contributors';
var osm = new L.TileLayer(osmUrl, {attribution: osmAttrib});
map.addLayer(osm);

var task_id = 1;
var url='/map/' + map_id + '/task/' + task_id + '/{z}/{x}/{y}.png';
var layer = new L.TileLayer(url);
map.addLayer(layer);

layer = new L.geoJson(geometry);
map.fitBounds(layer.getBounds());
