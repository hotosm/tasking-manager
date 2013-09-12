# -*- coding: utf-8 -*-
<%inherit file="base.mako"/>
<%block name="header">
<a href="${request.route_url('home')}" class="brand"><i class="icon-home"></i></a>
<div class="brand">${project.name}</div>
</%block>
<%block name="content">
<%
import markdown
%>

<div class="container">
  <div class="row">
    <div class="span12">
      <ul class="nav nav-pills">
          <li class="active"><a href="#main" data-toggle="tab">${_('Info')}</a>
        </li>
        <li><a id="map_tab" href="#map" data-toggle="tab">${_('Contribute')}</a>
        </li>
      </ul>
    </div>
  </div>
</div>
<div class="tab-content">
  <div id="main" class="tab-pane active container">
    <div class="span6">
      <div class="page-header">
        <h4>${_('Description')}</h4>
      </div>
      <p>${markdown.markdown(project.description)|n}</p>
    </div>
    <div class="span5">
      <div class="page-header">
        <h4>${_('Activity')}</h4>
      </div>
      <%include file="task.history.mako" args="section='project'"/>
    </div>
  </div>
  <div id="map" class="tab-pane">
    <div id="leaflet"></div>
    <div id="right-col">
      <p id="task_msg" class="alert alert-success hide">
        <div id="task" class="row-fluid"></div>
      </p>
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
var base_url = "${request.route_url('home')}";
</script>
  <script type="text/javascript" src="${request.static_url('osmtm:static/js/project.js')}"></script>
</div>
</%block>
