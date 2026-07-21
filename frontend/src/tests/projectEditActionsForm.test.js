import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { IntlProvider } from 'react-intl';
import { Provider } from 'react-redux';
import { store } from '../store';
import { StateContext } from '../views/projectEdit';

import { ActionsForm } from '../components/projectEdit/actionsForm';

const Wrapper = ({ children }) => (
  <Provider store={store}>
    <IntlProvider locale="en">
      <StateContext.Provider value={{ projectInfo: { author: 'admin', organisationName: 'Org1' } }}>
        {children}
      </StateContext.Provider>
    </IntlProvider>
  </Provider>
);

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
}));

describe('ActionsForm component', () => {
  it('renders all action buttons', () => {
    render(<ActionsForm projectId={123} projectName="Test" orgId={1} />, { wrapper: Wrapper });
    expect(screen.getByText(/Message All Contributors/i)).toBeInTheDocument();
    expect(screen.getByText(/Map All Tasks/i)).toBeInTheDocument();
    expect(screen.getByText(/Invalidate All Tasks/i)).toBeInTheDocument();
    expect(screen.getByText(/Validate All Tasks/i)).toBeInTheDocument();
    expect(screen.getByText(/Reset tasks/i)).toBeInTheDocument();
    expect(screen.getByText(/Transfer Ownership/i)).toBeInTheDocument();
    expect(screen.getByText('Clone Project')).toBeInTheDocument();
    expect(screen.getByText('Delete Project')).toBeInTheDocument();
  });

  it('opens message contributors modal', async () => {
    render(<ActionsForm projectId={123} projectName="Test" orgId={1} />, { wrapper: Wrapper });
    fireEvent.click(screen.getByText(/Message All Contributors/i));
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Subject/i)).toBeInTheDocument();
    });
  });

  it('opens map all tasks modal', async () => {
    render(<ActionsForm projectId={123} projectName="Test" orgId={1} />, { wrapper: Wrapper });
    fireEvent.click(screen.getByText(/Map All Tasks/i));
    await waitFor(() => {
      expect(screen.getByText(/Are you sure you want to map all tasks/i)).toBeInTheDocument();
    });
  });

  it('opens invalidate all tasks modal', async () => {
    render(<ActionsForm projectId={123} projectName="Test" orgId={1} />, { wrapper: Wrapper });
    fireEvent.click(screen.getByText(/Invalidate All Tasks/i));
    await waitFor(() => {
      expect(screen.getByText(/Are you sure you want to invalidate all tasks/i)).toBeInTheDocument();
    });
  });

  it('opens validate all tasks modal', async () => {
    render(<ActionsForm projectId={123} projectName="Test" orgId={1} />, { wrapper: Wrapper });
    fireEvent.click(screen.getByText(/Validate All Tasks/i));
    await waitFor(() => {
      expect(screen.getByText(/Are you sure you want to validate all tasks/i)).toBeInTheDocument();
    });
  });

  it('opens reset all tasks modal', async () => {
    render(<ActionsForm projectId={123} projectName="Test" orgId={1} />, { wrapper: Wrapper });
    fireEvent.click(screen.getByText(/Reset tasks/i));
    await waitFor(() => {
      expect(screen.getByText(/Are you sure you want to reset all tasks/i)).toBeInTheDocument();
    });
  });
});
