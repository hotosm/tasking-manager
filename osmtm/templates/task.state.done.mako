% if user and task.user == user:
<%
tooltip = _("Invalidate this task if you consider it needs more work.")
done = task.state == task.state_done
%>
  <form action="${request.route_path('task_validate', task=task.id, project=task.project_id)}" method="POST" role="form">
    <%include file="task.comment.mako" />
    <div class="row">
      <div class="${'col-md-6' if done else '12'}">
        <button type="submit" rel="tooltip" data-original-title="${tooltip}"
                name="invalidate"
                data-container="body"
                class="btn btn-danger">
          <i class="glyphicon glyphicon-thumbs-down icon-white"></i> ${_('Invalidate')}
        </button>
      </div>
      % if done:
<%
tooltip = _("Validate this task if you consider that the work is complete.")
%>
      <div class="col-md-6">
        <button type="submit" rel="tooltip"
                name="validate"
                data-container="body"
                data-original-title="${tooltip}"
                class="btn btn-success">
          <i class="glyphicon glyphicon-thumbs-up icon-white"></i> ${_('Validate')}
        </button>
      </div>
      % endif
    </div>
  </form>
% endif
