# -*- coding: utf-8 -*-
<%inherit file="base.mako"/>
<%block name="header">
<a href="${request.route_url('home')}" class="navbar-brand"><i class="glyphicon glyphicon-home"></i></a>
<a class="navbar-brand">OSM Tasking Manager - ${_('Licenses')}</a>
</%block>
<%block name="content">
<div class="container group wrap">
    <div class="row">
        <div class="span6">
            <ul>
            % for license in licenses:
            <li><h4>${license.name}</h4>
                <div class="help-inline">
                  ${license.plain_text}
                </div>
                <a href="${request.route_url('license_edit', license=license.id)}" class="hidden-link">edit</a><br />
                </li>
            % endfor
            </ul>
            </ul>
        </div>
        <div class="span6">
            <a href="${request.route_url('license_new')}" class="btn btn-small">+ Create new license</a>
        </div>
    </div>
</div>
</%block>
