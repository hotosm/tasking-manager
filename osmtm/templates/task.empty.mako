<div class="text-center">
% if  locked_task is not None:
  <%include file="task.current_locked.mako" />
% else:
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
    <a id="random" href="${request.route_path('task_random', project=project.id)}"
       class="btn btn-default">
       ${_('Take a task at random')}
    </a>
  </p>
% endif
</div>
