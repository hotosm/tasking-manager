# -*- coding: utf-8 -*-
<%inherit file="base.mako"/>
<%block name="header">
<a href="${request.route_url('home')}" class="brand"><i class="icon-home"></i></a>
<div class="brand">New Project</div>
</%block>
<%block name="content">
<div class="container">
  <form method="post">
    <h3>What kind of project are you about to create?</h3>
    <div class="row">
      <div class="span6">
        <label class="radio">
          <input type="radio" id="grid" name="type"
          value="grid" checked/>
          Square Grid
          <p class="help-block">
            Area of interest is split into square grids.
          </p>
        </label>
      </div>
      <div class="span6">
        <label class="radio">
          <input type="radio" id="imported" name="type"
          value="imported" />
          Imported Geometries
          <p class="help-block">
            You already have polygons you want people to work on.
          </p>
        </label>
      </div>
    </div>
    <div class="form-actions">
      <input id="id_submit" type="submit" value="OK" name="form.submitted" class="btn btn-success"/>
    </div>
  </form>
</div>
</%block>
