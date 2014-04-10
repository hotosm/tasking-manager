# -*- coding: utf-8 -*-
<%inherit file="base.mako"/>
<%block name="header">
<a href="${request.route_path('home')}" class="navbar-brand"><i class="glyphicon glyphicon-home"></i></a>
<a class="navbar-brand">${project.name}</a>
</%block>
<%block name="content">
<%
import markdown
%>
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
        <li class="active"><a href="#main" data-toggle="tab">${_('Info')}</a></li>
        <li><a id="instructions_tab" href="#instructions" data-toggle="tab">${_('Instructions')}</a></li>
        <li><a id="contribute_tab" href="#contribute" data-toggle="tab">${_('Contribute')}</a>
        <li><a id="stats_tab" href="#stats" data-toggle="tab">${_('Stats')}</a>
        </li>
        <div class="world_map pull-right">
          <div class="marker" style="top:${top}px;left:${left}px"></div>
        </div>
        % if user and user.is_admin():
          <a class="btn btn-default btn-sm pull-right" href="${request.route_path('project_edit', project=project.id)}">
            Edit project
          </a>
        % endif
      </ul>
    </div>
  </div>
</div>
<div id="main_content">
  <div id="leaflet"></div>
  <p id="task_loading" class="alert alert-success" style="display: none;">
    ${_('Loading')}
  </p>
  <p id="task_msg" class="alert alert-success" style="display: none;"></p>
  <p id="task_error_msg" class="alert alert-danger" style="display: none;"></p>
  <div id="side-col">
    <div class="tab-content">
      <div id="main" class="row-fluid tab-pane active">
        % if project.private:
        <p class="text-muted">
          <span class="glyphicon glyphicon-lock"></span>
          ${_('Access to this project is limited')}
        </p>
        % endif
        <p>${markdown.markdown(project.description)|n}</p>
        <p class="text-center">
          <a id="start"
             class="btn btn-success btn-lg">
            <span class="glyphicon glyphicon-share-alt"></span>&nbsp;
            ${_('Start contributing')}</a>
        </p>
        <hr />
        <h4>${_('Activity')}</h4>
        <%include file="task.history.mako" args="section='project'"/>
      </div>
      <div id="instructions" class="tab-pane">
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
<script src="${request.static_url('osmtm:static/js/lib/leaflet.js')}"></script>
<script src="${request.static_url('osmtm:static/js/lib/Leaflet.utfgrid/dist/leaflet.utfgrid.js')}"></script>
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
</script>
  <script src="http://d3js.org/d3.v3.js"></script>
  <script type="text/javascript" src="${request.static_url('osmtm:static/js/project.js')}"></script>
</%block>
