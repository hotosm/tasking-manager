import { removeUnavailableImagerySources } from '../idEditorContext';

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
