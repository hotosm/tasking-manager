import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { IntlProvider } from 'react-intl';
import { Provider } from 'react-redux';
import { store } from '../store';

import Review from '../components/projectCreate/review';

const Wrapper = ({ children }) => (
  <Provider store={store}>
    <IntlProvider locale="en">
      {children}
    </IntlProvider>
  </Provider>
);

describe('Review component', () => {
  const defaultProps = {
    metadata: { tasksNumber: 5, projectName: '', organisation: '', sandbox: false },
    updateMetadata: jest.fn(),
    token: 'test-token',
    projectId: null,
    cloneProjectData: { name: null, organisation: null },
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    render(<Review {...defaultProps} />, { wrapper: Wrapper });
    expect(screen.getByText(/Step 4/i)).toBeInTheDocument();
  });

  it('renders name input when cloneProjectData name is null', () => {
    render(<Review {...defaultProps} />, { wrapper: Wrapper });
    const nameInput = screen.getByLabelText(/name/i);
    expect(nameInput).toBeInTheDocument();
  });

  it('calls updateMetadata on name change', () => {
    render(<Review {...defaultProps} />, { wrapper: Wrapper });
    const nameInput = screen.getByLabelText(/name/i);
    fireEvent.change(nameInput, { target: { value: 'New Project' } });
    expect(defaultProps.updateMetadata).toHaveBeenCalledWith({
      ...defaultProps.metadata,
      projectName: 'New Project',
    });
  });

  it('hides name input when cloneProjectData has a name', () => {
    const props = { ...defaultProps, cloneProjectData: { name: 'Existing', organisation: null } };
    render(<Review {...props} />, { wrapper: Wrapper });
    expect(screen.queryByLabelText(/name/i)).not.toBeInTheDocument();
  });
});
