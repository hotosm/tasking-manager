from pyramid.view import view_config
from pyramid.url import route_path
from pyramid.httpexceptions import (
    HTTPFound,
)
from ..models import (
    DBSession,
    Label,
    LabelTranslation,
)


@view_config(route_name="labels", renderer="labels.mako",
             permission="project_edit")
def labels(request):
    labels = DBSession.query(Label).all()

    return dict(page_id="labels", labels=labels)


@view_config(route_name="label_delete", permission="project_edit")
def label_delete(request):
    _ = request.translate
    id = request.matchdict['label']
    label = DBSession.query(Label).get(id)

    if not label:
        request.session.flash(_("Label doesn't exist!"))
    else:
        DBSession.delete(label)
        DBSession.flush()
        request.session.flash(_("Label removed!"))

    return HTTPFound(location=route_path("labels", request))


@view_config(route_name='label_new', renderer='label.edit.mako',
             permission='project_edit')
@view_config(route_name='label_edit', renderer='label.edit.mako',
             permission='project_edit')
def label_edit(request):
    _ = request.translate
    if 'label' in request.matchdict:
        id = request.matchdict['label']
        label = DBSession.query(Label).get(id)
        translations = label.translations.items()
    else:
        label = None
        languages = request.registry.settings.available_languages.split()
        translations = [(language, LabelTranslation(description=''))
                        for language in languages]

    if 'form.submitted' in request.params:
        if not label:
            label = Label()
            label.name = request.params['name']
            label.color = request.params['color']
            DBSession.add(label)
            DBSession.flush()
            request.session.flash(_('Project label created!'), 'success')
        else:
            label.name = request.params['name']
            label.color = request.params['color']
            request.session.flash(_('Project label updated!'), 'success')

        for locale, translation in label.translations.iteritems():
            with label.force_locale(locale):
                field = 'description'
                translated = '_'.join([field, locale])
                if translated in request.params:
                    setattr(label, field, request.params[translated])
                DBSession.add(label)

        DBSession.add(label)
        return HTTPFound(location=route_path('labels', request))

    return dict(page_id="labels", label=label, translations=translations)
