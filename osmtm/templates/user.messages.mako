# -*- coding: utf-8 -*-
<%inherit file="base.mako"/>
<%block name="header">
<h1>Messages</h1>
</%block>
<%block name="content">
<script type="text/javascript" src="${request.static_url('osmtm:static/js/lib/angular.min.js')}"></script>
<div class="container" ng-app="projects">
  % for comment in comments:
    ${comment.comment}
  % endfor
</div>
</%block>
