import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import { screen } from '@testing-library/react';
import { ReactRouter6Adapter } from 'use-query-params/adapters/react-router-6';

import { QueryParamProvider } from 'use-query-params';

import {
  createComponentWithIntl,
  ReduxIntlProviders,
  renderWithRouter,
} from '../../../utils/testWithIntl';
import { MappingTypeFilterPicker } from '../mappingTypeFilterPicker';
import { RoadIcon } from '../../svgIcons';

it('mapping type options show the road icon', () => {
  const filtersForm = createComponentWithIntl(
    <MemoryRouter>
      <MappingTypeFilterPicker />
    </MemoryRouter>,
  );
  const testInstance = filtersForm.root;
  // RoadIcon is present because mapping types is rendered
  expect(() => testInstance.findByType(RoadIcon)).not.toThrow(
    new Error('No instances found with node type: "RoadIcon"'),
  );
});

it('should set query for the clicked icon', async () => {
  const setMappingTypesQueryMock = jest.fn();
  const { user } = renderWithRouter(
    <ReduxIntlProviders>
      <QueryParamProvider adapter={ReactRouter6Adapter}>
        <MappingTypeFilterPicker setMappingTypesQuery={setMappingTypesQueryMock} />
      </QueryParamProvider>
    </ReduxIntlProviders>,
  );
  await user.click(
    screen.getByRole('checkbox', {
      name: /roads/i,
    }),
  );
  expect(setMappingTypesQueryMock).toHaveBeenCalledWith(['ROADS'], 'pushIn');
});

it('should highlight active selected map icon', async () => {
  const setMappingTypesQueryMock = jest.fn();
  renderWithRouter(
    <ReduxIntlProviders>
      <QueryParamProvider adapter={ReactRouter6Adapter}>
        <MappingTypeFilterPicker
          mappingTypes={['ROADS']}
          setMappingTypesQuery={setMappingTypesQueryMock}
        />
      </QueryParamProvider>
    </ReduxIntlProviders>,
  );
  expect(screen.getByTitle('roads')).toHaveClass('blue-dark');
  expect(screen.getByTitle('buildings')).not.toHaveClass('blue-dark');
});

it('should concatinate values with the present query', async () => {
  const setMappingTypesQueryMock = jest.fn();
  const { user } = renderWithRouter(
    <ReduxIntlProviders>
      <QueryParamProvider adapter={ReactRouter6Adapter}>
        <MappingTypeFilterPicker
          mappingTypes={['ROADS', 'BUILDINGS']}
          setMappingTypesQuery={setMappingTypesQueryMock}
        />
      </QueryParamProvider>
    </ReduxIntlProviders>,
  );

  await user.click(
    screen.getByRole('checkbox', {
      name: /waterways/i,
    }),
  );
  expect(setMappingTypesQueryMock).toHaveBeenCalledWith(
    ['ROADS', 'BUILDINGS', 'WATERWAYS'],
    'pushIn',
  );
});

it('should deselect from the query value', async () => {
  const setMappingTypesQueryMock = jest.fn();
  const { user } = renderWithRouter(
    <ReduxIntlProviders>
      <QueryParamProvider adapter={ReactRouter6Adapter}>
        <MappingTypeFilterPicker
          mappingTypes={['ROADS', 'BUILDINGS']}
          setMappingTypesQuery={setMappingTypesQueryMock}
        />
      </QueryParamProvider>
    </ReduxIntlProviders>,
  );

  await user.click(
    screen.getByRole('checkbox', {
      name: /roads/i,
    }),
  );
  expect(setMappingTypesQueryMock).toHaveBeenCalledWith(['BUILDINGS'], 'pushIn');
});
