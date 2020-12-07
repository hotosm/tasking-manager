import React from 'react';
import ReactTooltip from 'react-tooltip';

import { DueDateBox } from '../../../components/projectCard/dueDateBox';
import { createComponentWithIntl } from '../../../utils/testWithIntl';

describe('test DueDate', () => {
  it('relative date formatting in English', () => {
    // six days of milliseconds plus a few seconds for the test
    const sixDaysOut = 6 * 86400 * 1000 + 10000 + Date.now();
    const testDueDateBox = createComponentWithIntl(<DueDateBox dueDate={sixDaysOut} />);
    const testInstance = testDueDateBox.root;
    expect(testInstance.findByType(DueDateBox).props.dueDate).toBe(sixDaysOut);
    expect(() => testInstance.findByType(ReactTooltip)).toThrow(
      new Error('No instances found with node type: "ReactTooltip"'),
    );
    expect(
      //find the FormattedMessage rendered component
      testInstance.findByProps({ className: 'indent' }).children,
    ).toContain('6 days left');
  });

  it('with tooltip message', () => {
    // five days of milliseconds plus a few seconds for the test
    const fiveDaysOut = 5 * 86400 * 1000 + 10000 + Date.now();
    const testDueDateBox = createComponentWithIntl(
      <DueDateBox dueDate={fiveDaysOut} tooltipMsg="Tooltip works" />,
    );
    const testInstance = testDueDateBox.root;
    expect(testInstance.findByType(DueDateBox).props.dueDate).toBe(fiveDaysOut);
    expect(testInstance.findByType(ReactTooltip).props.place).toBe('bottom');
    expect(testInstance.findAllByType('span')[0].props['data-tip']).toBe('Tooltip works');
    expect(
      //find the FormattedMessage rendered component
      testInstance.findByProps({ className: 'indent' }).children,
    ).toContain('5 days left');
  });
});
