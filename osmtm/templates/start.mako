# -*- coding: utf-8 -*-
<%inherit file="base.mako"/>
<%block name="header">
<h1>OSM Tasking Manager</h1>
</%block>
<%block name="content">
<%
login_url= request.route_path('login', _query=[('came_from', request.url)])
%>
<div class="container">
  <div class="row">
    <h2>
      Welcome, new user!
    </h2>
    <div>
      <p>
        You're ready to use the Tasking Manager.
      </p>
      <p>
        Please <a href="${login_url}">login</a>.
      </p>
      <p>
        Since you are the first user you'll be given admin rights.
      </p>
    </div>
  </div>
</div></%block>
