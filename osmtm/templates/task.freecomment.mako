% if user and not task.locked:
<hr />
<form action="${request.route_path('task_comment', task=task.id, project=task.project_id)}" method="POST" role="form">
  <div class="form-group">
    <textarea id="task_freecomment" name="comment" class="form-control" placeholder="${_('Leave a comment')}" rows="2"></textarea>
  </div>
  <button id="task_freecomment_submit" class="btn btn-default btn-sm pull-right disabled">${_('Comment')}</button>
  <script>
    $('#task_freecomment').focus().on('keyup', function() {
      $('#task_freecomment_submit').toggleClass(
        'disabled',
        $(this).val() === ''
      );
    });
  </script>
</form>
<div class="clear">
% endif
