# -*- coding: utf-8 -*-
<%! from pyjade.runtime import attrs as __pyjade_attrs, iteration as __pyjade_iter %><hr />
<h4>History</h4>
\
% for step,index in __pyjade_iter(history,2):
<%
first = "first" if index == 0 else ""
last = "last" if index == len(history) - 1 else ""
%>

<div class="history ${first} ${last}">\
% if  step.state == 1:
<span><i class="icon-lock"></i> <b>Locked</b> by ${step.user.username}</span>\
% elif  step.state == 2:
<span><i class="icon-ok"></i> <b>Marked as done</b> by ${step.prev_user.username}</span>\
% elif  step.state == 0 and step.old_state == 2:
<span><i class="icon-thumbs-down"></i> <b>Invalidated</b> by ${step.user.username}</span>\
% else:
<span>Unlocked</span>\
% endif

  <p class="muted"><em title="${step.update}" class="timeago"></em>
  </p>
</div>\
% endfor
\
% if  len(history) == 0:

<div>Nothing has happen yet.</div>\
% endif

<script>$('.timeago').timeago()

</script>