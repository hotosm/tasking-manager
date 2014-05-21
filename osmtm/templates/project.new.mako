# -*- coding: utf-8 -*-
<%inherit file="base.mako"/>
<%block name="header">
<a href="${request.route_path('home')}" class="navbar-brand"><i class="glyphicon glyphicon-home"></i></a>
<a class="navbar-brand">Project New</a>
</%block>
<%block name="content">
<div class="container">
    <h3>What kind of project are you about to create?</h3>
    <div class="row">
      <div class="col-md-6">
        <label class="radio">
          <input type="radio" id="grid" name="type" value="grid"/>
          Square Grid
          <p class="help-block">
            You want the area of interest to be automatically split into grid cells for you.<br>
            <img src="${request.static_url('osmtm:static/img/project_creation_grid.png')}" width="300">
          </p>
        </label>
      </div>
      <div class="col-md-6">
        <label class="radio">
          <input type="radio" id="import" name="type" value="import" />
          Arbitrary Geometries
          <p class="help-block">
            You have a file with polygons. One for each task.<br>
            <img src="${request.static_url('osmtm:static/img/project_creation_arbitrary.png')}" width="300">
          </p>
        </label>
      </div>
    </div>
</div>
<script>
  $('input[type=radio]').attr('checked', false);
  $('input[type=radio]').on('change', function() {
    switch ($(this)[0].id) {
      case "grid":
        window.location = "${request.route_path('project_new_grid')}";
        break;
      case "import":
        window.location = "${request.route_path('project_new_import')}";
        break;
    }
  });
</script>
</%block>
