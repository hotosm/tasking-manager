# -*- coding: utf-8 -*-
<%inherit file="base.mako"/>
<%block name="header">
<a href="${request.route_url('home')}" class="brand"><i class="icon-home"></i></a>
<div class="brand">${project.name} - Edit</div>
</%block>
<%block name="content">
<div id="markdown_cheat_sheet" class="modal hide fade">
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
    <div class="tabbable tabs">
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
    <div class="form-actions"><a href="${request.route_url('project', project=project.id)}" class="btn">Cancel</a>
      <input id="id_submit" type="submit" value="Save the modifications" name="form.submitted" class="btn btn-primary"/>
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
      <div class="tab-content">
        % for locale, translation in project.translations.iteritems():
        <div class="tab-pane active" id="${locale}">
          <input id="id_name" type="text" name="name_${locale}"
                 value="${translation.name}"
                 placeholder="Name"
                 class="text input-xxlarge"/>

          <!-- short_description -->
          <label for="id_short_description" class="control-label">Short Description</label>
          <div class="tab-content">
            <div class="tab-pane active" id="short_description_${locale}_edit">
              <textarea id="id_short_description_${locale}"
                        name="short_description_${locale}"
                        style="width: 80%;"
                        rows="3" class="text span4">${translation.short_description}</textarea>
            </div>
          </div>

          <!-- description -->
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
                        style="width: 80%;"
                        rows="5" class="text span4">${translation.description}</textarea>
            </div>
            <div class="tab-pane preview" id="description_${locale}_preview"></div>
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
    <div class="control-group">
        <label class="control-label" for="id_entities_to_map">Entities to Map</label>
        <div class="controls">
          <input type="text" class="span5" id="id_entities_to_map"
                 name="entities_to_map"
                 placeholder="primary roads, secondary roads, buildings"
                 value="${project.entities_to_map if project.entities_to_map is not None else ''}"/>
          <span class="help-inline">
            The list of entities to map.<br />
          </span>
        </div>
    </div>
    <div class="control-group">
        <label class="control-label" for="id_changeset_comment">Changeset Comment</label>
        <div class="controls">
          <input type="text" class="span5" id="id_changeset_comment"
                 name="changeset_comment"
                 value="${project.changeset_comment if project.changeset_comment is not None else ''}"/>
          <span class="help-inline">
            Comments users are recommended to add to upload commits.<br />
            <em>For example: <code>Guinea, #hotosm-guinea-task-470, source=Pleiades, CNES, Astrium</code></em>
          </span>
        </div>
    </div>
    <hr />
    <div class="tabbable tabs-left">
      <ul class="nav nav-tabs languages">
        % for locale, translation in project.translations.iteritems():
        <li><a href="#instructions_${locale}" data-toggle="tab">${locale}</a></li>
        % endfor
      </ul>
      <div class="tab-content">
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
                        style="width: 80%;"
                        rows="4" class="text span4">${translation.instructions}</textarea>
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
<div class="form-horizontal">
<div class="control-group">
  <label class="control-label" for="id_imagery">URL to service</label>
  <div class="controls">
    <input type="text" class="span9" id="id_imagery" name="imagery" value="${project.imagery if project.imagery is not None else ''}"/>
    <p class="help-block">
    <strong>Note:</strong> Follow this format for TMS urls.<br>tms[22]:http://hiu-maps.net/hot/1.0.0/kathmandu_flipped/{zoom}/{x}/{y}.png
    </p>
  </div>
</div>
<div class="control-group">
  <label class="control-label" for="id_license">Required License</label>
  <div class="controls">
    <select id="id_license" name="license_id">
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
<small><em>
  <span class="icon icon-bullhorn"></span><b>Tip:</b>
  You can use <a href class="markdown">Markdown</a>
</em></small>
</%block>
