import marked from 'marked';
import DOMPurify from 'dompurify';

/* per https://stackoverflow.com/a/34688574/272018 */
export const htmlFromMarkdown = (markdownText) => {
  DOMPurify.addHook('afterSanitizeAttributes', function (node) {
    // set all elements owning target to target=_blank
    if ('target' in node) {
      node.setAttribute('target', '_blank');
    }
    // set non-HTML/MathML links to xlink:show=new
    if (
      !node.hasAttribute('target') &&
      (node.hasAttribute('xlink:href') || node.hasAttribute('href'))
    ) {
      node.setAttribute('xlink:show', 'new');
    }
  });
  return { __html: DOMPurify.sanitize(marked(markdownText)) };
};
