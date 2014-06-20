<%
from osmtm.models import (
    TaskState,
)
%>
${_("You have tasks assigned:")}
<ul>
% for task in assigned_tasks:
  <li>
    <a href="#task/${task.id}">#${task.id}</a>
    % if task.cur_state:
      % if task.cur_state.state == TaskState.state_done:
      <i class="glyphicon glyphicon-ok text-success small"></i>
      % elif task.cur_state.state == TaskState.state_validated:
      <i class="glyphicon glyphicon-thumbs-up text-success small"></i>
      % elif task.cur_state.state == TaskState.state_invalidated:
      <i class="glyphicon glyphicon-thumbs-down text-danger small"></i>
      % endif
    % endif
  </li>
% endfor
</ul>
