import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import { DownloadOsmData, customDownloadOptions, customMappingTypeSlug } from '../downloadOsmData';
import { IntlProviders } from '../../../utils/testWithIntl';

describe('customMappingTypeSlug', () => {
  it('names the folder the way the data export does', () => {
    expect(customMappingTypeSlug('Water points')).toBe('water_points');
    expect(customMappingTypeSlug(' Seagrass--beds ')).toBe('seagrass_beds');
  });
});

describe('customDownloadOptions', () => {
  it('offers every geometry of a custom mapping type', () => {
    const [option] = customDownloadOptions([{ name: 'Wells', tags: ['man_made=water_well'] }]);
    expect(option.title).toBe('wells');
    expect(option.label).toBe('Wells');
    expect(option.featuretype).toEqual([
      { type: 'points' },
      { type: 'lines' },
      { type: 'polygons' },
    ]);
  });
});

describe('DownloadOsmData', () => {
  it('lists custom mapping types next to the standard ones', () => {
    render(
      <IntlProviders>
        <DownloadOsmData
          projectMappingTypes={['BUILDINGS']}
          project={{
            projectId: 1,
            customMappingTypes: [{ name: 'Water points', tags: ['amenity=drinking_water'] }],
          }}
        />
      </IntlProviders>,
    );
    expect(screen.getByText('buildings')).toBeInTheDocument();
    expect(screen.getByText('Water points')).toBeInTheDocument();
    expect(screen.queryByText('roads')).not.toBeInTheDocument();
  });
});
