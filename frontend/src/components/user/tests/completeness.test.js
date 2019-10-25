import React from 'react';
import TestRenderer from 'react-test-renderer';
import { FormattedMessage, FormattedNumber, IntlProvider } from 'react-intl';

import { ProfileCompleteness } from '../completeness';

const createComponentWithIntl = (children, props = { locale: 'en' }) => {
  return TestRenderer.create(<IntlProvider {...props}>{children}</IntlProvider>);
};

const user0Percent = {
  validation_message: true,
  id: 1,
  username: 'user1',
  role: 'ADMIN',
  mappingLevel: 'ADVANCED',
  dateRegistered: '2019-04-08 10:51:26.758678',
  totalTimeSpent: 180.0,
  timeSpentMapping: 176.0,
  timeSpentValidating: 4.0,
  projectsMapped: 2,
  tasksMapped: 6,
  tasksValidated: 2,
  tasksInvalidated: 0,
  emailAddress: null,
  isEmailVerified: false,
  isExpert: false,
  twitterId: null,
  facebookId: null,
  linkedinId: null,
  slackId: null,
  ircId: null,
  skypeId: null,
  city: null,
  country: null,
  name: null,
  gender: null,
  missingMapsProfile: 'http://www.missingmaps.org/users/#/user1',
  osmProfile: 'https://www.openstreetmap.org/user/user1',
};

const incompleteProfile = {
  validation_message: true,
  id: 1,
  username: 'user1',
  role: 'ADMIN',
  mappingLevel: 'ADVANCED',
  dateRegistered: '2019-04-08 10:51:26.758678',
  totalTimeSpent: 180.0,
  timeSpentMapping: 176.0,
  timeSpentValidating: 4.0,
  projectsMapped: 2,
  tasksMapped: 6,
  tasksValidated: 2,
  tasksInvalidated: 0,
  emailAddress: 'user@mail.org',
  isEmailVerified: false,
  isExpert: false,
  twitterId: '_user1',
  facebookId: null,
  linkedinId: null,
  slackId: null,
  ircId: null,
  skypeId: null,
  city: 'Nairobi',
  country: 'Nigeria',
  name: 'The User',
  gender: 'SELF_DESCRIBE',
  selfDescriptionGender: 'random_gender',
  missingMapsProfile: 'http://www.missingmaps.org/users/#/user1',
  osmProfile: 'https://www.openstreetmap.org/user/user1',
};

const user100Percent = {
  validation_message: true,
  id: 1,
  username: 'user1',
  role: 'ADMIN',
  mappingLevel: 'ADVANCED',
  dateRegistered: '2019-04-08 10:51:26.758678',
  totalTimeSpent: 180.0,
  timeSpentMapping: 176.0,
  timeSpentValidating: 4.0,
  projectsMapped: 2,
  tasksMapped: 6,
  tasksValidated: 2,
  tasksInvalidated: 0,
  emailAddress: 'user@mail.org',
  isEmailVerified: true,
  isExpert: false,
  twitterId: '_user1',
  facebookId: 'user1',
  linkedinId: 'user',
  slackId: 'user_1',
  ircId: null,
  skypeId: null,
  city: 'Nairobi',
  country: 'Nigeria',
  name: 'The User',
  gender: 'SELF_DESCRIBE',
  selfDescriptionGender: 'random_gender',
  missingMapsProfile: 'http://www.missingmaps.org/users/#/user1',
  osmProfile: 'https://www.openstreetmap.org/user/user1',
};

it('test with a user who filled all profile fields', () => {
  const element = createComponentWithIntl(<ProfileCompleteness userDetails={user100Percent} />);
  const elementInstance = element.root;
  expect(elementInstance.findAllByType(FormattedMessage).map(i => i.props.id)).toContain(
    'user.completeness.lead.complete',
  );
  expect(elementInstance.findByType(FormattedNumber).props.value).toBe(1);
  expect(
    elementInstance.findByProps({ className: 'absolute bg-red br-pill hhalf hide-child' }).props
      .style.width,
  ).toBe('100%');
});

it('test with a user whose profile is 62.5% filled', () => {
  const element = createComponentWithIntl(<ProfileCompleteness userDetails={incompleteProfile} />);
  const elementInstance = element.root;
  expect(elementInstance.findAllByType(FormattedMessage).map(i => i.props.id)).toContain(
    'user.completeness.lead.high',
  );
  expect(elementInstance.findByType(FormattedNumber).props.value).toBe(0.7);
  expect(
    elementInstance.findByProps({ className: 'absolute bg-red br-pill hhalf hide-child' }).props
      .style.width,
  ).toBe('70%');
});

it('test with a user whose profile is 0% filled', () => {
  const element = createComponentWithIntl(<ProfileCompleteness userDetails={user0Percent} />);
  const elementInstance = element.root;
  expect(elementInstance.findAllByType(FormattedMessage).map(i => i.props.id)).toContain(
    'user.completeness.lead.start',
  );
  expect(elementInstance.findByType(FormattedNumber).props.value).toBe(0);
  expect(
    elementInstance.findByProps({ className: 'absolute bg-red br-pill hhalf hide-child' }).props
      .style.width,
  ).toBe('0%');
});
