# -*- coding: utf-8 -*-
<%
from osmtm.mako_filters import convert_mentions
%>
<%inherit file="base.mako"/>
<%def name="title()">${_('Messages')}</%def>
<%block name="header">
</%block>
<%block name="content">
<div class="container" ng-app="projects">
  <div class="row">
    <h4>
      <a href="${request.route_path('user_messages')}">
        <span class="glyphicon glyphicon-chevron-left"></span>
        ${_('Messages')}
      </a>
    </h4>
  </div>
  <p>
    <strong>${message.subject|n}</strong>
  </p>
  <p class="text-muted">
    ${_('From:')} ${message.from_user.username}<br>
    <em title="${message.date}Z" class="timeago small"></em>
  </p>
  <p>
    ${message.message | convert_mentions(request), n}
  </p>
</div>
<script>$('.timeago').timeago()</script>
</%block>
