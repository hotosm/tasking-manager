import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import { ReduxIntlProviders } from '../../../utils/testWithIntl';
import { MessageStatus } from '../status';

describe('MessageStatus', () => {
  it('with status = error', () => {
    render(
      <ReduxIntlProviders>
        <MessageStatus status="error" />
      </ReduxIntlProviders>,
    );
    expect(screen.getByText('An error occurred while sending message.').className).toBe('red');
  });
  it('with status = messageSent', () => {
    render(
      <ReduxIntlProviders>
        <MessageStatus status="messageSent" />
      </ReduxIntlProviders>,
    );
    expect(screen.getByText('Message sent.').className).toBe('red');
  });
  it('with status = sending', () => {
    render(
      <ReduxIntlProviders>
        <MessageStatus status="sending" />
      </ReduxIntlProviders>,
    );
    expect(screen.getByText('Sending message...').className).toBe('blue-grey');
  });
});
