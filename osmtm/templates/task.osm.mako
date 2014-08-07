<osm version="0.6" generator="HOT Tasking Manager">
<%
    id = -2
%>
% for polygon in multipolygon:
% for point in polygon.exterior.coords:
<node id="${id}" lon="${point[0]}" lat="${point[1]}"><tag k="josm/ignore" v="true" /></node>
<% id = id -1 %>
% endfor
<way id="-1">
% for i in range(1, len(polygon.exterior.coords)):
<nd ref="-${i + 1}"/>
% endfor
<nd ref="-2"/>
<tag k="josm/ignore" v="true" />
</way>
% endfor
</osm>
