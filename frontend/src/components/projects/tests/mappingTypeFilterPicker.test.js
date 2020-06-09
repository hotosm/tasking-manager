import React from 'react';

import { createComponentWithIntl } from '../../../utils/testWithIntl';
import { MappingTypeFilterPicker } from '../mappingTypeFilterPicker';
import { RoadIcon } from '../../svgIcons';

it('mapping type options show the road icon', () => {
  const filtersForm = createComponentWithIntl(<MappingTypeFilterPicker />);
  const testInstance = filtersForm.root;
  // RoadIcon is present because mapping types is rendered
  expect(() => testInstance.findByType(RoadIcon)).not.toThrow(
    new Error('No instances found with node type: "RoadIcon"'),
  );
});
