<%!
    import markdown
%>
<%inherit file="/base.mako"/>
<%def name="id()">job</%def>
<%def name="title()">Job - ${job.title}</%def>
<div class="container">
    <div class="page-header">
        <h3>
        ${job.title}
        </h3>
    </div>
    <div class="row">
        <div class="span6">
            <div class="tab-pane active" id="description">
                <p>${markdown.markdown(job.description)|n}</p>
            </div>
        </div>
    </div>
    <div class="row">
        <div class="span6">
            <div id="map">
            </div>
        </div>
    </div>
</div>
<script src="http://cdn.leafletjs.com/leaflet-0.5/leaflet.js"></script>
<script>
    <%
        from shapely.wkb import loads
        from geojson import Feature, FeatureCollection, dumps

        geometry = loads(str(job.geometry.data))
    %>
    var job_id = ${job.id};
    var geometry = ${dumps(geometry)|n};
</script>
<script type="text/javascript" src="${request.static_url('osmtm:static/js/job.js')}"></script>
