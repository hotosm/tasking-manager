<p>
  <div class="btn-group">
    <%
      cookies = request.cookies
      prefered_editor = cookies['prefered_editor'] if 'prefered_editor' in cookies else ''
    %>
    <button id="edit" class="btn btn-small">
      <i class="icon-share-alt"></i> ${_('Edit with')}
      <span id="prefered_editor"></span>
    </button>
    <button data-toggle="dropdown" class="btn btn-small dropdown-toggle"><span class="caret"></span>
    </button>
    <ul id="editDropdown" class="dropdown-menu">
      <li id="josm"><a>JOSM</a>
      </li>
      <li id="iDeditor"><a>iD editor</a>
      </li>
      <li id="potlatch2"><a>Potlatch 2</a>
      </li>
      <li id="wp"><a>Walking Papers</a>
      </li>
    </ul>
    <script>
      var prefered_editor = "${prefered_editor}";
      setPreferedEditor();
    </script>
  </div>
  <button class="btn btn-small btn-link">.osm</button>
</p>
