# -*- coding: utf-8 -*-
<%namespace file="custom.mako" name="custom"/>
<%def name="title()"></%def>
<!DOCTYPE html>
<html>
  <head>
  <title>${custom.instance_name()} - ${self.title()}</title>
    <link rel="shortcut icon" href="${request.static_url('osmtm:static/img/favicon.ico')}">
    <link rel="stylesheet" href="${request.static_url('osmtm:static/css/main.css')}">
    <link rel="stylesheet" href="${request.static_url('osmtm:static/js/lib/leaflet.css')}">
    <script src="${request.static_url('osmtm:static/js/lib/jquery-1.12.3.min.js')}"></script>
    <script src="${request.static_url('osmtm:static/js/lib/velocity.min.js')}"></script>
    <script src="${request.static_url('osmtm:static/js/lib/velocity.ui.min.js')}"></script>
    <script src="${request.static_url('osmtm:static/js/lib/showdown/dist/showdown.js')}"></script>
    <script src="${request.static_url('osmtm:static/js/lib/showdown-youtube.js')}"></script>
    <script src="${request.static_url('osmtm:static/js/lib/jquery-timeago/jquery.timeago.js')}"></script>
    <%
      timeago_locale_baseurl = 'osmtm:static/js/lib/jquery-timeago/locales/jquery.timeago.%s.js'
      try:
        timeago_locale = request.static_url(timeago_locale_baseurl % request.locale_name.replace('_', '-'))
      except IOError:
        timeago_locale = request.static_url(timeago_locale_baseurl % request.locale_name[:2])
      except IOError:
        timeago_locale = request.static_url(timeago_locale_baseurl % 'en')
    %>
    <script src="${timeago_locale}"></script>
    <script src="${request.static_url('osmtm:static/js/lib/sammy-latest.min.js')}"></script>
    <script src="${request.static_url('osmtm:static/bootstrap/dist/js/bootstrap.min.js')}"></script>
    <script src="${request.static_url('osmtm:static/js/shared.js')}"></script>

<%
from osmtm.models import DBSession, TaskComment
login_url= request.route_path('login', _query=[('came_from', request.url)])
languages = request.registry.settings.available_languages.split()
languages_full = request.registry.settings.available_languages_full.split(",")

comments = []
%>
    <script>
        var base_url = "${request.route_path('home')}";
        var markdown_ref_url = "${request.static_url('osmtm:static/html/markdown_quick_ref.html')}";
        var unreadMsgsI18n = "${_('You have unread messages')}";
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
          <%include file="languages_menu.mako" args="languages=languages, languages_full=languages_full"/>
          % if user:
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
    ${custom.before_content()}
    <%block name="content"></%block>
% if page_id is not 'project':
    <footer class="footer">
      <div class="container">
<%
        link = "<a href='http://github.com/hotosm/osm-tasking-manager2'>github</a>"
        text = _('Fork the code on ${github_link}.', mapping={'github_link': link})
%>

        <p class="pull-right">${text|n}
        </p>
        <p>
          <a href="${request.route_path('about')}">${_('About the Tasking Manager')}</a><br />
          ${custom.footer_contact_text()}
        </p>
      </div>
    </footer>
% endif
  ${custom.analytics()}
  </body>
</html>
