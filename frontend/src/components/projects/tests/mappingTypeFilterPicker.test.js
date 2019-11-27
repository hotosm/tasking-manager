import React from 'react';
import TestRenderer from 'react-test-renderer';
import { IntlProvider } from 'react-intl';

import { MappingTypeFilterPicker } from '../mappingTypeFilterPicker';
import { RoadIcon } from '../../svgIcons';

const createComponentWithIntl = (children, props = { locale: 'en' }) => {
  return TestRenderer.create(<IntlProvider {...props}>{children}</IntlProvider>);
};

it('mapping type options show the road icon', () => {
  const filtersForm = createComponentWithIntl(<MappingTypeFilterPicker />);
  const testInstance = filtersForm.root;
  // RoadIcon is present because mapping types is rendered
  expect(() => testInstance.findByType(RoadIcon)).not.toThrow(
    new Error('No instances found with node type: "RoadIcon"'),
  );
});
