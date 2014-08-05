from pyramid.view import view_config
from ..models import (
    DBSession,
    Message,
)


@view_config(route_name='message_read', renderer='message.mako',
             permission='message_show')
def read(request):

    id = request.matchdict['message']
    message = DBSession.query(Message).get(id)

    message.read = True
    DBSession.add(message)

    return dict(page_id="message", message=message)
