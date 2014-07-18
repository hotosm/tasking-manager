# -*- coding: utf-8 -*-
<%
import geojson
from geoalchemy2 import shape
from geoalchemy2.functions import ST_Centroid
from osmtm.models import TaskState
geometry_as_shape = shape.to_shape(task.geometry)
centroid = geometry_as_shape.centroid
bounds = geometry_as_shape.bounds
project = task.project
%>
<script>
if (typeof countdownInterval != 'undefined') {
  clearInterval(countdownInterval);
}
</script>
<div>
  <%include file="task.status.mako" />
  Task #${task.id}
  <a class="btn btn-sm btn-link clear pull-right" title="${_('Clear selection')}"><i class="glyphicon glyphicon-remove"></i></a>
  <div id="task_actions">
% if task.cur_lock and task.cur_lock.lock:
  <%include file="task.locked.mako" />
% else:
  <%include file="task.unlocked.mako" />
% endif

% if task.cur_state.state == TaskState.state_ready or task.cur_state.state == TaskState.state_invalidated:
  <%include file="task.split.mako" />
% endif

    <div class="text-center">
% if task.cur_state.state == TaskState.state_ready or task.cur_state.state == TaskState.state_invalidated:
    <%include file="task.state.ready.mako" />
% endif

% if task.cur_lock and task.cur_lock.lock and task.cur_state and task.cur_state.state in [TaskState.state_done, TaskState.state_validated]:
    <%include file="task.state.done.mako" />
% endif
    </div>

    <%include file="task.instructions.mako" />
    <%include file="task.freecomment.mako" />
% if len(task.states) != 0:
    <h4>${_('History')}</h4>
    <div><%include file="task.history.mako" /></div>
    <hr>
    <p><a href="http://www.openstreetmap.org/history?bbox=${bounds[0]},${bounds[1]},${bounds[2]},${bounds[3]}"
          rel="tooltip"
          data-original-title="${_('See the changesets in the OSM database for this area.')}"
          target="_blank">OSM changesets</a></p>
% endif
  </div>
</div>

<script>
var task_osm_url = "${request.route_url('task_osm', project=task.project_id, task=task.id)}";
var task_geometry = ${geojson.dumps(geometry_as_shape)|n};
var task_centroid = [${centroid.x}, ${centroid.y}];
var task_bounds = [${bounds[0]}, ${bounds[1]}, ${bounds[2]}, ${bounds[3]}];
$('[rel=tooltip]').tooltip();
var login_url = "${request.route_path('login')}";
var gpx_url = window.location.origin +
    "${request.route_path('task_gpx', project=task.project_id, task=task.id)}";
% if user is not None and \
    project.imagery is not None and project.imagery != 'None' and \
    (project.license in user.accepted_licenses or not project.license):
var imagery_url = "${project.imagery}";
% endif
</script>
