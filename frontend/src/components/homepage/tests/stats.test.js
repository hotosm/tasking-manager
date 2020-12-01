import React from 'react';
import { FormattedNumber } from 'react-intl';

import { StatsNumber } from '../stats';
import { createComponentWithIntl } from '../../../utils/testWithIntl';

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
  expect(testInstance.children).not.toContain('K');
});
