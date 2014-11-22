# -*- coding: utf-8 -*-
<%inherit file="base.mako"/>
<%def name="title()">${_('Users')}</%def>
<%block name="header">
<h1>${_('Users')}</h1>
</%block>
<%block name="content">
<div class="container" ng-app="users">
  <div class="row" ng-controller="usersCrtl">
    <div class="col-md-8">
      <ul>
        % if paginator.items:
          % for user in paginator.items:
            <li>
              <a href="user/${user.username}">${user.username}</a>
                % if user.is_admin:
                  <i class="glyphicon glyphicon-star user-admin"></i>
                % elif user.is_project_manager:
                  <i class="glyphicon glyphicon-star user-project-manager"></i>
                % endif
            </li>
          % endfor
        ${paginator.pager()}
        % endif
      </ul>
    </div>
    <div class="col-md-4">
      <small>
        Keys:
        <ul>
          <li><i class="glyphicon glyphicon-star user-admin"></i> Administrator</li>
          <li><i class="glyphicon glyphicon-star user-project-manager"></i> Project Manager</li>
        </ul>
      </small>
    </div>
  </div>
</div>
</%block>
