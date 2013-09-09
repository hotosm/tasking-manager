# -*- coding: utf-8 -*-
<%inherit file="base.mako"/>
<%block name="header">
<a href="${request.route_url('home')}" class="brand"><i class="icon-home"></i></a>
<div class="brand">${project.name} - Partition</div>
</%block>
<%block name="content">
<div class="container">
  <form method="post">
    <div class="row">
      <div class="span6">
        <div id="leaflet"></div>
      </div>
      <div class="span6">Tile size
        <div id="tile_size" class="btn-group">
          <button class="btn btn-small">XL</button>
          <button class="btn btn-small">L</button>
          <button class="btn btn-small active">M</button>
          <button class="btn btn-small">S</button>
          <button class="btn btn-small">XS</button>
        </div>
      </div>
    </div>
    <input id="zoom" type="hidden" name="zoom"/>
    <input id="geometry" type="hidden" name="geometry"/>
    <div class="form-actions">
      <input id="id_submit" type="submit" value="Auto-fill project" name="form.submitted" class="btn btn-success"/><span id="loading" class="help-inline">Creating tiles, please wait...</span>
    </div>
  </form>
</div>
<script src="${request.static_url('osmtm:static/js/lib/leaflet.js')}"></script>
<script>
<%
from shapely.wkb import loads
from geojson import Feature, FeatureCollection, dumps
geometry = loads(str(project.area.geometry.data))
%>
var project_id = ${project.id};
var geometry = ${dumps(geometry)|n};
</script>
<script src="${request.static_url('osmtm:static/js/project.partition.js')}"></script>
</%block>
