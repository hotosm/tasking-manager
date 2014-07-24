# -*- coding: utf-8 -*-
<%inherit file="base.mako"/>
<%block name="header">
<h1>${_('Licenses')}</h1>
</%block>
<%block name="content">
<div class="container group wrap">
    <div class="row">
        <div class="col-md-6">
            <ul>
            % for license in licenses:
            <li><h4>${license.name}</h4>
                <div class="help-inline">
                  ${license.plain_text}
                </div>
                <a href="${request.route_path('license_edit', license=license.id)}" class="btn pull-right">edit</a><br />
                </li>
            % endfor
            </ul>
            </ul>
        </div>
        <div class="col-md-6">
            <a href="${request.route_path('license_new')}" class="btn btn-default">+ Create new license</a>
        </div>
    </div>
</div>
</%block>
