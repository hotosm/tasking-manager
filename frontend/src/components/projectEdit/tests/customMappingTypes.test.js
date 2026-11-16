import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';

import { CustomMappingTypes, CUSTOM_MAPPING_TYPES_LIMIT } from '../customMappingTypes';
import { IntlProviders } from '../../../utils/testWithIntl';

const SEAGRASS = {
  name: 'Seagrass',
  tags: ['seamark:type=seagrass'],
  attributes: [],
  geometries: [],
};

const Harness = ({ initial }) => {
  const [projectInfo, setProjectInfo] = useState({ customMappingTypes: initial });
  return (
    <IntlProviders>
      <CustomMappingTypes
        customMappingTypes={projectInfo.customMappingTypes}
        setProjectInfo={setProjectInfo}
      />
      <pre data-testid="state">{JSON.stringify(projectInfo.customMappingTypes)}</pre>
    </IntlProviders>
  );
};

const state = () => JSON.parse(screen.getByTestId('state').textContent);

describe('CustomMappingTypes', () => {
  it('adds an empty custom mapping type', async () => {
    const user = userEvent.setup();
    render(<Harness initial={[]} />);
    await user.click(screen.getByRole('button', { name: /Add custom mapping type/i }));
    expect(state()).toEqual([{ name: '', tags: [], attributes: [], geometries: [] }]);
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
  });

  it('edits the name and geometries of a type', async () => {
    const user = userEvent.setup();
    render(<Harness initial={[SEAGRASS]} />);
    await user.clear(screen.getByLabelText('Name'));
    await user.type(screen.getByLabelText('Name'), 'Seagrass beds');
    await user.click(screen.getAllByRole('checkbox')[2]);
    expect(state()[0]).toEqual({
      ...SEAGRASS,
      name: 'Seagrass beds',
      geometries: ['polygons'],
    });
  });

  it('only creates tags written as key=value', async () => {
    const user = userEvent.setup();
    render(<Harness initial={[{ ...SEAGRASS, tags: [] }]} />);
    const tagsInput = screen.getByLabelText('Tags');
    await user.type(tagsInput, 'not a tag{enter}');
    expect(state()[0].tags).toEqual([]);
    await user.clear(tagsInput);
    await user.type(tagsInput, 'amenity=drinking_water{enter}');
    await user.type(tagsInput, 'waterway=*{enter}');
    expect(state()[0].tags).toEqual(['amenity=drinking_water', 'waterway=*']);
  });

  it('only creates attributes that are OSM keys', async () => {
    const user = userEvent.setup();
    render(<Harness initial={[SEAGRASS]} />);
    const attributesInput = screen.getByLabelText('Extra attributes (optional)');
    await user.type(attributesInput, "x') AS y{enter}");
    expect(state()[0].attributes).toEqual([]);
    await user.clear(attributesInput);
    await user.type(attributesInput, 'addr:street{enter}');
    expect(state()[0].attributes).toEqual(['addr:street']);
  });

  it('removes a type', async () => {
    const user = userEvent.setup();
    render(<Harness initial={[SEAGRASS, { ...SEAGRASS, name: 'Wells' }]} />);
    await user.click(screen.getAllByRole('button', { name: 'Remove' })[0]);
    expect(state().map((customType) => customType.name)).toEqual(['Wells']);
  });

  it('stops adding types at the limit', () => {
    render(<Harness initial={Array(CUSTOM_MAPPING_TYPES_LIMIT).fill(SEAGRASS)} />);
    expect(screen.getByRole('button', { name: /Add custom mapping type/i })).toBeDisabled();
  });
});
