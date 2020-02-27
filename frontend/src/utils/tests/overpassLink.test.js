import { formatOverpassLink, formatUserQuery } from '../overpassLink';

describe('test user query formatting', () => {
  it('with simple username', () => {
    expect(formatUserQuery('test', [0, 0, 1, 1])).toBe(
      'node(user:"test")(0,0,1,1);way(user:"test")(0,0,1,1);relation(user:"test")(0,0,1,1);',
    );
  });
  it('with username containing spaces', () => {
    expect(formatUserQuery('test user', [0, 0, 1.5, 1.5])).toBe(
      'node(user:"test user")(0,0,1.5,1.5);way(user:"test user")(0,0,1.5,1.5);relation(user:"test user")(0,0,1.5,1.5);',
    );
  });
});

describe('test overpass link formatting', () => {
  const overpassLink = formatOverpassLink(['test'], [0, 1, 1, 2]);
  it('starts with the overpass-turbo.eu address', () => {
    expect(overpassLink.startsWith('https://overpass-turbo.eu/map.html?Q=')).toBeTruthy();
  });
  it('ends with the correct query', () => {
    const query =
      '[out:json][timeout:250];(node(user:"test")(1,0,2,1);way(user:"test")(1,0,2,1);relation(user:"test")(1,0,2,1););out body;>;out skel qt;';
    expect(overpassLink.endsWith(encodeURIComponent(query))).toBeTruthy();
  });
});

describe('test overpass link formatting with multiple users', () => {
  const overpassLink = formatOverpassLink(['test', 'user_2'], [0, 1, 1, 2]);
  it('has the correct query', () => {
    const query =
      '[out:json][timeout:250];(node(user:"test")(1,0,2,1);way(user:"test")(1,0,2,1);relation(user:"test")(1,0,2,1);node(user:"user_2")(1,0,2,1);way(user:"user_2")(1,0,2,1);relation(user:"user_2")(1,0,2,1););out body;>;out skel qt;';
    expect(overpassLink.endsWith(encodeURIComponent(query))).toBeTruthy();
  });
});

describe('test overpass download link formatting', () => {
  const overpassLink = formatOverpassLink(['test'], [0, 1, 1, 2], true);
  it('starts with the overpass-turbo.eu address', () => {
    expect(overpassLink.startsWith('https://overpass-api.de/api/interpreter?data=')).toBeTruthy();
  });
  it('ends with the correct query', () => {
    const query =
      '[out:xml][timeout:250];(node(user:"test")(1,0,2,1);way(user:"test")(1,0,2,1);relation(user:"test")(1,0,2,1););out body;>;out skel qt;';
    expect(overpassLink.endsWith(encodeURIComponent(query))).toBeTruthy();
  });
});
