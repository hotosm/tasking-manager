var task_layer, tiles;
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

    tiles = new L.TileLayer(
        '/project/' + project_id + '/{z}/{x}/{y}.png'
    );
    map.addLayer(tiles);

    task_layer = L.geoJson(null, {
        style: {
            weight: 1
        }
    }).addTo(map);

    var grid = new L.UtfGrid(
        '/project/' + project_id + '/{z}/{x}/{y}.json', {
        useJsonP: false
    });
    map.addLayer(grid);
    grid.on('click', function (e) {
        if (e.data && e.data.id) {
            location.hash = ["task", e.data.id].join('/');
        } else {
            clearSelection();
        }
    });
});

function clearSelection() {
    location.hash = "";
    task_layer.clearLayers();
    $('#task').fadeOut(function() {
        $('#task').empty();
    });
}

function loadTask(id, direction) {
    function load() {
        $('#task').load(
            base_url + "task/" + id,
            null,
            function(response, status, request) {
                if (status != 'error') {
                    task_layer.clearLayers();
                    task_layer.addData(task_geometry);
                } else {
                    alert("an error occured");
                }
            }
        );
    }
    $('#map_tab').tab('show');
    if (direction) {
        $('#task_actions').slide(direction)
            .one('slid', load);
    } else {
        $('#task').fadeOut(function() {
            load();
            $(this).css('display', '');
        });
    }
}

function startLoading() {
    console.info("show loading");
    //$('#task .loading').show();
}
function stopLoading() {
    //$('#task .loading').hide();
}

function onTaskAction(e) {

    if ($(this).hasClass('disabled')) {
        return false;
    }

    var direction = e.data && e.data.direction;
    startLoading();
    $.getJSON(this.href || e.action, e.formData, function(data) {
        stopLoading();

        tiles.redraw();
        if (data.task) {
            var task = data.task;
            loadTask(task.id, direction);
            return;
        }
        if (data.msg) {
            $('#task_msg').html(data.msg).show()
                .delay(3000)
                .fadeOut();
        }
        //if (data.error_msg) {
            //$('#task_error_msg').html(data.error_msg).show()
                //.delay(3000)
                //.fadeOut();
            //return;
        //}
        //if (data.split_id) {
            //splitTask(data.split_id, data.new_tiles);
        //}
        //$('#task_actions').slide(direction)
            //.one('slid', clearSelection);
        clearSelection();
        //loadEmptyTask();
    }).fail(function(error) {
        if (error.status == 401) {
            if (confirm('Please login first')) {
                window.location = login_url + '?came_from=' + encodeURIComponent(window.location.href);
            }
        }
    });
    return false;
}
$(document).on('click', '#lock', {direction: 'next'}, onTaskAction);
$(document).on('click', '#unlock', {direction: 'prev'}, onTaskAction);

$(document).on('submit', 'form', function(e) {
    var form = this;
    function load() {
        hideTooltips();
        var formData = $(form).serializeObject();
        var submitName = $("button[type=submit][clicked=true]").attr("name");
        formData[submitName] = true;
        onTaskAction({
            action: form.action,
            formData: formData,
            data: null
        });
        //$.get(form.action, formData, function(response) {
            //clearSelection();
            //tiles.redraw();
        //});
    }
    if ($(form).has($('#commentModal')).length > 0) {
        $('#commentModal').modal('show');
        $('#task_comment').focus();
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
});
$(document).on("click", "form button[type=submit]", function() {
    $("button[type=submit]", $(this).parents("form")).removeAttr("clicked");
    $(this).attr("clicked", "true");
});
$.fn.serializeObject = function()
{
    var o = {};
    var a = this.serializeArray();
    $.each(a, function() {
        if (o[this.name] !== undefined) {
            if (!o[this.name].push) {
                o[this.name] = [o[this.name]];
            }
            o[this.name].push(this.value || '');
        } else {
            o[this.name] = this.value || '';
        }
    });
    return o;
};

Sammy(function() {
    this.get('#task/:id', function() {
        loadTask(this.params.id);
    });
}).run();

function hideTooltips() {
    $('[rel=tooltip]').tooltip('hide');
}
$.fn.slide = function(type) {
    // we hide tooltips since they may interact with transitions
    hideTooltips();
    var $container = $(this);
    var $active = $('<div class="item active">');
    $active.html($container.html());
    $container.html('').append($active);
    var direction = type == 'next' ? 'left' : 'right';
    var $next = $('<div>');
    if ($.support.transition) {
        $next.addClass(type);
        $next.offsetWidth; // force reflow
        $container.append($next);
        setTimeout(function() {
            $active.addClass(direction);
            $active.one($.support.transition.end, function (e) {
                $next.removeClass([type, direction].join(' ')).addClass('active');
                $active.remove();
                setTimeout(
                    function () {
                        $next.addClass('item');
                        $container.trigger('slid');
                    },
                    0
                );
            });
        }, 200); // time to hide tooltips
    } else {
        setTimeout(
            function () {
                $next.addClass('item');
                $container.trigger('slid');
            },
            0
        );
    }
    return this;
};
