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
  var lastUpdateCheck = (new Date()).getTime();

  // creates the Leaflet map
  function createMap() {
    lmap = L.map('leaflet');
    // create the tile layer with correct attribution
    var osmUrl='http://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png';
    var osmAttrib='Map data © OpenStreetMap contributors';
    var osm = new L.TileLayer(osmUrl, {attribution: osmAttrib});
    lmap.addLayer(osm);

    var layer = new L.geoJson(geometry);
    lmap.fitBounds(layer.getBounds());
    lmap.zoomOut();

    // tells whether the mouse is over a feature or not
    var hoverFeature = false;

    tasksLayer = L.geoJson(null, {
      style: function(feature) {
        var color;
        switch (feature.properties.state) {
          case 0:
            color = "#dfdfdf";
            break;
          case 1:
            color = "gray";
            break;
          case 2:
            color = "orange";
            break;
          case 3:
            color = "green";
            break;
        }
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
      }
    );

    selectedTaskLayer = L.geoJson(null, {
        style: {
            weight: 1
        }
    }).addTo(lmap);
  }

  /**
   * Unselects task
   */
  function clearSelection() {
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
   * Loads task
   *
   * Parameters:
   * id {Integer} - The id of the task to load
   * direction {String} - The slide direction
   */
  function loadTask(id, direction) {
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

    var direction = e.data && e.data.direction;
    $.getJSON(this.href || e.action, e.formData, function(data) {
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
      var bounds = options.bounds;
      var so = new L.LatLng(bounds[0], bounds[1]),
      ne = new L.LatLng(bounds[2], bounds[3]),
      zoom = lmap.getBoundsZoom(new L.LatLngBounds(so, ne));
      var c = options.centroid;
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
        [zoom, c[1], c[0]].join('/');

      }
    }

    // task_centroid and task_bounds are global variables (given for the
    // currently selected task)
    switch (editor) {
      case "josm":
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
          }
        }
      });
      break;
      case "potlatch2":
      url = getLink({
        base: 'http://www.openstreetmap.org/edit?editor=potlatch2&',
        centroid: task_centroid,
        protocol: 'llz'
      });
      window.open(url);
      break;
      case "wp":
      url = getLink({
        base: 'http://walking-papers.org/?',
        centroid: task_centroid,
        protocol: 'llz'
      });
      window.open(url);
      break;
      case "iDeditor":
      url = getLink({
        base: 'http://www.openstreetmap.org/edit?editor=id&',
        bounds: task_bounds,
        centroid: task_centroid,
        protocol: 'id'
      });
      url += "&gpx=" + gpx_url;
      if (typeof imagery_url != "undefined") {
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
    function load() {
      hideTooltips();
      var formData = $(form).serializeObject();
      var submitName = $("button[type=submit][clicked=true]").attr("name");
      formData[submitName] = true;
      $.post(form.action, formData, function(response) {
        handleTaskResponse(response);
      });
    }
    if ($(form).has($('#commentModal')).length > 0) {
      $('#commentModal').modal('show');
      $('#task_comment').focus().on('keyup', function() {
        $('#commentModalCloseBtn').toggleClass(
          'disabled',
          $(this).val() === ''
        );
      });
      $('#commentModalCloseBtn').on('click', function() {
        if ($('#task_comment')[0].value !== '') {
          $('#commentModal').modal('hide');
          load();
        }
      });
    } else {
      load();
    }
    return false;
  }

  /**
   * Inits the d3js line chart
   */
  function initChart() {
    var margin = {top: 20, right: 20, bottom: 30, left: 20},
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
        .tickFormat(d3.format("d"))
        .orient("left");

    line = d3.svg.line()
        .x(function(d) { return x(d.date); })
        .y(function(d) { return y(d.done); });

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
         .attr("class", "line");
  }

  /**
   * Updates contributors list and stats chart
   */
  function loadStats() {
    $.getJSON(
      base_url + 'project/' + project_id + '/contributors',
      function(data) {
        var el = $('#contributors').empty();
        for (var i in data) {
          var tiles = data[i];
          var user = $('<a>', {
            "class": "user",
            href: base_url +  "user/" + i,
            html: i
          })
          el.append($('<li>', {
            html: " <sup>" + tiles.length + "</sup>"
            }).prepend(user));
          }
        }
      );

      var url = base_url + 'project/' + project_id + '/stats';
      d3.json(url, function(error, data) {
        data.forEach(function(d) {
        d.date = new Date(d[0]);
        d.done = d[1];
      });

      x.domain(d3.extent(data, function(d) { return d.date; }));
      y.domain(d3.extent(data, function(d) { return d.done; }));

      chart.selectAll(".x.axis").call(xAxis);

      chart.selectAll(".y.axis").call(yAxis);

      chart.selectAll('.line')
           .datum(data)
           .attr("d", line);
    });
  }

  function checkForUpdates() {
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
        }
      }, dataType: "json"}
    );
    lastUpdateCheck = now;
  }

  return function() {
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
    $(document).on('click', '.clear', clearSelection);
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
    window.setInterval(checkForUpdates, 20000);


    $(document).on('submit', 'form', onFormSubmit);
    $(document).on("click", "form button[type=submit]", function() {
      $("button[type=submit]", $(this).parents("form")).removeAttr("clicked");
      $(this).attr("clicked", "true");
    });
  }
})();

$(document).ready(function() {
  osmtm.project();
});
