import React from 'react';
import TestRenderer from 'react-test-renderer';
import { FormattedNumber, IntlProvider } from 'react-intl';

import { StatsNumber } from '../stats';

const createComponentWithIntl = (children, props = { locale: 'en' }) => {
  return TestRenderer.create(<IntlProvider {...props}>{children}</IntlProvider>);
};

it('test number formatting in English', () => {
  const testNumber = createComponentWithIntl(<StatsNumber value={744531} />);
  const testInstance = testNumber.root;
  expect(testInstance.findByType(FormattedNumber).props.value).toBe(744.5);
  expect(testInstance.findByType('span').children).toContain('K');
});

it('test number formatting smaller than 1000', () => {
  const testNumber = createComponentWithIntl(<StatsNumber value={744} />);
  const testInstance = testNumber.root;
  expect(testInstance.findByType(FormattedNumber).props.value).toBe(744);
  expect(testInstance.findByType('span').children).not.toContain('K');
});
