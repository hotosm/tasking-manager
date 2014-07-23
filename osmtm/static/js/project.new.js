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
      draw: {
        rectangle: false,
        circle: false,
        marker: false,
        polyline: false,
        polygon: {
          title: 'Draw the area of interest'
        }
      }
    });
    map.addControl(drawControl);

    $('#draw').on('click', function() {
      for (var toolbarId  in drawControl._toolbars) {
        var toolbar = drawControl._toolbars[toolbarId];
        toolbar._modes.polygon.handler.enable();
      }
    });

    vector = new L.geoJson();
    map.on('draw:created', function(e) {
      vector.addLayer(e.layer);
      map.fitBounds(vector.getBounds());
      var gj = vector.toGeoJSON();
      $('#geometry').val(JSON.stringify(gj)).trigger('change');
      $('#draw').removeClass('active');
    });
    map.on('drawing', function(e) {
      $('#draw').addClass('active');
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

  function changeTileSize(index) {
    $('#computing').removeClass('hidden');
    $('input[name=tile_size]').val(index - 2);
    $.ajax({
      url: base_url + "project/grid_simulate",
      type: 'POST',
      data: {
        tile_size: $('input[name=tile_size]').val(),
        geometry: $('#geometry').val()
      },
      success: function(data) {
        $('#computing').addClass('hidden');
        tasksLayer.clearLayers();
        tasksLayer.addData(data);
        $('#grid_geometries_count').html(data.features[0].geometry.coordinates.length);
      },
      dataType: "json"
    });
  }

  return {
    init: function() {
      createMap();

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
          $('#arbitrary_geometries_count').html(count);
        }
      });

      $('#import').click(function() {
        $('#draw').removeClass('active');
        $('input[name=import]').click();
        return false;
      });
      $('input[name=import]').change(function() {
        vector.clearLayers();
        var file = $(this).val();
        function onAdd() {
          map.fitBounds(vector.getBounds());
          var gj = vector.toGeoJSON();
          $('#geometry').val(JSON.stringify(gj)).trigger('change');
          $('#arbitrary').removeClass('mask');
          $('#arbitrary').tooltip('destroy');
          $('input[value=arbitrary]').attr('disabled', false);
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
