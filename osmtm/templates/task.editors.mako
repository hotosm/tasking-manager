<div class="text-center">
  <div class="btn-group">
    <%
      cookies = request.cookies
      prefered_editor = cookies['prefered_editor'] if 'prefered_editor' in cookies else ''
    %>
    <button id="edit" class="btn btn-default">
      <i class="glyphicon glyphicon-share-alt"></i> ${_('Edit with')}
      <span id="prefered_editor"></span>
    </button>
    <button data-toggle="dropdown" class="btn btn-default dropdown-toggle"><span class="caret"></span>
    </button>
    <ul id="editDropdown" class="dropdown-menu text-left">
      <li id="josm"><a role="menuitem">JOSM</a></li>
      <li id="iDeditor"><a role="menuitem">iD editor</a></li>
      <li id="potlatch2"><a role="menuitem">Potlatch 2</a></li>
      <li id="wp"><a role="menuitem">Walking Papers</a></li>
    </ul>
  </div>
  <div id="josm_task_boundary_tip" class="help-block small text-left">
    <em>
      <i class="glyphicon glyphicon-info-sign"></i>
      <%
        link_to_gpx_text = _('.gpx file')
        link_to_gpx = '<a href="%s" target="_blank">%s</a>' % (
          request.route_url('task_gpx', project=task.project_id, task=task.id),
          link_to_gpx_text)
      %>
      ${_('Tip: Download the following ${task_gpx_link} and load it in JOSM in order to see the current task boundary',
      mapping={'task_gpx_link': link_to_gpx}) | n}
    </em>
  </div>
</div>
<script>
  osmtm.prefered_editor = "${prefered_editor}";
</script>
<p></p>
