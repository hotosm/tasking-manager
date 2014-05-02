<?xml version="1.0" encoding="UTF-8" standalone="no" ?>
<%
import datetime
timestamp = datetime.datetime.utcnow()
timestamp = timestamp.isoformat()
%>
<gpx xmlns="http://www.topografix.com/GPX/1/1">
<metadata>
  <link href="https://github.com/hotosm/osm-tasking-manager">
    <text>HOT Tasking Manager</text>
  </link>
  <time>${timestamp}</time>
</metadata>
<trk>
  <name>Task for project ${project_id}</name>
  % for polygon in multipolygon:
  <trkseg>
    % for point in polygon.exterior.coords:
      <trkpt lon="${point[0]}" lat="${point[1]}"></trkpt>
    % endfor
  </trkseg>
  % endfor
</trk>
</gpx>
