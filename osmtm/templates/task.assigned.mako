<script type="text/javascript">
  var assigned_to = "${task.assigned_to.username if task.assigned_to else ''}";
</script>
% if user and (user.is_project_manager or user.is_admin):
  <div>
    ${assigned_to_container()}
    % if not task.cur_lock or not task.cur_lock.lock:
    <a class="btn btn-xs"
      id="assign_to">
      <i class="glyphicon glyphicon-cog"></i>
    </a>
    % endif
  </div>
  <script type="text/javascript" src="${request.static_url('osmtm:static/js/task.assign.js', _query={'v':'2.4.0'})}"></script>
  <div id="assign_to_selector" class="panel panel-default hide">
    <div class="panel-heading small">
      <strong>
        ${_('Assign task to someone')}
      </strong>
    </div>
    <div class="panel-body">
      <form>
        <div class="form-group">
          <input type="text" id="user_filter"
          placeholder="${_('Filter users')}" class="form-control">
        </div>
      </form>
      <ul id="assign_users" class="list-unstyled"></ul>
    </div>
  </div>
% elif task.assigned_to:
  <div>
    ${assigned_to_container()}
  </div>
% endif

<%def name="assigned_to_container()">
  <em class="">
    % if task.assigned_to:
      <i class="glyphicon glyphicon-user"></i>
      <%
        username = _('you') if task.assigned_to == user else task.assigned_to.username
        username = '<strong>%s</strong>' % username
        assigned_text = _('Assigned to ${username}', mapping={'username': username})
      %>
      ${assigned_text|n}
    % else:
      ${_('Not assigned yet')}
    % endif
  </em>
</%def>
