# -*- coding: utf-8 -*-
<%
import geojson
from geoalchemy2 import shape
from geoalchemy2.functions import ST_Centroid
from osmtm.models import TaskState
from urllib import quote
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
  <a id="task_close" class="btn btn-sm btn-link pull-right" title="${_('Clear selection')}"><i class="glyphicon glyphicon-remove"></i></a>
  <h4 class="pull-left">
  <%include file="task.status.mako" />
<%
  text = _('Task #${number}', mapping={'number': task.id})
%>
  ${text|n}
  </h4>
  <div class="clear"></div>
  <div id="task_actions">
  <div class="text-muted small">
  <%include file="task.difficulty.mako" />
% if task.cur_lock and task.cur_lock.lock:
  <%include file="task.locked.mako" />
% endif
  <%include file="task.assigned.mako" />
  </div>
  <hr>

% if task.cur_lock and task.cur_lock.lock:
  % if user and task.cur_lock.user == user:
    <%include file="task.editors.mako" />
  % endif
% else:
  <%include file="task.unlocked.mako" />
% endif

% if not task.assigned_to and (task.cur_state.state == TaskState.state_ready or task.cur_state.state == TaskState.state_invalidated):
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
    <hr>
    <div><%include file="task.history.mako" /></div>
    <hr>
    <p><a href="http://www.openstreetmap.org/history?bbox=${bounds[0]},${bounds[1]},${bounds[2]},${bounds[3]}"
          rel="tooltip"
          data-original-title="${_('See the changesets in the OSM database for this area.')}"
          target="_blank">${_('OSM changesets')}</a> | ${overpassturbo_link(history,task,bounds)}</p>
% endif
  </div>
</div>

<script>
var task_id = ${task.id};
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
var changeset_comment = "${quote(project.changeset_comment.encode('utf8'), '')}";
osmtm.project.initAtWho();
</script>

<%def name="overpassturbo_link(history,task,bounds)" >
<%
import urllib
queryprefix = '<osm-script output="json" timeout="25"><union>'
querysuffix = '</union><print mode="body"/><recurse type="down"/><print mode="skeleton" order="quadtile"/></osm-script>'
querymiddle = ''
userlist = []
for step in history:
    if hasattr(step, 'user') and step.user is not None and step.user.username not in userlist:
	stepquery = u'<query type="node"><user name="%(name)s"/><bbox-query %(bbox)s/></query><query type="way"><user name="%(name)s"/><bbox-query %(bbox)s/></query><query type="relation"><user name="%(name)s"/><bbox-query %(bbox)s/></query>' % {
		'name': step.user.username,
		'bbox': 'w="%f" s="%f" e="%f" n="%f"' % bounds
		 }
	querymiddle = querymiddle + stepquery
	userlist.append(step.user.username)
query = queryprefix + querymiddle + querysuffix
query = urllib.quote_plus(query.encode('utf8'))
%>
<small>
  <a href="http://overpass-turbo.eu/map.html?Q=${query}" rel="tooltip" data-original-title="${_('See the changes in this area using overpass turbo.')}"><span class="glyphicon glyphicon-share-alt"></span> ${_('overpass turbo')}</a>
</small>
</%def>
