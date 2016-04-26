# -*- coding: utf-8 -*-
<%namespace file="custom.mako" name="custom"/>
<%namespace file="helpers.mako" name="helpers"/>
<%inherit file="base.mako"/>
<%block name="header">
</%block>
<%block name="content">
<%
base_url = request.route_path('home')
priorities = [_('urgent'), _('high'), _('medium'), _('low')]

sorts = [('priority', 'asc', _('High priority first')),
         ('created', 'desc', _('Creation date')),
         ('last_update', 'desc', _('Last update'))]
%>
<div class="container">
  <div class="col-md-6">
    <h3>${_('Projects')}</h3>
    <%
        qs = dict(request.GET)

        sort_by = qs.get('sort_by', 'priority')
        direction = qs.get('direction', 'asc')
        button_text = ''
        for sort in sorts:
            if sort[0] == sort_by and sort[1] == direction:
                button_text = sort[2]
        endfor
    %>
    <form class="form-inline" role="form"
          action="${request.current_route_url()}"
          method="GET">

      <div class="row">
        <div class="col-md-12">
          <input type="hidden" name="sort_by"
                 value="${request.params.get('sort_by', 'priority')}">
          <input type="hidden" name="direction"
                 value="${request.params.get('direction', 'asc')}">

          <div class="form-group left-inner-addon">
            <i class="glyphicon glyphicon-search text-muted"></i>
            <input type="search" class="form-control input-sm"
                   name="search" placeholder="${_('Search')}"
                   value="${request.params.get('search', '')}">
          </div>
          <div class="btn-group pull-right">
            <button type="button" class="btn btn-default btn-sm dropdown-toggle"
                    data-toggle="dropdown">
              ${_('Sort by:')} <strong>${button_text}</strong>
              <span class="caret"></span>
            </button>
            <ul class="dropdown-menu" role="menu">
              % for sort in sorts:
                <%
                  qs['sort_by'] = sort[0]
                  qs['direction'] = sort[1]
                %>
                <li>
                  <a href="${request.current_route_url(_query=qs.items())}">
                    ${sort[2]}
                  </a>
                </li>
              % endfor
            </ul>
          </div>
        </div>
      </div>
      <div class="row">
        <div class="col-md-12">
          % if user and user.username:
          <div class="checkbox input-sm pull-right">
            <label>
              <input type="checkbox" name="my_projects"
                ${'checked' if request.params.get('my_projects') == 'on' else ''}
                onclick="this.form.submit();"> ${_('Your projects')}
            </label>
          </div>
            % if user.is_admin or user.is_project_manager:
            <div class="checkbox input-sm pull-right">
              <label>
                <input type="checkbox" name="show_archived"
                  ${'checked' if request.params.get('show_archived') == 'on' else ''}
                  onclick="this.form.submit();"> ${_('Include archived projects')}
              </label>
            </div>
            % endif
          % else:
          <br>
          % endif
        </div>
      </div>
    </form>
    % if paginator.items:
        % for project in paginator.items:
          ${project_block(project=project, base_url=base_url,
                          priorities=priorities)}
        % endfor
        ${paginate()}
    % endif
  </div>
  <div class="col-md-6">
    <h3>${_('About the Tasking Manager')}</h3>
    <p>
    ${_('OSM Tasking Manager is a mapping tool designed and built for the Humanitarian OSM Team collaborative mapping. The purpose of the tool is to divide up a mapping job into smaller tasks that can be completed rapidly. It shows which areas need to be mapped and which areas need the mapping validated. <br />This approach facilitates the distribution of tasks to the various mappers in a context of emergency. It also permits to control the progress and the homogeneity of the work done (ie. Elements to cover, specific tags to use, etc.).')|n}
    </p>
    <hr />
    <p>
    ${custom.main_page_new_to_mapping_info()}
    </p>
    <hr />
    <p>
    ${custom.main_page_community_info()}
    </p>
  </div>
</div>
</%block>

<%def name="project_block(project, base_url, priorities)">
<%
    import math
    from osmtm.mako_filters import markdown_filter
    if request.locale_name:
        project.locale = request.locale_name

    if project.status == project.status_archived:
        status = 'Archived'
    elif project.status == project.status_draft:
        status = 'Draft'
    else:
        status = ''
%>
<div class="project well ${status.lower()}">
  <ul class="nav project-stats">
    <li>
      <table>
        <tr>
          <%
            locked = project.get_locked()
            # plural forms are defined ngettext(singular, plural, n, ...)
            # 'n' is the conditional for choosing the right plural form
            title = ngettext('${locked} user is currently working on this project', '${locked} users are currently working on this project', locked, mapping={'locked': locked})
          %>
          % if locked:
          <td>
            <span title="${title}" class="text-muted">
              <span class="glyphicon glyphicon-user"></span>
              ${locked}
            </span>
            &nbsp;
          </td>
          % endif
          <td>
            <div class="progress">
              <div style="width: ${project.done}%;" class="progress-bar progress-bar-warning"></div>
              <div style="width: ${project.validated}%;" class="progress-bar progress-bar-success"></div>
            </div>
          </td>
          <td>&nbsp;${int(math.floor(project.done + project.validated))}%</td>
        </tr>
      </table>
    </li>
  </ul>
  <h4>
    <a href="${base_url}project/${project.id}">#${project.id} ${project.name}
    </a>
  </h4>
  <div class="clear"></div>
  <div class="world_map">
    % if project.area:
    <%
        from geoalchemy2 import shape
        centroid = shape.to_shape(project.area.centroid)
    %>
    <div style="top: ${(-centroid.y + 90) * 60 / 180 - 1}px; left: ${(centroid.x + 180) * 120 / 360 - 1}px;" class="marker"></div>
    % endif
  </div>
  ${project.short_description | markdown_filter, n}
  <div class="clear"></div>
  ${helpers.display_project_info(project=project)}
</div>
</%def>

<%def name="paginate()">
<div class="text-center">
  <div class="btn-group btn-group-xs">
    <% link_attr={"class": "btn btn-small btn-default"} %>
    <% curpage_attr={"class": "btn btn-default btn-primary"} %>
    <% dotdot_attr={"class": "btn btn-default btn-small disabled"} %>
    ${paginator.pager(format="$link_previous ~2~ $link_next",
                      link_attr=link_attr,
                      curpage_attr=curpage_attr,
                      dotdot_attr=dotdot_attr)}
  </div>
</div>
</%def>
