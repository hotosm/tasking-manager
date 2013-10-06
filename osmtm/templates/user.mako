# -*- coding: utf-8 -*-
<%inherit file="base.mako"/>
<%block name="header">
<a href="${request.route_url('home')}" class="brand"><i class="icon-home"></i></a>
<div class="brand">${contributor.username}</div>
</%block>
<%block name="content">
<%
# FIXME already done in base.mako
from pyramid.security import authenticated_userid
from osmtm.models import DBSession, User
username = authenticated_userid(request)
if username is not None:
   user = DBSession.query(User).get(username)
else:
   user = None
%>
<div class="container">
  <div class="row">
    <h3>${contributor.username}</h3>
    % if user == contributor:
    <h4>This is <b>You</b>!</h4>
    % endif
    <div class="span12">
      % if contributor.admin:
      ${_("This user is an administrator.")}<i class="icon-star"></i>
        % if user is not None and user.admin:
        <a href="${request.route_url('user_admin', id=contributor.id)}">Remove privileges.</a>
        % endif
      % else:
        % if user is not None and user.admin:
        <a href="${request.route_url('user_admin', id=contributor.id)}">Set as administrator.</a>
        % endif
      % endif
    </div>
  </div>
</div>
</%block>
