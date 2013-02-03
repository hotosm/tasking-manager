var map = L.map('map');
// create the tile layer with correct attribution
var osmUrl='http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
var osmAttrib='Map data © OpenStreetMap contributors';
var osm = new L.TileLayer(osmUrl, {attribution: osmAttrib, drawControl: true});
map.addLayer(osm);

var job = new L.geoJson(geometry).addTo(map);
map.fitBounds(job.getBounds());
