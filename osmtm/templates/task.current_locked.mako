<%
link = '<a href="#task/%s">%s</a>' % (locked_task.id, _('a task'))
text = _("You already have ${task_link} locked.", mapping={'task_link': link})
%>
  <p>&nbsp;${text|n}</p>
  <p class="text-center">
  <a href="#task/${locked_task.id}"
       class="btn btn-default">
      <i class="glyphicon glyphicon-share-alt"></i>&nbsp;
      ${_('Select it again')}
    </a>
  </p>
