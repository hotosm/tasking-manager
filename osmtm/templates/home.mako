# -*- coding: utf-8 -*-
<%inherit file="base.mako"/>
<%block name="header">
<div class="brand">OSM Tasking Manager</div>
</%block>
<%block name="content">
<div class="container">
  <div class="row">
% for project in projects:

    <div class="project well">
      <ul class="nav project-stats">
        <li><i class="icon-user"></i><span></span>
        </li>
        <li class="row">
          <table>
            <tr>
              <td>
                <div style="border: 1px solid #ccc;" class="progress">
                  <div style="width: 90%;" class="bar"></div>
                </div>
              </td>
              <td></td>
            </tr>
          </table>
        </li>
      </ul>
      <h4><a href="${request.route_url('project', project=project.id)}">${project.name}</a>
      </h4>
      <div class="clear"></div>
      <div class="world_map">
        <div style="top: 15px; left: 43px;" class="marker"></div>
      </div>${project.short_description}

      <div class="clear"></div>
      <span class="created-by">Created by Pierre</span> -
      <span class="updated-at">Updated <span title="${project.last_update}" class="timeago"></span></span>
    </div>
% endfor
  </div>
</div></%block>
