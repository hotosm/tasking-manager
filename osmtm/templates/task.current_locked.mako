<%
link = '<a href="#task/%s">%s</a>' % (locked_task.id, _('a task'))
text = _("You already have ${task_link} locked.", mapping={'task_link': link})
%>
  <p>&nbsp;${text|n}</span>
