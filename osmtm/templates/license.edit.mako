# -*- coding: utf-8 -*-
<%inherit file="base.mako"/>
<%block name="header">
<a href="${request.route_path('home')}" class="navbar-brand"><i class="glyphicon glyphicon-home"></i></a>
<a class="navbar-brand">OSM Tasking Manager - Edit License</a>
</%block>
<%block name="content">
<div class="container">
    <form method="post" action="" class="form-horizontal">
        <div class="form-group">
          <label class="control-label" for="id_name">Name</label>
          <input type="text" class="form-control" id="id_name" name="name" value="${license.name if license else ''}"
                 placeholder="A name for the license (provider, for example)" />
        </div>
        <div class="form-group">
          <label class="control-label" for="id_description">Description</label>
          <textarea class="form-control" id="id_description" name="description" rows="6"
              placeholder="The license terms">${license.description if license else ''}</textarea>
        </div>
        <div class="form-group">
          <label class="control-label" for="id_plain_text">Plain Text</label>
          <textarea class="form-control" id="id_plain_text" name="plain_text" rows="2"
              placeholder="A short vesion of the terms"
              >${license.plain_text if license else ''}</textarea>
        </div>
        <div class="form-group">
            % if license:
            <input type="submit" class="btn btn-success" value="Save the modifications" id="id_submit" name="form.submitted"/>
            % else:
            <input type="submit" class="btn btn-success" value="Create the new license" id="id_submit" name="form.submitted"/>
            % endif
            % if license:
            <a class="btn btn-danger" id="delete" href="${request.route_path('license_delete', license=license.id)}">Delete</a>
            % endif
            <a class="btn btn-default pull-right" href="${request.route_path('licenses')}">Cancel</a>
        </div>
    </form>
</div>
<script>
    $('#delete').click(function() {
        if (confirm('Are you sure you want to delete this license?')) {
            window.location = this.href;
        }
        return false;
    });
</script>
</%block>
