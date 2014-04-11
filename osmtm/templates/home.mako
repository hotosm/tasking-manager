# -*- coding: utf-8 -*-
<%inherit file="base.mako"/>
<%block name="header">
<div class="navbar-brand">OSM Tasking Manager</div>
</%block>
<%block name="content">
<%
base_url = request.route_path('home')
%>
<script type="text/javascript" src="${request.static_url('osmtm:static/js/lib/angular.min.js')}"></script>
<div class="container" ng-app="projects">
  <div class="col-md-6" ng-controller="projectCrtl">
    <h3>Projects</h3>
    <form class="form-inline" role="form">
      <div class="form-group">
        <label for="id_sort" class="control-label">Sort by</label>
        <select id="id_sort" class="form-control input-sm" ng-model="sortExpression">
          <option value="priority">High priority first</option>
          <option value="-created">Creation date</option>
          <option value="-last_update">Last update</option>
        </select>
      </div>
    </form>
    <hr>
    <div class="project well" ng-repeat="project in projects | orderBy:sortExpression">
      <ul class="nav project-stats">
        <li><i class="glyphicon glyphicon-user"></i><span></span></li>
        <li>
          <table>
            <tr>
              <td>
                <div style="border: 1px solid #ccc;" class="progress">
                  <div style="width: {{project.done}}%;" class="progress-bar"></div>
                </div>
              </td>
              <td>&nbsp;{{project.done}}%</td>
            </tr>
          </table>
        </li>
      </ul>
      <h4><a href="${base_url}project/{{project.id}}">#{{project.id}} {{project.name}}</a>
      </h4>
      <div class="clear"></div>
      <div class="world_map">
        <div style="top: {{(-project.centroid[1] + 90) * 60 / 180 - 1}}px; left: {{(project.centroid[0] + 180) * 120 / 360 - 1}}px;" class="marker"></div>
      </div>
      {{project.short_description}}
      <div class="clear"></div>
      <small class="text-muted">
        <span>${_('Created by')} {{project.author}}</span> -
        <span>${_('Updated')} <span class="timeago">{{project.last_update + 'Z' | timeAgo}}</span></span> -
        <span>${_('Priority:')} {{project.priority | priority}}</span>
      </small>
    </div>
  </div>
  <div class="col-md-6">
    <h3>New to the Tasking Manager?</h3>
    <p>What is this Tasking Manager all about?</p>
  </div>
</div>
<%
  from osmtm.models import dumps
%>

<script>
  var projects = ${dumps([project.as_dict(request.locale_name) for project in projects])|n};
  var priorities = ["${_('urgent')}", "${_('high')}", "${_('medium')}", "${_('low')}"];
</script>
<script type="text/javascript" src="${request.static_url('osmtm:static/js/home.js')}"></script>
</%block>
