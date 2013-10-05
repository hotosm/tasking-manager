# -*- coding: utf-8 -*-
<%inherit file="base.mako"/>
<%block name="header">
<a href="${request.route_url('home')}" class="brand"><i class="icon-home"></i></a>
<div class="brand">OSM Tasking Manager - Edit License</div>
</%block>
<%block name="content">
<div class="container">
    <form method="post" action="" class="form-horizontal">
        <div class="control-group">
            <label class="control-label" for="id_name">Name</label>
            <div class="controls">
                <input type="text" class="text input-xxlarge" id="id_name" name="name" value="${license.name}"
                    placeholder="A name for the license (provider, for example)" />
            </div>
        </div>
        <div class="row">
            <div class="span7">
                <div class="control-group">
                    <label class="control-label" for="id_description">Description</label>
                    <div class="controls">
                        <textarea class="text span7" id="id_description" name="description" rows="10"
                            placeholder="The license terms">${license.description}</textarea>
                    </div>
                </div>
            </div>
        </div>
        <div class="row">
            <div class="span7">
                <div class="control-group">
                    <label class="control-label" for="id_plain_text">Plain Text</label>
                    <div class="controls">
                        <textarea class="text span7" id="id_plain_text" name="plain_text" rows="5"
                            placeholder="A short vesion of the terms"
                            >${license.plain_text}</textarea>
                    </div>
                </div>
            </div>
        </div>
        <div class="form-actions">
            <input type="submit" class="btn btn-success" value="Save the modifications" id="id_submit" name="form.submitted"/>
            <a class="btn btn-danger" id="delete" href="${request.route_url('license_delete', license=license.id)}">Delete</a>
            <a class="btn pull-right" href="${request.route_url('licenses')}">Cancel</a>
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
