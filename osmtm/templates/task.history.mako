# -*- coding: utf-8 -*-
<%
from osmtm.models import (
    TaskState,
    TaskLock,
    TaskComment,
)
from osmtm.mako_filters import (
    convert_mentions,
    markdown_filter,
)
%>
<%page args="section='task'"/>
% for index, step in enumerate(history):
    <%
    first = "first" if index == 0 else ""
    last = "last" if index == len(history) - 1 else ""

    unknown = '<span class="text-danger">Unknown</span>'
    task_link = '<a href="#task/' + str(step.task_id) + '">#' + str(step.task_id) + '</a>'

    contributor = None
    if hasattr(step, 'user') and step.user is not None:
      contributor = step.user.username
    elif hasattr(step, 'author') and step.author is not None:
      contributor = step.author.username
    if contributor is not None:
      user_link = '<a href="/user/' + contributor + '">' + contributor + '</a>'
    else:
      user_link = 'unknown'
    %>

    <div class="history ${first} ${last}">
    % if section == 'project':
      % if isinstance(step, TaskState):
        % if step.state == step.state_done:
          <span><i class="glyphicon glyphicon-ok text-success"></i> 
          ${_('${user} marked ${tasklink} as <b>done</b>', mapping={'user':user_link, 'tasklink':task_link}) | n}</span>
        % elif step.state == step.state_invalidated:
          <span><i class="glyphicon glyphicon-thumbs-down text-danger"></i> 
          ${_('${user} <b>invalidated</b> ${tasklink}', mapping={'user':user_link, 'tasklink':task_link}) | n}</span>
        % elif step.state == step.state_validated:
          <span><i class="glyphicon glyphicon-thumbs-up text-success"></i> 
          ${_('${user} <b>validated</b> ${tasklink}', mapping={'user':user_link, 'tasklink':task_link}) | n}</span>
        % endif
      % endif
    % else:
      % if isinstance(step, TaskState):
        % if step.state == step.state_done:
          <span><i class="glyphicon glyphicon-ok text-success"></i> <b>${_('Marked as done')}</b> ${_('by')} ${user_link | n}</span>
        % elif step.state == step.state_invalidated:
          <span><i class="glyphicon glyphicon-thumbs-down text-danger"></i> <b>${_('Invalidated')}</b> ${_('by')} ${user_link | n}</span>
        % elif step.state == step.state_validated:
          <span><i class="glyphicon glyphicon-thumbs-up text-success"></i> <b>${_('Validated')}</b> ${_('by')} ${user_link | n}</span>
        % endif
      % elif isinstance(step, TaskLock):
        % if step.lock:
          <span><i class="glyphicon glyphicon-lock text-muted"></i> ${_('Locked')} ${_('by')} ${user_link | n}</span>
        % else:
          <span>${_('Unlocked')}</span>
        % endif
      % elif isinstance(step, TaskComment):
        <span><i class="glyphicon glyphicon-comment text-muted"></i> ${_('Comment left')} ${_('by')} ${user_link | n}</span>
        <blockquote>
          ${step.comment | convert_mentions(request), markdown_filter, n}
        </blockquote>
      % endif
    % endif

    <p class="text-muted">
      <em title="${step.date}Z" class="timeago"></em>
    </p>
    </div>
% endfor

% if len(history) == 0:
<div>${_('Nothing has happened yet.')}</div>
% endif

<script>$('.timeago').timeago()</script>
