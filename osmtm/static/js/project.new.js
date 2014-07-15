osmtm = {};
osmtm.project_new = (function() {
  var map;
  var vector;
  var tasksLayer;
  var tiles;
  var drawControl;

  function createMap() {
    map = L.map('leaflet').setView([0, 0], 1);
    // create the tile layer with correct attribution
    var osmUrl='http://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png';
    var osmAttrib='Map data © OpenStreetMap contributors';
    var osm = new L.TileLayer(osmUrl, {attribution: osmAttrib, drawControl: true});
    map.addLayer(osm);

    drawControl = new L.Control.Draw({
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

    vector = new L.geoJson();
    map.on('draw:poly-created', function(e) {
      vector.addLayer(e.poly);
      map.fitBounds(vector.getBounds());
      $('#geometry').val(toGeoJSON(e.poly)).trigger('change');
      $('#draw').removeClass('active');
    });
    map.on('drawing', function(e) {
      $('#draw').addClass('active');
      cancel();
    });
    map.addLayer(vector);

    tasksLayer = L.geoJson(null, {
      style: {
        color: "gray",
        weight: 1,
        opacity: 0.7
      }
    }).addTo(map);
  }

  function cancel() {
    vector.clearLayers();
    $('#geometry').val('');
    $('#help-step1').removeClass("hidden");
    $('#partition').addClass("hidden");
  }

  function toGeoJSON(polygon) {
    var json, type, latlng, latlngs = [], i;

    type = 'Polygon';
    polygon._latlngs.push(polygon._latlngs[0]);
    latlngs = LatLngsToCoords(polygon._latlngs, 1);
    return JSON.stringify({"type": "Feature", "geometry": {"type": 'Polygon', "coordinates": [latlngs]}});
  }

  function LatLngToCoords(LatLng, reverse) { // (LatLng, Boolean) -> Array
    var lat = parseFloat(reverse ? LatLng.lng : LatLng.lat),
    lng = parseFloat(reverse ? LatLng.lat : LatLng.lng);

    return [lng,lat];
  }

  function LatLngsToCoords(LatLngs, levelsDeep, reverse) { // (LatLngs, Number, Boolean) -> Array
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
  }

  function onImport(err, gj, warning) {
    if (gj && gj.features) {
      vector.addData(gj);
      map.fitBounds(vector.getBounds());
      window.setTimeout(function() {
        $('#geometry').val(JSON.stringify(gj)).trigger('change');
        $('input[value=arbitrary]').attr('disabled', false);
      }, 500);
    }
  }
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

  function changeTileSize(index) {
    $('#computing').removeClass('hidden');
    $('#zoom').val(map.getBoundsZoom(vector.getBounds()) + index + 2);
    $.ajax({
      url: base_url + "project/grid_simulate",
      type: 'POST',
      data: {
        zoom: $('#zoom').val(),
        geometry: $('#geometry').val()
      },
      success: function(data) {
        $('#computing').addClass('hidden');
        tasksLayer.clearLayers();
        tasksLayer.addData(data);
      },
      dataType: "json"
    });
  }

  return {
    init: function() {
      createMap();

      $('#cancel').click(function() {
        cancel();
        return false;
      });

      $('#geometry').change(function() {
        $('#step1').addClass("hidden");
        $('#step2').removeClass("hidden");
        map.removeControl(drawControl);
      });

      $('#step2-next').click(function() {
        $('#step2').addClass("hidden");

        if ($('input[name=type]:checked').val() == 'grid') {
          $('#step3-grid').removeClass("hidden");
          changeTileSize(2);
        } else {
          $('#step3-arbitrary').removeClass("hidden");
          $('#geometry_arbitrary').val($('#geometry').val());
          var count = 0;
          vector.eachLayer(function(l) {
            if (l.feature.geometry.type == 'Polygon' ||
                l.feature.geometry.type == 'MultiPolygon') {
              count++;
            }
          });
          $('#geometries_count').html(count);
        }
      });

      $('#import').click(function() {
        drawControl.handlers.polygon.disable();
        $('#draw').removeClass('active');
        $('input[name=import]').click();
        return false;
      });
      $('input[name=import]').change(function() {
        vector.clearLayers();
        var file = $(this).val();
        function onAdd() {
          map.fitBounds(vector.getBounds());
          $('#geometry').val(vector.toGeoJSON());
        }
        if (file.substr(-4) == 'json') {
          readAsText($(this)[0].files[0], function(err, text) {
            var gj = JSON.parse(text);
            vector.addData(gj);
            onAdd();
          });
        } else if (file.substr(-3) == 'kml') {
          readAsText($(this)[0].files[0], function(err, text) {
            omnivore.kml.parse(text, null, vector);
            onAdd();
          });
        } else {
          alert("Please provide a .geojson file");
        }
      });


      var buttons = $('#tile_size button');
      buttons.each(function(index, button) {
        $(button).click(function() {
          buttons.removeClass('active');
          $(this).addClass('active');
          changeTileSize(index);
          return false;
        });
      });

      $('#gridform, #arbitraryform').submit(function() {
        window.setTimeout(function() {
          $('input[type=submit]').attr('disabled', 'disabled');
          $('.loading').removeClass('hidden');
        }, 0);
      });
    }
  };
})();

$(document).ready(function() {
  osmtm.project_new.init();
});
