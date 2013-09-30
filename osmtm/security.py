from sqlalchemy.orm import (
    scoped_session,
    sessionmaker,
    )
from zope.sqlalchemy import ZopeTransactionExtension
DBSession = scoped_session(sessionmaker(extension=ZopeTransactionExtension()))

from .models import (
    User,
    )

from pyramid.security import (
    Allow,
    Everyone,
    Authenticated,
    )
class RootFactory(object):
    __acl__ = [ (Allow, Everyone, 'view'),
            (Allow, 'group:admin', 'add'),
            (Allow, 'group:admin', 'edit'),
            (Allow, 'group:admin', 'admin'),
        ]
    def __init__(self, request):
        pass

def group_membership(username, request):
    session = DBSession()
    user = session.query(User).get(username)
    perms = []
    if user:
        #for job in user.private_jobs:
            #perms += ['job:'+str(job.id)]
        if user.is_admin():
            perms += ['group:admin']
    return perms
