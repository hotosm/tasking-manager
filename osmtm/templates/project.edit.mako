# -*- coding: utf-8 -*-
<%inherit file="base.mako"/>
<%block name="header">
<h1>${project.name} - Edit</h1>
</%block>
<%block name="content">
<link rel="stylesheet" href="${request.static_url('osmtm:static/js/lib/datepicker3.css')}">
<script type="text/javascript" src="${request.static_url('osmtm:static/js/lib/angular.min.js')}"></script>
<script type="text/javascript" src="${request.static_url('osmtm:static/js/lib/bootstrap-datepicker.js')}"></script>
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
  var project_id = ${project.id};
</script>
<div class="container">
  <form method="post" action="" enctype="multipart/form-data" class="form"
        enctype="multipart/form-data">
    <div class="row">
      <div class="tabbable tabs row">
        <ul class="nav nav-tabs">
          <li><a href="#description" data-toggle="tab">Description</a></li>
          <li><a href="#instructions" data-toggle="tab">Instructions</a></li>
          <li><a href="#area" data-toggle="tab">Area</a></li>
          <li><a href="#imagery" data-toggle="tab">Imagery</a></li>
          <li><a href="#allowed_users" data-toggle="tab">Allowed Users</a></li>
          <li><a href="#misc" data-toggle="tab">Misc</a></li>
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
          <div class="tab-pane" id="allowed_users">
            ${allowed_users()}
          </div>
          <div class="tab-pane" id="misc">
            ${misc()}
          </div>
        </div>
      </div>
    </div>
    <div class="row pull-right">
      <div class="form-group">
        <a href="${request.route_path('project', project=project.id)}" class="btn btn-default">Cancel</a>
        <input id="id_submit" type="submit" value="Save the modifications" name="form.submitted" class="btn btn-primary"/>
      </div>
    </div>
  </form>
  <script type="text/javascript" src="${request.static_url('osmtm:static/js/project.edit.js')}"></script>
  <script src="http://twitter.github.io/typeahead.js/releases/latest/typeahead.bundle.js"></script>
</div>
</%block>
<%block name="description">

    <div class="row">
      <!-- status -->
      <div class="form-group col-md-2">
        <label for="id_status" class="control-label">Status</label>
        <select id="id_status" name="status" class="form-control">
          <%
          from osmtm.models import Project
          statuses = {
            Project.status_archived: _('Archived'),
            Project.status_published: _('Published'),
            Project.status_draft: _('Draft'),
          }
          %>
          % for s in statuses:
            <%
            selected = 'selected' if project.status == s else ''
            %>
            <option value="${s}" ${selected}>${statuses[s]}</option>
          % endfor
        </select>
      </div>

      <div class="form-group col-md-2">
        <label for="id_priority" class="control-label">Priority</label>
        <select id="id_priority" name="priority" class="form-control">
          % for idx, val in enumerate(['urgent', 'high', 'medium', 'low']):
            <%
            selected = 'selected' if project.priority == idx else ''
            %>
            <option value="${idx}" ${selected}>${_(val)}</option>
          % endfor
        </select>
      </div>
    </div>

    <!-- name -->
    <div class="row">
      <div class="col-md-8">
        <div class="form-group">
          <label for="id_name" class="control-label">Name of the project
          </label>
          ${locale_chooser(inputname='name')}
          <div class="tab-content">
            % for locale, translation in project.translations.iteritems():
            <div id="tab_name_${locale}"
                 data-locale="${locale}"
                 class="tab-pane ${'active' if locale == 'en' else ''}">
              <input id="id_name_${locale}" type="text" name="name_${locale}"
                     value="${translation.name}"
                     placeholder="${project.translations.en.name}"
                     class="form-control"/>
            </div>
            % endfor
          </div>
        </div>
      </div>
    </div>

    <!-- short_description -->
    <div class="row">
      <div class="col-md-8">
        <div class="form-group">
          <label for="id_short_description" class="control-label">
            Short Description
          </label>
          ${locale_chooser(inputname='short_description')}
          <div class="tab-content">
            % for locale, translation in project.translations.iteritems():
              <div id="short_description_${locale}"
                   data-locale="${locale}"
                   class="tab-pane ${'active' if locale == 'en' else ''}">
                <textarea id="id_short_description_${locale}"
                          name="short_description_${locale}"
                          class="form-control"
                          placeholder="${project.translations.en.short_description}"
                          rows="3">${translation.short_description}</textarea>
              </div>
            % endfor
          </div>
        </div>
      </div>
    </div>

    <!-- description -->
    <div class="row">
      <div class="col-md-8">
        <div class="form-group">
          <label for="id_description" class="control-label">
            Description
          </label>
          ${textarea_with_preview(inputname='description', size='big')}
        </div>
      </div>
    </div>
</%block>

<%block name="instructions">
    <div class="form-group">
      <label class="control-label" for="id_entities_to_map">Entities to Map</label>
      <input type="text" id="id_entities_to_map"
             name="entities_to_map"
             placeholder="primary roads, secondary roads, buildings"
             class="form-control"
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
        For example: <em>" Guinea, #hotosm-guinea-task-470, source=Pleiades, CNES, Astrium "</code></em>
      </span>
    </div>

    <!-- instructions -->
    <div class="row">
      <div class="col-md-8">
        <div class="form-group">
          <label for="id_instructions" class="control-label">
            Detailed Instructions
          </label>
          ${textarea_with_preview(inputname='instructions', size='big')}
        </div>
      </div>
    </div>


    <!-- per task instructions -->
    <div class="row">
      <div class="col-md-8">
        <div class="form-group">
          <label for="id_per_task_instructions" class="control-label">
            Per Task Instructions (optional)
          </label>
          ${textarea_with_preview(inputname='per_task_instructions')}

          <span class="help-block col-md-9">
            Put here anything that can be usefull to users while taking a task. {x}, {y} and {z} will be replaced by the correponding parameters for each task.<br />
            For example: <em>" This task involves loading extra data. Click [here](http://localhost:8111/import?new_layer=true&url=http://www.domain.com/data/{x}/{y}/{z}/routes_2009.osm) to load the data into JOSM "</em>
          </span>
        </div>
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

<%block name="allowed_users">
<div class="row">
  <div class="input-group">
    <div class="checkbox">
      <label>
        <%
          checked = 'checked' if project.private else ''
        %>
        <input type="checkbox" name="private" ${checked}>
        <span class="glyphicon glyphicon-lock"></span> Private
      </label>
      <div class="help-block">
        Private means that only a given list of users can access this project.
      </div>
    </div>
  </div>
  <h4>
    ${_('Allowed users')}
  </h4>
  <div class="row" ng-app="allowed_users">
    <div class="col-md-4 panel panel-default" ng-controller="allowedUsersCrtl">
      <ul class="list-group">
        <li class="list-group-item"
            ng-repeat="user in allowed_users"
            data-user="{{user.id}}">
          {{user.username}}
          <button class="btn btn-default btn-xs pull-right user-remove"
                  type="button">
            <span class="glyphicon glyphicon-remove"></span>
          </button>
        </li>
      </ul>
    </div>
  </div>
  <div class="row">
    <div class="col-md-3">
      <div class="input-group">
        <input type="text" class="form-control"
               id="adduser"
               placeholder="Type a username">
        <span class="input-group-btn">
        <button class="btn btn-default disabled" type="button"
                id="do_add_user">Add user</button>
        </span>
      </div>
    </div>
  </div>
</div>
<%
  from osmtm.models import dumps
%>
<script>
  var allowed_users = ${dumps({user.id: user.as_dict() for user in project.allowed_users})|n};
</script>
</%block>

<%block name="misc">
<div class="form-group">
  <div class="input-group">
    <label>
      Project due date
    </label>
    <div class="input-group date">
      <input type="text" class="form-control"
             name="due_date"
             value="${project.due_date.strftime('%m/%d/%Y') if project.due_date is not None else ''}">
      <span class="input-group-addon"><i class="glyphicon glyphicon-th"></i></span>
    </div>
    <div class="help-block">The date after which the project will automatically be archived.</div>
  </div>
</div>

<div class="form-group">

  <label for="id_josm_preset" class="control-label">JOSM Preset</label>
  <input id="id_josm_preset" type="file" name="josm_preset"
         accept="application/x-josm-preset">
  % if project.josm_preset:
  <span class="help-block">
    A JOSM Preset has already been added to this project.
  </span>
  % endif
</div>
</%block>

<%block name="markdown_link">
<div class="help-block pull-right"><small><em>
  <b>Tip:</b>
  You can use <a href class="markdown">Markdown</a>. (HTML is not allowed)
</em></small></div>
</%block>

<%def name="textarea_with_preview(inputname, size=None)">
  <div class="tab-content">
    ${locale_chooser(inputname=inputname)}
    % for locale, translation in project.translations.iteritems():
    <div id="tab_${inputname}_${locale}"
         data-locale="${locale}"
         class="tab-pane ${'active' if locale == 'en' else ''}">
      <ul class="nav nav-pills small">
        <li class="active">
          <a href="#${inputname}_${locale}_edit" data-toggle="tab">Edit</a>
        </li>
        <li>
          <a href="#${inputname}_${locale}_preview" data-toggle="tab">Preview</a>
        </li>
      </ul>
      <div class="tab-content">
        <div id="${inputname}_${locale}_edit"
             data-locale="${locale}"
             class="tab-pane ${'active' if locale == 'en' else ''}">
          <textarea id="id_${inputname}_${locale}"
                    name="${inputname}_${locale}"
                    class="form-control"
                    placeholder="${getattr(project.translations.en, inputname)}"
                    rows="${15 if size == 'big' else 5}">${getattr(translation, inputname)}</textarea>
        </div>
        <div class="tab-pane preview" id="${inputname}_${locale}_preview"></div>
      </div>
    </div>
    <script>
      (function () {
        var ${inputname} = $('#id_${inputname}_${locale}'),
        ${inputname}_preview = $('#${inputname}_${locale}_preview');
        ${inputname}.keyup(function() {
          var html = converter.makeHtml(${inputname}.val());
          ${inputname}_preview.html(html);
        }).trigger('keyup');
      })();
    </script>
    % endfor
  </div>
  ${markdown_link()}
</%def>

<%def name="locale_chooser(inputname)">
  <div class="btn-group pull-right" id="locale_chooser_${inputname}">
    % for locale, translation in project.translations.iteritems():
    <a href
      class="btn btn-default btn-xs ${'active' if locale == 'en' else ''}"
      data-locale="${locale}">
      <span class="${'text-muted' if getattr(translation, inputname) == '' else ''}">
        ${locale}
      </span>
    </a>
    % endfor
  </div>
  <script>
    $('#locale_chooser_${inputname} a').on('click', function() {
      $(this).addClass('active');
      $(this).siblings().removeClass('active');
      var locale = $(this).attr('data-locale');
      $(this).parents('.form-group').find('.tab-pane').each(function(index, item) {
        if ($(item).attr('data-locale') == locale) {
          $(item).addClass('active');
        } else {
          $(item).removeClass('active');
        }
      });
      return false;
    });
  </script>
</%def>
