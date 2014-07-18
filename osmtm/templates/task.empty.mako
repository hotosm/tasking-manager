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
