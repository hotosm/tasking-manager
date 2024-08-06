import '@testing-library/jest-dom';
import { screen } from '@testing-library/react';
import { FormattedMessage } from 'react-intl';
import { Provider } from 'react-redux';

import {
  createComponentWithIntl,
  IntlProviders,
  ReduxIntlProviders,
  renderWithRouter,
} from '../../../utils/testWithIntl';
import { store } from '../../../store';
import { OrgsManagement, OrganisationCard } from '../organisations';
import { AddButton } from '../management';
import { MemoryRouter } from 'react-router-dom';

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
    <MemoryRouter>
      <Provider store={store}>
        <OrganisationCard details={orgData} />
      </Provider>
    </MemoryRouter>,
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
      <MemoryRouter>
        <OrgsManagement
          organisations={orgData.organisations}
          isOrgManager={false}
          isAdmin={false}
          isOrganisationsFetched={true}
        />
      </MemoryRouter>,
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
    renderWithRouter(
      <ReduxIntlProviders>
        <OrgsManagement
          organisations={orgData.organisations}
          isOrgManager={true}
          isAdmin={true}
          isOrganisationsFetched={true}
        />
      </ReduxIntlProviders>,
    );
    expect(
      screen.getByRole('button', {
        name: /new/i,
      }),
    ).toBeInTheDocument();
  });

  it('OrgsManagement with isOrgManager = false and isAdmin = true should NOT list organisations, but have a link to /new', () => {
    const element = createComponentWithIntl(
      <MemoryRouter>
        <OrgsManagement organisations={orgData.organisations} isOrgManager={false} isAdmin={true} />
      </MemoryRouter>,
    );
    const testInstance = element.root;
    expect(() => testInstance.findByType(OrganisationCard)).toThrow(
      new Error('No instances found with node type: "OrganisationCard"'),
    );
    expect(testInstance.findAllByType(AddButton).length).toBe(1);
  });

  it('OrgsManagement with isOrgManager = true and isAdmin = false SHOULD list organisations, but should NOT have an AddButton', () => {
    const element = createComponentWithIntl(
      <MemoryRouter>
        <OrgsManagement
          organisations={orgData.organisations}
          isOrgManager={true}
          isAdmin={false}
          isOrganisationsFetched={true}
        />
      </MemoryRouter>,
    );
    const testInstance = element.root;
    expect(testInstance.findByType(OrganisationCard).props.details).toStrictEqual(
      orgData.organisations[0],
    );
    expect(() => testInstance.findByType(AddButton)).toThrow(
      new Error('No instances found with node type: "AddButton"'),
    );
  });

  it('renders loading placeholder when API is being fetched', () => {
    const element = createComponentWithIntl(
      <OrgsManagement
        organisations={orgData.organisations}
        isOrgManager={true}
        isAdmin={false}
        isOrganisationsFetched={false}
      />,
    );
    const testInstance = element.root;
    expect(testInstance.findAllByProps({ className: 'show-loading-animation' }).length).toBe(4);
  });

  it('should not render loading placeholder after API is fetched', () => {
    const element = createComponentWithIntl(
      <MemoryRouter>
        <OrgsManagement
          organisations={orgData.organisations}
          isOrgManager={true}
          isAdmin={false}
          isOrganisationsFetched={true}
        />
      </MemoryRouter>,
    );
    const testInstance = element.root;
    expect(testInstance.findAllByProps({ className: 'show-loading-animation' }).length).toBe(0);
  });

  it('filters organisations list by the search query', async () => {
    const { user } = renderWithRouter(
      <IntlProviders>
        <OrgsManagement
          organisations={orgData.organisations}
          isOrgManager={true}
          isAdmin={false}
          isOrganisationsFetched={true}
        />
      </IntlProviders>,
    );
    const textField = screen.getByRole('textbox');
    await user.clear(textField);
    await user.type(textField, 'Singapore');
    expect(screen.getByRole('heading', { name: 'Singapore Red Cross' })).toHaveTextContent(
      'Singapore Red Cross',
    );
    await user.clear(textField);
    await user.type(textField, 'not Singapore');
    expect(screen.queryByRole('heading', { name: 'Singapore Red Cross' })).not.toBeInTheDocument();
    expect(screen.queryByText('No organizations were found.')).toBeInTheDocument();
  });
});
