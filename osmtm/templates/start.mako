# -*- coding: utf-8 -*-
<%inherit file="base.mako"/>
<%block name="header">
<div class="brand">OSM Tasking Manager</div>
</%block>
<%block name="content">
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
        Please <a href="${request.route_url('login')}">login</a>.
      </p>
      <p>
        Since you are the first user you'll be given admin rights.
      </p>
    </div>
  </div>
</div></%block>
