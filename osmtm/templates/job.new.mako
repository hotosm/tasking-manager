<%inherit file="/base.mako"/>
<%def name="id()">job_new</%def>
<%def name="title()">New Job</%def>

<div class="container">
    <form method="post" action="" class="form-horizontal">
        <legend>New Job</legend>
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
                        <div id="map" class="span6"></div>
                        <input type="hidden" id="geometry" name="geometry" value="" />
                    </div>
                </div>
            </div>
        </div>
        <div class="row">
            <div class="span6">
                <div class="control-group">
                    <label class="control-label" for="id_zoom">Zoom level</label>
                    <div class="controls">
                        <select id="id_zoom" name="zoom">
                             <option>10</option>
                             <option>11</option>
                             <option selected="selected">12</option>
                             <option>13</option>
                             <option>14</option>
                             <option>15</option>
                             <option>16</option>
                             <option>17</option>
                             <option>18</option>
                        </select>
                        <p class="help-block">
                            <span id="zoom_level_info">
                                Up to <strong id="nb_tiles"></strong> tiles will be created.
                            </span>
                        </p>
                    </div>
                </div>
            </div>
        </div>
        <div class="form-actions">
            <input type="submit" class="btn btn-primary" value="Create the job" id="id_submit" name="form.submitted" disabled="disabled"/>
        </div>
    </form>
</div>
<script src="http://cdn.leafletjs.com/leaflet-0.5/leaflet.js"></script>
<link rel="stylesheet" href="${request.static_url('osmtm:static/js/lib/Leaflet.draw/dist/leaflet.draw.css')}">
<script type="text/javascript" src="${request.static_url('osmtm:static/js/lib/Leaflet.draw/dist/leaflet.draw.js')}"></script>
<script type="text/javascript" src="${request.static_url('osmtm:static/js/job.new.js')}"></script>
