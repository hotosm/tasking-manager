% if user and task.cur_lock and task.cur_lock.user == user:
<%
from osmtm.models import TaskState
tooltip = _("Invalidate this task if you consider it needs more work.")
done = task.cur_state and task.cur_state.state == TaskState.state_done
%>
  <form action="${request.route_path('task_validate', task=task.id, project=task.project_id)}" method="POST" role="form">
    <%include file="task.comment.mako" />
    <a id="unlock"
       class="btn btn-default"
       href="${request.route_path('task_unlock', task=task.id, project=task.project_id)}">
        ${_('Unlock')}
    </a>
    <button type="submit" rel="tooltip" data-original-title="${tooltip}"
            name="invalidate"
            data-container="body"
            class="btn btn-danger">
      <i class="glyphicon glyphicon-thumbs-down icon-white"></i> ${_('Invalidate')}
    </button>
    % if done:
<%
tooltip = _("Validate this task if you consider that the work is complete.")
%>
      % if user == task.states[0].user and not user.is_project_manager:
<%
selfvalidatestate = """ type="button" disabled """
selfvalidatetext = _("You cannot validate a task that you have personally marked as done.")
selfvalidatediv = """<div id="self_validation" class="help-block small text-right">
        <em><i class="glyphicon glyphicon-warning-sign"></i>""" + \
        selfvalidatetext + """</em></div>"""
%>
      % else:
<%
selfvalidatestate = """ type="submit" """
selfvalidatediv = """"""
%>
      % endif
      <button rel="tooltip"
              name="validate"
              data-container="body"
              data-original-title="${tooltip}"
              class="btn btn-success" ${selfvalidatestate | n }>
        <i class="glyphicon glyphicon-thumbs-up icon-white"></i> ${_('Validate')}
      </button>
      ${selfvalidatediv | n}
    % endif
  </form>
% endif
