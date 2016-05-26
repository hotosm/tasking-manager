# -*- coding: utf-8 -*-
<%inherit file="base.mako"/>
<%namespace file="custom.mako" name="custom"/>

<%block name="header"></%block>

<%block name="content">
<div class="container">
  <div class="row">
    <div class="col-md-7">
      <h3>${_('About the Tasking Manager')}</h3>
      <p>
      ${custom.about_tasking_manager_intro()}
      </p>
      <h3>${_('Sponsorship and Funding')}</h3>
      <p>${_('OSM Tasking Manager was designed and built for the <a href="http://hot.openstreetmap.org">Humanitarian OpenStreetMap Team</a>.') |n}
      <img src="${request.static_url('osmtm:static/img/hot.png')}" />
      <p>${_('With the invaluable help from:') | n}<p>
      <ul>
        <li>
          <a href="http://www.aifdr.org">Australia-Indonesia Facility for Disaster Reduction</a>
        </li>
        <li>
          <a href="http://www.usaid.gov">USAID GeoCenter</a>
        </li>
        <li>
          <a href="http://www.usaid.gov">USAID Office of Transition Initiatives</a>
        </li>
        <li>
          <a href="//www.gfdrr.org">World Bank - GFDRR</a>
        </li>
        <li>
          <a href="//www.redcross.org">American Red Cross</a>
        </li>
      </ul>
      </p>
      <p>
        <img src="${request.static_url('osmtm:static/img/aifdr.png')}" />
        <img src="${request.static_url('osmtm:static/img/usaid.png')}" />
        <img src="${request.static_url('osmtm:static/img/gfdrr.png')}" />
        <img src="${request.static_url('osmtm:static/img/redcross.png')}" />
        <img src="${request.static_url('osmtm:static/img/gwu.png')}" />
      </p>
    </div>
    <div class="col-md-5">
      <h3>${_('Getting Started')}</h3>
      <p>
        ${_('Some resources to help you start using the Tasking Manager:')}
        <ul>
          <li><a href="http://wiki.openstreetmap.org/wiki/OSM_Tasking_Manager">OSM Wiki</a></li>
          <li><a href="http://learnosm.org/en/coordination/tasking-manager/">LearnOSM</a></li>
          <li><a href="http://mapgive.state.gov/">MapGive</a></li>
        </ul>
      </p>
      <h3>${_('Open Source')}</h3>
      <p>
      ${_('OSM Tasking Manager is an open source software.<br>Feel free to report issues and contribute.') | n}
      </p>
      <p>${_('The <a href="http://github.com/hotosm/osm-tasking-manager2">application code</a> is available on github') | n}.</p>
      <p>
        ${_('Lead developer: Pierre GIRAUD (<a href="//www.camptocamp.com">Camptocamp</a>)')|n}
        ${_('with the help of <a href="https://github.com/hotosm/osm-tasking-manager2/graphs/contributors">other contributors</a>.') |n}
      </p>
<%
      from gitversion import determine_git_version
      
      ver = determine_git_version('.')
      url = 'https://github.com/hotosm/osm-tasking-manager2/commit/' + ver.rsplit('.',1)[1]
      txt = '<a href="%s">%s</a>' % (url, ver)
%>
      <h3>${_('Version')}</h3>
      <p>
        ${txt |n}
      </p>
    </div>
  </div>
</div>
</%block>
