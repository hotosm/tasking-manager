# -*- coding: utf-8 -*-
<%inherit file="base.mako"/>
<%block name="header">
<a href="${request.route_path('home')}" class="navbar-brand"><i class="glyphicon glyphicon-home"></i></a>
<a class="navbar-brand">${_('User profile')}</a>
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
    <h3>User: ${contributor.username}</h3>
    <div class="col-md-12">
      % if user == contributor:
      <p>
        This is <b>You</b>!
      </p>
      % endif
      <p>
        <a href="http://www.openstreetmap.org/user/${contributor.username}" title="OSM User Profile">
          <img src="http://www.openstreetmap.org/favicon.ico" alt="[OSM]" /> OSM Profile</a>
      </p>
    </div>
  </div>
  <div class="row">
    <div class="col-md-12">
      <p>
      % if contributor.is_admin:
        <i class="glyphicon glyphicon-star user-admin"></i>
        ${_("This user is an administrator.")}
        % if user is not None and user.is_admin and user != contributor:
          <a href="${request.route_path('user_admin', id=contributor.id)}">Remove privileges</a>
        % endif
      % else:
        % if user is not None and user.is_admin:
          <i class="glyphicon glyphicon-star user-admin"></i>
          <a href="${request.route_path('user_admin', id=contributor.id)}">Set as administrator</a>
        % endif
      % endif
      </p>

      <p>
      % if not contributor.is_admin:
        % if contributor.is_project_manager:
          <i class="glyphicon glyphicon-star user-project-manager"></i>
          ${_("This user is a project manager.")}
          % if user is not None and user.is_admin and user != contributor:
            <a href="${request.route_path('user_project_manager', id=contributor.id)}">Remove privileges</a>
          % endif
        % else:
          % if user is not None and user.is_admin:
            <i class="glyphicon glyphicon-star user-project-manager"></i>
            <a href="${request.route_path('user_project_manager', id=contributor.id)}">Set as project manager</a>
          % endif
        % endif
      % endif
      </p>
    </div>
  </div>
  <div class="row">
    <div class="col-md-12">
      <h3>Projects</h3>
        % if projects:
        This user contributed to the following projects:
        <ul>
        % for p in projects:
          <li>
            <a href="${request.route_path('project', project=p["project"].id)}"
              title="Project Details">
              #${p['project'].id} ${p["project"].name}
            </a>
            (${p["count"]} tiles)
          </li>
        % endfor
        </ul>
        % else:
        User hasn't contributed yet.
      % endif
    </div>
  </div>
</div>
</%block>
