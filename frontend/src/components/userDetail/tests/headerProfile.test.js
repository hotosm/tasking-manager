import '@testing-library/jest-dom';
import { render, screen, act } from '@testing-library/react';

import { HeaderProfile, SocialMedia, MyContributionsNav } from '../headerProfile';
import {
  IntlProviders,
  QueryClientProviders,
  ReduxIntlProviders,
  renderWithRouter,
} from '../../../utils/testWithIntl';
import { userQueryDetails } from '../../../network/tests/mockData/userList';
import { store } from '../../../store';

let mockData = {
  id: 10291369,
  username: 'johndoe',
  slackId: 'johndoeSlack',
  twitterId: 'johndoeTwitter',
  facebookId: 'johndoeFacebook',
  linkedinId: 'johndoeLinkedin',
};

describe('Social Media component', () => {
  it('should render the correct number of icons', () => {
    const { container } = render(
      <IntlProviders>
        <SocialMedia data={mockData} />
      </IntlProviders>,
    );
    // img tag for OSM, Slack and HDYC Neis One
    expect(screen.getAllByRole('img')).toHaveLength(4);
    // SVGs for Facebook, Linkedin, Twitter
    expect(container.querySelectorAll('svg').length).toBe(3);
  });

  it('should render correct links', () => {
    render(
      <IntlProviders>
        <SocialMedia data={mockData} />
      </IntlProviders>,
    );
    expect(
      screen.getAllByRole('link', {
        name: 'johndoe',
      }),
    ).toHaveLength(3);
    expect(screen.queryAllByRole('link', { name: 'johndoe' })[0]).toHaveAttribute(
      'href',
      'https://www.openstreetmap.org/user/johndoe',
    );
    expect(screen.queryAllByRole('link', { name: 'johndoe' })[1]).toHaveAttribute(
      'href',
      'https://osmcha.org/?filters={"users":[{"label":"johndoe","value":"johndoe"}]}',
    );
    expect(screen.getAllByRole('link', { name: 'johndoe' })[2]).toHaveAttribute(
      'href',
      'https://hdyc.neis-one.org/?johndoe',
    );
    expect(screen.getByRole('link', { name: 'johndoeTwitter' })).toHaveAttribute(
      'href',
      'https://www.twitter.com/johndoeTwitter',
    );
    expect(screen.getByRole('link', { name: 'johndoeFacebook' })).toHaveAttribute(
      'href',
      'https://www.facebook.com/johndoeFacebook',
    );
    expect(screen.getByRole('link', { name: 'johndoeLinkedin' })).toHaveAttribute(
      'href',
      'https://www.linkedin.com/in/johndoeLinkedin',
    );
  });

  it('should not render the Facebook icon and link for a falsy value', () => {
    mockData.facebookId = '';
    render(
      <IntlProviders>
        <SocialMedia data={mockData} />
      </IntlProviders>,
    );
    expect(
      screen.queryByRole('link', {
        name: 'johndoefacebook',
      }),
    ).not.toBeInTheDocument();
  });
});

test('section menu should render display menus for contributions tab', () => {
  renderWithRouter(
    <IntlProviders>
      <MyContributionsNav />
    </IntlProviders>,
  );
  expect(
    screen.getByRole('link', {
      name: 'My stats',
    }),
  ).toHaveAttribute('href', '/contributions');
  expect(
    screen.getByRole('link', {
      name: 'My projects',
    }),
  ).toHaveAttribute('href', '/contributions/projects/?mappedByMe=1&action=any');
  expect(
    screen.getByRole('link', {
      name: 'My tasks',
    }),
  ).toHaveAttribute('href', '/contributions/tasks');
  expect(
    screen.getByRole('link', {
      name: 'My teams',
    }),
  ).toHaveAttribute('href', '/contributions/teams');
});

describe('Header Profile Component', () => {
  it('should render details of the components', async () => {
    const { container } = renderWithRouter(
      <QueryClientProviders>
        <ReduxIntlProviders>
          <HeaderProfile userDetails={userQueryDetails} changesets={120} selfProfile={false} />
        </ReduxIntlProviders>
      </QueryClientProviders>,
    );
    expect(screen.getByRole('img', { name: 'somebodysomewhere' }).src).toContain(
      userQueryDetails.pictureUrl,
    );
    expect(screen.getByText(userQueryDetails.name)).toBeInTheDocument();
    expect(screen.getByText('Advanced mapper')).toBeInTheDocument();
    expect(screen.queryByText(/changesets to/i)).toBeInTheDocument();
    expect(
      screen.getByRole('link', {
        name: 'somebodysomewhereFacebook',
      }),
    ).toBeInTheDocument();
    expect(container.querySelectorAll('svg').length).toBe(3); // socials icons
    expect(
      screen.queryByRole('link', {
        name: 'My projects',
      }),
    ).not.toBeInTheDocument();
  });

  it('should display profile icon when no user display picture is present', async () => {
    const moddeduserQueryDetails = { ...userQueryDetails, pictureUrl: null };
    const { container } = renderWithRouter(
      <QueryClientProviders>
        <ReduxIntlProviders>
          <HeaderProfile
            userDetails={moddeduserQueryDetails}
            changesets={120}
            selfProfile={false}
          />
        </ReduxIntlProviders>
      </QueryClientProviders>,
    );
    expect(container.querySelectorAll('svg').length).toBe(4); // socials icon plus display picture
  });

  it('should display contributions tabs nav when viewing own profile', async () => {
    act(() => {
      store.dispatch({
        type: 'SET_USER_DETAILS',
        userDetails: { id: 123, username: userQueryDetails.username },
      });
    });
    renderWithRouter(
      <QueryClientProviders>
        <ReduxIntlProviders>
          <HeaderProfile userDetails={userQueryDetails} changesets={120} selfProfile={false} />
        </ReduxIntlProviders>
      </QueryClientProviders>,
    );
    expect(
      screen.getByRole('link', {
        name: 'My projects',
      }),
    ).toBeInTheDocument();
  });
});
