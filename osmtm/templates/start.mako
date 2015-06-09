# -*- coding: utf-8 -*-
<%inherit file="base.mako"/>
<%block name="header">
<h1>${_('OSM Tasking Manager')}</h1>
</%block>
<%block name="content">
<%
login_url= request.route_path('login', _query=[('came_from', request.url)])
%>
<div class="container">
  <div class="row">
    <h2>
      ${_('Welcome, new user!')}
    </h2>
    <div>
      <p>
        ${_('You\'re ready to use the Tasking Manager.')} ${_('Since you are the first user you\'ll be given admin rights.')}
      </p>
      <p>
        <a class="btn btn-default" href="${login_url}">${_('Please login')}</a>
      </p>
    </div>
  </div>
</div></%block>
