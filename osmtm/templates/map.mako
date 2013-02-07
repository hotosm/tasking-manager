<%!
    import markdown
%>
<%inherit file="/base.mako"/>
<%def name="id()">map</%def>
<%def name="title()">Map - ${map.title}</%def>
<div class="container">
    <div class="page-header">
        <h3>
        ${map.title}
        </h3>
    </div>
    <div class="row">
        <div class="span6">
            <div class="tab-pane active" id="description">
                <p>${markdown.markdown(map.description)|n}</p>
            </div>
        </div>
    </div>
    <div class="row">
        <div class="span6">
            <div id="leaflet">
            </div>
        </div>
    </div>
</div>
<script src="http://cdn.leafletjs.com/leaflet-0.5/leaflet.js"></script>
<script>
    <%
        from shapely.wkb import loads
        from geojson import Feature, FeatureCollection, dumps

        geometry = loads(str(map.geometry.data))
    %>
    var map_id = ${map.id};
    var geometry = ${dumps(geometry)|n};
</script>
<script type="text/javascript" src="${request.static_url('osmtm:static/js/map.js')}"></script>
