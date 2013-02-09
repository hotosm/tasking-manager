<%inherit file="/base.mako"/>
<%def name="id()">map_new</%def>
<%def name="title()">New Map</%def>

<div class="container">
    <form method="post" action="" class="form-horizontal">
        <legend>New Map</legend>
        <div class="control-group">
            <label class="control-label" for="id_title">Title</label>
            <div class="controls">
            <input type="text" class="text input-xxlarge" id="id_title" name="title" value="" />
            </div>
        </div>
        <div class="row">
            <div>
                <label class="control-label">Area of interest</label>
                <div class="control-group">
                    <div class="controls">
                        <div id="leaflet" class="span6"></div>
                        <input type="hidden" id="geometry" name="geometry" value="" />
                    </div>
                </div>
            </div>
        </div>
        <div class="form-actions">
            <input type="submit" class="btn btn-primary" value="Create the map" id="id_submit" name="form.submitted" disabled="disabled"/>
        </div>
    </form>
</div>
<script src="http://cdn.leafletjs.com/leaflet-0.5/leaflet.js"></script>
<link rel="stylesheet" href="${request.static_url('osmtm:static/js/lib/Leaflet.draw/dist/leaflet.draw.css')}">
<script type="text/javascript" src="${request.static_url('osmtm:static/js/lib/Leaflet.draw/dist/leaflet.draw.js')}"></script>
<script type="text/javascript" src="${request.static_url('osmtm:static/js/map.new.js')}"></script>
