% if user and (user.is_project_manager or user.is_admin):
  <p>
    ${assigned_to_container()}
    <a class="btn text-muted btn-xs"
      id="assign_to">
      <i class="glyphicon glyphicon-cog"></i>
    </a>
  </p>
  <script type="text/javascript" src="${request.static_url('osmtm:static/js/task.assign.js')}"></script>
  <div id="assign_to_selector" class="panel panel-default hide">
    <div class="panel-heading small">
      <strong>
        Assign task to someone
      </strong>
    </div>
    <div class="panel-body">
      <form>
        <div class="form-group">
          <input type="text" id="user_filter"
                 placeholder="Filter users" class="form-control">
        </div>
      </form>
      <ul id="assign_users" class="list-unstyled"></ul>
    </div>
  </div>
% elif task.assigned_to:
  <p>
    ${assigned_to_container()}
  </p>
% endif

<%def name="assigned_to_container()">
  <em class="text-muted small">
    <i class="glyphicon glyphicon-user"></i>
    % if task.assigned_to:
      ${assigned_to()}
    % else:
      Not assigned yet
    % endif
  </em>
</%def>
<%def name="assigned_to()">
  <%
    username = _('you') if task.assigned_to == user else task.assigned_to.username
    username = '<strong>%s</strong>' % username
    assigned_text = _('Assigned to ${username}', mapping={'username': username})
  %>
  ${assigned_text|n}
</%def>
