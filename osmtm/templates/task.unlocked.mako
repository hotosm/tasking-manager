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
<%
link = '<a href="#task/%s">%s</a>' % (locked_task.id, _('a task'))
text = _("You already have ${task_link} locked.", mapping={'task_link': link})
%>
  <span>&nbsp;${text|n}</span>
  % endif
</p>
<p>
  <a id="lock" href="${request.route_path('task_lock', task=task.id, project=task.project_id)}"
     rel="tooltip" data-original-title="${tooltip}"
     data-container="body"
     class="btn btn-success ${disabled}">
     <i class="glyphicon glyphicon-lock icon-white"></i> ${_('Yes, I want to work on this task')}
  </a>
</p>
% endif
