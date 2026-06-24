import '@testing-library/jest-dom';
import { act, screen, waitFor } from '@testing-library/react';
import { rest } from 'msw';

import { store } from '../../store';
import { Authorized } from '../authorized';
import {
  ReduxIntlProviders,
  renderWithRouter,
  createComponentWithMemoryRouter,
} from '../../utils/testWithIntl';
import { server } from '../../network/tests/server';
import { API_URL } from '../../config';

// Mock AnimatedLoadingIcon (SVG)
jest.mock('../../components/button', () => ({
  ...jest.requireActual('../../components/button'),
  AnimatedLoadingIcon: () => <span data-testid="loading-icon" />,
}));

// Mock safe_storage
import * as safeStorage from '../../utils/safe_storage';
jest.mock('../../utils/safe_storage', () => ({
  getItem: jest.fn(),
  removeItem: jest.fn(),
  setItem: jest.fn(),
}));

import * as genericJSONRequest from '../../network/genericJSONRequest';

jest.mock('../../network/genericJSONRequest', () => ({
  fetchLocalJSONAPI: jest.fn(),
}));

describe('Authorized view', () => {
  beforeEach(() => {
    safeStorage.getItem.mockImplementation((key) => {
      if (key === 'osm_oauth_state') return 'test_state';
      if (key === 'osm_oauth_redirect_to') return '/contributions';
      return null;
    });

    genericJSONRequest.fetchLocalJSONAPI.mockImplementation(() =>
      Promise.resolve({
        username: 'testuser',
        session: { access_token: 'token123' },
        session_token: 'session_xyz',
        picture: 'https://example.com/avatar.png',
        id: 1,
      })
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
    // Reset store
    act(() => {
      store.dispatch({ type: 'SET_TOKEN', token: null });
    });
  });

  describe('renderizado base', () => {
    it('renderiza el spinner de redirección', () => {
      createComponentWithMemoryRouter(
        <ReduxIntlProviders>
          <Authorized />
        </ReduxIntlProviders>,
        { route: '/authorized', entryRoute: '/authorized?code=123&state=test_state' },
      );
      expect(screen.getByTestId('loading-icon')).toBeInTheDocument();
    });

    it('renderiza el texto "Redirecting ..."', () => {
      createComponentWithMemoryRouter(
        <ReduxIntlProviders>
          <Authorized />
        </ReduxIntlProviders>,
        { route: '/authorized', entryRoute: '/authorized?code=123&state=test_state' },
      );
      expect(screen.getByRole('heading', { name: /redirecting/i })).toBeInTheDocument();
    });
  });

  describe('flujo de autenticación con parámetros de usuario', () => {
    it('despacha setAuthDetails cuando tiene username, session_token y osm_oauth_token', async () => {
      const dispatchSpy = jest.spyOn(store, 'dispatch');
      createComponentWithMemoryRouter(
        <ReduxIntlProviders>
          <Authorized />
        </ReduxIntlProviders>,
        {
          route: '/authorized',
          entryRoute:
            '/authorized?username=testuser&session_token=abc123&osm_oauth_token=osmtok&redirect_to=/welcome',
        },
      );
      await waitFor(() => {
        expect(dispatchSpy).toHaveBeenCalled();
      });
    });

    it('redirige a /welcome cuando redirect_to es /', async () => {
      const dispatchSpy = jest.spyOn(store, 'dispatch');
      createComponentWithMemoryRouter(
        <ReduxIntlProviders>
          <Authorized />
        </ReduxIntlProviders>,
        {
          route: '/authorized',
          entryRoute: '/authorized?username=testuser&session_token=abc&osm_oauth_token=tok&redirect_to=/',
        },
      );
      await waitFor(() => {
        expect(dispatchSpy).toHaveBeenCalled();
      });
    });

    it('redirige a la URL proporcionada cuando redirect_to tiene valor', async () => {
      const dispatchSpy = jest.spyOn(store, 'dispatch');
      createComponentWithMemoryRouter(
        <ReduxIntlProviders>
          <Authorized />
        </ReduxIntlProviders>,
        {
          route: '/authorized',
          entryRoute:
            '/authorized?username=testuser&session_token=abc&osm_oauth_token=tok&redirect_to=/contributions',
        },
      );
      await waitFor(() => {
        expect(dispatchSpy).toHaveBeenCalled();
      });
    });
  });

  describe('el componente renderiza correctamente', () => {
    it('contiene el div contenedor con la clase pa3', async () => {
      createComponentWithMemoryRouter(
        <ReduxIntlProviders>
          <Authorized />
        </ReduxIntlProviders>,
        {
          route: '/authorized',
          entryRoute: '/authorized?code=123&state=test_state',
        },
      );
      await waitFor(() => {
        const container = document.querySelector('[class*="pa3"]');
        expect(container).toBeInTheDocument();
      });
    });
  });
});
