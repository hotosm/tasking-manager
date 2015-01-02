# -*- coding: utf-8 -*-
<%inherit file="base.mako"/>
<%block name="header">
<h1>${_('Messages')}</h1>
</%block>
<%block name="content">
<%
import bleach
%>
<div class="container" ng-app="projects">
  <table class="table">
    <thead>
      <tr>
        <th>${_('From')}</th>
        <th>${_('Subject')}</th>
        <th></th>
      </tr>
    </thead>
    <tbody>
      % for message in messages:
      <tr class="${'unread' if message.read != True else ''}">
        <td>${message.from_user.username}</td>
        <td>
          <a href="${request.route_path('message_read', message=message.id)}">
            ${bleach.clean(message.subject, [], strip=True)|n}
          </a>
        </td>
        <td>
          <em title="${message.date}Z" class="timeago"></em>
        </td>
      </tr>
      % endfor
    </tbody>
  </table>
</div>
<script>$('.timeago').timeago()</script>
</%block>
