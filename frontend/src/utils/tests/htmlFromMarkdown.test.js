import { htmlFromMarkdown, formatUserNamesToLink } from '../htmlFromMarkdown';

test('htmlFromMarkdown returns correct content', () => {
  expect(htmlFromMarkdown('![test](https://a.co/img.jpg)').__html).toContain(
    '<p><img alt="test" src="https://a.co/img.jpg"></p>',
  );
  expect(htmlFromMarkdown('[test](https://a.co/)').__html).toContain(
    '<p><a href="https://a.co/" target="_blank">test</a></p>',
  );
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
