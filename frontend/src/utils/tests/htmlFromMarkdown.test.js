import { htmlFromMarkdown, formatUserNamesToLink } from '../htmlFromMarkdown';

test('htmlFromMarkdown returns correct content', () => {
  expect(htmlFromMarkdown('![test](https://a.co/img.jpg)').__html).toContain(
    '<p><img alt="test" src="https://a.co/img.jpg"></p>',
  );
  expect(htmlFromMarkdown('[test](https://a.co/)').__html).toContain(
    '<p><a href="https://a.co/" target="_blank">test</a></p>',
  );
});

test('htmlFromMarkdown with youtube tag', () => {
  const html = htmlFromMarkdown('::youtube[UzT0i5XhsOQ]').__html;
  expect(html).toContain('<iframe');
  expect(html).toContain('width="480"');
  expect(html).toContain('height="270"');
  expect(html).toContain('style="border: 0;"');
  expect(html).toContain('title="YouTube Video"');
  expect(html).toContain('frameborder="0"');
  expect(html).toContain(
    'allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"',
  );
  expect(html).toContain('allowfullscreen=""');
  expect(html).toContain('src="https://www.youtube.com/embed/UzT0i5XhsOQ"');
});

test('htmlFromMarkdown should not render other iframes', () => {
  const html = htmlFromMarkdown('<iframe src="https://osm.org"></iframe>').__html;
  expect(html).not.toContain('<iframe');
  expect(html).not.toContain('src="https://osm.org"');
});

test('formatUserNamesToLink returns correct content', () => {
  expect(
    formatUserNamesToLink(
      'Hello @[test_user]! Welcome to OpenStreetMap! Contact me at test@test.com.',
    ),
  ).toBe(
    'Hello <a class="pointer blue-grey b underline" href="/users/test_user">@test_user</a>! Welcome to OpenStreetMap! Contact me at test@test.com.',
  );
  expect(formatUserNamesToLink('Hello @test, @test2], @[test3!')).toBe(
    'Hello @test, @test2], @[test3!',
  );
});
