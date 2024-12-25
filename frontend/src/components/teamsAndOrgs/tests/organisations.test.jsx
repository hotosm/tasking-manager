import { screen } from '@testing-library/react';
import { Provider } from 'react-redux';

import {
  createComponentWithIntl,
  IntlProviders,
  ReduxIntlProviders,
  renderWithRouter,
} from '../../../utils/testWithIntl';
import { store } from '../../../store';
import { OrgsManagement, OrganisationCard } from '../organisations';
import { MemoryRouter } from 'react-router-dom';
import messages from '../messages';

it('test organisation card component', async () => {
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
  renderWithRouter(
    <Provider store={store}>
      <IntlProviders localStore={orgData}>
        <OrganisationCard details={orgData} />
      </IntlProviders>
    </Provider>
  );
  expect(await screen.findByRole('img', { name: 'Singapore Red Cross logo' })).toBeInTheDocument();
  // TODO: Revisit - might need more tests, removed a lot which were deprecated with ts/vite/vitest revamp
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
  it('isOrgManager = false and isAdmin = false should NOT list organisations', async () => {
    renderWithRouter(
      <IntlProviders>
        <OrgsManagement
          organisations={orgData.organisations}
          isOrgManager={false}
          isAdmin={false}
          isOrganisationsFetched={true}
        />
      </IntlProviders>,
    );
    expect(await screen.findByText(messages.notAllowed.defaultMessage)).toBeInTheDocument();
    expect(await screen.findAllByRole("button")).toHaveLength(1);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
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

  it('OrgsManagement with isOrgManager = false and isAdmin = true should NOT list organisations, but have a link to /new', async () => {
    renderWithRouter(
      <IntlProviders>
        <OrgsManagement organisations={orgData.organisations} isOrgManager={false} isAdmin={true} />
      </IntlProviders>,
    );
    expect(await screen.findByRole("link", { name: /new/i })).toBeInTheDocument();
    expect(await screen.findAllByRole("link")).toHaveLength(1);
  });

  it('OrgsManagement with isOrgManager = true and isAdmin = false SHOULD list organisations, but should NOT have an AddButton', async () => {
    renderWithRouter(
      <IntlProviders>
        <OrgsManagement
          organisations={orgData.organisations}
          isOrgManager={true}
          isAdmin={false}
          isOrganisationsFetched={true}
        />
      </IntlProviders>,
    );
    expect(await screen.findByText(orgData.organisations[0].name)).toBeInTheDocument();
    expect(await screen.findAllByRole("button")).toHaveLength(1);
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
