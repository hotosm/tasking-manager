# -*- coding: utf-8 -*-
<%page args="section='task'"/>
% for index, step in enumerate(history):
    <%
    first = "first" if index == 0 else ""
    last = "last" if index == len(history) - 1 else ""
    %>

    <div class="history ${first} ${last}">
    % if section == 'project':
      <a href="#task/${step.task_id}">#${step.task_id}</a>
    % endif
    % if  step.locked:
    <span><i class="glyphicon glyphicon-lock text-muted"></i> ${_('Locked')} ${_('by')} ${step.user.username}</span>
    % elif  step.state == step.state_done and step.state_changed:
    <span><i class="glyphicon glyphicon-ok text-success"></i> <b>${_('Marked as done')}</b> ${_('by')} ${step.user.username}</span>
    % elif  step.state == step.state_invalidated and step.state_changed:
    <span><i class="glyphicon glyphicon-thumbs-down text-danger"></i> <b>${_('Invalidated')}</b> ${_('by')} ${step.user.username}</span>
    % elif  step.state == step.state_validated and step.state_changed:
    <span><i class="glyphicon glyphicon-thumbs-up text-success"></i> <b>${_('Validated')}</b> ${_('by')} ${step.user.username}</span>
    % else:
    <span>${_('Unlocked')}</span>
    % endif

    % if step.comment:
    <blockquote>
      <span class="glyphicon glyphicon-comment"></span> ${step.comment.comment}
    </blockquote>
    % endif

      <p class="text-muted">
        <em title="${step.update}" class="timeago"></em>
      </p>
    </div>
% endfor

% if len(history) == 0:
<div>${_('Nothing has happened yet.')}</div>
% endif

<script>$('.timeago').timeago()

</script>
