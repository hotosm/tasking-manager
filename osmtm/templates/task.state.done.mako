% if user and task.user == user:
<%
tooltip = _("Invalidate this task if you consider it needs more work.")
%>
<form action="${request.route_url('task_invalidate', task=task.id, project=task.project_id)}" method="POST" class="form-horizontal">
  <button type="submit" rel="tooltip" data-original-title="${tooltip}" class="btn btn-danger btn-small"><i class="icon-thumbs-down icon-white"></i> ${_('Invalidate')}</button>
  <div id="commentModal" class="modal hide fade" tabindex="-1" role="dialog" aria-labelledby="commentModalLabel" aria-hidden="true">
    <div class="modal-header">
      <h3 id="commentModalLabel">Comment?
      </h3>
      ${_('Please tell why you marked this task as invalid so that the user can eventually correct his mistakes if any.')}
    </div>
    <div class="modal-body">
      <textarea id="task_comment" name="comment" class="span12" placeholder="${_('Your comment here')}"></textarea>
    </div>
    <div class="modal-footer">
      <a id="commentModalCancelBtn" data-dismiss="modal" class="btn" aria-hidden="true" >${_('Cancel')}</a>
      <a id="commentModalCloseBtn" class="btn btn-primary disabled" aria-hidden="true" >${_('OK')}</a>
    </div>
  </div>
</form>
% endif
