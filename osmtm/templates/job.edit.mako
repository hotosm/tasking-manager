<%inherit file="/base.mako"/>
<%def name="id()">job_new</%def>
<%def name="title()">Edit Job</%def>

<div class="container">
    <form method="post" action="" class="form-horizontal" enctype="multipart/form-data">
        <legend>Edit Job</legend>
        <div class="control-group">
            <label class="control-label" for="id_title">Title</label>
            <div class="controls">
            <input type="text" class="text input-xxlarge" id="id_title" name="title" value="${job.title}" />
            </div>
        </div>
        <div class="row">
            <div class="span7">
                <div class="control-group">
                    <label class="control-label" for="id_short_description">Short Description</label>
                    <div class="controls">
                        <textarea class="text span5" id="id_short_description" name="short_description" rows="5">${job.short_description}</textarea>
                    </div>
                </div>
            </div>
            <div class="span5">
                <span id="short_description_preview"></span>
            </div>
        </div>
        <div class="row">
            <div class="span7">
                <div class="control-group">
                    <label class="control-label" for="id_description">Description</label>
                    <div class="controls">
                        <textarea class="text span5" id="id_description" name="description" rows="10">${job.description}</textarea>
                    </div>
                </div>
            </div>
            <div class="span5">
                <span id="description_preview"></span>
            </div>
        </div>
        <div class="form-actions">
            <input type="submit" class="btn btn-primary" value="Save the modifications" id="id_submit" name="form.submitted"/>
        </div>
    </form>
</div>
<script type="text/javascript" src="${request.static_url('osmtm:static/js/job.edit.js')}"></script>
