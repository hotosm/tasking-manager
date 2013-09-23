# -*- coding: utf-8 -*-
<%inherit file="base.mako"/>
<%block name="header">
<div class="brand">OSM Tasking Manager</div>
</%block>
<%block name="content">
<script type="text/javascript" src="${request.static_url('osmtm:static/js/lib/angular.min.js')}"></script>
<div class="container" ng-app="projects">
  the messages
</div>
</%block>
