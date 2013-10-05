<%
  # FIXME already done in base.mako
  from pyramid.security import authenticated_userid
  from osmtm.models import DBSession, User
  username = authenticated_userid(request)
  if username is not None:
     user = DBSession.query(User).get(username)
  else:
     user = None
  license_accepted = project.license in user.accepted_licenses
%>
% if project.imagery is not None and project.imagery != 'None':
% if license_accepted or not project.license:
<%
    type = project.imagery.lower()[:3]
%>
<p>
  ${_('Imagery is available to be used for tracing elements.')}
  ${_('You should be able to load it in your favorite editor.')}
</p>
<p>
<a href='http://127.0.0.1:8111/imagery?title=${project.name}&type=${type}&url=${project.imagery}'
   target="_blank" rel="tooltip"
   data-original-title="${_('If you have JOSM running and remote control activated, clicking this link should automatically load imagery.')}">
   ${project.imagery}
</a>
</p>
% endif
% if project.license:
<div class="alert ${'alert-error' if not license_accepted else ''}">
  Access to this imagery is limited by the
  <a href="${request.route_url('license', license=project.license.id)}?redirect=${request.route_url('project', project=project.id)}">
    ${project.license.name} license agreement
  </a>.
% if not license_accepted:
  You need to
  <a href="${request.route_url('license', license=project.license.id)}?redirect=${request.route_url('project', project=project.id)}">
    review and acknowledge
  </a>
  the agreement.
% endif
</div>
% endif
% endif
