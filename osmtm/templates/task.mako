# -*- coding: utf-8 -*-
<div>
  <a href="#task/${task.id}">#${task.id}</a>
  <p>
    <div class="btn-group">
      <%
        cookies = request.cookies
        prefered_editor = cookies['prefered_editor'] if 'prefered_editor' in cookies else ''
      %>
      <button id="edit" class="btn btn-small">
        <i class="icon-share-alt"></i> ${_('Edit with')}
        <span id="prefered_editor"></span>
      </button>
      <button data-toggle="dropdown" class="btn btn-small dropdown-toggle"><span class="caret"></span>
      </button>
      <ul id="editDropdown" class="dropdown-menu">
        <li id="josm"><a>JOSM</a>
        </li>
        <li id="iDeditor"><a>iD editor</a>
        </li>
        <li id="potlatch2"><a>Potlatch 2</a>
        </li>
        <li id="wp"><a>Walking Papers</a>
        </li>
      </ul>
      <script>
        var prefered_editor = "${prefered_editor}";
        setPreferedEditor();
      </script>
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
    tooltip = _("You cannot lock more than one task at a time.")
else:
    tooltip = _("Lock this task to tell others that you are currently working on it.")
%>
    <a id="lock" href="${request.route_url('task_lock', id=task.id)}"
       rel="tooltip" data-original-title="${tooltip}"
       class="btn btn-small btn-primary ${disabled}">
       <i class="icon-lock icon-white"></i> ${_('Lock')}
    </a>
    % if task.zoom is not None:
      <%
        disabled = ""
        tooltip = ""
        if (task.zoom - task.project.zoom) > 0:
          disabled = "disabled"
          tooltip = "You cannot split this task more."
      %>
        <a id="split" href="${request.route_url('task_split', id=task.id)}"
           rel="tooltip" data-original-title="${tooltip}"
           data-confirm="${_('Are you sure you want to split this task?')}"
           class="btn btn-small ${disabled}">
           <i class="icon-split"></i> ${_('Split')}
        </a>
    % endif
    % if  locked_task is not None:

<%
link = '<a href="#task/%s">%s</a>' % (locked_task.id, _('a task'))
text = _("You already have ${task_link} locked.", mapping={'task_link': link})
%>
    <span>&nbsp;${text|n}</span>
    % endif
% endif

% if  task.state == 1:
<%
username = _('you') if task.user == user else task.user.username
username = '<strong>%s</strong>' % username
text = _('Task locked by ${username}', mapping={'username': username})
%>
    <p>${text|n}.&nbsp;
        % if  task.user == user:
        <a id="unlock" href="${request.route_url('task_unlock', id=task.id)}">${_('Unlock')}</a>
        % endif
    </p>
    % if  task.user == user:
        <form action="${request.route_url('task_done', id=task.id)}" method="POST" class="form-horizontal">
          <p>
          <button type="submit" class="btn btn-success btn-small"><i class="icon-ok icon-white"></i> ${_('Mark task as done')}</button>
          </p>
        </form>
    % endif
% endif

% if user is not None and task.state == 2:
<%
tooltip = _("Invalidate this task if you consider it needs more work.")
%>
    <form action="${request.route_url('task_invalidate', id=task.id)}" method="POST" class="form-horizontal">
        <button type="submit" rel="tooltip" data-original-title="${tooltip}" class="btn btn-danger btn-small"><i class="icon-thumbs-down icon-white"></i> ${_('Invalidate')}</button>
        <div id="commentModal" class="modal hide fade" tabindex="-1" role="dialog" aria-labelledby="commentModalLabel" aria-hidden="true">
          <div class="modal-header">
            <h3 id="commentModalLabel">Comment?
            </h3>
            ${_('Please tell why you marked this task as invalid so that the user can eventually correct his mistakes if any.')}
          </div>
          <div class="modal-body">
            <textarea id="task_comment" name="comment" class="span12" placeholder="${_('Your comment here')}"></textarea>
          </div>
          <div class="modal-footer">
            <a id="commentModalCancelBtn" data-dismiss="modal" class="btn" aria-hidden="true" >${_('Cancel')}</a>
            <a id="commentModalCloseBtn" class="btn btn-primary disabled" aria-hidden="true" >${_('OK')}</a>
          </div>
        </div>
    </form>
% endif

    <hr />
    <h4>${_('History')}</h4>
    <div><%include file="task.history.mako" /></div>
  </div>
</div>

<%
from geoalchemy2 import shape
from geoalchemy2.functions import ST_Centroid
import geojson
geometry_as_shape = shape.to_shape(task.geometry)
centroid = geometry_as_shape.centroid
bounds = geometry_as_shape.bounds
%>
<script>
var task_geometry = ${geojson.dumps(geometry_as_shape)|n};
var task_centroid = [${centroid.x}, ${centroid.y}];
var task_bounds = [${bounds[0]}, ${bounds[1]}, ${bounds[2]}, ${bounds[3]}];
$('[rel=tooltip]').tooltip();
var login_url = "${request.route_url('login')}";
</script>
