from pyramid.security import authenticated_userid
from .models import (
    DBSession,
    User,
)

from pyramid.events import (
    subscriber,
    BeforeRender,
)


@subscriber(BeforeRender)
def add_global(event):
    request = event.get('request')

    user_id = authenticated_userid(request)
    if user_id is not None:
        event['user'] = DBSession.query(User).get(user_id)
