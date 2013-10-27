# -*- coding: utf-8 -*-
<%inherit file="base.mako"/>
<%block name="header">
<a href="${request.route_url('home')}" class="brand"><i class="icon-home"></i></a>
<div class="brand">${project.name} - Partition</div>
</%block>
<%block name="content">
<div class="container">
  <form method="post" enctype="multipart/form-data">
    <p>
    <input type="file" val="" name="import" style="visibility:hidden;height:0;position:absolute;">
    <a id="import"
      data-role="button"
      class="btn btn-small">Import polygons from GeoJSON file</a>
    <span id="loading" class="help-inline hide">Importing file, please wait...</span>
    </p>
  </form>
</div>
<script src="${request.static_url('osmtm:static/js/project.partition.import.js')}"></script>
</%block>
