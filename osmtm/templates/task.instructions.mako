% if task.cur_lock and task.cur_lock.lock and task.project.per_task_instructions:
<hr>
<h4>${_('Extra Instructions')}</h4>
<%
  from osmtm.mako_filters import markdown_filter
  content = task.project.per_task_instructions
  if task.x and task.y and task.zoom:
    content = content.replace('{x}', str(task.x)) \
                     .replace('{y}', str(task.y)) \
                     .replace('{z}', str(task.zoom))
%>
  <p>${content | markdown_filter, n}</p>
% endif
