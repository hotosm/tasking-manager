import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';

import { SwitchToggleField } from '../switchToggleField';
import { store } from '../../../../store';

jest.mock('../../../formInputs', () => ({
  SwitchToggle: ({ onChange, isChecked }) => (
    <input 
      type="checkbox" 
      data-testid="switch-toggle" 
      onChange={onChange} 
      checked={isChecked || false} 
    />
  )
}));
describe('SwitchToggleField', () => {
  const setup = (props) => {};
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with true value from store', () => {
    setup({ fieldName: 'testFieldTrue' });
    const checkbox = screen.getByTestId('switch-toggle');
    expect(checkbox).toBeChecked();
  });

  it('renders correctly with false value from store', () => {
    setup({ fieldName: 'testFieldFalse' });
    const checkbox = screen.getByTestId('switch-toggle');
    expect(checkbox).not.toBeChecked();
  });

  it('uses default value if field is not in store', () => {
    setup({ fieldName: 'missingField', default: true });
    const checkbox = screen.getByTestId('switch-toggle');
    expect(checkbox).toBeChecked();
  });

  it('handles onChange and pushes new user details', async () => {
    const genericJSONRequest = require('../../../../network/genericJSONRequest');
    setup({ fieldName: 'testFieldFalse' });
    
    const checkbox = screen.getByTestId('switch-toggle');
    fireEvent.click(checkbox);
    
    expect(genericJSONRequest.pushToLocalJSONAPI).toHaveBeenCalledWith(
      `users/me/actions/set-user/`,
      JSON.stringify({ id: 1, testFieldFalse: true }),
      'validToken',
      'PATCH'
    );
    
    // Check if the component state updated locally
    await waitFor(() => {
      expect(checkbox).toBeChecked();
    });
  });
});
