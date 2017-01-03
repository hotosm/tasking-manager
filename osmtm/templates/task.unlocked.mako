<%
from osmtm.models import TaskState
%>
<div class="text-center">
% if  locked_task is not None:
  % if locked_task != task:
    <%include file="task.current_locked.mako" />
  % endif
% elif not task.assigned_to or task.assigned_to == user:
  % if task.cur_state.state == TaskState.state_ready or task.cur_state.state == TaskState.state_invalidated:
    <p>
    <a id="lock" href="${request.route_path('task_lock', task=task.id, project=task.project_id)}"
       rel="tooltip"
       data-original-title="${_('Lock this task to tell others that you are currently working on it.')}"
       data-container="body"
       class="btn btn-success">
         <i class="glyphicon glyphicon-share-alt"></i>&nbsp;
         ${_('Start mapping')}
    </a>
    </p>
  % elif (task.cur_state.state == TaskState.state_done or task.cur_state.state == TaskState.state_validated):
    % if user == task.states[0].user:
    <form action="${request.route_path('task_cancel_done', task=task.id, project=task.project_id)}" method="POST" role="form">
    ${_('Marked as done by mistake?')}
    <button type="submit"
            data-container="body"
            class="btn btn-default">
      <i class="glyphicon glyphicon-repeat flip-horizontal"></i> ${_('Undo')}
    </button>
    </form>
    <hr>
    % endif
    % if user and user.is_validator:
    <p>
    <a id="lock" href="${request.route_path('task_lock', task=task.id, project=task.project_id)}"
       rel="tooltip"
       data-original-title="${_('Lock this task to tell others that you are currently reviewing it. Validate that this task has been mapped correctly and completely.')}"
       data-container="body"
       class="btn btn-success">
         <i class="glyphicon glyphicon-thumbs-up"></i>&nbsp;
         <i class="glyphicon glyphicon-thumbs-down"></i>&nbsp;
         ${_('Review the work')}
    </a>
    </p>
    % endif
  % endif
% endif
</div>
<p></p>
