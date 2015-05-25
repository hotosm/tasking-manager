## works for ready or invalidated tasks
% if user and task.cur_lock and task.cur_lock.lock and task.cur_lock.user == user:
  <%
  unlocktip = _("Stop working on this task and unlock it. You may resume work on it again later.")
  donetip = _("Mark this task as done if you have completed all items in the instructions.")
  %>
  <form action="${request.route_path('task_done', task=task.id, project=task.project_id)}" method="POST">
    <%include file="task.comment.mako" />
    <a id="unlock"
       rel="tooltip"
       data-container="body"
       data-original-title="${unlocktip}"
       class="btn btn-default"
       href="${request.route_path('task_unlock', task=task.id, project=task.project_id)}">
        ${_('Unlock')}
    </a>
    <button type="submit"
      rel="tooltip"
      data-container="body"
      data-original-title="${donetip}"
      class="btn btn-success">
      <i class="glyphicon glyphicon-ok icon-white"></i> ${_('Mark task as done')}
    </button>
  </form>
% endif
