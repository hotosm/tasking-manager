<p class="status">
% if task.locked:
  <span><i class="icon-lock" title="${_('Locked')}"></i></span>
% endif
% if task.state == task.state_done:
  <span><i class="icon-ok" title="${_('Done')}"></i></span>
% elif task.state == task.state_invalidated:
  <span><i class="icon-thumbs-down" title="${_('Invalidated')}"></i></span>
% endif
</p>
