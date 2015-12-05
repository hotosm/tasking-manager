<%
from osmtm.mako_filters import markdown_filter
%>
<dl>
  % if project.entities_to_map:
  <dt>
    ${_('Entities to Map')}
    <span class="glyphicon glyphicon-question-sign"
          data-toggle="tooltip"
          data-placement="right"
          data-container="body"
          title="${_('The list of elements we ask you to map')}">
    </span>
  </dt>
  <dd>${project.entities_to_map}</dd>
  % endif
  % if project.changeset_comment:
  <dt>
    ${_('Changeset Comment')}
    <span class="glyphicon glyphicon-question-sign"
          data-toggle="tooltip"
          data-placement="right"
          data-container="body"
          title="${_('The default comment entered when uploading data to the OSM database. Please add to the default comment a description of what you actually mapped.')}">
    </span>
  </dt>
  <dd>
    ${project.changeset_comment}
  </dd>
  <span class="help-block">
    ${_('When saving your work, pleaes leave the default comment but add what you actually mapped, for example "added buildings and a residential road".')}
  </span>
  % endif
  % if project.imagery:
  <dt>
    ${_('Imagery')}
  </dt>
  <dd>
      <%include file="imagery.mako" />
  </dd>
  % endif
</dl>
% if project.josm_preset:
<p >
<%
    link = '<a href="%s">%s</a>' % (request.route_url('project_preset', project=project.id), _('preset'))
    text = _('Using JOSM? Please use the dedicated ${preset_link}.', mapping={'preset_link': link} )
%>
  ${text|n}
</p>
% endif
<hr />
<p>${project.instructions | markdown_filter, n}</p>
<p class="text-center">
  <a id="start"
     class="btn btn-success btn-lg">
    <span class="glyphicon glyphicon-share-alt"></span>&nbsp;
    ${_('Start contributing')}</a>
</p>
