# -*- coding: utf-8 -*-
<%inherit file="base.mako"/>
<%block name="header">
<h1>Project New</h1>
</%block>
<%block name="content">
<div class="container">
  <form method="post" enctype="multipart/form-data">
    <p>
    <input type="file" val="" name="import" style="visibility:hidden;height:0;position:absolute;">
    <a id="import"
      data-role="button"
      class="btn btn-default">Import polygons from GeoJSON file</a>
    <span id="loading" class="help-inline" style="display: none;">Importing file, please wait...</span>
    </p>
  </form>
</div>
<script src="${request.static_url('osmtm:static/js/project.new.import.js', _query={'v':'2.3.1'})}"></script>
</%block>
