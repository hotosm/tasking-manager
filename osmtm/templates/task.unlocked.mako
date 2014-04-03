<%
disabled = ""
tooltip = ""
if locked_task is not None:
  disabled = "disabled"
  tooltip = _("You cannot lock more than one task at a time.")
else:
  tooltip = _("Lock this task to tell others that you are currently working on it.")
%>
% if locked_task != task:
<p>
  % if  locked_task is not None:
  <%include file="task.current_locked.mako" />
  % endif
</p>
<p>
  <a id="lock" href="${request.route_path('task_lock', task=task.id, project=task.project_id)}"
     rel="tooltip" data-original-title="${tooltip}"
     data-container="body"
     class="btn btn-success ${disabled}">
     % if task.state == task.state_ready:
       <i class="glyphicon glyphicon-share-alt"></i>&nbsp;
       ${_('Start mapping')}
     % elif task.state == task.state_done:
       <i class="glyphicon glyphicon-thumbs-up"></i>&nbsp;
       <i class="glyphicon glyphicon-thumbs-down"></i>&nbsp;
       ${_('Review the work')}
     % endif
  </a>
</p>
% endif
