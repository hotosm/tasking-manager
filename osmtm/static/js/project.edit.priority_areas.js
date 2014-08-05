osmtm = {};
osmtm.project = {};
osmtm.project.edit = {};
osmtm.project.edit.priority_areas = (function() {

  var lmap;
  var drawControl;
  var drawnItems;

  // creates the Leaflet map
  function createMap() {
    lmap = L.map('leaflet');
    // create the tile layer with correct attribution
    var osmUrl='http://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png';
    var osmAttrib='Map data © OpenStreetMap contributors';
    var osm = new L.TileLayer(osmUrl, {attribution: osmAttrib});
    lmap.addLayer(osm);

    var layer = new L.geoJson(geometry, {
      style: {
        fillOpacity: 0.1,
        weight: 1.5
      }
    });
    lmap.addLayer(layer);
    lmap.fitBounds(layer.getBounds());
    lmap.zoomOut();

    var style = {
      color: 'red',
      weight: 1
    };
    drawnItems = new L.GeoJSON(null, {
      style: style
    });
    lmap.addLayer(drawnItems);
    drawnItems.addData(priority_areas);

    onChange(true);

    drawControl = new L.Control.Draw({
      position: 'topleft',
      draw: {
        rectangle: {
          title: 'Draw the area of interest'
        },
        circle: false,
        marker: false,
        polyline: false,
        polygon: {
          title: 'Draw the area of interest'
        }
      },
      edit: {
        featureGroup: drawnItems
      }
    });
    lmap.addControl(drawControl);

    lmap.on('draw:created', function(e) {
      var layer = e.layer;
      drawnItems.addLayer(layer);
      layer.setStyle(style);
      onChange();
    });
    lmap.on('draw:edited', function(e) {
      onChange();
    });
    lmap.on('draw:deleted', function(e) {
      onChange();
    });
  }

  function onChange(silent) {
    var val = '';
    if (drawnItems.getLayers().length) {
      var gj = drawnItems.toGeoJSON();
      val = JSON.stringify(gj);
    }
    $('#priority_areas').val(val);

    silent = !!silent;
    if (!silent) {
      $('#priority_areas').trigger('change');
    }
  }

  return {
    init: function() {
      createMap();

      $('#priority_areas').on('change', function() {
        $('input[type=submit]').removeAttr('disabled');
      });
    }
  };
})();

$(document).ready(function() {
  osmtm.project.edit.priority_areas.init();
});
