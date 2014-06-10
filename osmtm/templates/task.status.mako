<%
from osmtm.models import TaskState
%>
<p class="status">
% if task.lock and task.lock.lock:
  <span><i class="glyphicon glyphicon-lock" title="${_('Locked')}"></i></span>
% endif
% if task.state == TaskState.state_done:
  <span><i class="glyphicon glyphicon-ok" title="${_('Done')}"></i></span>
% elif task.state == TaskState.state_invalidated:
  <span><i class="glyphicon glyphicon-thumbs-down" title="${_('Invalidated')}"></i></span>
% elif task.state == TaskState.state_validated:
  <span><i class="glyphicon glyphicon-thumbs-up" title="${_('Validated')}"></i></span>
% else:
  <span><i class="glyphicon"></i></span>
% endif
</p>
