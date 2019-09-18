import marked from 'marked';
import DOMPurify from 'dompurify';

/* per https://stackoverflow.com/a/34688574/272018 */
export const htmlFromMarkdown = markdownText => ({
    __html: DOMPurify.sanitize(marked(markdownText)),
  });
  