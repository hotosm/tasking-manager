# -*- coding: utf-8 -*-
<%inherit file="base.mako"/>
<%block name="header">
<a href="${request.route_url('home')}" class="brand"><i class="icon-home"></i></a>
<div class="brand">${project.name} - Edit</div>
</%block>
<%block name="content">
<div class="container">
  <form method="post" action="" enctype="multipart/form-data" class="form-horizontal">
    <div class="control-group">
      <label for="id_name" class="control-label">Name</label>
      <div class="controls">
        <input id="id_name" type="text" name="name" value="${project.name}" class="text input-xxlarge"/>
      </div>
    </div>
    <div class="row">
      <div class="span7">
        <div class="control-group">
          <label for="id_short_description" class="control-label">Short Description</label>
          <div class="controls"><textarea id="id_short_description" name="short_description" rows="5" class="text span5">${project.short_description}</textarea>
          </div>
        </div>
      </div>
      <div class="span5"><span id="short_description_preview"></span>
      </div>
    </div>
    <div class="row">
      <div class="span7">
        <div class="control-group">
          <label for="id_description" class="control-label">Description</label>
          <div class="controls"><textarea id="id_description" name="description" rows="10" class="text span5">${project.description}</textarea>
          </div>
        </div>
      </div>
      <div class="span5"><span id="description_preview"></span>
      </div>
    </div>
    <div class="form-actions"><a href="${request.route_url('project', project=project.id)}" class="btn">Cancel</a>
      <input id="id_submit" type="submit" value="Save the modifications" name="form.submitted" class="btn btn-primary"/>
    </div>
  </form>
  <script type="text/javascript" src="${request.static_url('osmtm:static/js/project.edit.js')}"></script>
</div>
</%block>
