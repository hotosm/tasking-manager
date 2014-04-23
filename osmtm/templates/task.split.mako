% if user and task.user == user and task.zoom is not None:
  <p class="text-muted">
  <span>${_('Task is too big?')}</span>
  <%
    disabled = ""
    tooltip = ""
    if (task.zoom - task.project.zoom) > 1:
      disabled = "disabled linethrough"
      tooltip = "You cannot split this task more."
  %>
    <a id="split" href="${request.route_path('task_split', task=task.id, project=task.project_id)}"
       rel="tooltip" data-original-title="${tooltip}"
       data-confirm="${_('Are you sure you want to split this task?')}"
       class="${disabled}">
       ${_('Split')} <i class="glyphicon icon-split"></i>
    </a>
  </p>
% endif
