import { marked } from 'marked';
import DOMPurify from 'dompurify';
import TurndownService from 'turndown';
import { gfm } from 'turndown-plugin-gfm';

const VIDEO_TAG_REGEXP = new RegExp(/^::youtube\[(.*)\]$/);

const parseMarkdown = (markdownText) => {
  marked.use({
    gfm: false,
    extensions: [
      {
        name: 'videoExt',
        level: 'inline',
        start: (src) => {
          const m = src.match(/^::youtube/);

          if (m) {
            return m.index;
          }
        },
        tokenizer: function (src) {
          const match = VIDEO_TAG_REGEXP.exec(src);

          if (match) {
            return {
              type: 'videoExt',
              raw: match[0],
              text: match[1].trim(),
              tokens: [],
            };
          }
        },
        renderer: function (token) {
          const videoId = token.text;

          return `
            <iframe
              src="https://www.youtube.com/embed/${videoId}"
              width="480" height="270"
              style="border: 0;"
              title="YouTube Video"
              frameborder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowfullscreen>
            </iframe>
          `;
        },
      },
    ],
  });
  return marked.parse(markdownText);
};

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

  DOMPurify.addHook('uponSanitizeElement', (node, data) => {
    if (data.tagName === 'iframe') {
      const src = node.getAttribute('src') || '';
      // allow only youtube urls to be embedded in iframes
      if (!src.startsWith('https://www.youtube.com/embed/')) {
        return node.parentNode?.removeChild(node);
      }
    }
  });

  const config = {
    ADD_TAGS: ['iframe'],
    ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder'],
  };

  return { __html: DOMPurify.sanitize(parseMarkdown(markdownText), config) };
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
        `<a class="pointer blue-grey underline" style="color: #d73f3f" href="/users/${username}">@${username}</a>`,
      );
    }
  }
  return text;
};

const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  hr: '---',
  bullet: '-',
  emDelimiter: '*',
});

// Custom escape function to avoid escaping brackets [ ] and other common characters
// which fixes the task list issue \[x\] and makes the output cleaner.
turndownService.escape = (string) => {
  return string
    .replace(/\\/g, '\\\\')
    .replace(/\*/g, '\\*')
    .replace(/_/g, '\\_')
    .replace(/`/g, '\\`')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/#/g, '\\#');
};

turndownService.use(gfm);

// Rule to force '-' bullets for unordered lists
turndownService.addRule('listItem', {
  filter: 'li',
  replacement: function (content, node, options) {
    content = content
      .replace(/^\n+/, '') // remove leading newlines
      .replace(/\n+$/, '\n') // replace trailing newlines with just one
      .replace(/\n/gm, '\n    '); // indent content
    let prefix = options.bullet + ' ';
    const parent = node.parentNode;
    if (parent.nodeName === 'OL') {
      const start = parent.getAttribute('start');
      const index = Array.prototype.indexOf.call(parent.children, node);
      prefix = (start ? Number(start) + index : index + 1) + '. ';
    }
    return prefix + content + (node.nextSibling && !/\n$/.test(content) ? '\n' : '');
  },
});

// Rule to use double tildes for strikethrough
turndownService.addRule('strikethrough', {
  filter: ['del', 's', 'strike'],
  replacement: (content) => `~~${content}~~`,
});

// Rule to keep HTML comments
turndownService.addRule('keepComments', {
  filter: (node) => node.nodeType === 8,
  replacement: (content, node) => `\n<!--${node.data}-->\n`,
});

// Rule to keep other iframes
turndownService.keep(['iframe']);

export const markdownFromHtml = (html) => {
  const markdown = turndownService.turndown(html);
  return markdown
    .replace(/(#+ .+\n)\n+(?=#+ .+)/g, '$1') // Remove blank lines between consecutive headers
    .replace(/\n{3,}/g, '\n\n') // Max two newlines
    .trim();
};
