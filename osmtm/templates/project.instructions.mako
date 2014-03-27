<%
import markdown
%>
<div class="row">
  <dl class="dl-horizontal">
    % if project.entities_to_map:
    <dt>
      ${_('Entities to Map')}
      <span class="icon icon-question-sign"
            rel="tooltip"
            data-original-title="The list of elements of elements we ask you to map">
      </span>
    </dt>
    <dd>${project.entities_to_map}</dd>
    % endif
    % if project.changeset_comment:
    <dt>
      ${_('Changeset Comment')}
      <span class="icon icon-question-sign"
            rel="tooltip"
            data-original-title="The comment to put when uploading data to the OSM database">
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
</div>
<div class="row">
  <div class="span12">
    <h4>${_('Detailed Instructions')}</h4>
    <p>${markdown.markdown(project.instructions)|n}</p>
  </div>
</div>
