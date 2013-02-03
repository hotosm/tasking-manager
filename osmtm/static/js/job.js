var map = L.map('map');
// create the tile layer with correct attribution
var osmUrl='http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
var osmAttrib='Map data © OpenStreetMap contributors';
var osm = new L.TileLayer(osmUrl, {attribution: osmAttrib});
map.addLayer(osm);

var url='/job/' + job_id + '/{z}/{x}/{y}.png';
var job = new L.TileLayer(url);
map.addLayer(job);

var job = new L.geoJson(geometry);
map.fitBounds(job.getBounds());
