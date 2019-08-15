import React from 'react';
import TestRenderer from 'react-test-renderer';
import { FormattedNumber, IntlProvider } from 'react-intl';

import { NextMappingLevel } from '../settings';
import { MappingLevelMessage } from '../../mappingLevel';

const createComponentWithIntl = (children, props = { locale: 'en' }) => {
  return TestRenderer.create(<IntlProvider {...props}>{children}</IntlProvider>);
};

it('changesets missing to intermediate level', () => {
  const element = createComponentWithIntl(<NextMappingLevel changesetsCount={100} />);
  const elementInstance = element.root;
  expect(elementInstance.findByType(FormattedNumber).props.value).toBe(150);
  expect(elementInstance.findByType(MappingLevelMessage).props.level).toBe('INTERMEDIATE');
});

it('changesets missing to advanced level', () => {
  const element = createComponentWithIntl(<NextMappingLevel changesetsCount={300} />);
  const elementInstance = element.root;
  expect(elementInstance.findByType(FormattedNumber).props.value).toBe(200);
  expect(elementInstance.findByType(MappingLevelMessage).props.level).toBe('ADVANCED');
});

it('user already is advanced', () => {
  const element = createComponentWithIntl(<NextMappingLevel changesetsCount={600} />);
  const elementInstance = element.root;
  expect(() => elementInstance.findByType(FormattedNumber)).toThrow(
    new Error('No instances found with node type: "FormattedNumber"'),
  );
  expect(() => elementInstance.findByType(MappingLevelMessage)).toThrow(
    new Error('No instances found with node type: "MappingLevelMessage"'),
  );
});
