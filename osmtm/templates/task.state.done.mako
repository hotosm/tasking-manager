% if user and task.user == user:
<%
tooltip = _("Invalidate this task if you consider it needs more work.")
done = task.state == task.state_done
%>
<div class="row">
  <div class="${'col-md-6' if done else '12'}">
    <form action="${request.route_path('task_invalidate', task=task.id, project=task.project_id)}" method="POST" class="form-horizontal" role="form">
      <button type="submit" rel="tooltip" data-original-title="${tooltip}"
              data-container="body"
              class="btn btn-danger">
        <i class="glyphicon glyphicon-thumbs-down icon-white"></i> ${_('Invalidate')}
      </button>
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
  </div>
  % if done:
<%
tooltip = _("Validate this task if you consider that the work is complete.")
%>
  <div class="col-md-6">
    <form action="${request.route_path('task_validate', task=task.id, project=task.project_id)}"
          method="POST" class="form-horizontal" role="form">
      <button type="submit" rel="tooltip"
              data-container="body"
              data-original-title="${tooltip}"
              class="btn btn-success">
        <i class="glyphicon glyphicon-thumbs-up icon-white"></i> ${_('Validate')}
      </button>
    </form>
  </div>
  % endif
</div>
% endif
