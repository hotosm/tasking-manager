% if user and (not task.cur_lock or not task.cur_lock.lock):
<hr />
<form action="${request.route_path('task_comment', task=task.id, project=task.project_id)}" method="POST" role="form">
  <div class="form-group">
    <textarea id="task_freecomment" name="comment" class="form-control" placeholder="${_('Leave a comment')}" rows="2"></textarea>
  </div>
  <div class="text-right">
    <button id="task_freecomment_submit" class="btn btn-default btn-sm disabled">${_('Comment')}</button>
  </div>
  <script>
    $('#task_freecomment').focus().on('keyup', function() {
      $('#task_freecomment_submit').toggleClass(
        'disabled',
        $(this).val() === ''
      );
    });
  </script>
</form>
% endif
