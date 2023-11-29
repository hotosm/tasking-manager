import { generateStartingHash, equalsUrlParameters } from '../rapidEditor';

describe('equalsUrlParameters', () => {
  // This is a mini polyfill for Node 16, 17, and 18. Node 19 actually implements URLSearchParams.size.
  // See https://nodejs.org/api/url.html#urlsearchparamssize for details.
  if (!('size' in URLSearchParams.prototype)) {
    const prototype = URLSearchParams.prototype;
    Object.defineProperty(prototype, 'size', {
      get: function () {
        let counter = 0;
        for (const [_] of this) {
          counter += 1;
        }
        return counter;
      },
    });
  }
  it('equals', () => {
    expect(
      equalsUrlParameters(
        new URLSearchParams('comment=something&presets=null'),
        new URLSearchParams('presets=null&comment=something'),
      ),
    ).toBeTruthy();
  });
  it('not equals', () => {
    expect(
      equalsUrlParameters(
        new URLSearchParams('comment=something&presets=null'),
        new URLSearchParams('comment=something'),
      ),
    ).toBeFalsy();
    expect(
      equalsUrlParameters(
        new URLSearchParams('comment=something&presets=null'),
        new URLSearchParams('presets=null'),
      ),
    ).toBeFalsy();
    expect(
      equalsUrlParameters(
        new URLSearchParams('comment=something&presets=null'),
        new URLSearchParams(''),
      ),
    ).toBeFalsy();
    expect(
      equalsUrlParameters(
        new URLSearchParams('comment=something&presets=null'),
        new URLSearchParams('comment=something&presets=null&data=extra'),
      ),
    ).toBeFalsy();
    expect(
      equalsUrlParameters(
        new URLSearchParams('comment=something&presets=null&data=extra'),
        new URLSearchParams('comment=something&presets=null'),
      ),
    ).toBeFalsy();
    expect(
      equalsUrlParameters(
        new URLSearchParams('comment=something1&presets=null'),
        new URLSearchParams('presets=null&comment=something2'),
      ),
    ).toBeFalsy();
    expect(
      equalsUrlParameters(
        new URLSearchParams('comment1=something&presets=null'),
        new URLSearchParams('presets=null&comment2=something'),
      ),
    ).toBeFalsy();
  });
});

describe('generateStartingHash', () => {
  it('only comment', () => {
    expect(generateStartingHash({ comment: 'random comment' }).toString()).toEqual(
      new URLSearchParams('comment=random comment').toString(),
    );
  });
  it('only presets', () => {
    expect(
      generateStartingHash({
        presets: ['barrier/gate', 'building', 'highway/motorway'],
      }).toString(),
    ).toEqual(new URLSearchParams('presets=barrier/gate,building,highway/motorway').toString());
  });
  it('only gpxUrl', () => {
    expect(generateStartingHash({ gpxUrl: 'https://example.com/gpx/track' }).toString()).toEqual(
      new URLSearchParams('data=https://example.com/gpx/track').toString(),
    );
  });
  it('only powerUser', () => {
    expect(generateStartingHash({ powerUser: true }).toString()).toEqual(
      new URLSearchParams('poweruser=true').toString(),
    );
    expect(generateStartingHash({ powerUser: false }).toString()).toEqual(
      new URLSearchParams('poweruser=false').toString(),
    );
  });
  it('only imagery', () => {
    expect(generateStartingHash({ imagery: 'https://example.com/{x}/{y}/{z}' }).toString()).toEqual(
      new URLSearchParams('background=custom:https://example.com/{x}/{y}/{z}').toString(),
    );
    expect(generateStartingHash({ imagery: 'Bing' }).toString()).toEqual(
      new URLSearchParams('background=Bing').toString(),
    );
  });
});
