import React from 'react';
import TestRenderer from 'react-test-renderer';
import { IntlProvider } from 'react-intl';

import DueDateBox from '../../../components/projectcard/dueDateBox';

const createComponentWithIntl = (children, props = { locale: 'en' }) => {
  return TestRenderer.create(<IntlProvider {...props}>{children}</IntlProvider>);
};

it('test relative date formatting in English', () => {
  // six days of milliseconds plus a few seconds for the test
  const sixDaysOut = 6 * 86400 * 1000 + 10000 + Date.now();
  const testDueDateBox = createComponentWithIntl(<DueDateBox dueDate={sixDaysOut} />);
  const testInstance = testDueDateBox.root;
  expect(testInstance.findByType(DueDateBox).props.dueDate).toBe(sixDaysOut);
  // console.log(testInstance.findAllByType('span')[1].children);

  expect(
    //find the span inside the span
    testInstance.findAllByType('span')[2].children,
  ).toContain('6 days left');
});
