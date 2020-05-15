import { getTwitterLink, getLinkedInLink, getFacebookLink } from '../shareFunctions';

describe('test create twitter links', () => {
  it('encodes correctly all params', () => {
    expect(
      getTwitterLink(
        'Contribute to project 42 on Tasking Manager!',
        'http://tasks.hotosm.org/projects/42',
        ['OpenStreetMap', 'hotosm'],
      ),
    ).toBe(
      'https://twitter.com/intent/tweet?text=Contribute%20to%20project%2042%20on%20Tasking%20Manager!&url=http%3A%2F%2Ftasks.hotosm.org%2Fprojects%2F42&hashtags=OpenStreetMap,hotosm',
    );
  });
});

describe('test create facebook links', () => {
  it('encodes correctly all params', () => {
    expect(
      getFacebookLink(
        'Contribute to project 42 on Tasking Manager!',
        'http://tasks.hotosm.org/projects/42',
      ),
    ).toBe(
      'https://web.facebook.com/sharer/sharer.php?display=popup&u=http%3A%2F%2Ftasks.hotosm.org%2Fprojects%2F42&quote=Contribute%20to%20project%2042%20on%20Tasking%20Manager!',
    );
  });
});

describe('test create LinkedIn link', () => {
  it('encodes correctly the URL', () => {
    expect(getLinkedInLink('http://osm.org')).toBe(
      'https://www.linkedin.com/sharing/share-offsite/?url=http%3A%2F%2Fosm.org',
    );
  });
});
