import React from 'react';
import { createComponentWithReduxAndIntl } from '../../../utils/testWithIntl';
import { DateRangeFilterSelect } from '../filterSelectFields';

describe('tests for selecting date range filters for not custom date ranges', () => {
  const element = createComponentWithReduxAndIntl(
    <DateRangeFilterSelect
      fieldsetName="dateRange"
      fieldsetStyle="bn dib pv0-ns pv2 ph2-ns ph1 mh0 mb1 w-30-ns w-100"
      isCustomDateRange={false}
    />,
  );
  const instance = element.root;
  it('has the passed classname for fieldset', () => {
    expect(instance.findByType('fieldset').props.className).toEqual(
      'bn dib pv0-ns pv2 ph2-ns ph1 mh0 mb1 w-30-ns w-100',
    );
  });

  it('should render six options if the date is not custom input', () => {
    expect(instance.findByProps({ classNamePrefix: 'react-select' }).props.options.length).toEqual(
      6,
    );
  });

  it("should set the default dropdown value to 'thisYear'", () => {
    expect(instance.findByProps({ classNamePrefix: 'react-select' }).props.value[0].value).toEqual(
      'thisYear',
    );
  });
});
