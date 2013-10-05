from pyramid.view import view_config
from pyramid.url import route_url
from pyramid.httpexceptions import (
    HTTPFound,
    HTTPBadRequest,
    HTTPUnauthorized
    )
from ..models import (
    DBSession,
    License,
    User,
    )

from pyramid.security import authenticated_userid

@view_config(route_name='licenses', renderer='licenses.mako')
def licenses(request):
    licenses = DBSession.query(License).all()

    return dict(page_id="licenses", licenses=licenses)

@view_config(route_name='license', renderer='license.mako', permission='edit')
def license(request):
    id = request.matchdict['license']
    license = DBSession.query(License).get(id)

    username = authenticated_userid(request)
    user = DBSession.query(User).get(username)
    redirect = request.params.get("redirect", request.route_url("home"))
    if "accepted_terms" in request.params:
        if request.params["accepted_terms"] == "I AGREE":
            user.accepted_licenses.append(license)
        elif license in user.accepted_licenses:
            user.accepted_licenses.remove(license)
        return HTTPFound(location=redirect)
    else:
        return dict(page_id="license", user=user, license=license, redirect=redirect)

@view_config(route_name='license_new', permission='admin')
def license_new(request):
    license = License()
    license.name = ''
    license.description = ''
    license.plain_text = ''

    DBSession.add(license)
    DBSession.flush()
    return HTTPFound(location = route_url('license_edit', request, license=license.id))

@view_config(route_name='license_delete', permission='admin')
def license_delete(request):
    id = request.matchdict['license']
    license = DBSession.query(License).get(id)

    DBSession.delete(license)
    DBSession.flush()
    request.session.flash('License removed!')
    return HTTPFound(location = route_url('licenses', request))

@view_config(route_name='license_edit', renderer='license.edit.mako',
        permission='admin')
def license_edit(request):
    id = request.matchdict['license']
    license = DBSession.query(License).get(id)

    if 'form.submitted' in request.params:
        license.name = request.params['name']
        license.description = request.params['description']
        license.plain_text = request.params['plain_text']

        DBSession.add(license)
        request.session.flash('License updated!')
        return HTTPFound(location = route_url('licenses', request))
    return dict(page_id="licenses", license=license)
