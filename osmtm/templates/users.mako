# -*- coding: utf-8 -*-
<%inherit file="base.mako"/>
<%block name="header">
<a href="${request.route_url('home')}" class="brand"><i class="icon-home"></i></a>
<div class="brand">OSM Tasking Manager - ${_('Users')}</div>
</%block>
<%block name="content">
<script type="text/javascript" src="${request.static_url('osmtm:static/js/lib/angular.min.js')}"></script>
<div class="container" ng-app="users">
  <div class="row" ng-controller="usersCrtl">
    <ul ng-repeat="user in users">
      <li>
        <a href="user/{{user.username}}">{{user.username}}</a>
        <i class="icon-star" ng-show="user.admin"></i>
      </li>
    </div>
  </div>
</div>
<%
  from json import dumps
%>

<script>
  users = ${dumps([user.as_dict() for user in users])|n};
</script>
<script type="text/javascript" src="${request.static_url('osmtm:static/js/users.js')}"></script>
</%block>
