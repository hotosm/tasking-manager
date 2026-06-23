import '@testing-library/jest-dom';
import { act, screen, waitFor } from '@testing-library/react';

import { store } from '../../store';
import { Settings } from '../settings';
import { ReduxIntlProviders, renderWithRouter } from '../../utils/testWithIntl';

// Mock heavy child form components to isolate view-level behaviour
jest.mock('../../components/user/forms/personalInformation', () => ({
  PersonalInformationForm: () => <div data-testid="personal-information-form" />,
}));

jest.mock('../../components/user/forms/settings', () => ({
  UserSettingsForm: () => <div data-testid="user-settings-form" />,
}));

jest.mock('../../components/user/forms/notifications', () => ({
  UserNotificationsForm: () => <div data-testid="user-notifications-form" />,
}));

jest.mock('../../components/user/forms/interests', () => ({
  UserInterestsForm: () => <div data-testid="user-interests-form" />,
}));

jest.mock('../../components/user/topBar', () => ({
  UserTopBar: () => <div data-testid="user-top-bar" />,
}));

jest.mock('../../components/user/content', () => ({
  OSMCard: ({ username }) => <div data-testid="osm-card">{username}</div>,
  APIKeyCard: ({ token }) => <div data-testid="api-key-card">{token}</div>,
}));

describe('Settings view', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('when user is authenticated', () => {
    beforeEach(() => {
      act(() => {
        store.dispatch({ type: 'SET_TOKEN', token: 'validToken123' });
        store.dispatch({
          type: 'SET_USER_DETAILS',
          userDetails: {
            id: 42,
            username: 'testuser',
            isExpert: false,
            role: 'MAPPER',
          },
        });
      });
    });

    it('renders the UserTopBar component', () => {
      renderWithRouter(
        <ReduxIntlProviders>
          <Settings />
        </ReduxIntlProviders>,
      );
      expect(screen.getByTestId('user-top-bar')).toBeInTheDocument();
    });

    it('renders UserInterestsForm', () => {
      renderWithRouter(
        <ReduxIntlProviders>
          <Settings />
        </ReduxIntlProviders>,
      );
      expect(screen.getByTestId('user-interests-form')).toBeInTheDocument();
    });

    it('renders UserSettingsForm', () => {
      renderWithRouter(
        <ReduxIntlProviders>
          <Settings />
        </ReduxIntlProviders>,
      );
      expect(screen.getByTestId('user-settings-form')).toBeInTheDocument();
    });

    it('renders UserNotificationsForm', () => {
      renderWithRouter(
        <ReduxIntlProviders>
          <Settings />
        </ReduxIntlProviders>,
      );
      expect(screen.getByTestId('user-notifications-form')).toBeInTheDocument();
    });

    it('renders PersonalInformationForm', () => {
      renderWithRouter(
        <ReduxIntlProviders>
          <Settings />
        </ReduxIntlProviders>,
      );
      expect(screen.getByTestId('personal-information-form')).toBeInTheDocument();
    });

    it('renders OSMCard when username is present', () => {
      renderWithRouter(
        <ReduxIntlProviders>
          <Settings />
        </ReduxIntlProviders>,
      );
      const osmCard = screen.getByTestId('osm-card');
      expect(osmCard).toBeInTheDocument();
      expect(osmCard).toHaveTextContent('testuser');
    });

    it('does NOT render APIKeyCard when user is not expert', () => {
      renderWithRouter(
        <ReduxIntlProviders>
          <Settings />
        </ReduxIntlProviders>,
      );
      expect(screen.queryByTestId('api-key-card')).not.toBeInTheDocument();
    });

    it('renders APIKeyCard when user is expert', () => {
      act(() => {
        store.dispatch({
          type: 'SET_USER_DETAILS',
          userDetails: {
            id: 42,
            username: 'expertuser',
            isExpert: true,
            role: 'MAPPER',
          },
        });
      });
      renderWithRouter(
        <ReduxIntlProviders>
          <Settings />
        </ReduxIntlProviders>,
      );
      expect(screen.getByTestId('api-key-card')).toBeInTheDocument();
    });
  });

  describe('when user is not authenticated', () => {
    it('redirects to /login when token is absent', async () => {
      act(() => {
        store.dispatch({ type: 'SET_TOKEN', token: null });
        store.dispatch({
          type: 'SET_USER_DETAILS',
          userDetails: { id: null, username: null, isExpert: false },
        });
      });

      renderWithRouter(
        <ReduxIntlProviders>
          <Settings />
        </ReduxIntlProviders>,
      );

      // Navigation happens via useEffect; the router redirects to /login
      await waitFor(() => {
        expect(window.location.pathname).toBe('/login');
      });
    });
  });
});
