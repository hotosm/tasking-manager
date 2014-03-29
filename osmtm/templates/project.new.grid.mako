# -*- coding: utf-8 -*-
<%inherit file="base.mako"/>
<%block name="header">
<a href="${request.route_url('home')}" class="navbar-brand"><i class="glyphicon glyphicon-home"></i></a>
<a class="navbar-brand">Project New</a>
</%block>
<%block name="content">
<div class="container">
  <form method="post">
    <div class="row">
      <div class="span6">
        <div id="leaflet"></div>
      </div>
      <div class="span6">
        <div id="help-step1" class="span6">
          <p>
            Draw the area of interest on the map yourself.
          </p>
          <p>
          or
          </p>
          <p>
            <input type="file" val="" name="osm" style="visibility:hidden;height:0;position:absolute;">
            <a id="import_osm"
              data-role="button"
              class="btn btn-small disabled"
              rel="tooltip"
              title="Provide a .osm file. You can download it from the OSM API (ex. www.openstreetmap.org/api/0.6/ relation/270485/full). (not available yet)"
              >Import OSM relation</a>
          </p>
        </div>
        <div id="partition" class="hide">
            Tile size
            <div id="tile_size" class="btn-group" >
              <button class="btn btn-small">XL</button>
              <button class="btn btn-small">L</button>
              <button class="btn btn-small active">M</button>
              <button class="btn btn-small">S</button>
              <button class="btn btn-small">XS</button>
            </div>
            <div class="form-actions">
              <button id="cancel" class="btn">Cancel</button>
              <input id="id_submit" type="submit" value="OK"
                  name="form.submitted" class="btn btn-success"/>
              <span id="loading" class="help-inline hide">Creating tiles, please wait...</span>
            </div>
            <input id="zoom" type="hidden" name="zoom"/>
            <input id="geometry" type="hidden" name="geometry"/>
        </div>
      </div>
    </div>
  </form>
</div>
<link rel="stylesheet" href="${request.static_url('osmtm:static/js/lib/Leaflet.draw/dist/leaflet.draw.css')}"/>
<script src="${request.static_url('osmtm:static/js/lib/leaflet.js')}"></script>
<script src="${request.static_url('osmtm:static/js/lib/Leaflet.draw/dist/leaflet.draw.js')}"></script>
<script src="${request.static_url('osmtm:static/js/project.new.grid.js')}"></script>

</%block>
