% if task.assigned_to:
<%
username = _('you') if task.assigned_to == user else task.assigned_to.username
username = '<strong>%s</strong>' % username
assigned_text = _('Assigned to ${username}', mapping={'username': username})
%>
<p class="small">
<em class="text-muted">
  <i class="glyphicon glyphicon-user"></i>
  ${assigned_text|n}.
</em>
</p>
% endif
