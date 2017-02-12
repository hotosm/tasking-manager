<%
from osmtm.models import TaskState
from osmtm.mako_filters import (
    markdown_filter,
)

requires_experience = user is not None and task.project.requires_experienced_mapper_role and not (user.is_experienced_mapper or user.is_admin or user.is_project_manager)

if user is not None:
  user_link = request.route_url('user',username=user.username)
else:
  user_link = ''

author = task.project.author.username if task.project.author else ''

%>
<div>
% if  locked_task is not None:
  % if locked_task != task:
    <%include file="task.current_locked.mako" />
  % endif
% elif not task.assigned_to or task.assigned_to == user:
  % if requires_experience:
    <%
      link = 'http://www.openstreetmap.org/message/new/%s?message[title]=%s&message[body]=%s' % (
        author,
        _("Privileges for project {project} in the tasking manager").format(project='%23' + str(task.project_id)),
        _("I would like to be granted as experienced mapper.") + "%0D%0A%0D%0A[{0}]({1})".format(
            _("Link to my profile page"),
            user_link)
      )
    %>
    <p>
      ${_('You need to be an **experienced mapper** to contribute to this project.')|markdown_filter}
      ${_("You think you are an **experienced mapper**? Click [this link](${link}) to send a message to the author to ask him for permissions to work on this project.",
        mapping={'link': link})| markdown_filter, n}
    </p>
    <hr>
  % endif
  % if task.cur_state.state == TaskState.state_ready or task.cur_state.state == TaskState.state_invalidated:
    <p class="text-center">
    <a id="lock" href="${request.route_path('task_lock', task=task.id, project=task.project_id)}"
       rel="tooltip"
       data-original-title="${_('Lock this task to tell others that you are currently working on it.')}"
       data-container="body"
       class="btn btn-success ${'disabled' if requires_experience else ''}">
         <i class="glyphicon glyphicon-share-alt"></i>&nbsp;
         ${_('Start mapping')}
    </a>
    </p>
  % elif (task.cur_state.state == TaskState.state_done or task.cur_state.state == TaskState.state_validated):
    % if user == task.states[0].user:
    <form action="${request.route_path('task_cancel_done', task=task.id, project=task.project_id)}" method="POST" role="form" class-"text-center">
    ${_('Marked as done by mistake?')}
    <button type="submit"
            data-container="body"
            class="btn btn-default">
      <i class="glyphicon glyphicon-repeat flip-horizontal"></i> ${_('Undo')}
    </button>
    </form>
    <hr>
    % endif
    % if user and (not task.project.requires_validator_role or user.is_validator):
    <p class="text-center">
    <a id="lock" href="${request.route_path('task_lock', task=task.id, project=task.project_id)}"
       rel="tooltip"
       data-original-title="${_('Lock this task to tell others that you are currently reviewing it. Validate that this task has been mapped correctly and completely.')}"
       data-container="body"
       class="btn btn-success ${'disabled' if requires_experience else ''}">
         <i class="glyphicon glyphicon-thumbs-up"></i>&nbsp;
         <i class="glyphicon glyphicon-thumbs-down"></i>&nbsp;
         ${_('Review the work')}
    </a>
    </p>
    % endif
  % endif
% endif
</div>
<p></p>
