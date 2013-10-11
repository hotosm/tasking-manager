# -*- coding: utf-8 -*-
<%inherit file="base.mako"/>
<%block name="header">
<a href="${request.route_url('home')}" class="brand"><i class="icon-home"></i></a>
<div class="brand">New Project</div>
</%block>
<%block name="content">
<div class="container">
  <form method="post">
    <div class="control-group">
      <label for="id_name" class="control-label">Name</label>
      <div class="controls">
        <input id="id_name" type="text" name="name" value="Untitled_project" class="text input-xlarge"/>
      </div>
    </div>
    <legend>Area of interest</legend>
    <div class="row">
      <div class="span6">Choose an existing area or Draw it yourself
        <div id="leaflet"></div>
      </div>
      <div class="span6">You can also
        <div>
          <input type="file" val="" name="osm" style="visibility:hidden;height:0;position:absolute;">
          <a id="import_osm"
                  data-role="button"
                  class="btn btn-small">Import OSM relation</a>
          <p class="help-block">
            Provide a .osm file. You can download it from the OSM API (ex. www.openstreetmap.org/api/0.6/relation/270485/full).
          </p>
        </div>
      </div>
    </div>
    <input id="geometry" type="hidden" name="geometry"/>
    <div class="form-actions">
      <input id="id_submit" type="submit" value="OK" name="form.submitted" disabled="disabled" class="btn btn-success"/>
    </div>
  </form>
</div>
<link rel="stylesheet" href="${request.static_url('osmtm:static/js/lib/Leaflet.draw/dist/leaflet.draw.css')}"/>
<script src="${request.static_url('osmtm:static/js/lib/leaflet.js')}"></script>
<script src="${request.static_url('osmtm:static/js/lib/Leaflet.draw/dist/leaflet.draw.js')}"></script>
<script src="${request.static_url('osmtm:static/js/project.new.js')}"></script>
</%block>
