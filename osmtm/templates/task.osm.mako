<osm version="0.6" generator="HOT Tasking Manager">
% for polygon in multipolygon:
% for i, point in enumerate(polygon.exterior.coords[:-1]):
  <node id="-${i + 2}" lon="${point[0]}" lat="${point[1]}"><tag k="josm/ignore" v="true" /></node>
% endfor
  <way id="-1">
% for i, point in enumerate(polygon.exterior.coords[:-1]):
    <nd ref="-${i + 2}"/>
% endfor
    <nd ref="-2"/>
    <tag k="josm/ignore" v="true" />
  </way>
% endfor
</osm>
