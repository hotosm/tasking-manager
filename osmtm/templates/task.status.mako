<p class="status">
% if task.locked:
  <span><i class="glyphicon glyphicon-lock" title="${_('Locked')}"></i></span>
% endif
% if task.state == task.state_done:
  <span><i class="glyphicon glyphicon-ok" title="${_('Done')}"></i></span>
% elif task.state == task.state_invalidated:
  <span><i class="glyphicon glyphicon-thumbs-down" title="${_('Invalidated')}"></i></span>
% elif task.state == task.state_validated:
  <span><i class="glyphicon glyphicon-thumbs-up" title="${_('Validated')}"></i></span>
% else:
  <span><i class="glyphicon"></i></span>
% endif
</p>
