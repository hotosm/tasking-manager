% if task.cur_lock and task.cur_lock.lock and task.project.per_task_instructions:
<hr>
<h4>${_('Extra Instructions')}</h4>
<%
  from osmtm.mako_filters import markdown_filter
  content = task.get_extra_instructions()
%>
  <p>${content | markdown_filter, n}</p>
% endif
