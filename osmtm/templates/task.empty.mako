<div>
  ${_("Select a task on the map")}
</div>
<img src="${request.static_url('osmtm:static/img/arrow_left.png')}">

<div>
    <a id="random" href="${request.route_url('task_random', project=project.id)}"
       class="btn btn-small btn-primary">
       ${_('Or take a task at random')}
    </a>
</div>
