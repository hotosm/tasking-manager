<div class="text-center">
% if  locked_task is not None:
  % if locked_task != task:
    <%include file="task.current_locked.mako" />
  % endif
% else:
    <a id="lock" href="${request.route_path('task_lock', task=task.id, project=task.project_id)}"
       rel="tooltip"
       data-original-title="${_('Lock this task to tell others that you are currently working on it.')}"
       data-container="body"
       class="btn btn-success">
       % if task.state == task.state_ready or task.state == task.state_invalidated:
         <i class="glyphicon glyphicon-share-alt"></i>&nbsp;
         ${_('Start mapping')}
       % elif task.state == task.state_done:
         <i class="glyphicon glyphicon-thumbs-up"></i>&nbsp;
         <i class="glyphicon glyphicon-thumbs-down"></i>&nbsp;
         ${_('Review the work')}
       % endif
    </a>
% endif
</div>
