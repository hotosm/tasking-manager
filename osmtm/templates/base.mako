# -*- coding: utf-8 -*-
<!DOCTYPE html>
<html>
  <head>
    <title>OSM Tasking Manager</title>
    <link rel="stylesheet" href="${request.static_url('osmtm:static/css/main.css')}">
    <link rel="stylesheet" href="${request.static_url('osmtm:static/js/lib/leaflet.css')}">
    <script src="${request.static_url('osmtm:static/js/lib/jquery-1.7.2.min.js')}"></script>
    <script src="${request.static_url('osmtm:static/js/lib/showdown.js')}"></script>
    <script src="${request.static_url('osmtm:static/js/lib/jquery-timeago/jquery.timeago.js')}"></script>
    <script src="${request.static_url('osmtm:static/js/lib/jquery-timeago/locales/jquery.timeago.%s.js' % request.locale_name)}"></script>
    <script src="${request.static_url('osmtm:static/js/lib/sammy-latest.min.js')}"></script>
    <script src="${request.static_url('osmtm:static/js/shared.js')}"></script>
    <script src="${request.static_url('osmtm:static/bootstrap/dist/js/bootstrap.min.js')}"></script>
<%
from pyramid.security import authenticated_userid
from osmtm.models import DBSession, User, TaskComment
login_url= request.route_url('login', _query=[('came_from', request.url)])
username = authenticated_userid(request)
if username is not None:
   user = DBSession.query(User).get(username)
else:
   user = None
languages = request.registry.settings.available_languages.split()

comments = []
%>
    <script>
        var base_url = "${request.route_url('home')}";
    </script>

  </head>
  <body id="${page_id}">
    <div class="navbar navbar-default navbar-fixed-top">
      <div class="container">
        <div class="navbar-header">
          <%block name="header"></%block>
        </div>
        <ul class="nav navbar-nav navbar-right">
          <%include file="languages_menu.mako" args="languages=languages"/>
          % if  user is not None:
          <%
              badge = ""
              if len(comments) > 0:
                  badge = '<sup><span class="badge badge-important">%s</span></sup>' % len(comments)
          %>
          <li>
            <a class="messages" href="${request.route_url('user_messages')}">
              <i class="glyphicon glyphicon-envelope" style="opacity: 0.5;"></i>${badge|n}
            </a>
          </li>
          <%include file="user_menu.mako" args="user=user"/>
          % else:
          <li>
          <a href="${login_url}" class="btn btn-link pull-right">${_('login to OpenStreetMap')}</a>
          </li>
          % endif
        </ul>
      </div>
    </div>
% if  request.session.peek_flash('alert'):
    <div class="container">
      <div class="row">
        <div class="flash alert alert-error">
<% flash = request.session.pop_flash('alert') %>
% for message in flash:
${message | n}
%endfor
        </div>
      </div>
    </div>
% endif
% if  request.session.peek_flash('success'):
    <div class="container">
      <div class="row">
        <div class="flash alert alert-success">
<% flash = request.session.pop_flash('success') %>
% for message in flash:
${message | n}
%endfor
        </div>
      </div>
    </div>
% endif
% if  request.session.peek_flash():
    <div class="container">
      <div class="row">
        <div class="flash alert">
<% flash = request.session.pop_flash() %>
% for message in flash:
${message | n}
%endfor
        </div>
      </div>
    </div>
% endif

    <%block name="content"></%block>
    <footer class="footer">
      <div class="container">
        <p class="col-md-6">Designed and built for the <a>Humanitarian OpenStreetMap Team</a> with
		 initial sponsorship from the Australia-Indonesia Facility for Disaster Reduction.
        </p>
        <p class="pull-right">Fork the code on <a href="http://github.com/hotosm/osm-tasking-manager">github</a>.

        </p>
      </div>
    </footer>
  </body>
</html>
