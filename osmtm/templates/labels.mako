# -*- coding: utf-8 -*-
<%inherit file="base.mako"/>
<%namespace file="helpers.mako" name="helpers"/>
<%block name="header">
<h1>${_('Labels')}</h1>
</%block>
<%block name="content">
<%
  from osmtm.mako_filters import contrast
%>
<div class="container group wrap">
    <div class="row">
        <div class="col-md-6">
          <table class="table table-condensed table-hover">
            % for label in labels:
            <tr>
              <td>
                ${helpers.display_label(label)}
              </td>
              <td class="text-right">
                <a href="${request.route_path('label_edit', label=label.id)}" class="small">${_('edit')}</a>
              </td>
            </tr>
            % endfor
          </table>
        </div>
        <div class="col-md-6">
            <a href="${request.route_path('label_new')}" class="btn btn-default btn-success">${_('New label')}</a>
        </div>
    </div>
</div>
</%block>
