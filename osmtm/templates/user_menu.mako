<%page />
<li class="dropdown">
  <a class="username" href="#" data-toggle="dropdown" class="dropdown-toggle">
    ${user.username}
    <span class="unread badge"></span>
    <b class="caret"></b>
  </a>
  <ul role="menu" class="dropdown-menu">
    <li><a href="${request.route_path('user', username=user.username)}">${_('Your page')}</a></li>
    <li>
      <a href="${request.route_path('user_messages')}">${_('Messages')}
        <span class="unread badge"></span>
      </a>
    </li>
    <li><a href="${request.route_path('logout')}">${_('logout')}</a></li>
    <li class="divider"></li>
    <li>
      <a href="${request.route_path('users')}">${_('Users list')}</a>
    </li>
    % if user.is_admin:
    <li>
      <a href="${request.route_path('licenses')}">${_('Manage licenses')}</a>
    </li>
    % endif
    % if user.is_admin or user.is_project_manager:
    <li>
      <a href="${request.route_path('project_new')}">${_('Create a new project')}</a>
    </li>
    % endif
  </ul>
</li>

<script>
  // automaticaly checks for new unread messages
  checkForMessages();
</script>
