# -*- coding: utf-8 -*-
<%inherit file="base.mako"/>
<%block name="header">
<a href="${request.route_path('home')}" class="navbar-brand"><i class="glyphicon glyphicon-home"></i></a>
<a class="navbar-brand">Project New</a>
</%block>
<%block name="content">
<div class="container">
    <div class="row">
      <div class="col-md-8">
        <div id="leaflet"></div>
      </div>
      <div class="col-md-4">
        <div id="help-step1" class="">
          <p>
            <a id="draw"
              class="btn btn-default">Draw</a> the area of interest on the map.
          </p>
          <p>
          or
          </p>
          <p>
          <form id="uploadform" method="post" enctype="multipart/form-data">
            <input type="file" val="" name="import" style="visibility:hidden;height:0;position:absolute;">
            <a id="import"
              data-role="button"
              class="btn btn-default"
              rel="tooltip"
              title="Provide a .geojson file."
              >Import</a> a GeoJSON file to define the area of interest.
            <span class="help-block">
              <small>
                Want to use an .osm file instead?<br>
                You can use the great <a href="http://geojson.io" target="_blank">GeoJSON.io</a> to convert it to GeoJSON.
              </small>
            </span>
            </form>
          </p>
        </div>
        <form id="mainform" method="post">
        <div id="partition" class="hidden">
          <div class="form-group">
            Tile size
            <div id="tile_size" class="btn-group" >
              <button class="btn btn-default">XL</button>
              <button class="btn btn-default">L</button>
              <button class="btn btn-default active">M</button>
              <button class="btn btn-default">S</button>
              <button class="btn btn-default">XS</button>
            </div>
          </div>
          <div class="form-actions">
            <button id="cancel" class="btn btn-default">Cancel</button>
            <input id="id_submit" type="submit" value="OK"
                name="form.submitted" class="btn btn-success"/>
            <span id="loading" class="help-inline" style="display: none;">Creating tiles, please wait...</span>
          </div>
            <input id="zoom" type="hidden" name="zoom"/>
            <input id="geometry" type="hidden" name="geometry"/>
        </div>
        </form>
      </div>
    </div>
</div>
<link rel="stylesheet" href="${request.static_url('osmtm:static/js/lib/Leaflet.draw/dist/leaflet.draw.css')}"/>
<script src="${request.static_url('osmtm:static/js/lib/leaflet.js')}"></script>
<script src="${request.static_url('osmtm:static/js/lib/Leaflet.draw/dist/leaflet.draw.js')}"></script>
<script src="${request.static_url('osmtm:static/js/project.new.grid.js')}"></script>

</%block>
