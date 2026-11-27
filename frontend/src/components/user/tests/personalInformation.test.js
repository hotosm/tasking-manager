import '@testing-library/jest-dom';
import { act, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { ReduxIntlProviders } from '../../../utils/testWithIntl';
import { store } from '../../../store';
import { PersonalInformationForm } from '../forms/personalInformation';

describe('PersonalInformationForm', () => {
  beforeEach(() => {
    act(() => {
      store.dispatch({
        type: 'SET_USER_DETAILS',
        userDetails: { username: 'test_user', name: 'Test', emailAddress: 'test@example.com' },
      });
    });
  });
  afterEach(() => {
    act(() => {
      store.dispatch({ type: 'SET_USER_DETAILS', userDetails: {} });
    });
  });

  it('links each label to its input', () => {
    render(
      <ReduxIntlProviders>
        <MemoryRouter>
          <PersonalInformationForm />
        </MemoryRouter>
      </ReduxIntlProviders>,
    );
    expect(screen.getByLabelText(/^Name/)).toHaveAttribute('name', 'name');
    expect(screen.getByLabelText(/^Email/)).toHaveAttribute('name', 'emailAddress');
    expect(screen.getByLabelText('Country')).toHaveAttribute('id', 'user-country');
    expect(screen.getByLabelText('City')).toHaveAttribute('name', 'city');
    expect(screen.getByLabelText('Twitter')).toHaveAttribute('name', 'twitterId');
    expect(screen.getByLabelText('Facebook')).toHaveAttribute('name', 'facebookId');
    expect(screen.getByLabelText('Linkedin')).toHaveAttribute('name', 'linkedinId');
    expect(screen.getByLabelText('Female')).toHaveAttribute('value', 'FEMALE');
  });
});
