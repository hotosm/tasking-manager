import React from 'react';

import { DueDateBox } from '../../../components/projectCard/dueDateBox';
import { createComponentWithIntl } from '../../../utils/testWithIntl';

it('test relative date formatting in English', () => {
  // six days of milliseconds plus a few seconds for the test
  const sixDaysOut = 6 * 86400 * 1000 + 10000 + Date.now();
  const testDueDateBox = createComponentWithIntl(<DueDateBox dueDate={sixDaysOut} />);
  const testInstance = testDueDateBox.root;
  expect(testInstance.findByType(DueDateBox).props.dueDate).toBe(sixDaysOut);
  // console.log(testInstance.findAllByType('span')[1].children);

  expect(
    //find the FormattedMessage rendered component
    testInstance.findByProps({ className: 'indent' }).children,
  ).toContain('6 days left');
});
