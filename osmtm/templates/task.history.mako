# -*- coding: utf-8 -*-
<%page args="section='task'"/>
% for index, step in enumerate(history):
    <%
    first = "first" if index == 0 else ""
    last = "last" if index == len(history) - 1 else ""

    unknown = '<span class="text-danger">Unknown</span>'
    %>

    <div class="history ${first} ${last}">
    % if section == 'project':
      <a href="#task/${step.task_id}">#${step.task_id}</a>
    % endif
    % if step.state == step.state_done:
    <span><i class="glyphicon glyphicon-ok text-success"></i> <b>${_('Marked as done')}</b> ${_('by')} ${step.user.username if step.user is not None else unknown | n}</span>
    % elif step.state == step.state_invalidated:
    <span><i class="glyphicon glyphicon-thumbs-down text-danger"></i> <b>${_('Invalidated')}</b> ${_('by')} ${step.user.username if step.user is not None else unknown | n}</span>
    % elif step.state == step.state_validated:
    <span><i class="glyphicon glyphicon-thumbs-up text-success"></i> <b>${_('Validated')}</b> ${_('by')} ${step.user.username if step.user is not None else unknown | n}</span>
    % endif

      <p class="text-muted">
        <em title="${step.date}Z" class="timeago"></em>
      </p>
    </div>
% endfor

% if len(history) == 0:
<div>${_('Nothing has happened yet.')}</div>
% endif

<script>$('.timeago').timeago()

</script>
