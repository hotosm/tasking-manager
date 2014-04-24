% if user:
<hr />
<form action="${request.route_path('task_comment', task=task.id, project=task.project_id)}" method="POST" role="form">
  <div class="form-group">
    <textarea id="task_freecomment" name="comment" class="form-control" placeholder="${_('Leave a comment')}" rows="2"></textarea>
  </div>
  <button class="btn btn-default btn-sm pull-right">${_('Comment')}</button>
</form>
<div class="clear">
% endif
