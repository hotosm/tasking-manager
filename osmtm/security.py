from sqlalchemy.orm import (
    scoped_session,
    sessionmaker,
)
from zope.sqlalchemy import ZopeTransactionExtension
DBSession = scoped_session(sessionmaker(extension=ZopeTransactionExtension()))

from .models import (
    User,
    Project,
)

from pyramid.security import (
    Allow,
    Everyone,
    Deny,
)


class RootFactory(object):
    __acl__ = [(Allow, Everyone, 'view'),
               (Allow, Everyone, 'project'),
               (Allow, 'group:admin', 'add'),
               (Allow, 'group:admin', 'edit'),
               (Allow, 'group:admin', 'admin')]

    def __init__(self, request):
        if request.matchdict and 'project' in request.matchdict:
            project_id = request.matchdict['project']
            project = DBSession.query(Project).get(project_id)
            if project is not None and project.private:
                acl = [
                    (Allow, 'project:' + project_id, 'project'),
                    (Allow, 'group:admin', 'project'),
                    (Deny, Everyone, 'project'),
                ]
                self.__acl__ = acl + list(self.__acl__)
        pass


def group_membership(user, request):
    user = DBSession.query(User).get(user)
    perms = []
    if user:
        for project in user.private_projects:
            perms += ['project:' + str(project.id)]
        if user.admin:
            perms += ['group:admin']
    return perms
