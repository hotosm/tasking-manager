from markdown import Extension
from markdown.inlinepatterns import Pattern
import oembed

DEFAULT_ENDPOINTS = [
    # Youtube
    oembed.OEmbedEndpoint('http://www.youtube.com/oembed', [
        'https?://(*.)?youtube.com/*',
        'https?://youtu.be/*',
    ]),

    # Flickr
    oembed.OEmbedEndpoint('http://www.flickr.com/services/oembed/', [
        'https?://*.flickr.com/*',
    ]),

    # Vimeo
    oembed.OEmbedEndpoint('http://vimeo.com/api/oembed.json', [
        'https?://vimeo.com/*',
    ]),
]

OEMBED_LINK_RE = r'\!\[([^\]]*)\]\(((?:https?:)?//[^\)]*)' \
                 r'(?<!png)(?<!jpg)(?<!jpeg)(?<!gif)\)'


class OEmbedLinkPattern(Pattern):
    def __init__(self, pattern, markdown_instance=None, oembed_consumer=None):
        Pattern.__init__(self, pattern, markdown_instance)
        self.consumer = oembed_consumer

    def handleMatch(self, match):
        html = self.get_oembed_html_for_match(match)
        if html is None:
            return None
        else:
            html = "<figure class=\"oembed\">%s</figure>" % html
            placeholder = self.markdown.htmlStash.store(html, True)
            return placeholder

    def get_oembed_html_for_match(self, match):
        url = match.group(3).strip()
        try:
            response = self.consumer.embed(url)
        except oembed.OEmbedNoEndpoint:
            return None
        else:
            return response['html']


class OEmbedExtension(Extension):
    def __init__(self, **kwargs):
        self.config = {
            'allowed_endpoints': [
                DEFAULT_ENDPOINTS,
                "A list of oEmbed endpoints to allow. Defaults to "
                "endpoints.DEFAULT_ENDPOINTS"
            ],
        }
        super(OEmbedExtension, self).__init__(**kwargs)
        self.oembed_consumer = self.prepare_oembed_consumer()

    def extendMarkdown(self, md, md_globals):
        link_pattern = OEmbedLinkPattern(OEMBED_LINK_RE, md,
                                         self.oembed_consumer)
        md.inlinePatterns.add('oembed_link', link_pattern, '<image_link')

    def prepare_oembed_consumer(self):
        allowed_endpoints = self.getConfig('allowed_endpoints',
                                           DEFAULT_ENDPOINTS)
        consumer = oembed.OEmbedConsumer()

        if allowed_endpoints:
            for endpoint in allowed_endpoints:
                consumer.addEndpoint(endpoint)

        return consumer
