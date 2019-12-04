import React from 'react';
import { FormattedMessage } from 'react-intl';

import { createComponentWithIntl } from '../../../utils/testWithIntl';
import { Provider } from 'react-redux';
import { store } from '../../../store';
import { OrgsManagement, OrganisationCard } from '../organisations';

it('test organisation card component', () => {
  const orgData = {
    id: 1,
    name: 'Singapore Red Cross',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/0/04/Singapore_Red_Cross.jpg',
    url: 'http://www.redcross.sg/',
    managers: [{username: 'Admin_1', profilePicture: null }, {username: 'B', profilePicture: null }],
    campaigns: ['Health', 'Environement']
  };
  const element = createComponentWithIntl(
    <Provider store={store} >
    <OrganisationCard details={orgData}/>
    </Provider>,
  );
  const testInstance = element.root;
  expect(
    () => testInstance.findByProps(
      {className: "cf bg-white blue-dark br1"}
    )).not.toThrow(
      new Error('No instances found with props: {className: "cf bg-white blue-dark br1"}')
    );
  expect(
    () => testInstance.findByProps(
      {href: "http://www.redcross.sg/"}
    )).not.toThrow(
      new Error('No instances found with props: {href: "http://www.redcross.sg/"}')
    );
  expect(
    () => testInstance.findByProps(
      {src: "https://upload.wikimedia.org/wikipedia/commons/0/04/Singapore_Red_Cross.jpg"}
    )).not.toThrow(
      new Error(
        'No instances found with props: {src: "https://upload.wikimedia.org/wikipedia/commons/0/04/Singapore_Red_Cross.jpg"}'
      )
    );
});

it('MAPPER role user can NOT see organisations on OrgsManagement view', () => {
  const orgData = {
    "organisations":[{
      id: 1,
      name: 'Singapore Red Cross',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/0/04/Singapore_Red_Cross.jpg',
      url: 'http://www.redcross.sg/',
      visibility: 'PUBLIC',
      managers: [{username: 'Admin_1', profilePicture: null }, {username: 'B', profilePicture: null }],
      campaigns: ['Health', 'Environement']
    }]
  };
  const element = createComponentWithIntl(
    <OrgsManagement organisations={orgData.organisations} userDetails={{role: 'MAPPER'}} />,
  );
  const testInstance = element.root;
  expect(
    testInstance.findAllByType(FormattedMessage).map(i => i.props.id)
  ).toContain('management.messages.notAllowed');
  expect(
    () => testInstance.findByType(OrganisationCard)
  ).toThrow(new Error('No instances found with node type: "OrganisationCard"'));
});

it('PROJECT_MANAGER role user can NOT see organisations on OrgsManagement view', () => {
  const orgData = {
    "organisations":[{
      id: 1,
      name: 'Singapore Red Cross',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/0/04/Singapore_Red_Cross.jpg',
      url: 'http://www.redcross.sg/',
      visibility: 'PUBLIC',
      managers: [{username: 'Admin_1', profilePicture: null }, {username: 'B', profilePicture: null }],
      campaigns: ['Health', 'Environement']
    }]
  };
  const element = createComponentWithIntl(
    <OrgsManagement organisations={orgData.organisations} userDetails={{role: 'PROJECT_MANAGER'}} />,
  );
  const testInstance = element.root;
  expect(
    testInstance.findAllByType(FormattedMessage).map(i => i.props.id)
  ).toContain('management.messages.notAllowed');
  expect(
    () => testInstance.findByType(OrganisationCard)
  ).toThrow(new Error('No instances found with node type: "OrganisationCard"'));
});

it('ADMIN role user CAN see organisations on OrgsManagement view', () => {
  const orgData = {
    "organisations": [{
      id: 1,
      name: 'Singapore Red Cross',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/0/04/Singapore_Red_Cross.jpg',
      url: 'http://www.redcross.sg/',
      managers: [{username: 'Admin_1', profilePicture: null }, {username: 'B', profilePicture: null }],
      campaigns: ['Health', 'Environement']
    }]
  };
  const element = createComponentWithIntl(
    <Provider store={store} >
    <OrgsManagement organisations={orgData.organisations} userDetails={{role: 'ADMIN'}} />,
    </Provider>
  );
  const testInstance = element.root;
  expect(testInstance.findByType(OrganisationCard).props.details).toStrictEqual(orgData.organisations[0]);
});
