from sqlalchemy.orm import (
    scoped_session,
    sessionmaker,
)
from zope.sqlalchemy import ZopeTransactionExtension

from .models import (
    User,
    Project,
    Message,
)

from pyramid.security import (
    Allow,
    Everyone,
    Deny,
)

DBSession = scoped_session(sessionmaker(extension=ZopeTransactionExtension()))


class RootFactory(object):
    __acl__ = [
        (Allow, Everyone, 'view'),
        (Allow, Everyone, 'project_show'),
        (Allow, 'group:admin', 'add'),
        (Allow, 'group:admin', 'license_edit'),
        (Allow, 'group:admin', 'user_edit'),
        (Allow, 'group:admin', 'project_edit'),
        (Allow, 'group:project_manager', 'project_edit'),
    ]

    def __init__(self, request):
        if request.matchdict and 'project' in request.matchdict:
            project_id = request.matchdict['project']
            project = DBSession.query(Project).get(project_id)
            if project is not None and \
                    (project.private or
                     project.status == Project.status_draft):
                acl = [
                    (Allow, 'project:' + project_id, 'project_show'),
                    (Allow, 'group:admin', 'project_show'),
                    (Allow, 'group:project_manager', 'project_show'),
                    (Deny, Everyone, 'project_show'),
                ]
                self.__acl__ = acl + list(self.__acl__)
        if request.matchdict and 'message' in request.matchdict:
            message_id = request.matchdict['message']
            message = DBSession.query(Message).get(message_id)
            if message is not None:
                acl = [
                    (Allow, 'message:' + message_id, 'message_show'),
                    (Deny, Everyone, 'message_show'),
                ]
                self.__acl__ = acl + list(self.__acl__)
        pass


def group_membership(user, request):
    user = DBSession.query(User).get(user)
    perms = []
    if user:
        for project in user.private_projects:
            perms += ['project:' + str(project.id)]
        for message in user.messages:
            perms += ['message:' + str(message.id)]
        if user.is_admin:
            perms += ['group:admin']
        if user.is_project_manager:
            perms += ['group:project_manager']
    return perms
