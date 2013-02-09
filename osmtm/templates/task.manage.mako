<%inherit file="/base.mako"/>
<%def name="id()">task_manage</%def>
<%def name="title()">Manage Tasks</%def>

<div class="container">
    <div class="page-header">
        <h3>
            ${map.title}
            <small>Manage Tasks</small>
        </h3>
    </div>
    <div class="row">
        <ul>
        % for task in tasks:
            ${item(task)}
        % endfor
        </ul>
        <a href="${request.route_url('task_new', map=map.id)}" class="btn">+ Add a task</a>
    </div>
</div>

<%def name="item(task)">
    <li class="task">
        ${task.short_description}
    </li>
</%def>
