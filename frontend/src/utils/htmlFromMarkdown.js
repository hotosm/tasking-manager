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

export const formatUserNamesToLink = (text) => {
  const regex = /@\[([^\]]+)\]/gi;
  // Find usernames with a regular expression. They all start with '[@' and end with ']'
  const usernames = text && text.match(regex);
  if (usernames) {
    for (let i = 0; i < usernames.length; i++) {
      // Strip off the first two characters: '@['
      let username = usernames[i].substring(2, usernames[i].length);
      // Strip off the last character
      username = username.substring(0, username.length - 1);
      text = text.replace(
        usernames[i],
        `<a class="pointer blue-grey b underline" href="/users/${username}">@${username}</a>`,
      );
    }
  }
  return text;
};
