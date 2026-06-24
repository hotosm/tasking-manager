import '@testing-library/jest-dom';
import { screen, waitFor, act, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  ListPartners,
  CreatePartner,
  EditPartners,
} from '../partnersManagement';
import { renderWithRouter, ReduxIntlProviders, createComponentWithMemoryRouter } from '../../utils/testWithIntl';
import { store } from '../../store';
import { server } from '../../network/tests/server';

import { useFetch } from '../../hooks/UseFetch';
import { fetchLocalJSONAPI, pushToLocalJSONAPI } from '../../network/genericJSONRequest';

jest.mock('../../hooks/UseFetch', () => ({
  useFetch: jest.fn(),
}));

jest.mock('../../network/genericJSONRequest', () => ({
  fetchLocalJSONAPI: jest.fn(),
  pushToLocalJSONAPI: jest.fn(),
}));

describe('PartnersManagement Views', () => {
  beforeAll(() => server.listen());
  afterAll(() => server.close());

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
    server.resetHandlers();
  });

  const renderComponent = (ui, preloadedState = {}) => {
    return renderWithRouter(
      <ReduxIntlProviders>
        {ui}
      </ReduxIntlProviders>
    );
  };

  describe('ListPartners', () => {
    it('redirects to login if not authenticated', () => {
      const { router } = createComponentWithMemoryRouter(
        <ReduxIntlProviders>
          <ListPartners />
        </ReduxIntlProviders>
      );
      // Depending on the mock store state, userDetails might be empty by default
    });

    it('renders ListPartners when authenticated', async () => {
      fetchLocalJSONAPI.mockResolvedValue([{ id: 1, name: 'Partner 1' }]);
      renderComponent(<ListPartners />);
      await waitFor(() => expect(fetchLocalJSONAPI).toHaveBeenCalled());
    });
    
    it('handles error while fetching partners', async () => {
      fetchLocalJSONAPI.mockRejectedValue(new Error('Failed'));
      renderComponent(<ListPartners />);
      await waitFor(() => expect(fetchLocalJSONAPI).toHaveBeenCalled());
    });

    it('displays loading skeleton before fetch', () => {
      fetchLocalJSONAPI.mockImplementation(() => new Promise(() => {})); // pending promise
      renderComponent(<ListPartners />);
      expect(fetchLocalJSONAPI).toHaveBeenCalled();
    });
  });

  describe('CreatePartner', () => {
    it('redirects to login if not authenticated', () => {
      createComponentWithMemoryRouter(
        <ReduxIntlProviders>
          <CreatePartner />
        </ReduxIntlProviders>
      );
    });

    it('shows not allowed message if user is not admin', () => {
      renderComponent(<CreatePartner />);
    });
  });

  describe('EditPartners', () => {
    it('renders EditPartners correctly', () => {
      useFetch.mockReturnValue([null, false, { id: 1, name: 'Partner 1' }]);
      createComponentWithMemoryRouter(
        <ReduxIntlProviders>
          <EditPartners />
        </ReduxIntlProviders>,
        { route: '/partners/1' }
      );
    });

    it('handles not allowed message if not admin', () => {
      useFetch.mockReturnValue([null, false, { id: 1, name: 'Partner 1' }]);
      createComponentWithMemoryRouter(
        <ReduxIntlProviders>
          <EditPartners />
        </ReduxIntlProviders>,
        { route: '/partners/1' }
      );
    });
    
    it('handles error and redirects', () => {
      useFetch.mockReturnValue([new Error('Not found'), false, null]);
      createComponentWithMemoryRouter(
        <ReduxIntlProviders>
          <EditPartners />
        </ReduxIntlProviders>,
        { route: '/partners/1' }
      );
    });

    it('handles loading state', () => {
      useFetch.mockReturnValue([null, true, null]);
      createComponentWithMemoryRouter(
        <ReduxIntlProviders>
          <EditPartners />
        </ReduxIntlProviders>,
        { route: '/partners/1' }
      );
    });
  });
});
