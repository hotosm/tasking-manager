import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';

import { PersonalInformationForm } from '../personalInformation';
import { ReduxIntlProviders, createComponentWithMemoryRouter } from '../../../../utils/testWithIntl';
import * as genericJSONRequest from '../../../../network/genericJSONRequest';
import { store } from '../../../../store';

jest.mock('../../../deleteModal', () => ({
  DeleteModal: () => <div data-testid="delete-modal" />
}));

describe('PersonalInformationForm Component', () => {
  const setup = () => {
    store.dispatch({
      type: 'SET_USER_DETAILS',
      userDetails: {
        id: 1,
        username: 'testuser',
        name: 'Test User',
        emailAddress: 'test@example.com',
        isEmailVerified: false,
        city: 'Test City',
        gender: 'FEMALE'
      }
    });
    store.dispatch({ type: 'SET_TOKEN', token: 'validToken' });

    return render(
      <ReduxIntlProviders localStore={store}>
        <PersonalInformationForm />
      </ReduxIntlProviders>
    );
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders personal information form correctly', () => {
    setup();
    expect(screen.getByText('Personal information')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test User')).toBeInTheDocument();
    expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test City')).toBeInTheDocument();
  });

  it('handles email resend', async () => {
    jest.spyOn(genericJSONRequest, 'fetchLocalJSONAPI').mockResolvedValue({});
    setup();
    
    // Trigger dirty state so verification warning shows? No, the condition is !meta.dirty
    // The warning is "Please verify your email" with "Resend"
    const resendBtn = screen.getByText(/Resend validation email/i);
    expect(resendBtn).toBeInTheDocument();
    
    fireEvent.click(resendBtn);
    
    await waitFor(() => {
      expect(genericJSONRequest.fetchLocalJSONAPI).toHaveBeenCalledWith(
        'users/me/actions/verify-email/',
        'validToken',
        'PATCH'
      );
    });
  });

  it('validates URLs on social fields', async () => {
    setup();
    const twitterInput = screen.getAllByRole('textbox').find(el => el.name === 'twitterId');
    
    fireEvent.change(twitterInput, { target: { value: 'http://twitter.com/test' } });
    fireEvent.blur(twitterInput);
    
    await waitFor(() => {
      expect(screen.getByText(/Type only your username/i)).toBeInTheDocument();
    });
  });
});
