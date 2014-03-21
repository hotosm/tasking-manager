% if task.locked:
<%
username = _('you') if task.user == user else task.user.username
username = '<strong>%s</strong>' % username
locked_text = _('Task locked by ${username}', mapping={'username': username})
%>
<p>${locked_text|n}.&nbsp;
  % if user and task.user == user:
  <a id="unlock"
     href="${request.route_url('task_unlock', task=task.id, project=task.project_id)}">
      ${_('Unlock')}
  </a>
  % endif
</p>
% endif

% if user and task.user == user:
<p>
  <%include file="task.editors.mako" />
</p>
% endif
