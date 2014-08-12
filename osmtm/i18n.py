# subscribers.py

from pyramid.i18n import get_localizer
from pyramid.events import (
    NewRequest,
    BeforeRender,
    subscriber,
)

DEFAULT_TRANSLATION_DOMAIN = 'osmtm'


@subscriber(BeforeRender)
def add_renderer_globals(event):
    request = event['request']
    event['_'] = request.translate
    # ngettext is used to define a translatable plural string as one of the
    # supported keywords by Babel """https://github.com/mitsuhiko/babel/blob/
    # master/babel/messages/extract.py#L34"""
    event['ngettext'] = request.plural_translate
    event['localizer'] = request.localizer


@subscriber(NewRequest)
def add_localizer(event):
    request = event.request
    localizer = get_localizer(request)

    def auto_translate(*args, **kwargs):
        # set the default domain if not provided by the context
        kwargs.setdefault('domain', DEFAULT_TRANSLATION_DOMAIN)

        return localizer.translate(*args, **kwargs)

    def translate_plural(*args, **kwargs):
        # set the default domain if not provided by the context
        kwargs.setdefault('domain', DEFAULT_TRANSLATION_DOMAIN)

        return localizer.pluralize(*args, **kwargs)

    request.localizer = localizer
    request.translate = auto_translate
    request.plural_translate = translate_plural


@subscriber(NewRequest)
def setAcceptedLanguagesLocale(event):
    if not event.request.accept_language:
        return
    accepted = event.request.accept_language
    event.request._LOCALE_ = accepted.best_match(
        event.request.registry.settings.available_languages.split(),
        event.request.registry.settings.default_locale_name)


def custom_locale_negotiator(request):
    """ The :term:`custom locale negotiator`. Returns a locale name.

    - First, the negotiator looks for the ``_LOCALE_`` attribute of
      the request object (possibly set by a view or a listener for an
      :term:`event`).

    - Then it looks for the ``request.params['_LOCALE_']`` value.

    - Then it looks for the ``request.cookies['_LOCALE_']`` value.

    - Then it looks for the ``Accept-Language`` header value,
      which is set by the user in his/her browser configuration.

    - Finally, if the locale could not be determined via any of
      the previous checks, the negotiator returns the
      :term:`default locale name`.
    """

    name = '_LOCALE_'
    if request.params.get(name) is not None:
        return request.params.get(name)
    if request.cookies.get(name) is not None:
        return request.cookies.get(name)
    return request.accept_language.best_match(
        request.registry.settings.available_languages.split(),
        request.registry.settings.default_locale_name)
