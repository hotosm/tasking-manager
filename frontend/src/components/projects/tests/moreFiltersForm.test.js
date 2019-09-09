import React from 'react';
import TestRenderer from 'react-test-renderer';
import { IntlProvider } from 'react-intl';
import { MoreFiltersForm } from '../moreFiltersForm';
import { RoadIcon } from '../../svgIcons';

const createComponentWithIntl = (children, props = { locale: 'en' }) => {
  return TestRenderer.create(<IntlProvider {...props}>{children}</IntlProvider>);
};

it('More filters form begins rendering with correct English title in first span', () => {
  const testFeaturedProjects = createComponentWithIntl(<MoreFiltersForm />);
  const testInstance = testFeaturedProjects.root;

  expect(testInstance.findAllByType('span')[0].children).toContain('Types of Mapping');
});

it('mapping type options show the road icon', () => {
  const testFeaturedProjects = createComponentWithIntl(<MoreFiltersForm />);
  const testInstance = testFeaturedProjects.root;
  // RoadIcon is present because mapping types is rendered
  expect(() => testInstance.findByType(RoadIcon)).not.toThrow(
    new Error('No instances found with node type: "RoadIcon"'),
  );
});
