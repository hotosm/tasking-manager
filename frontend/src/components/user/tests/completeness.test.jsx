import { ProfileCompleteness } from '../completeness';
import { IntlProviders } from '../../../utils/testWithIntl';
import { render, screen } from '@testing-library/react';
import messages from '../messages';

const user0Percent = {
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
  const { container } = render(
    <IntlProviders>
      <ProfileCompleteness userDetails={user100Percent} />
    </IntlProviders>
  );
  expect(screen.getByText(messages.completenessLead2.defaultMessage)).toBeInTheDocument();
  expect(container.querySelector('.absolute.bg-red.br-pill.hhalf.hide-child')).toBeInTheDocument();
  expect(container.querySelector('.absolute.bg-red.br-pill.hhalf.hide-child')).toHaveStyle({
    width: '100%',
  })
  expect(screen.getByText("100%")).toBeInTheDocument();
});

it('test with a user whose profile is 66.7% filled', () => {
  const { container } = render(
    <IntlProviders>
      <ProfileCompleteness userDetails={incompleteProfile} />
    </IntlProviders>
  );
  expect(screen.getByText(messages.completenessLead1.defaultMessage)).toBeInTheDocument();
  expect(screen.getByText(`67%`)).toBeInTheDocument();
  expect(container.querySelector('.absolute.bg-red.br-pill.hhalf.hide-child')).toBeInTheDocument();
  expect(container.querySelector('.absolute.bg-red.br-pill.hhalf.hide-child')).toHaveStyle({
    width: '66.7%',
  });
});

it('test with a user whose profile is 0% filled', () => {
  const { container } = render(
    <IntlProviders>
      <ProfileCompleteness userDetails={user0Percent} />
    </IntlProviders>
  );
  expect(screen.getByText(messages.completenessLead0.defaultMessage)).toBeInTheDocument();
  expect(screen.getByText(`0%`)).toBeInTheDocument();
  expect(container.querySelector('.absolute.bg-red.br-pill.hhalf.hide-child')).toBeInTheDocument();
  expect(container.querySelector('.absolute.bg-red.br-pill.hhalf.hide-child')).toHaveStyle({
    width: '0%',
  });
});
