# -*- coding: utf-8 -*-
<%inherit file="base.mako"/>
<%def name="title()">${_('User profile')} - ${contributor.username}</%def>
<%block name="header">
<h1>${_('User profile')}</h1>
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
    <h3>${_('User: ${username}', mapping={'username': contributor.username})}</h3>
    <div class="col-md-6">
      % if user == contributor:
      <p>
        ${_('This is <b>You</b>!')|n}
      </p>
      % endif
      <p>
        <a href="http://www.openstreetmap.org/user/${contributor.username}" title="${_('OSM User Profile')}">
          <img src="http://www.openstreetmap.org/favicon.ico" alt="[OSM]" />${_('OSM Profile')}</a>
      </p>
    </div>
    <div class="col-md-6">
    % if creation_date != 'null':
    <p>
       ${_('This user joined OSM ')} <span class="timeago" title="${creation_date}"></span>.
    </p>
    % endif
    </div>
  </div>
  <div class="row">
  <div class="col-md-6">
  <p>
    <a href="http://www.openstreetmap.org/user/${contributor.username}/history" title="${_('OSM User Changeset History')}">
      ${_('OSM Edit History')}</a>
  </p>
  </div>
  <div class="col-md-6">
  % if changeset_count != 'null':
  <p>
    ${_('This user has submitted ${changes} total changesets.', mapping={'changes':changeset_count})}
  </p>
  % endif
  </div>
  </div>
  <div class="row">
    <div class="col-md-12">
      <p>
      % if contributor.is_admin:
        <i class="glyphicon glyphicon-star user-admin"></i>
        ${_("This user is an administrator.")}
        % if user is not None and user.is_admin and user != contributor:
          <a href="${request.route_path('user_admin', id=contributor.id)}">${_('Remove privileges')}</a>
        % endif
      % else:
        % if user is not None and user.is_admin:
          <i class="glyphicon glyphicon-star user-admin"></i>
          <a href="${request.route_path('user_admin', id=contributor.id)}">${_('Set as administrator')}</a>
        % endif
      % endif
      </p>

      <p>
      % if not contributor.is_admin:
        % if contributor.is_project_manager:
          <i class="glyphicon glyphicon-star user-project-manager"></i>
          ${_("This user is a project manager.")}
          % if user is not None and user.is_admin and user != contributor:
            <a href="${request.route_path('user_project_manager', id=contributor.id)}">${_('Remove privileges')}</a>
          % endif
        % else:
          % if user is not None and user.is_admin:
            <i class="glyphicon glyphicon-star user-project-manager"></i>
            <a href="${request.route_path('user_project_manager', id=contributor.id)}">${_('Set as project manager')}</a>
          % endif
        % endif
      % endif
      </p>
    </div>
  </div>
  <div class="row">
    <div class="col-md-12">
      <h3>${_('Projects')}</h3>
        % if projects:
        ${_('This user contributed to the following projects:')}
        <ul>
        % for p in projects:
          <li>
            <a href="${request.route_path('project', project=p["project"].id)}"
              title="${_('Project Details')}">
              #${p['project'].id} ${p["project"].name}
            </a>
            (
            ${_('${count} tiles', mapping={'count': p["count"]})}
            )
            ${overpassturbo_link(p['project'])}
          </li>
        % endfor
        </ul>
        % else:
        ${_("User hasn't contributed yet.")}
      % endif
    </div>
  </div>
</div>
</%block>

<%def name="overpassturbo_link(project)" >
<%
import urllib
bbox = project.to_bbox()
query = u'<osm-script output="json" timeout="25"><union><query type="node"><user name="%(name)s"/><bbox-query %(bbox)s/></query><query type="way"><user name="%(name)s"/><bbox-query %(bbox)s/></query><query type="relation"><user name="%(name)s"/><bbox-query %(bbox)s/></query></union><print mode="body"/><recurse type="down"/><print mode="skeleton" order="quadtile"/></osm-script>' % {
  'name': contributor.username,
  'bbox': 'w="%f" s="%f" e="%f" n="%f"' % bbox
}
query = urllib.quote_plus(query.encode('utf8'))
%>
<small>
  <a href="http://overpass-turbo.eu/map.html?Q=${query}" ><span class="glyphicon glyphicon-share-alt"></span> overpass-turbo</a>
</small>
</%def>
