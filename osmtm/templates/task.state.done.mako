% if user and task.user == user:
<%
tooltip = _("Invalidate this task if you consider it needs more work.")
%>
<form action="${request.route_url('task_invalidate', task=task.id, project=task.project_id)}" method="POST" class="form-horizontal" role="form">
  <button type="submit" rel="tooltip" data-original-title="${tooltip}" class="btn btn-danger btn-sm"><i class="glyphicon glyphicon-thumbs-down icon-white"></i> ${_('Invalidate')}</button>
  <div id="commentModal" class="modal fade" tabindex="-1" role="dialog" aria-labelledby="commentModalLabel" aria-hidden="true">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h3 id="commentModalLabel" class="modal-title">Comment?</h3>
        </div>
        <div class="modal-body">
          <p>
          ${_('Please tell why you marked this task as invalid so that the user can eventually correct his mistakes if any.')}
          </p>
          <div class="form-group">
            <textarea id="task_comment" name="comment" class="col-md-12 form-control" placeholder="${_('Your comment here')}"></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <a id="commentModalCancelBtn" data-dismiss="modal" class="btn btn-default" aria-hidden="true" >${_('Cancel')}</a>
          <a id="commentModalCloseBtn" class="btn btn-primary disabled" aria-hidden="true" >${_('OK')}</a>
        </div>
      </div><!-- /.modal-content -->
    </div><!-- /.modal-dialog -->
  </div><!-- /.modal -->
</form>
% endif
