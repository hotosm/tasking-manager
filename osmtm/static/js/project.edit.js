$(document).ready(function() {
    $('.nav-tabs a:first').tab('show');
    $('.nav.languages li:first-of-type a').tab('show');
    $('.input-group.date').datepicker({});
  var substringMatcher = function(strs) {
    return function findMatches(q, cb) {
      var matches, substrRegex;

      // an array that will be populated with substring matches
      matches = [];

      // regex used to determine if a string contains the substring `q`
      substrRegex = new RegExp(q, 'i');

      // iterate through the pool of strings and for any string that
      // contains the substring `q`, add it to the `matches` array
      $.each(strs, function(i, str) {
        if (substrRegex.test(str)) {
          // the typeahead jQuery plugin expects suggestions to a
          // JavaScript object, refer to typeahead docs for more info
          matches.push({ value: str });
        }
      });

      cb(matches);
    };
  };

  $.getJSON(base_url + 'users.json', function(users) {
    $('#adduser').typeahead({
      hint: true,
      highlight: true,
      minLength: 1
    },
    {
      name: 'states',
      displayKey: 'value',
      source: substringMatcher(users)
    }).on({
      'typeahead:selected': function(e, suggestion, name) {
        window.setTimeout(function() {
          $('#do_add_user').removeClass('disabled');
        }, 200);
      },
      'typeahead:autocompleted': function(e, suggestion, name) {
        window.setTimeout(function() {
          $('#do_add_user').removeClass('disabled');
        }, 200);
      },
      'keyup': function(e) {
        $('#do_add_user').addClass('disabled');
      }
    });
  });
});

function allowedUsersCrtl($scope) {
  $scope.allowed_users = allowed_users;

  $(document).on('click', '#do_add_user', function() {
    $.ajax({
      url: base_url + 'project/' + project_id + '/user/' + $('#adduser').val(),
      type: 'PUT',
      success: function(data) {
        $scope.$apply(function() {
          allowed_users[data.user.id] = data.user;
          $scope.allowed_users = allowed_users;
        });
        $('#adduser').val('');
      }
    });
  });

  $(document).on('click', '.user-remove', function() {
    var el = $(this).parents('li:first');
    var user_id = el.attr('data-user');
    $.ajax({
      url: base_url + 'project/' + project_id + '/user/' + user_id,
      type: 'DELETE',
      success: function(data) {
        el.remove();
      }
    });
  });
}
angular.module('allowed_users', []);

osmtm = {};
osmtm.project = {};
osmtm.project.edit = {};
osmtm.project.edit.priority_areas = (function() {

  var lmap;
  var drawControl;
  var drawnItems;

  // creates the Leaflet map
  function createMap() {
    if (lmap) {
      return;
    }
    lmap = L.map('leaflet_priority_areas');
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
    $('input[name=priority_areas]').val(val);

    silent = !!silent;
    if (!silent) {
      $('input[name=priority_areas]').trigger('change');
    }
  }

  return {
    init: function() {
      $('a[data-toggle="tab"]').on('shown.bs.tab', function(e) {
        if (e.target.id == 'priority_areas_tab') {
          createMap();
        }
      });


      $('input[name=priority_areas]').on('change', function() {
        $('input[type=submit]').removeAttr('disabled');
      });
    }
  };
})();

$(document).ready(function() {
  osmtm.project.edit.priority_areas.init();
});
