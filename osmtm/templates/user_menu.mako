<%page />
<%
  unread = user.unread_messages
%>
<li class="dropdown"><a href="#" data-toggle="dropdown" class="dropdown-toggle">
  ${user.username}
  ${unread_badge(unread)}
  <b class="caret"></b></a>
  <ul role="menu" class="dropdown-menu">
    <li><a href="${request.route_path('user', username=user.username)}">${_('Your page')}</a></li>
    <li>
      <a href="${request.route_path('user_messages')}">${_('Messages')}
      ${unread_badge(unread)}
      </a>
    </li>
    <li><a href="${request.route_path('logout')}">${_('logout')}</a></li>
    <li class="divider"></li>
    <li>
      <a href="${request.route_path('users')}">Users list</a>
    </li>
    % if user.is_admin:
    <li>
      <a href="${request.route_path('licenses')}">Manage licenses</a>
    </li>
    % endif
    % if user.is_admin or user.is_project_manager:
    <li>
      <a href="${request.route_path('project_new')}">Create a new project</a>
    </li>
    % endif
  </ul>
</li>

<%def name="unread_badge(unread)">
  % if len(unread) > 0:
  <span class="badge">${len(unread)}</span>
  % endif
</%def>
