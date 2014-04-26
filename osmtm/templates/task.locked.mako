% if task.locked:
<%
username = _('you') if task.user == user else task.user.username
username = '<strong>%s</strong>' % username
locked_text = _('Task locked by ${username}', mapping={'username': username})
import datetime
from osmtm.models import EXPIRATION_DELTA
time_left = (task.update - (datetime.datetime.utcnow() - EXPIRATION_DELTA)).seconds
%>
<p>${locked_text|n}.&nbsp;
  % if user and task.user == user:
  <small><em id="task_countdown_text" rel="tooltip"
      data-original-title="${_('If you do not complete or release this task in time, it will be automatically unlocked')}"
      data-container="body"
      class="text-muted pull-right"><i class="glyphicon glyphicon-time" /> <span id="countdown">${time_left / 60}</span> ${_("min. left")}</em></small>
    <script>
      var task_time_left = ${time_left};
      var countdownInterval = setInterval(function(){
        $("#countdown").html(Math.floor(task_time_left / 60));
        if (task_time_left < 10 * 60) {
          $('#task_countdown_text').addClass('text-danger');
        }
        if (task_time_left < 0) {
          osmtm.project.loadTask(${task.id});
          clearInterval(countdownInterval);
        }
        task_time_left--;
      }, 1000);
    </script>
  % endif
</p>
% endif

% if user and task.user == user:
<p>
  <%include file="task.editors.mako" />
</p>
% endif
