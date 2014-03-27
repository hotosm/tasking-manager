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

@view_config(route_name='license', renderer='license.mako')
def license(request):
    id = request.matchdict['license']
    license = DBSession.query(License).get(id)
    user_id = authenticated_userid(request)

    if not user_id:
        raise HTTPUnauthorized()

    user = DBSession.query(User).get(user_id)

    if not user: # pragma: no cover
        raise HTTPUnauthorized()

    redirect = request.params.get("redirect", request.route_url("home"))
    if "accepted_terms" in request.params:
        if request.params["accepted_terms"] == "I AGREE":
            user.accepted_licenses.append(license)
        elif license in user.accepted_licenses:
            user.accepted_licenses.remove(license)
        return HTTPFound(location=redirect)

    return dict(page_id="license", user=user, license=license, redirect=redirect)

@view_config(route_name='license_delete', permission='admin')
def license_delete(request):
    id = request.matchdict['license']
    license = DBSession.query(License).get(id)

    if not license:
        request.session.flash('License doesn\'t exist!')
    else:
        DBSession.delete(license)
        DBSession.flush()
        request.session.flash('License removed!')

    return HTTPFound(location = route_url('licenses', request))

@view_config(route_name='license_new', renderer='license.edit.mako',
        permission='admin')
@view_config(route_name='license_edit', renderer='license.edit.mako',
        permission='admin')
def license_edit(request):
    if 'license' in request.matchdict:
        id = request.matchdict['license']
        license = DBSession.query(License).get(id)
    else:
        license = None

    if 'form.submitted' in request.params:
        if not license:
            license = License()
            DBSession.add(license)
            DBSession.flush()
            request.session.flash('License created!', 'success')
        else:
            request.session.flash('License updated!', 'success')

        license.name = request.params['name']
        license.description = request.params['description']
        license.plain_text = request.params['plain_text']

        DBSession.add(license)
        return HTTPFound(location = route_url('licenses', request))
    return dict(page_id="licenses", license=license)
