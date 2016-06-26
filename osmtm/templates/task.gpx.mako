<?xml version="1.0" encoding="UTF-8" standalone="no" ?>
<%
import datetime
timestamp = datetime.datetime.utcnow()
timestamp = timestamp.isoformat()
stay_inside_msg = _('Do not edit outside of this box!')
%>
<gpx xmlns="http://www.topografix.com/GPX/1/1" version="1.1" creator="HOT Tasking Manager">
<metadata>
  <link href="https://github.com/hotosm/osm-tasking-manager2">
    <text>HOT Tasking Manager</text>
  </link>
  <time>${timestamp}</time>
</metadata>
<trk>
  <name>${_('Task for project ${project}.', mapping={'project': project_id}) | n} ${stay_inside_msg}</name>
  % for polygon in multipolygon:
  <trkseg>
    % for point in polygon.exterior.coords:
      <trkpt lon="${point[0]}" lat="${point[1]}"></trkpt>
    % endfor
  </trkseg>
  % endfor
</trk>
% for polygon in multipolygon:
  % for point in polygon.exterior.coords:
    <wpt lon="${point[0]}" lat="${point[1]}"><name>${stay_inside_msg}</name></wpt>
  % endfor
%endfor
</gpx>
