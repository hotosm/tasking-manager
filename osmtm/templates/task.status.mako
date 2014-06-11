<%
from osmtm.models import TaskState
%>
<p class="status">
% if task.cur_lock and task.cur_lock.lock:
  <span><i class="glyphicon glyphicon-lock" title="${_('Locked')}"></i></span>
% endif
% if task.cur_state:
  % if task.cur_state.state == TaskState.state_done:
    <span><i class="glyphicon glyphicon-ok" title="${_('Done')}"></i></span>
  % elif task.cur_state.state == TaskState.state_invalidated:
    <span><i class="glyphicon glyphicon-thumbs-down" title="${_('Invalidated')}"></i></span>
  % elif task.cur_state.state == TaskState.state_validated:
    <span><i class="glyphicon glyphicon-thumbs-up" title="${_('Validated')}"></i></span>
  % endif
% else:
  <span><i class="glyphicon"></i></span>
% endif
</p>
