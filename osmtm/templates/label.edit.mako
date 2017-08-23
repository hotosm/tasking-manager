# -*- coding: utf-8 -*-
<%inherit file="base.mako"/>
<%namespace file="helpers.mako" name="helpers"/>
<%block name="header">
<h1>${_('Edit Label')}</h1>
</%block>
<%block name="content">
<div class="container">
    <form method="post" action="" class="">
      <div class="form-inline">
        <div class="form-group">
          <input type="text" class="form-control" id="id_name" name="name" value="${label.name if label else ''}"
                   placeholder="${_('New label name...')}" />
        </div>
        <div class="form-group">
          <select class="colorselector" name="color">
            % for color in ['#888', '#b60205', '#d93f0b', '#fbca04', '#0e8a16', '#006b75', '#1d76db', '#0052cc', '#5319e7', \
                            '#ccc', '#e99695', '#f9d0c4', '#fef2c0', '#c2e0c6', '#bfdadc', '#c5def5', '#bfd4f2', '#d4c5f9']:
              <option value="${color}"
                      data-color="${color}"
                      ${'selected' if label is not None and label.color == color else ''}>
                ${color}
              </option>
            % endfor
          </select>
        </div>
      </div>
      <br>
      <div class="form-group">
        <label for="id_short_description" class="control-label">
          ${_('Description')}
        </label>
        ${helpers.locale_chooser(inputname='description')}
        <div class="tab-content">
          % for locale, translation in translations:
            <div id="description_${locale}"
                 data-locale="${locale}"
                 class="tab-pane ${'active' if locale == 'en' else ''}">
              <textarea id="id_description_${locale}"
                        name="description_${locale}"
                        class="form-control"
                        % if label is not None:
                          placeholder="${label.translations.en.description}"
                        % endif
                        rows="3">${translation.description}</textarea>
            </div>
          % endfor
        </div>
      </div>
      <div class="row">
        <div class="col-md-12">
          % if label:
          <button type="submit" class="btn btn-success" id="id_submit" name="form.submitted">${_('Save the modifications')}</button>
          <a class="btn btn-danger" id="delete" href="${request.route_path('label_delete', label=label.id)}">${_('Delete')}</a>
          % else:
          <button type="submit" class="btn btn-success" id="id_submit" name="form.submitted">${_('Create label')}</button>
          % endif
          <a class="btn btn-default" href="${request.route_path('labels')}">${_('Cancel')}</a>
        </div>
      </div>
    </form>
</div>
<script>
    $('#delete').click(function() {
        if (confirm("${_('Are you sure you want to delete this label?')}")) {
            window.location = this.href;
        }
        return false;
    });
    $('.colorselector').colorselector();
</script>
</%block>

<%block name="extrascripts">
<link rel="stylesheet" href="${request.static_path('osmtm:static/js/lib/colorselector/lib/bootstrap-colorselector-0.2.0/css/bootstrap-colorselector.css')}">
<script src="${request.static_path('osmtm:static/js/lib/colorselector/lib/bootstrap-colorselector-0.2.0/js/bootstrap-colorselector.js')}"></script>
</%block>
