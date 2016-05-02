from pyramid.view import view_config
from ..models import (
    DBSession,
    Message,
)
from .task import __get_user
import datetime


@view_config(route_name='message_read', renderer='message.mako',
             permission='message_show')
def read(request):

    id = request.matchdict['message']
    message = DBSession.query(Message).get(id)

    message.read = True
    DBSession.add(message)

    return dict(page_id="message", message=message)


@view_config(route_name="user_messages_check", renderer='json')
def check(request):
    '''
    This view check whether there is a new message until the last call and
    also returns the number of unread messages
    '''
    user = __get_user(request, allow_none=True)

    interval = request.GET['interval']
    date = datetime.datetime.utcnow() \
        - datetime.timedelta(0, 0, 0, int(interval))

    new_message = DBSession.query(Message) \
        .filter(Message.to_user == user) \
        .filter(Message.date > date) \
        .first()

    return dict(new_message=bool(new_message),
                unread=len(user.unread_messages))
