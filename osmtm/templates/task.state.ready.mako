## works for ready or invalidated tasks
% if user and task.user == user:
  <form action="${request.route_path('task_done', task=task.id, project=task.project_id)}" method="POST">
    <%include file="task.comment.mako" />
    <a id="unlock"
       class="btn btn-default"
       href="${request.route_path('task_unlock', task=task.id, project=task.project_id)}">
        ${_('Unlock')}
    </a>
    <button type="submit" class="btn btn-success"><i class="glyphicon glyphicon-ok icon-white"></i> ${_('Mark task as done')}</button>
  </form>
% endif
