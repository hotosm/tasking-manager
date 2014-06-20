% if (user.is_project_manager or user.is_admin) and task.assigned_to == None:
<a class="btn btn-default btn-xs"
   id="assign_to"
   data-toggle="popover" data-container="body"
   data-placement="bottom"
   data-html="true">
  Assign to <i class="glyphicon glyphicon-user"></i>
</a>
<script>
  $('#assign_to').popover({
    content: function() {
      return $('#popover-content').html();
    }
  });
</script>
<div id="popover-content" class="hide">
  <form>
    <div class="form-group">
      <input type="text" placeholder="Filter users" class="form-control">
    </div>
  </form>
</div>
% endif

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
