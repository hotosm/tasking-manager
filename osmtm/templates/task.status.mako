% if task.state == 1:
  <p>
    <span><i class="icon-lock"></i> <b>${_('Locked')}</b></span>
  </p>
% elif task.state == 2:
  <p>
    <span><i class="icon-ok"></i> <b>${_('Done')}</b></span>
  </p>
% endif
