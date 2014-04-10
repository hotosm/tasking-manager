# -*- coding: utf-8 -*-
<%
from geoalchemy2 import shape
from geoalchemy2.functions import ST_Centroid
import geojson
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
% if task.locked:
  <%include file="task.locked.mako" />
% else:
  <%include file="task.unlocked.mako" />
% endif
  <%include file="task.split.mako" />

    <div class="text-center">
% if task.state in [task.state_ready, task.state_invalidated]:
    <%include file="task.state.ready.mako" />
% endif

% if task.state == task.state_done:
    <%include file="task.state.done.mako" />
% endif
    </div>

    <%include file="task.instructions.mako" />
    <hr />
    <h4>${_('History')}</h4>
    <div><%include file="task.history.mako" /></div>
    <hr>
    <p><a href="http://www.openstreetmap.org/history?bbox=${bounds[0]},${bounds[1]},${bounds[2]},${bounds[3]}"
          rel="tooltip"
          data-original-title="${_('See the changesets in the OSM database for this area.')}"
          target="_blank">OSM changesets</a></p>
  </div>
</div>

<script>
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
