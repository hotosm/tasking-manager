# -*- coding: utf-8 -*-
<div>
<%
from osmtm.models import Task
if task.difficulty == task.difficulty_hard:
  style = 'danger'
  difficulty = _('Hard')
  tooltip = _('Difficulty: hard<br>Level: advanced')
elif task.difficulty == task.difficulty_medium:
  style = 'warning'
  difficulty = _('Medium')
  tooltip = _('Difficulty: medium<br>Level: intermediate')
elif task.difficulty == task.difficulty_easy:
  style = 'success'
  difficulty = _('Easy')
  tooltip = _('Difficulty: easy<br>Level: beginner')
else:
  style = ''
  difficulty = _('Difficulty')
  tooltip = _('No difficulty set yet')
endif
%>
% if task.difficulty is not None or \
  (user and (user.is_project_manager or user.is_admin)):
<em class="text-${style}"
    rel="tooltip"
    data-html="true"
    data-original-title="${tooltip}">
<span class="glyphicon glyphicon-bookmark"></span>
${difficulty}
</em>
% endif
% if user and (user.is_project_manager or user.is_admin):
<span class="dropdown">
  <a class="btn btn-xs"
    data-toggle="dropdown"
    data-target="#"
    id="difficulty-btn">
    <i class="glyphicon glyphicon-cog"></i>
  </a>
  <ul id="task_difficulty_dropdown" class="dropdown-menu" role="menu">
    <li class="small">
      <a href data-difficulty="0">
        <span class="text-muted">
          <span class="glyphicon glyphicon-bookmark"></span>
          ${_('Unknown difficulty')|n}
        </span>
      </a>
    </li>
    % for d in [(Task.difficulty_hard, _('Hard'), 'danger'), (Task.difficulty_medium, _('Medium'), 'warning'), (Task.difficulty_easy, _('Easy'), 'success')]:
    <li class="small">
      <a href data-difficulty="${d[0]}">
        <span class="text-${d[2]}">
          <span class="glyphicon glyphicon-bookmark"></span>
          ${d[1]}
        </span>
      </a>
    </li>
    % endfor
  </ul>
</span>
% endif
</div>
