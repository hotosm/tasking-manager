<%
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
          title="The list of elements of elements we ask you to map">
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
          title="The comment to put when uploading data to the OSM database">
    </span>
  </dt>
  <dd>
    ${project.changeset_comment}
  </dd>
  % endif
  <dt>
    ${_('Imagery')}
  </dt>
  <dd>
    % if project.imagery:
      <%include file="imagery.mako" />
    % else:
      N/A
    % endif
  </dd>
</dl>
% if project.josm_preset:
<p >
  Using JOSM? Please use the dedicated
  <a href="${request.route_url('project_preset', project=project.id)}">preset</a>.
</p>
% endif
<hr />
<p>${markdown.markdown(project.instructions)|n}</p>
