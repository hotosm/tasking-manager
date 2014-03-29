<%
import markdown
%>
<div class="row">
  <div class="col-md-12">
    <dl class="dl-horizontal">
      % if project.entities_to_map:
      <dt data-toggle="tooltip"
          data-placement="right"
          title="The list of elements of elements we ask you to map">
        ${_('Entities to Map')}
        <span class="glyphicon glyphicon-question-sign">
        </span>
      </dt>
      <dd>${project.entities_to_map}</dd>
      % endif
      % if project.changeset_comment:
      <dt data-toggle="tooltip"
          data-placement="right"
          title="The comment to put when uploading data to the OSM database">
        ${_('Changeset Comment')}
        <span class="glyphicon glyphicon-question-sign">
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
</div>
<hr />
<div class="row">
  <div class="col-md-12">
    <p>${markdown.markdown(project.instructions)|n}</p>
  </div>
</div>
