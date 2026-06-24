import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import { UserNotificationsForm } from '../notifications';
import { ReduxIntlProviders } from '../../../../utils/testWithIntl';

jest.mock('../customField', () => ({
  CustomField: ({ children, labelId }) => (
    <div data-testid={`custom-field-${labelId}`}>
      <label>{labelId}</label>
      {children}
    </div>
  ),
}));

jest.mock('../switchToggleField', () => ({
  SwitchToggleField: ({ fieldName }) => (
    <input type="checkbox" data-testid={`switch-field-${fieldName}`} />
  ),
}));

describe('UserNotificationsForm Component', () => {
  const setup = () => {
    return render(
      <ReduxIntlProviders>
        <UserNotificationsForm />
      </ReduxIntlProviders>
    );
  };

  it('renders correctly', () => {
    setup();
    // Verify title
    expect(screen.getByText('Notifications')).toBeInTheDocument();
    
    // Verify each custom field and switch toggle
    const fields = [
      'mentions', 'teamUpdates', 'taskValidationUpdates', 'taskInvalidationUpdates',
      'projectUpdates', 'questionsAndComments', 'taskComments'
    ];
    
    fields.forEach(field => {
      expect(screen.getByTestId(`custom-field-${field}`)).toBeInTheDocument();
    });
  });
});
