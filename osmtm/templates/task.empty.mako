<div class="text-center">
  <p>
    ${_("Select a task on the map")}
  </p>
  <br/>
  <p>
    <img src="${request.static_url('osmtm:static/img/arrow_left.png')}">
  </p>
    ${_('or')}
  </p>
  <br/>
  <p>
    <a id="random" href="${request.route_url('task_random', project=project.id)}"
       class="btn btn-small">
       ${_('take a task at random')}
    </a>
  </p>
</div>
