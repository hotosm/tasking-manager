# -*- coding: utf-8 -*-
<%namespace file="custom.mako" name="custom"/>
<%def name="title()"></%def>
<!DOCTYPE html>
<html>
  <head>
  <title>${custom.instance_name()} - ${self.title()}</title>
    <link rel="shortcut icon" href="${request.static_url('osmtm:static/img/favicon.ico')}">
    <link rel="stylesheet" href="${request.static_url('osmtm:static/css/main.css', _query={'v':'2.5-dev'})}">
    <link rel="stylesheet" href="${request.static_url('osmtm:static/js/lib/leaflet.css', _query={'v':'2.5-dev'})}">
    <script src="${request.static_url('osmtm:static/js/lib/jquery-1.7.2.min.js', _query={'v':'2.5-dev'})}"></script>
    <script src="${request.static_url('osmtm:static/js/lib/showdown.js', _query={'v':'2.5-dev'})}"></script>
    <script src="${request.static_url('osmtm:static/js/lib/jquery-timeago/jquery.timeago.js', _query={'v':'2.5-dev'})}"></script>
    <script src="${request.static_url('osmtm:static/js/lib/jquery-timeago/locales/jquery.timeago.%s.js' % request.locale_name, _query={'v':'2.5-dev'})}"></script>
    <script src="${request.static_url('osmtm:static/js/lib/sammy-latest.min.js', _query={'v':'2.5-dev'})}"></script>
    <script src="${request.static_url('osmtm:static/js/shared.js', _query={'v':'2.5-dev'})}"></script>
    <script src="${request.static_url('osmtm:static/bootstrap/dist/js/bootstrap.min.js', _query={'v':'2.5-dev'})}"></script>
<%
from osmtm.models import DBSession, TaskComment
login_url= request.route_path('login', _query=[('came_from', request.url)])
languages = request.registry.settings.available_languages.split()

comments = []
%>
    <script>
        var base_url = "${request.route_path('home')}";
    </script>

  </head>
  <body id="${page_id}">
    <div class="navbar navbar-default navbar-fixed-top">
      <div class="container">
        <div class="navbar-header">
          <a href="${request.route_path('home')}" class="navbar-brand">
            <i class="glyphicon glyphicon-home"></i> ${custom.instance_name()}
          </a>
        </div>
        <ul class="nav navbar-nav navbar-right">
          <li>
          <a href="${request.route_path('about')}" class="btn btn-link pull-right">${_('About')}</a>
          </li>
          <%include file="languages_menu.mako" args="languages=languages"/>
          % if user:
          <%
              badge = ""
              if len(comments) > 0:
                  badge = '<sup><span class="badge badge-important">%s</span></sup>' % len(comments)
          %>
          <%include file="user_menu.mako" />
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
  <div class="container">
    <div class="row"><%block name="header"></%block></div>
  </div>
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
% if page_id is not 'project':
    <footer class="footer">
      <div class="container">
        <p class="pull-right">Fork the code on <a href="http://github.com/hotosm/osm-tasking-manager2">github</a>.
        </p>
        <p>
          <a href="${request.route_path('about')}">${_('About the Tasking Manager')}</a><br />
          ${custom.footer_contact_text()}
        </p>
      </div>
    </footer>
% endif
  </body>
</html>
