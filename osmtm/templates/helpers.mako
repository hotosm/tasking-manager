<%def name="display_project_info(project)">
  <%
  priorities = [_('urgent'), _('high'), _('medium'), _('low')]
  %>
  <small class="text-muted">
    % if project.private:
    <span class="glyphicon glyphicon-lock"
          title="${_('Access to this project is limited')}"></span> -
    % endif
    % if project.author:
    <span>${_('Created by')} <a href="${request.route_path('user',username=project.author.username)}">${project.author.username}</a></span> -
    % endif
    <span>${_('Updated')} <span class="timeago" title="${project.last_update}Z"></span></span> -
    <span>${_('Priority:')} ${priorities[project.priority]}</span>
    % if status:
    - <span>${_(status)}</span>
    % endif
  </small>
</%def>

<%def name="display_label(label)">
  <%
    from osmtm.mako_filters import contrast
  %>
  <%
    import re
    label_id = label.name
    if re.findall(ur'\s', label_id):
      label_id = '\"' + label_id + '\"'
  %>
  <a class="label label-default"
     style="background-color: ${label.color};color: ${label.color|contrast}"
     href="${request.route_url('home', _query={'labels': label_id})}">${label.name}</a>
</%def>

<%def name="locale_chooser(inputname)">
  <div class="btn-group pull-right" id="locale_chooser_${inputname}">
    % for locale, translation in translations:
    <a href
      class="btn btn-default btn-xs ${'active' if locale == 'en' else ''}"
      data-locale="${locale}">
      <span class="${'text-muted' if getattr(translation, inputname) == '' else ''}">
        ${locale}
      </span>
    </a>
    % endfor
  </div>
  <script>
    $('#locale_chooser_${inputname} a').on('click', function() {
      $(this).addClass('active');
      $(this).siblings().removeClass('active');
      var locale = $(this).attr('data-locale');
      $(this).parents('.form-group').find('.tab-pane').each(function(index, item) {
        if ($(item).attr('data-locale') == locale) {
          $(item).addClass('active');
        } else {
          $(item).removeClass('active');
        }
      });
      return false;
    });
  </script>
</%def>
