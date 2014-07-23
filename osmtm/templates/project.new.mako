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
        ${step1()}
        ${step2()}
        ${step3_grid()}
        ${step3_arbitrary()}
      </div>
    </div>
</div>
<link rel="stylesheet" href="${request.static_url('osmtm:static/js/lib/Leaflet.draw/dist/leaflet.draw.css')}"/>
<script src="${request.static_url('osmtm:static/js/lib/leaflet.js')}"></script>
<script src="${request.static_url('osmtm:static/js/lib/Leaflet.draw/dist/leaflet.draw.js')}"></script>
<script src="${request.static_url('osmtm:static/js/lib/leaflet-omnivore.min.js')}"></script>
<script src="${request.static_url('osmtm:static/js/project.new.js')}"></script>

</%block>

<%block name="step1">
<div id="step1" class="">
  <h2>Step 1</h2>
  <p>
  <a id="draw"
    class="btn btn-default">Draw</a> the area of interest on the map.
  </p>
  <p>
  or
  </p>
  <p>
  <form id="uploadform" method="post" enctype="multipart/form-data">
    <input type="file" val="" name="import" class="hidden" />
    <a id="import"
      data-role="button"
      class="btn btn-default"
      rel="tooltip"
      title="Provide a .geojson or .kml file."
      >Import</a> a <em>GeoJSON</em> or <em>KML</em> file.
    <span class="help-block">
      <small>
        Want to use an <em>.osm</em> file instead?<br>
        You can use <a href="http://geojson.io" target="_blank">GeoJSON.io</a> to convert it to <em>GeoJSON</em>.
      </small>
    </span>
  </form>
  </p>
</div>
</%block>

<%block name="step2">
<div id="step2" class="hidden">
  <h2>Step 2 - Type of project</h2>
  <div class="row">
    <div class="col-md-6">
      <label class="radio">
        <input type="radio" name="type" value="grid" checked/>
        Square Grid
        <br>
        <img src="${request.static_url('osmtm:static/img/project_creation_grid.png')}" width="150">
        <p class="help-block">
        Area of interest is automatically split into grid cells. Each one is a task.<br>
        </p>
      </label>
    </div>
    <div class="col-md-6">
      <label id="arbitrary" class="radio mask"
             rel="tooltip"
             data-original-title="${_('You cannot select this option unless you import a file with polygons.')}"
             >
        <input type="radio" name="type" value="arbitrary" disabled />
        Arbitrary Geometries
        <br>
        <img src="${request.static_url('osmtm:static/img/project_creation_arbitrary.png')}" width="150">
        <p class="help-block">
        Each polygon represents a task.<br>
        </p>
      </label>
    </div>
  </div>
  <div class="row">
    <a id="step2-next" class="btn btn-default pull-right">Next
      <span class="glyphicon glyphicon-chevron-right"></span>
    </a>
  </div>
</div>
</%block>

<%block name="step3_grid">
<div id="step3-grid" class="hidden">
  <form id="gridform" method="post" action="${request.route_url('project_new_grid')}">
    <h2>Step 3</h2>
    <div class="form-group">
      Tile size
      <div id="tile_size" class="btn-group" >
        <button class="btn btn-default">XL</button>
        <button class="btn btn-default">L</button>
        <button class="btn btn-default active">M</button>
        <button class="btn btn-default">S</button>
        <button class="btn btn-default">XS</button>
      </div>
      <span id="computing" class="help-inline hidden">Computing...</span>
    </div>
    <div>
      A new project will be created with <strong id="grid_geometries_count"></strong> tasks.
    </div>
    <div class="form-actions pull-right">
      <input type="submit" value="Create project"
             name="form.submitted" class="btn btn-success"/>
    </div>
    <div class="clearfix"></div>
    <div class="clearfix"></div>
    <div class="pull-right loading help hidden">
      Creating tiles, please wait...
    </div>
    <input type="hidden" name="tile_size"/>
    <input id="geometry" type="hidden" name="geometry"/>
  </form>
</div>
</%block>

<%block name="step3_arbitrary">
<div id="step3-arbitrary" class="hidden">
  <form id="gridform" method="post" action="${request.route_url('project_new_arbitrary')}">
    <h2>Step 3</h2>
    A new project will be created with <strong><span id="arbitrary_geometries_count"></span></strong> tasks.
    <div class="form-actions pull-right">
      <input type="submit" value="Create project"
             name="form.submitted" class="btn btn-success"/>
    </div>
    <div class="clearfix"></div>
    <div class="loading pull-right help hidden">
      Creating project, please wait...
    </div>
    <input id="geometry_arbitrary" type="hidden" name="geometry"/>
  </form>
</div>
</%block>
