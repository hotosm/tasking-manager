import '@testing-library/jest-dom';
import { screen, waitFor, render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Listing } from '../partnersListing';
import { ReduxIntlProviders, QueryClientProviders } from '../../../utils/testWithIntl';
import * as genericJSONRequest from '../../../network/genericJSONRequest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

jest.mock('../../../network/genericJSONRequest', () => ({
  fetchLocalJSONAPI: jest.fn(),
  pushToLocalJSONAPI: jest.fn(),
}));

jest.mock('reactjs-popup', () => {
  const React = require('react');
  return function MockPopup({ open, children, onClose }) {
    if (!open) return null;
    return (
      <div data-testid="popup-modal">
        {typeof children === 'function' ? children(onClose) : children}
      </div>
    );
  };
});

const mockPartnerMapping = {
  1: { id: 1, name: 'Partner 1' },
};

const renderListing = () => {
  return render(
    <MemoryRouter initialEntries={['/projects/123/edit']}>
      <Routes>
        <Route path="/projects/:id/edit" element={
          <ReduxIntlProviders>
            <QueryClientProviders>
              <Listing partnerIdToDetailsMapping={mockPartnerMapping} />
            </QueryClientProviders>
          </ReduxIntlProviders>
        } />
      </Routes>
    </MemoryRouter>
  );
};

describe('PartnersListing', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders listing with placeholder initially', () => {
    genericJSONRequest.fetchLocalJSONAPI.mockReturnValue(new Promise(() => {}));
    renderListing();
    expect(screen.getByText(/Partner/i)).toBeInTheDocument();
  });

  it('renders empty state', async () => {
    genericJSONRequest.fetchLocalJSONAPI.mockResolvedValue({ partnerships: [] });
    renderListing();
    await waitFor(() => {
      expect(screen.getByText(/No partners are associated with this project yet./i)).toBeInTheDocument();
    });
  });

  it('renders error state', async () => {
    genericJSONRequest.fetchLocalJSONAPI.mockRejectedValue(new Error('Fetch failed'));
    renderListing();
    await waitFor(() => {
      expect(screen.getByText(/Something went wrong!/i)).toBeInTheDocument();
    });
  });

  it('renders listing with data and handles remove popup', async () => {
    const user = userEvent.setup();
    genericJSONRequest.fetchLocalJSONAPI.mockResolvedValue({
      partnerships: [
        { id: 10, partnerId: 1, startedOn: '2023-01-01T00:00:00Z', endedOn: null },
      ],
    });
    renderListing();

    await waitFor(() => {
      expect(screen.getByText('Partner 1')).toBeInTheDocument();
    });

    const removeIcon = document.querySelector('.red.pointer');
    if (removeIcon) {
      await user.click(removeIcon);
      expect(screen.getByText(/Confirm Removal/i)).toBeInTheDocument();
      const cancelBtn = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelBtn);
      expect(screen.queryByTestId('popup-modal')).not.toBeInTheDocument();
    }
  });

  it('handles edit popup on double click', async () => {
    const user = userEvent.setup();
    genericJSONRequest.fetchLocalJSONAPI.mockResolvedValue({
      partnerships: [
        { id: 10, partnerId: 1, startedOn: '2023-01-01T00:00:00Z', endedOn: null },
      ],
    });
    renderListing();

    await waitFor(() => {
      expect(screen.getByText('Partner 1')).toBeInTheDocument();
    });

    const row = screen.getByText('Partner 1').closest('tr');
    await user.dblClick(row);

    expect(screen.getByTestId('popup-modal')).toBeInTheDocument();
    expect(screen.getByText(/Edit Partner Assignment/i)).toBeInTheDocument();

    const cancelBtn = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelBtn);
    expect(screen.queryByTestId('popup-modal')).not.toBeInTheDocument();
  });
  
  it('handles remove API call', async () => {
    const user = userEvent.setup();
    genericJSONRequest.fetchLocalJSONAPI.mockResolvedValue({
      partnerships: [
        { id: 10, partnerId: 1, startedOn: '2023-01-01T00:00:00Z', endedOn: null },
      ],
    });
    genericJSONRequest.pushToLocalJSONAPI.mockResolvedValue({});
    
    renderListing();
    await waitFor(() => expect(screen.getByText('Partner 1')).toBeInTheDocument());
    
    const removeIcon = document.querySelector('.red.pointer');
    await user.click(removeIcon);
    
    const removeBtn = screen.getByRole('button', { name: /remove/i });
    await user.click(removeBtn);
    
    await waitFor(() => {
      expect(genericJSONRequest.pushToLocalJSONAPI).toHaveBeenCalledWith(
        'projects/partnerships/10/',
        null,
        '',
        'DELETE'
      );
    });
  });
});
