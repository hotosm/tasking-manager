<script>
  if (typeof countdownInterval != 'undefined') {
    clearInterval(countdownInterval);
  }
</script>
% if locked_task is not None:
  <div class="text-center">
  <%include file="task.current_locked.mako" />
  </div>
% elif user and len(assigned_tasks) > 0:
  <%include file="project.assigned_tasks.mako" />
% else:
  <div class="text-center">
  <p>
    ${_("Select a task on the map")}
  </p>
  <br/>
  <p>
    <img src="${request.static_url('osmtm:static/img/choose_on_map.png')}">
  </p>
    ${_('or')}
  </p>
  <br/>
  <p>
    <a id="random" href="${request.route_path('task_random', project=project_id)}"
       class="btn btn-default">
       ${_('Take a task at random')}
    </a>
  </p>
  </div>
% endif

% if user and (user.is_project_manager or user.is_admin):
<hr />
<div class="text-center">
  <div class="form-group">
    <textarea id="project_invalidate_comment" name="invalidate_all_comment" class="form-control" placeholder="${_('Leave a comment')}" rows="2"></textarea>

  </div>
  <a class="btn btn-danger btn-lg btn-invalidate-all">
     <span class="glyphicon glyphicon-share-alt"></span>&nbsp;
     ${_('Invalidate all done tasks')}
  </a>
</div>
% endif
