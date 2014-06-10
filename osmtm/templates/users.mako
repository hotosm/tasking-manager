# -*- coding: utf-8 -*-
<%inherit file="base.mako"/>
<%block name="header">
<a href="${request.route_path('home')}" class="navbar-brand"><i class="glyphicon glyphicon-home"></i></a>
<a class="navbar-brand">OSM Tasking Manager - ${_('Users')}</a>
</%block>
<%block name="content">
<script type="text/javascript" src="${request.static_url('osmtm:static/js/lib/angular.min.js')}"></script>
<div class="container" ng-app="users">
  <div class="row" ng-controller="usersCrtl">
    <div class="col-md-8">
      <ul ng-repeat="user in users">
        <li>
          <a href="user/{{user.username}}">{{user.username}}</a>
          <i class="glyphicon glyphicon-star user-admin" ng-show="user.is_admin"></i>
          <i class="glyphicon glyphicon-star user-project-manager" ng-show="user.is_project_manager"></i>
        </li>
      </ul>
    </div>
    <div class="col-md-4">
      <small>
        Keys:
        <ul>
          <li><i class="glyphicon glyphicon-star"></i> Administrator</li>
        </ul>
      </small>
    </div>
  </div>
</div>
<%
  from json import dumps
%>

<script>
  var users = ${dumps([user.as_dict() for user in users])|n};
</script>
<script type="text/javascript" src="${request.static_url('osmtm:static/js/users.js')}"></script>
</%block>
