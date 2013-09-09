# -*- coding: utf-8 -*-
<div>
  <a href="#task/${task.id}">#${task.id}</a>
  <p>
    <div class="btn-group">
      <button class="btn btn-small"><i class="icon-share-alt"></i> Edit with</button>
      <button data-toggle="dropdown" class="btn btn-small dropdown-toggle"><span class="caret"></span>
      </button>
      <ul class="dropdown-menu">
        <li id="josm"><a>JOSM</a>
        </li>
        <li id="iDeditor"><a>iD editor</a>
        </li>
        <li id="potlatch2"><a>Potlatch 2</a>
        </li>
        <li id="wp"><a>Walking Papers</a>
        </li>
      </ul>
    </div>
    <button class="btn btn-small btn-link">.osm</button>
  </p>
  <div id="task_actions">

% if  task.state == 0:
<%
disabled = ""
tooltip = ""
if locked_task is not None:
   disabled = "disabled"
   tooltip = "You cannot lock more than one task at a time."
else:
   tooltip = "Lock this task to tell others that you are currently working on it."
%>
    <a id="lock" href="${request.route_url('task_lock', id=task.id)}"
       rel="tooltip" data-original-title="${tooltip}"
       class="btn btn-small btn-primary ${disabled}">
        <i class="icon-lock icon-white"></i> Lock
    </a>
    % if  locked_task is not None:
    <span>&nbsp;You already have a <a href="#task/${locked_task.id}">task</a> locked.</span>
    % endif
% endif

% if  task.state == 1:
<%
username = 'you' if task.user == user else user.username
%>
    <p>Task locked by <strong>${username}</strong>.&nbsp;
        % if  task.user == user:
        <a id="unlock" href="${request.route_url('task_unlock', id=task.id)}">Unlock</a>
        % endif
    </p>
    % if  task.user == user:
        <form action="${request.route_url('task_done', id=task.id)}" method="POST" class="form-horizontal">
          <p>
            <button type="submit" class="btn btn-success btn-small"><i class="icon-ok icon-white"></i> Mark task as done</button>
          </p>
        </form>
    % endif
% endif

% if  task.state == 2:
<%
tooltip = "Lock this task to tell others that you are currently working on it."
%>
    <form action="${request.route_url('task_invalidate', id=task.id)}" method="POST" class="form-horizontal">
      <button type="submit" rel="tooltip" data-original-title="${tooltip}" class="btn btn-danger btn-small"><i class="icon-thumbs-down icon-white"></i> Invalidate</button>
    </form>
% endif

    <div><%include file="task.history.mako" /></div>
  </div>
</div>

<%
from geoalchemy2 import shape
import geojson
%>
<script>
var task_geometry = ${geojson.dumps(shape.to_shape(task.geometry))|n};
$('[rel=tooltip]').tooltip();
var login_url = "${request.route_url('login')}";
</script>
