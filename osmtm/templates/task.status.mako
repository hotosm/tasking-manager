<p>
% if task.locked:
  <span><i class="icon-lock"></i> <b>${_('Locked')}</b></span>
% endif
% if task.state == task.state_done:
  <span><i class="icon-ok"></i> <b>${_('Done')}</b></span>
% elif task.state == task.state_invalidated:
  <span><i class="icon-thumbs-down"></i> <b>${_('Invalidated')}</b></span>
% endif
</p>
