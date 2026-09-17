import { removeUnavailableImagerySources, setBackgroundHashParam } from '../idEditorContext';

describe('removeUnavailableImagerySources', () => {
  it('removes the unavailable Kontur imagery source', () => {
    const background = {
      sources: jest.fn(() => [
        { id: 'Bing' },
        { id: 'OpenAerialMapMosaic' },
        { id: 'EsriWorldImagery' },
      ]),
    };

    removeUnavailableImagerySources(background);

    expect(background.sources()).toEqual([{ id: 'Bing' }, { id: 'EsriWorldImagery' }]);
  });

  it('wraps each background source lookup only once', () => {
    const originalSources = jest.fn(() => [{ id: 'Bing' }]);
    const background = { sources: originalSources };

    removeUnavailableImagerySources(background);
    const filteredSources = background.sources;
    removeUnavailableImagerySources(background);

    expect(background.sources).toBe(filteredSources);
    expect(background.sources()).toEqual([{ id: 'Bing' }]);
    expect(originalSources).toHaveBeenCalledTimes(1);
  });

  it('forwards all source lookup arguments', () => {
    const originalSources = jest.fn(() => [{ id: 'Bing' }]);
    const background = { sources: originalSources };
    const extent = { min: [0, 0], max: [1, 1] };

    removeUnavailableImagerySources(background);
    background.sources(extent, 18, true);

    expect(originalSources).toHaveBeenCalledWith(extent, 18, true);
  });

  it('filters separate official and Sandbox background instances', () => {
    const createBackground = () => ({
      sources: () => [{ id: 'OpenAerialMapMosaic' }, { id: 'Bing' }],
    });
    const officialBackground = createBackground();
    const sandboxBackground = createBackground();

    removeUnavailableImagerySources(officialBackground);
    removeUnavailableImagerySources(sandboxBackground);

    expect(officialBackground.sources()).toEqual([{ id: 'Bing' }]);
    expect(sandboxBackground.sources()).toEqual([{ id: 'Bing' }]);
  });

  it('ignores a missing background', () => {
    expect(() => removeUnavailableImagerySources()).not.toThrow();
  });
});

describe('setBackgroundHashParam', () => {
  // iD reads the hash with URLSearchParams (utilStringQs), so compare the same
  // way rather than as raw strings -- how `:` and `{}` get percent-encoded is
  // irrelevant to it.
  const hashParams = () => new URLSearchParams(window.location.hash.replace(/^#/, ''));

  beforeEach(() => {
    window.history.replaceState(null, '', '#');
  });

  it('names a built-in source directly', () => {
    setBackgroundHashParam('EsriWorldImagery');
    expect(hashParams().get('background')).toEqual('EsriWorldImagery');
  });

  it('prefixes a custom template with custom:, as iD expects', () => {
    setBackgroundHashParam('https://example.com/{z}/{x}/{y}.png');
    expect(hashParams().get('background')).toEqual('custom:https://example.com/{z}/{x}/{y}.png');
  });

  it('asks for Bing explicitly when the project has no imagery', () => {
    setBackgroundHashParam(null);
    expect(hashParams().get('background')).toEqual('Bing');
    setBackgroundHashParam(undefined);
    expect(hashParams().get('background')).toEqual('Bing');
  });

  it('replaces a background left over from a previous project and keeps the rest of the hash', () => {
    window.history.replaceState(null, '', '#map=18.00/27.74/85.32&background=Bing');
    setBackgroundHashParam('EsriWorldImagery');
    expect(hashParams().get('background')).toEqual('EsriWorldImagery');
    expect(hashParams().get('map')).toEqual('18.00/27.74/85.32');
  });
});
