<%
import bleach
import markdown
%>
<dl>
  % if project.entities_to_map:
  <dt>
    ${_('Entities to Map')}
    <span class="glyphicon glyphicon-question-sign"
          data-toggle="tooltip"
          data-placement="right"
          data-container="body"
          title="${_('The list of elements of elements we ask you to map')}">
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
          title="${_('The comment to put when uploading data to the OSM database')}">
    </span>
  </dt>
  <dd>
    ${project.changeset_comment}
  </dd>
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
<p>${bleach.clean(markdown.markdown(project.instructions), strip=True) |n}</p>
<p class="text-center">
  <a id="start"
     class="btn btn-success btn-lg">
    <span class="glyphicon glyphicon-share-alt"></span>&nbsp;
    ${_('Start contributing')}</a>
</p>
