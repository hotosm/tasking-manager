<%
import bleach
import markdown
%>
% if project.status in [project.status_draft, project.status_archived] :
<p class="alert alert-warning text-muted">
  <span class="glyphicon glyphicon-warning-sign"></span>
  % if project.status == project.status_draft:
    ${_('This project is not published yet.')}
    % if user and (user.is_project_manager or user.is_admin):
    <a href="${request.route_url('project_publish', project=project.id)}" class="pull-right">
      <span class="glyphicon glyphicon-share-alt"></span> ${_('Publish')}
    </a>
    % endif
  % elif project.status == project.status_archived:
    ${_('This project was archived.')}
  % endif
</p>
% endif
% if project.private:
<p class="text-muted">
  <span class="glyphicon glyphicon-lock"></span>
  ${_('Access to this project is limited')}
</p>
% endif
<p>${markdown.markdown(bleach.clean(project.description, strip=True)) |n}</p>
<hr />
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
<p>${markdown.markdown(bleach.clean(project.instructions, strip=True)) |n}</p>
<p class="text-center">
  <a id="start"
     class="btn btn-success btn-lg">
    <span class="glyphicon glyphicon-share-alt"></span>&nbsp;
    ${_('Start contributing')}</a>
</p>
