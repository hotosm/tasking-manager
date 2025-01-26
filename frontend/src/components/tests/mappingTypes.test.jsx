import { MappingTypes } from '../mappingTypes';
import { IntlProviders } from '../../utils/testWithIntl';
import { render, screen } from '@testing-library/react';

test('test if MappingTypes with BUILDINGS option returns the correct icon', () => {
  const { container } = render(
    <IntlProviders>
      <MappingTypes types={['BUILDINGS']} colorClass={'blue'} />
    </IntlProviders>,
  );
  expect(container.querySelector('.ml1.mr3.blue')).toBeInTheDocument();
  expect(container.querySelector('.ml1.mr3.blue')).toHaveStyle({
    height: '23',
  });
});

test('test if MappingTypes with ROADS and WATERWAYS option returns the correct icon', () => {
  const { container } = render(
    <IntlProviders>
      <MappingTypes types={['ROADS', 'WATERWAYS']} colorClass={'blue'} />
    </IntlProviders>,
  );
  expect(container.querySelectorAll('svg')).toHaveLength(5);
  expect(container.querySelectorAll('.ml1.mr3.blue')).toHaveLength(2);
  expect(container.querySelectorAll('.ml1.mr3.grey-light')).toHaveLength(3);
  expect(screen.getByTitle('Roads')).toBeInTheDocument();
  expect(screen.getByTitle('Buildings')).toBeInTheDocument();
  expect(screen.getByTitle('Land use')).toBeInTheDocument();
  expect(screen.getByTitle('Waterways')).toBeInTheDocument();
  expect(screen.getByTitle('Other')).toBeInTheDocument();
});

test('test if MappingTypes with LAND_USE option returns the correct icon color', () => {
  const { container } = render(
    <IntlProviders>
      <MappingTypes types={['LAND_USE']} colorClass={'red'} />
    </IntlProviders>,
  );
  expect(screen.getByTitle('Land use')).toBeInTheDocument();
  expect(screen.getByTitle('Land use').children[0]).toHaveClass('ml1 mr3 red');
  expect(container.querySelectorAll('.ml1.mr3.grey-light')).toHaveLength(4);
});

test('test if MappingTypes with OTHER option returns the correct icon color', () => {
  const { container } = render(
    <IntlProviders>
      <MappingTypes types={['OTHER']} colorClass={'red'} />
    </IntlProviders>,
  );
  expect(screen.getByTitle('Other')).toBeInTheDocument();
  expect(screen.getByTitle('Other').children[0]).toHaveClass('ml1 mr3 red');
  expect(container.querySelectorAll('.ml1.mr3.grey-light')).toHaveLength(4);
});

test('test if MappingTypes with empty array returns all icons in grey-light', () => {
  const { container } = render(
    <IntlProviders>
      <MappingTypes types={[]} colorClass={'red'} />
    </IntlProviders>,
  );
  expect(container.querySelectorAll('.ml1.mr3.grey-light')).toHaveLength(5);
});

test('test if MappingTypes with all type options returns all icons in red', () => {
  const { container } = render(
    <IntlProviders>
      <MappingTypes
        types={['ROADS', 'LAND_USE', 'BUILDINGS', 'WATERWAYS', 'OTHER']}
        colorClass="red"
      />
    </IntlProviders>,
  );
  expect(container.querySelectorAll('.ml1.mr3.red')).toHaveLength(5);
});
