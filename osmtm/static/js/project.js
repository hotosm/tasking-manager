osmtm = {};
osmtm.project = (function() {

  var lmap;
  var tasksLayer;
  var selectedTaskLayer;
  var x;
  var y;
  var xAxis;
  var yAxis;
  var line;
  var chart;
  var checkTimeout;
  var lastUpdateCheck = (new Date()).getTime();
  var pageFocusInterval;
  var lockedCounter;

  var states = [
    ['#dfdfdf'],
    ['gray'],
    ['orange'],
    ['green']
  ];

  var at_config = {
    at: "@",
    tpl: "<li data-value='${name}'>${name}</li>",
    show_the_at: true,
    limit: 10,
    callbacks: {
      remote_filter: function(query, callback) {
        $.getJSON(base_url + "users.json", {q: query}, function(data) {
          var names = $.map(data,function(value,i) {
            return {'id':i,'name':value};
          });
          callback(names);
        });
      },
      before_insert: function(value)  {
        // username contains a space
        if (value.match((/ /))) {
          value = ['[', value, ']'].join('');
        }
        return '@' + value;
      }
    }
  };

  var Legend = L.Control.extend({
    options: {
      position: 'bottomleft'
    },

    onAdd: function(map) {
      var container = L.DomUtil.create('div', 'legend-control');

      var ul = L.DomUtil.create('ul', null, container);

      var key, color;

      key = L.DomUtil.create('li', null, ul);
      color = L.DomUtil.create('div', 'key-color', key);
      color.style.border = '2px solid orange';
      key.innerHTML += 'Cur. worked on ';

      lockedCounter = $('<span>');
      $(key).append(lockedCounter);

      var i;
      for (i = 1; i < states.length; i++) {
        var key = L.DomUtil.create('li', null, ul);
        var color = L.DomUtil.create('div', 'key-color', key);
        color.style.backgroundColor = states[i];
        key.innerHTML += statesI18n[i];
      }

      return container;
    }
  });

  var LegendPriority = L.Control.extend({
    options: {
      position: 'bottomleft'
    },

    onAdd: function(map) {
      var container = L.DomUtil.create('div', 'legend-control');

      var ul = L.DomUtil.create('ul', null, container);

      var key, color;

      key = L.DomUtil.create('li', null, ul);
      color = L.DomUtil.create('div', 'key-color', key);
      color.style.border = '1px solid #FF9A9A';
      color.style.opacity = "1";
      color.style.backgroundColor = '#FFE6EA';
      key.innerHTML += highPriorityI18n;

      return container;
    }
  });

  // creates the Leaflet map
  function createMap() {
    lmap = L.map('leaflet');
    L.control.scale().addTo(lmap);
    // create the tile layer with correct attribution
    var osmUrl='http://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png';
    var osmAttrib='Map data © OpenStreetMap contributors';
    var osm = new L.TileLayer(osmUrl, {attribution: osmAttrib});
    lmap.addLayer(osm);

    var layer = new L.geoJson(geometry, {
      style: {
        fillOpacity: 0,
        weight: 1.5
      }
    });
    lmap.addLayer(layer);
    lmap.fitBounds(layer.getBounds());
    lmap.zoomOut();

    // tells whether the mouse is over a feature or not
    var hoverFeature = false;

    tasksLayer = L.geoJson(null, {
      style: function(feature) {
        var color = states[feature.properties.state];
        return {
          fillColor: color,
          color: feature.properties.locked ? "orange" : "gray",
          fillOpacity: feature.state === 0 ? 0.1 : 0.4,
          weight: feature.properties.locked ? 2 : 1,
          opacity: feature.properties.locked ? 1 : 0.7
        };
      },
      filter: function(feature, layer) {
        return feature.properties.state != -1;
      },
      onEachFeature: function(feature, layer) {
        layer.on({
          'mouseover': function(e) { hoverFeature = true; },
          'mouseout': function(e) { hoverFeature = false; },
          'click': function (e) {
            location.hash = ["task", e.target.feature.id].join('/');
          }
        });
      }
    }).addTo(lmap);
    lmap.on('click', function() {
      if (!hoverFeature) {
        clearSelection();
      }
    });

    $.get(
      base_url + 'project/' + project_id + '/tasks.json',
      function(data) {
        tasksLayer.addData(data);
        updateLockedCounter();
      }
    );

    selectedTaskLayer = L.geoJson(null, {
        style: {
            weight: 1,
            opacity: 0
        }
    }).addTo(lmap);

    if (priority_areas && priority_areas.features.length > 0) {
      var priority = new L.geoJson(null, {
        style: {
          color: 'red',
          weight: 1
        }
      });
      priority.addData(priority_areas);
      lmap.addLayer(priority);
      lmap.addControl(new LegendPriority());
    }

    lmap.addControl(new Legend());

  }

  /**
   * Unselects task
   */
  function clearSelection() {
    hideTooltips();
    location.hash = "";
    selectedTaskLayer.clearLayers();
    $('#task').fadeOut(function() {
      $('#task').empty();
      loadEmptyTask();
    });
  }

  /**
   * Loads empty task
   */
  function loadEmptyTask() {
    $('#task_empty').fadeIn();
    $('#task_empty').load(base_url + "project/" + project_id + "/task/empty");
  }

  /**
   * Get bounds area
   *
   * Parameters:
   * bounds {L.Bounds} - The bounds
   *
   * Returns: float
   */
  function getBoundsArea(bounds) {
    var h = bounds.getNorth() - bounds.getSouth();
    var w = bounds.getEast() - bounds.getWest();
    return h * w;
  };

  /**
   * Loads task
   *
   * Parameters:
   * id {Integer} - The id of the task to load
   * direction {String} - The slide direction
   */
  function loadTask(id, direction) {
    hideTooltips();
    startLoading();
    function load() {
      $('#task').load(
        base_url + "project/" + project_id + "/task/" + id,
        null,
        function(response, status, request) {
          stopLoading();
          if (status != 'error') {
            selectedTaskLayer.clearLayers();
            selectedTaskLayer.addData(task_geometry);
            if (!selectedTaskLayer.getBounds().intersects(lmap.getBounds())) {
              lmap.panTo(selectedTaskLayer.getBounds().getCenter());
            }
            if (getBoundsArea(selectedTaskLayer.getBounds()) <
                getBoundsArea(lmap.getBounds()) / 1000) {
              lmap.fitBounds(selectedTaskLayer.getBounds());
            };
            $('#task').fadeIn();
            setPreferedEditor();
          } else if (request.status == '404'){
            $('#task_error_msg').html("Task doesn't exist.").show()
            .delay(3000)
            .fadeOut();
            clearSelection();
          } else {
            alert("an error occured");
          }
          checkForUpdates();
        }
      );
    }
    $(document.body).scrollTop(0);
    $('#contribute_tab').tab('show');
    $('#task_empty').fadeOut(
      function() {
        if (direction) {
          $('#task_actions').slide(direction)
          .one('slid', load);
        } else {
          $('#task').fadeOut(function() {
            load();
          });
        }
      }
    );
  }

  /**
   * Starts loading (ie. shows loading message)
   */
  function startLoading() {
    $('#task_loading').show();
  }

  /**
   * Stops loading (ie. hides loading message)
   */
  function stopLoading() {
    $('#task_loading').fadeOut();
  }

  /**
   * Called when task load response is received
   *
   * Parameters:
   * data {Object} - The server response
   * direction {String} - The slide direction
   */
  function handleTaskResponse(data, direction) {
    checkForUpdates();

    if (data.task) {
      var task = data.task;
      loadTask(task.id, direction);
    }
    if (data.msg) {
      $('#task_msg').html(data.msg).show()
      .delay(3000)
      .fadeOut();
    }
    if (data.error_msg) {
      $('#task_error_msg').html(data.error_msg).show()
      .delay(3000)
      .fadeOut();
    }
    if (!data.task) {
      clearSelection();
    }
  }

  /**
   * Called on any task action button click
   *
   * Parameters:
   * e {Object} - JQuery Event
   */
  function onTaskAction(e) {

    if ($(this).hasClass('disabled')) {
      return false;
    }

    var params = {};
    if (this.id == 'unlock' && $('#task_comment').val()) {
        params.comment = $('#task_comment').val();
    }
    var direction = e.data && e.data.direction;
    $.getJSON(this.href || e.action, params, function(data) {
      handleTaskResponse(data, direction);
    }).fail(function(error) {
      if (error.status == 401) {
        if (confirm('Please login first')) {
          window.location = login_url + '?came_from=' + encodeURIComponent(window.location.href);
        }
      }
    });
    return false;
  }


  /**
   * Called when editor butotn is clicked
   *
   * Parameters:
   * evt {Object} - Event
   */
  function exportOpen(evt) {
    var editor;
    if (this.id == 'edit') {
      if (osmtm.prefered_editor) {
        editor = osmtm.prefered_editor;
      } else {
        return false;
      }
    } else {
      editor = this.id;
    }

    $.ajax({
      url: base_url + 'user/prefered_editor/' + editor,
      complete: function(t) {
        osmtm.prefered_editor = editor;
        setPreferedEditor();
      }
    });

    function roundd(input, decimals) {
      var p = Math.pow(10, decimals);
      return Math.round(input*p)/p;
    }
    function getLink(options) {
      var bounds = options.bounds,
          so = new L.LatLng(bounds[0], bounds[1]),
          ne = new L.LatLng(bounds[2], bounds[3]),
          zoom = lmap.getBoundsZoom(new L.LatLngBounds(so, ne));
          c = options.centroid;
      switch (options.protocol) {
        case 'lbrt':
        return options.base + $.param({
          left: roundd(bounds[0],5),
          bottom: roundd(bounds[1],5),
          right: roundd(bounds[2],5),
          top: roundd(bounds[3],5)
        });
        case 'llz':
        return options.base + $.param({
          lon: roundd(c[0],5),
          lat: roundd(c[1],5),
          zoom: zoom
        });
        case 'id':
        return options.base + '#map=' +
        [zoom, c[1], c[0]].join('/') +
        '&comment=' + changeset_comment;

      }
    }

    // task_centroid and task_bounds are global variables (given for the
    // currently selected task)
    switch (editor) {
      case "josm":
      if (typeof licenseAgreementUrl != 'undefined') {
        alert(requiresLicenseAgreementMsg);
        window.location = licenseAgreementUrl;
        break;
      }
      url = getLink({
        base: 'http://127.0.0.1:8111/load_and_zoom?',
        bounds: task_bounds,
        protocol: 'lbrt'
      });
      $.ajax({
        url: url,
        complete: function(t) {
          if (t.status != 200) {
            alert("JOSM remote control did not respond. Do you have JOSM running and configured to be controlled remotely?");
          } else {
            if (typeof imagery_url != "undefined" && imagery_url !== '') {
              $.ajax({
                url: 'http://127.0.0.1:8111/imagery',
                data: {
                  title: "Tasking Manager - #" + project_id,
                  type: imagery_url.toLowerCase().substring(0,3),
                  url: imagery_url
                }
              });
            }
          }
        }
      });
      break;
      case "potlatch2":
      url = getLink({
        base: 'http://www.openstreetmap.org/edit?editor=potlatch2&',
        bounds: task_bounds,
        centroid: task_centroid,
        protocol: 'llz'
      });
      window.open(url);
      break;
      case "wp":
      url = getLink({
        base: 'http://walking-papers.org/?',
        bounds: task_bounds,
        centroid: task_centroid,
        protocol: 'llz'
      });
      window.open(url);
      break;
      case "iDeditor":
        if (typeof licenseAgreementUrl != 'undefined') {
          alert(requiresLicenseAgreementMsg);
          window.location = licenseAgreementUrl;
          break;
        }
        url = getLink({
          base: 'http://www.openstreetmap.org/edit?editor=id&',
          bounds: task_bounds,
          centroid: task_centroid,
          protocol: 'id'
        });
        url += "&gpx=" + gpx_url;
        if (typeof imagery_url != "undefined" && imagery_url !== '') {
          // url is supposed to look like tms[22]:http://hiu...
          u = imagery_url.substring(imagery_url.indexOf('http'));
          u = u.replace('zoom', 'z');
          url += "&background=custom:" + u;
        }
        window.open(url);
        break;
      default:
      break;
    }
  }

  /**
   * Loads random task
   *
   * e {Object} - JQuery Event
   */
  function loadRandom(e) {
    $.getJSON($('#random').attr('href'), e.formData, function(data) {

      if (data.task) {
        var task = data.task;
        loadTask(task.id);
        location.hash = ["task", task.id].join('/');
        return false;
      }else{
        $('#task_msg').html("Error: random task should have returned a task ID but did not").show()
      }
      if (data.msg) {
        $('#task_msg').html(data.msg).show()
        .delay(3000)
        .fadeOut();
      }
      clearSelection();
    }).fail(function(error) {
      if (error.status == 401) {
        if (confirm('Please login first')) {
          window.location = login_url + '?came_from=' + encodeURIComponent(window.location.href);
        }
      }
    });
  }

  /**
   * Sets the prefered editor
   */
  function setPreferedEditor() {
    if (osmtm.prefered_editor !== '') {
      $('#prefered_editor').text($('#' + osmtm.prefered_editor + ' a').text());
      $('#josm_task_boundary_tip').toggle(osmtm.prefered_editor == 'josm');
    }
  }

  /**
   * Called when a tab is selected
   *
   * Parameters:
   * e {Object} - Bootstrap Event
   */
  function onTabShow(e) {
    if (e.target.id == 'instructions_tab') {
      $('#main_content').addClass('large');
    } else {
      $('#main_content').removeClass('large');
    }

    if (e.target.id == 'stats_tab') {
      loadStats();
    }
  }

  function onFormSubmit(e) {
    var form = this;

    hideTooltips();
    var formData = $(form).serializeObject();
    var submitName = $("button[type=submit][clicked=true]").attr("name");

    // require a comment for invalidation
    if (submitName == 'invalidate' && !formData.comment) {
      alert(commentRequiredMsg);
    } else {
      formData[submitName] = true;
      $.post(form.action, formData, function(response) {
        handleTaskResponse(response);
      }).fail(function(error) {
        console.error("Something wrong happened");
      });
    }

    return false;
  }

  /**
   * Inits the d3js line chart
   */
  function initChart() {
    var margin = {top: 20, right: 20, bottom: 30, left: 34},
        width = 400 - margin.left - margin.right,
        height = 300 - margin.top - margin.bottom;

    x = d3.time.scale()
        .range([0, width]);

    y = d3.scale.linear()
       .range([height, 0]);

    xAxis = d3.svg.axis()
        .scale(x)
        .ticks(5)
        .orient("bottom");

    yAxis = d3.svg.axis()
        .scale(y)
        .orient("left")
        .tickFormat(d3.format(".0%"));

    areaDone = d3.svg.area()
        .interpolate("basis")
        .x(function(d) { return x(d.date); })
        .y0(function(d) { return y(d.y0); })
        .y1(function(d) { return y(d.y + d.y0); });

    areaValidated = d3.svg.area()
        .interpolate("basis")
        .x(function(d) { return x(d.date); })
        .y0(function(d) { return y(d.y0); })
        .y1(function(d) { return y(d.y + d.y0); });

    stack = d3.layout.stack();

    chart = d3.select("#chart").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    chart.append("g")
         .attr("class", "x axis")
         .attr("transform", "translate(0," + height + ")");
    chart.append("g")
         .attr("class", "y axis");
    chart.append("path")
         .attr("class", "area done");
    chart.append("path")
         .attr("class", "area validated");
    chart.insert('g', ":first-child")
         .attr('class', 'grid-y')
         .call(yAxis
              .tickSize(-width, 0, 0)
         );
  }

  /**
   * Updates contributors list and stats chart
   */
  function loadStats() {
    $.getJSON(
      base_url + 'project/' + project_id + '/contributors',
      function(data) {
        var body = $('#contributors tbody').empty();
        var footer = $('#contributors tfoot').empty();
        var total = {
          'done': [],
          'assigned': []
        };
        for (var i in data) {
          if (data[i].done) {
            total.done = total.done.concat(data[i].done);
          }
          if (data[i].assigned) {
            total.assigned = total.assigned.concat(data[i].assigned);
          }
        }
        data['sum'] = total;

        for (var i in data) {
          var tiles = data[i];
          var row = $('<tr>', {
            class: 'highlight',
            'mouseover': $.proxy(highlightTasks, null, tiles),
            'mouseout': resetStyle
          });

          var user = $('<a>', {
            "class": "user",
            href: base_url +  "user/" + i,
            html: i
          })[0];
          var cell = $('<td>', {
            html: i == 'sum' ? '' : user
          });
          row.append(cell);
          row.append($('<td>', {
            class: 'text-center done',
            html: $('<span>', {
              html: tiles.done && tiles.done.length || '-'
            })
          }));

          row.append($('<td>', {
            class: 'text-center assigned',
            html: $('<span>', {
              html: tiles.assigned && tiles.assigned.length || '-'
            })
          }));

          if (i == 'sum') {
            footer.append(row);
          } else {
            body.append(row);
          }
        }
      }
    );

    var url = base_url + 'project/' + project_id + '/stats';
    d3.json(url, function(error, data) {
      var total = data.total;
      data = data.stats;
      data.forEach(function(d) {
        d.date = new Date(d[0]);
        d.done = d[1] / total;
        d.validated = d[2] / total;
      });

      var layers = stack(['validated', 'done'].map(function(state) {
        return data.map(function(d) {
          return {date: d.date, y: d[state]}
        })
      }));

      x.domain(d3.extent(data, function(d) { return d.date; }));
      y.domain([0, 1]);

      chart.selectAll(".x.axis").call(xAxis);

      chart.selectAll(".y.axis").call(yAxis);

      chart.selectAll('.area.validated')
           .datum(layers[0])
           .attr("d", areaValidated);

      chart.selectAll('.area.done')
           .datum(layers[1])
           .attr("d", areaDone);

      var last = data[data.length - 1];
      var legend = chart.selectAll('.legend')
          .data([
            ['done', Math.floor((last.done + last.validated) * 100) + '%'],
            ['validated ', Math.floor(last.validated * 100) + '%']
          ], function(d) { return d[1]});
      legend.exit().remove()

      legendEnter = legend.enter()
        .append('g')
          .attr('class', 'legend');

      legendEnter.append('rect')
        .attr('x', 10)
        .attr('y', function(d, i){ return i *  16;})
        .attr('width', 10)
        .attr('height', 10)
        .attr('class', function(d) {
          return d[0]
        });

      legendEnter.append('text')
        .attr('x', 25)
        .attr('y', function(d, i){ return i *  16 + 8;})
        .text(function(d) { return d[0] + ' ' + d[1];})
    });
  }

  function checkForUpdates() {
    window.clearTimeout(checkTimeout);
    checkTimeout = window.setTimeout(checkForUpdates, 5000);
    if (document.hasFocus && !document.hasFocus()) {
      clearInterval(pageFocusInterval);
      pageFocusInterval = setInterval( checkPageFocus, 200 );
      return;
    }
    var now = (new Date()).getTime();
    var interval = now - lastUpdateCheck;
    $.ajax({
      url: base_url + "project/" + project_id + "/check_for_updates",
      data: {
        interval: interval
      },
      success: function(data){
        if (data.updated) {
          $.each(data.updated, function(index, task) {
            tasksLayer.eachLayer(function(layer) {
              var id = layer.feature.id;
              if (id == task.id) {
                tasksLayer.removeLayer(layer);
              }
            });
            tasksLayer.addData(task);
          });
          updateLockedCounter();
        }
      }, dataType: "json"}
    );
    lastUpdateCheck = now;
  }

  function checkPageFocus() {
    if (document.hasFocus && document.hasFocus()) {
      clearInterval(pageFocusInterval);
      checkForUpdates();
    }
  }

  /**
   * Updates the 'currently worked on' counter
   */
  function updateLockedCounter() {
    var count = 0;
    var layers = tasksLayer.getLayers();
    var locked = layers.filter(function(l) {
      return l.feature.properties.locked == true;
    });
    lockedCounter.html('(' + locked.length + ')');
  }

  /**
   * Highlights the tasks for the given task ids
   */
  function highlightTasks(tasks) {
    tasksLayer.eachLayer(function(layer) {
      if (tasks.assigned && tasks.assigned.indexOf(layer.feature.id) != -1) {
        style = {
          weight: 2,
          color: 'red',
          opacity: 1
        }
      } else if (tasks.done && tasks.done.indexOf(layer.feature.id) != -1) {
        style = {
          weight: 2,
          fillColor: 'orange',
          opacity: 1
        }
      } else {
        style = {
          opacity: 0.3,
          fillOpacity: 0.1
        }
      }
      layer.setStyle(style);
    });
  }

  function resetStyle() {
    tasksLayer.eachLayer(function(layer) {
      tasksLayer.resetStyle(layer);
    });
  }

  return {
    init: function() {
      createMap();
      initChart();

      // load an empty task
      loadEmptyTask();

      $('#start').on('click', function() {$('#contribute_tab').tab('show');});
      $('a[data-toggle="tab"]').on('shown.bs.tab', onTabShow);

      // actions button handlers
      $(document).on('click', '#lock', {direction: 'next'}, onTaskAction);
      $(document).on('click', '#unlock', {direction: 'prev'}, onTaskAction);
      $(document).on('click', '#split', {direction: 'next'}, function(e) {
        if ($(this).hasClass('disabled')) {
          return false;
        }
        if (confirm($(this).attr('data-confirm'))) {
          onTaskAction.call(this, e);
        }
        return false;
      });
      $(document).on('click', '#task_close', clearSelection);
      $(document).on('click', '#edit', exportOpen);
      $(document).on('click', '#editDropdown li', exportOpen);
      $(document).on('click', '#random', function(e) {
        loadRandom(e);
        return false;
      });

      // routes
      Sammy(function() {
        this.get('#task/:id', function() {
          loadTask(this.params.id);
        });
      }).run();

      // automaticaly checks for tile state updates
      checkForUpdates();

      $(document).on('submit', 'form', onFormSubmit);
      $(document).on("click", "form button[type=submit]", function() {
        $("button[type=submit]", $(this).parents("form")).removeAttr("clicked");
        $(this).attr("clicked", "true");
      });
    },

    initAtWho: function() {
      $('[name=comment]').atwho(at_config);
    },

    loadTask: loadTask
  }
})();

$(document).ready(function() {
  osmtm.project.init();
});
