# -*- coding: utf-8 -*-
<%inherit file="base.mako"/>
<%block name="header">
<a href="${request.route_url('home')}" class="navbar-brand"><i class="glyphicon glyphicon-home"></i></a>
<a class="navbar-brand">${project.name} - Edit</a>
</%block>
<%block name="content">
<div id="markdown_cheat_sheet" class="modal fade">
  <div class="modal-dialog">
  <div class="modal-content">
    <div class="modal-header">
      <button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>
      <h4 class="modal-title">Markdown Quick Reference</h4>
    </div>
    <div class="modal-body"></div>
  </div>
  </div>
</div>
<script>
  var converter = new Showdown.converter();
</script>
<div class="container">
  <form method="post" action="" enctype="multipart/form-data" class="form">
    <div class="row">
      <div class="tabbable tabs row">
        <ul class="nav nav-tabs">
          <li><a href="#description" data-toggle="tab">Description</a></li>
          <li><a href="#instructions" data-toggle="tab">Instructions</a></li>
          <li><a href="#area" data-toggle="tab">Area</a></li>
          <li><a href="#imagery" data-toggle="tab">Imagery</a></li>
        </ul>
        <div class="tab-content">
          <div class="tab-pane" id="description">
            ${description()}
          </div>
          <div class="tab-pane" id="instructions">
            ${instructions()}
          </div>
          <div class="tab-pane" id="area">
            Area modifications are not available yet.
          </div>
          <div class="tab-pane" id="imagery">
            ${imagery()}
          </div>
        </div>
      </div>
    </div>
    <div class="row pull-right">
      <div class="form-group">
        <a href="${request.route_url('project', project=project.id)}" class="btn btn-default">Cancel</a>
        <input id="id_submit" type="submit" value="Save the modifications" name="form.submitted" class="btn btn-primary"/>
      </div>
    </div>
  </form>
  <script type="text/javascript" src="${request.static_url('osmtm:static/js/project.edit.js')}"></script>
</div>
</%block>
<%block name="description">
    <div class="tabbable tabs-left">
      <ul class="nav nav-tabs languages">
        % for locale, translation in project.translations.iteritems():
        <li><a href="#${locale}" data-toggle="tab">${locale}</a></li>
        % endfor
      </ul>
      <div class="tab-content col-md-8">
        % for locale, translation in project.translations.iteritems():
        <div class="tab-pane active" id="${locale}">
          <div class="form-group">
            <input id="id_name" type="text" name="name_${locale}"
                   value="${translation.name}"
                   placeholder="Name"
                   class="form-control"/>
          </div>

          <!-- short_description -->
          <div class="form-group">
            <label for="id_short_description" class="control-label">Short Description</label>
            <div class="tab-content">
              <div class="tab-pane active" id="short_description_${locale}_edit">
                <textarea id="id_short_description_${locale}"
                          name="short_description_${locale}"
                          class="form-control"
                          rows="3">${translation.short_description}</textarea>
              </div>
            </div>
          </div>

          <!-- description -->
          <div class="form-group">
            <label for="id_description" class="control-label">Description</label>
            <ul class="nav nav-pills small">
              <li class="active">
                <a href="#description_${locale}_edit" data-toggle="tab">Edit</a>
              </li>
              <li>
                <a href="#description_${locale}_preview" data-toggle="tab">Preview</a>
              </li>
            </ul>
            <div class="tab-content">
              <div class="tab-pane active" id="description_${locale}_edit">
                <textarea id="id_description_${locale}"
                          name="description_${locale}"
                          class="form-control"
                          rows="5">${translation.description}</textarea>
              </div>
              <div class="tab-pane preview" id="description_${locale}_preview"></div>
            </div>
          </div>
          ${markdown_link()}
        </div>
        <script>
          (function () {
            var description = $('#id_description_${locale}'),
            description_preview = $('#description_${locale}_preview');
            description.keyup(function() {
              var html = converter.makeHtml(description.val());
              description_preview.html(html);
            }).trigger('keyup');
          })();
        </script>
        % endfor
      </div>
    </div>
</%block>

<%block name="instructions">
    <div class="form-group">
      <label class="control-label" for="id_entities_to_map">Entities to Map</label>
      <input type="text" id="id_entities_to_map"
             name="entities_to_map"
             placeholder="primary roads, secondary roads, buildings"
             class="form-control col-md-5"
             value="${project.entities_to_map if project.entities_to_map is not None else ''}"/>
      <span class="help-block">
        The list of entities to map.<br />
      </span>
    </div>
    <div class="form-group">
      <label class="control-label" for="id_changeset_comment">Changeset Comment</label>
      <input type="text" id="id_changeset_comment"
             name="changeset_comment"
             class="form-control"
             value="${project.changeset_comment if project.changeset_comment is not None else ''}"/>
      <span class="help-block">
        Comments users are recommended to add to upload commits.<br />
        <em>For example: <code class="text-muted">Guinea, #hotosm-guinea-task-470, source=Pleiades, CNES, Astrium</code></em>
      </span>
    </div>
    <hr />
    <div class="tabbable tabs-left">
      <ul class="nav nav-tabs languages">
        % for locale, translation in project.translations.iteritems():
        <li><a href="#instructions_${locale}" data-toggle="tab">${locale}</a></li>
        % endfor
      </ul>
      <div class="tab-content col-md-8">
        % for locale, translation in project.translations.iteritems():
        <div class="tab-pane active" id="instructions_${locale}">
          <!-- instructions -->
          <label for="id_instructions" class="control-label">Detailed Instructions</label>
          <ul class="nav nav-pills small">
            <li class="active">
              <a href="#instructions_${locale}_edit" data-toggle="tab">Edit</a>
            </li>
            <li>
              <a href="#instructions_${locale}_preview" data-toggle="tab">Preview</a>
            </li>
          </ul>
          <div class="tab-content">
            <div class="tab-pane active" id="instructions_${locale}_edit">
              <textarea id="id_instructions_${locale}"
                        name="instructions_${locale}"
                        class="form-control"
                        rows="4">${translation.instructions}</textarea>
            </div>
            <div class="tab-pane preview" id="instructions_${locale}_preview"></div>
          </div>
          ${markdown_link()}
        </div>
        <script>
          (function () {
            var instructions = $('#id_instructions_${locale}'),
            instructions_preview = $('#instructions_${locale}_preview');
            instructions.keyup(function() {
              var html = converter.makeHtml(instructions.val());
              instructions_preview.html(html);
            }).trigger('keyup');
          })();
        </script>
        % endfor
      </div>
    </div>
</%block>

<%block name="imagery">
<div class="row">
  <div class="col-md-6">
    <div class="form-group">
      <label class="control-label" for="id_imagery">URL to service</label>
      <input type="text" class="col-md-9 form-control" id="id_imagery" name="imagery" value="${project.imagery if project.imagery is not None else ''}"/>
      <p class="help-block">
        <strong>Note:</strong> Follow this format for TMS urls.<br>tms[22]:http://hiu-maps.net/hot/1.0.0/kathmandu_flipped/{zoom}/{x}/{y}.png
      </p>
    </div>
  </div>
  <div class="col-md-6">
    <div class="form-group">
      <label class="control-label" for="id_license">Required License</label>
      <select id="id_license" name="license_id" class="form-control col-md-6">
        <option value="" />
        % for l in licenses:
        <%
        selected = ""
        if project.license is not None and l.id == project.license.id:
          selected = "selected"
        %>
        <option value="${l.id}" ${selected}>${l.name}</a>
        % endfor
      </select>
    </div>
  </div>
</div>
</%block>

<%block name="markdown_link">
<div class="help-block"><em>
  <span class="glyphicon glyphicon-bullhorn"></span><b>Tip:</b>
  You can use <a href class="markdown">Markdown</a>
</em></div>
</%block>
