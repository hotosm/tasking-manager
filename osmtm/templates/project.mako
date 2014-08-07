# -*- coding: utf-8 -*-
<%inherit file="base.mako"/>
<%block name="header">
<h1>
  #${project.id} - ${project.name}
  % if project.status == project.status_draft:
   (${_('Draft')})
  % elif project.status == project.status_archived:
   (${_('Archived')})
  % endif
  % if user and (user.is_admin or user.is_project_manager):
    <a class="btn btn-link btn-sm pull-right"
       href="${request.route_path('project_tasks_json', project=project.id)}"
       target="_blank">
       <span class="glyphicon glyphicon-cloud-download"></span>
      Export
    </a>
    <a class="btn btn-link btn-sm pull-right" href="${request.route_path('project_edit', project=project.id)}">
      <span class="glyphicon glyphicon-cog"></span>
      Edit
    </a>
  % endif
</h1>
</%block>
<%block name="content">
<%
from geoalchemy2 import shape
from geoalchemy2.functions import ST_Centroid
geometry_as_shape = shape.to_shape(project.area.geometry)
centroid = geometry_as_shape.centroid
left = (centroid.x + 180) * 120 / 360 - 1
top = (-centroid.y + 90) * 60 / 180 - 1
%>
<%
# FIXME already done in base.mako
from pyramid.security import authenticated_userid
from osmtm.models import DBSession, User
username = authenticated_userid(request)
if username is not None:
   user = DBSession.query(User).get(username)
else:
   user = None
%>
<div class="container-fluid">
  <div class="row">
    <div class="col-md-12">
      <ul class="nav nav-pills">
        <li class="active"><a id="instructions_tab" href="#instructions" data-toggle="tab">${_('Instructions')}</a></li>
        <li><a id="contribute_tab" href="#contribute" data-toggle="tab">${_('Contribute')}</a>
        <li><a href="#activity" data-toggle="tab">${_('Activity')}</a></li>
        <li><a id="stats_tab" href="#stats" data-toggle="tab">${_('Stats')}</a>
        </li>
        <div class="world_map pull-right">
          <div class="marker" style="top:${top}px;left:${left}px"></div>
        </div>
      </ul>
    </div>
  </div>
</div>
<div id="main_content" class="large">
  <div id="leaflet"></div>
  <p id="task_loading" class="alert alert-success" style="display: none;">
    ${_('Loading')}
  </p>
  <p id="task_msg" class="alert alert-success" style="display: none;"></p>
  <p id="task_error_msg" class="alert alert-danger" style="display: none;"></p>
  <div id="side-col">
    <div class="tab-content">
      <div id="activity" class="row-fluid tab-pane">
        <%include file="task.history.mako" args="section='project'"/>
      </div>
      <div id="instructions" class="tab-pane active">
        <%include file="project.instructions.mako" />
      </div>
      <div id="contribute" class="tab-pane">
        <div id="task_empty">
        </div>
        <div id="task"></div>
      </div>
      <div id="stats" class="tab-pane">
        <%include file="project.stats.mako" />
      </div>
    </div>
  </div>
</div>
<script src="${request.static_url('osmtm:static/js/lib/leaflet.js', _query={'v':'2.4.2'})}"></script>
<script>
<%
from shapely.wkb import loads
from geojson import Feature, FeatureCollection, dumps
geometry = loads(str(project.area.geometry.data))
%>
var project_id = ${project.id};
var geometry = ${dumps(geometry)|n};
% if locked_task is not None:
window.location.hash = "task/${locked_task.id}";
% endif
var priority_areas = ${dumps(priority_areas)|n};

var statesI18n = ["${_('Ready')}", "${_('Invalidated')}", "${_('Done')}", "${_('Validated')}"];
var commentRequiredMsg = "${_('You must leave a comment.')}";
var highPriorityI18n = "${_('High priority')}";
</script>
  <script src="http://d3js.org/d3.v3.js"></script>
  <script type="text/javascript" src="${request.static_url('osmtm:static/js/project.js', _query={'v':'2.4.2'})}"></script>
  <script type="text/javascript" src="${request.static_url('osmtm:static/js/task.difficulty.js', _query={'v':'2.4.2'})}"></script>
</%block>
