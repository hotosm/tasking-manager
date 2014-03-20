<%
username = _('you') if task.user == user else task.user.username
username = '<strong>%s</strong>' % username
locked_text = _('Task locked by ${username}', mapping={'username': username})
%>
<p>${locked_text|n}.&nbsp;
  % if  task.user == user:
  <a id="unlock"
     href="${request.route_url('task_unlock', task=task.id, project=task.project_id)}">
      ${_('Unlock')}
  </a>
  % endif
</p>
<p>
% if user:
  <%include file="task.editors.mako" />
% endif
</p>
% if  task.user == user:
  <form action="${request.route_url('task_done', task=task.id, project=task.project_id)}" method="POST" class="form-horizontal">
    <p>
    <button type="submit" class="btn btn-success btn-small"><i class="icon-ok icon-white"></i> ${_('Mark task as done')}</button>
    </p>
  </form>
% endif
% if user:
  <%include file="task.split.mako" />
% endif
