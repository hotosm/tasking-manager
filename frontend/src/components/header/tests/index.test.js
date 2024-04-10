import '@testing-library/jest-dom';
import { screen, fireEvent, act, within, waitFor, render } from '@testing-library/react';

import '../../../utils/mockMatchMedia';
import {
  IntlProviders,
  QueryClientProviders,
  ReduxIntlProviders,
  renderWithRouter,
} from '../../../utils/testWithIntl';
import { ORG_NAME, ORG_URL, ORG_LOGO, SERVICE_DESK } from '../../../config';
import { AuthButtons, getMenuItemsForUser, Header, PopupItems } from '..';
import messages from '../messages';
import { store } from '../../../store';

describe('Header', () => {
  const setup = () => {
    return {
      ...renderWithRouter(
        <ReduxIntlProviders>
          <Header />
        </ReduxIntlProviders>,
      ),
    };
  };

  it('should render component details', () => {
    setup();
    expect(screen.getByText(messages.slogan.defaultMessage)).toBeInTheDocument();
    if (ORG_URL) {
      expect(screen.getByText(`${ORG_NAME} Website`)).toBeInTheDocument();
      expect(screen.getByText(`${ORG_NAME} Website`).closest('a')).toHaveAttribute('href', ORG_URL);
    }
    expect(screen.getByTitle('externalLink')).toBeInTheDocument();
    const orgLogo = screen.getByRole('img');
    if (ORG_LOGO) {
      expect(orgLogo).toHaveAttribute('src', ORG_LOGO);
    } else {
      expect(orgLogo).toHaveAttribute('src', 'main-logo.svg');
    }
    expect(screen.getByText(/Tasking Manager/i)).toBeInTheDocument();
    ['Explore projects', 'Learn', 'About'].forEach((menuItem) =>
      expect(
        screen.getByRole('link', {
          name: menuItem,
        }),
      ).toBeInTheDocument(),
    );
    if (SERVICE_DESK) {
      expect(
        screen.getByRole('link', {
          name: 'Support',
        }),
      ).toBeInTheDocument();
    } else {
      expect(
        screen.queryByRole('link', {
          name: 'Support',
        }),
      ).not.toBeInTheDocument();
    }
  });

  // TODO:
  // it('should use local logo image if no org logo is present', () => {
  //   const { rerender } = renderWithRouter(
  //     <ReduxIntlProviders>
  //       <Header />
  //     </ReduxIntlProviders>,
  //   );

  //   const orgLogo = screen.getByAltText(`${ORG_NAME} logo`);
  //   expect(orgLogo).toHaveAttribute('src', 'main-logo.svg');
  // });

  it('should render fallback logo if the environment logo fails to load', () => {
    setup();
    const orgLogo = screen.getByRole('img');
    if (ORG_LOGO) {
      expect(orgLogo).toHaveAttribute('src', ORG_LOGO);
      fireEvent.error(orgLogo);
      expect(orgLogo).toHaveAttribute('src', 'main-logo.svg');
    }
  });

  it('should display menu when burger menu icon is clicked', async () => {
    const { user } = setup();
    await user.click(
      screen.getByRole('button', {
        name: /menu/i,
      }),
    );
    const popup = screen.getByRole('dialog');
    const someMenuFromDialog = within(popup).getByRole('link', {
      name: /about/i,
    });
    expect(someMenuFromDialog).toBeInTheDocument();
  });

  it('should display active classes on active page', async () => {
    setup();
    expect(
      screen.getByRole('link', {
        name: /explore projects/i,
      }),
    ).toHaveClass('link mh3 barlow-condensed blue-dark f4 ttu lh-solid nowrap pv2');
    expect(
      screen.getByRole('link', {
        name: /about/i,
      }),
    ).not.toHaveClass('bb b--blue-dark bw1 pv2');
  });
});

describe('Right side action items', () => {
  const setup = () => {
    renderWithRouter(
      <QueryClientProviders>
        <ReduxIntlProviders>
          <Header />
        </ReduxIntlProviders>
      </QueryClientProviders>,
    );
  };
  test('when the user is logged in', () => {
    act(() => {
      store.dispatch({
        type: 'SET_USER_DETAILS',
        userDetails: { username: 'somebody' },
      });
    });
    setup();
    expect(screen.getByLabelText('Notifications')).toBeInTheDocument();
    expect(screen.getByLabelText('Sample avatar')).toBeInTheDocument();
  });

  test("when the user isn't logged in", () => {
    act(() => {
      store.dispatch({
        type: 'SET_USER_DETAILS',
        userDetails: {},
      });
    });
    setup();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByText('English')).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: /log in/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: /sign up/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: /menu/i,
      }),
    ).toBeInTheDocument();
  });
});

describe('Dropdown menu of logged in user', () => {
  const setup = () =>
    renderWithRouter(
      <QueryClientProviders>
        <ReduxIntlProviders>
          <Header />
        </ReduxIntlProviders>
      </QueryClientProviders>,
    );

  it('should render dropdown menu when clicked', async () => {
    act(() => {
      store.dispatch({
        type: 'SET_USER_DETAILS',
        userDetails: { username: 'somebody' },
      });
    });
    const { user } = setup();
    await user.click(screen.getByText('somebody'));
  });

  it('should log the user out', async () => {
    act(() => {
      store.dispatch({
        type: 'SET_USER_DETAILS',
        userDetails: { username: 'somebody' },
      });
    });
    const { user } = setup();
    await user.click(screen.getByText('somebody'));
    // screen.getByRole('')
    await user.click(screen.getByText(/Logout/i));
    await waitFor(() =>
      expect(
        screen.getByRole('button', {
          name: /log in/i,
        }),
      ).toBeInTheDocument(),
    );
  });
});

describe('AuthButtons Component', () => {
  it('should render component details', async () => {
    render(
      <IntlProviders>
        <AuthButtons />
      </IntlProviders>,
    );

    expect(
      screen.getByRole('button', {
        name: messages.logIn.defaultMessage,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: messages.signUp.defaultMessage,
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', {
        name: messages.createAccount.defaultMessage,
      }),
    ).not.toBeInTheDocument();
  });

  it('should display alterntive sign up text', async () => {
    render(
      <IntlProviders>
        <AuthButtons alternativeSignUpText />
      </IntlProviders>,
    );
    expect(
      screen.getByRole('button', {
        name: messages.createAccount.defaultMessage,
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', {
        name: messages.signUp.defaultMessage,
      }),
    ).not.toBeInTheDocument();
  });
});

describe('PopupItems Component', () => {
  test('when user is logged in', async () => {
    renderWithRouter(
      <ReduxIntlProviders>
        <PopupItems
          menuItems={getMenuItemsForUser({ username: 'somebody', role: 'ADMIN' })}
          userDetails={{ username: 'somebody', emailAddress: undefined }}
        />
      </ReduxIntlProviders>,
    );
    expect(
      screen.getByRole('link', {
        name: /manage/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', {
        name: /settings/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: /logout/i,
      }),
    ).toBeInTheDocument();
  });

  test('when user is not logged in', async () => {
    renderWithRouter(
      <ReduxIntlProviders>
        <PopupItems
          menuItems={getMenuItemsForUser({ username: 'somebody', role: 'ADMIN' })}
          userDetails={{}}
          location={{ pathname: '/somewhere' }}
        />
      </ReduxIntlProviders>,
    );
    expect(
      screen.queryByRole('link', {
        name: /manage/i,
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('link', {
        name: /settings/i,
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', {
        name: /logout/i,
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: /log in/i,
      }),
    ).toBeInTheDocument();
  });

  it('should log the user out', async () => {
    const { user, rerender } = renderWithRouter(
      <ReduxIntlProviders>
        <PopupItems
          menuItems={getMenuItemsForUser({ username: 'somebody', role: 'ADMIN' })}
          userDetails={{ username: 'somebody', emailAddress: undefined }}
        />
      </ReduxIntlProviders>,
    );
    const logoutBtn = screen.getByRole('button', {
      name: /logout/i,
    });
    await user.click(logoutBtn);
    rerender(
      <ReduxIntlProviders>
        <PopupItems
          menuItems={getMenuItemsForUser({ username: 'somebody', role: 'ADMIN' })}
          userDetails={{}}
          location={{ pathname: '/somewhere' }}
        />
      </ReduxIntlProviders>,
    );
    await waitFor(() => expect(logoutBtn).not.toBeInTheDocument());
  });
});

test('users should be prompted to update their email', () => {
  act(() => {
    store.dispatch({
      type: 'SET_USER_DETAILS',
      userDetails: { username: 'somebody', emailAddress: undefined },
    });
  });
  renderWithRouter(
    <QueryClientProviders>
      <ReduxIntlProviders>
        <Header />
      </ReduxIntlProviders>
    </QueryClientProviders>,
  );
  expect(
    screen.getByRole('heading', {
      name: /update your email/i,
    }),
  ).toBeInTheDocument();
});
