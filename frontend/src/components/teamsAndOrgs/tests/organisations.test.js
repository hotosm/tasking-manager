import React from 'react';
import { FormattedMessage } from 'react-intl';
import { Provider } from 'react-redux';

import { createComponentWithIntl } from '../../../utils/testWithIntl';
import { store } from '../../../store';
import { OrgsManagement, OrganisationCard } from '../organisations';
import { AddButton } from '../management';

it('test organisation card component', () => {
  const orgData = {
    id: 1,
    name: 'Singapore Red Cross',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/0/04/Singapore_Red_Cross.jpg',
    url: 'http://www.redcross.sg/',
    managers: [
      { username: 'Admin_1', profilePicture: null },
      { username: 'B', profilePicture: null },
    ],
    campaigns: ['Health', 'Environement'],
  };
  const element = createComponentWithIntl(
    <Provider store={store}>
      <OrganisationCard details={orgData} />
    </Provider>,
  );
  const testInstance = element.root;
  expect(() => testInstance.findByProps({ className: 'cf bg-white blue-dark br1' })).not.toThrow(
    new Error('No instances found with props: {className: "cf bg-white blue-dark br1"}'),
  );
  expect(() => testInstance.findByProps({ href: 'http://www.redcross.sg/' })).not.toThrow(
    new Error('No instances found with props: {href: "http://www.redcross.sg/"}'),
  );
  expect(() =>
    testInstance.findByProps({
      src: 'https://upload.wikimedia.org/wikipedia/commons/0/04/Singapore_Red_Cross.jpg',
    }),
  ).not.toThrow(
    new Error(
      'No instances found with props: {src: "https://upload.wikimedia.org/wikipedia/commons/0/04/Singapore_Red_Cross.jpg"}',
    ),
  );
});

describe('OrgsManagement with', () => {
  const orgData = {
    organisations: [
      {
        id: 1,
        name: 'Singapore Red Cross',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/0/04/Singapore_Red_Cross.jpg',
        url: 'http://www.redcross.sg/',
        visibility: 'PUBLIC',
        managers: [
          { username: 'Admin_1', profilePicture: null },
          { username: 'B', profilePicture: null },
        ],
        campaigns: ['Health', 'Environement'],
      },
    ],
  };
  it('isOrgManager = false and isAdmin = false should NOT list organisations', () => {
    const element = createComponentWithIntl(
      <OrgsManagement organisations={orgData.organisations} isOrgManager={false} isAdmin={false} />,
    );
    const testInstance = element.root;
    expect(testInstance.findAllByType(FormattedMessage).map((i) => i.props.id)).toContain(
      'management.messages.notAllowed',
    );
    expect(() => testInstance.findByType(OrganisationCard)).toThrow(
      new Error('No instances found with node type: "OrganisationCard"'),
    );
    expect(() => testInstance.findByType(AddButton)).toThrow(
      new Error('No instances found with node type: "AddButton"'),
    );
  });

  it('isOrgManager and isAdmin SHOULD list organisations and have a link to /new ', () => {
    const element = createComponentWithIntl(
      <OrgsManagement organisations={orgData.organisations} isOrgManager={true} isAdmin={true} />,
    );
    const testInstance = element.root;
    expect(testInstance.findByType(OrganisationCard).props.details).toStrictEqual(
      orgData.organisations[0],
    );
    expect(testInstance.findAllByProps({ href: '/new' }).length).toBe(1);
  });

  it('OrgsManagement with isOrgManager = false and isAdmin = true should NOT list organisations, but have a link to /new', () => {
    const element = createComponentWithIntl(
      <OrgsManagement organisations={orgData.organisations} isOrgManager={false} isAdmin={true} />,
    );
    const testInstance = element.root;
    expect(() => testInstance.findByType(OrganisationCard)).toThrow(
      new Error('No instances found with node type: "OrganisationCard"'),
    );
    expect(testInstance.findAllByType(AddButton).length).toBe(1);
  });

  it('OrgsManagement with isOrgManager = true and isAdmin = false SHOULD list organisations, but should NOT have an AddButton', () => {
    const element = createComponentWithIntl(
      <OrgsManagement organisations={orgData.organisations} isOrgManager={true} isAdmin={false} />,
    );
    const testInstance = element.root;
    expect(testInstance.findByType(OrganisationCard).props.details).toStrictEqual(
      orgData.organisations[0],
    );
    expect(() => testInstance.findByType(AddButton)).toThrow(
      new Error('No instances found with node type: "AddButton"'),
    );
  });
});
