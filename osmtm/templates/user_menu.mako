<%page args="user" />
<li class="dropdown"><a href="#" data-toggle="dropdown" class="dropdown-toggle">${user.username}<b class="caret"></b></a>
  <ul role="menu" class="dropdown-menu">
    <li><a href="${request.route_path('logout')}">${_('logout')}</a></li>
    % if user.is_admin():
    <li class="divider"></li>
    <li>
      <a href="${request.route_path('users')}">Users list</a>
    </li>
    <li>
      <a href="${request.route_path('licenses')}">Manage licenses</a>
    </li>
    <li>
      <a href="${request.route_path('project_new')}">Create a new project</a>
    </li>
    % endif
  </ul>
</li>
