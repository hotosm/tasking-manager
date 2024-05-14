import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import { ReduxIntlProviders } from '../../../utils/testWithIntl';
import { MessageStatus } from '../status';

describe('MessageStatus', () => {
  it('with status = error', () => {
    const { container } = render(
      <ReduxIntlProviders>
        <MessageStatus status="error" />
      </ReduxIntlProviders>,
    );
    expect(screen.getByText('An error occurred while sending message.')).toBeInTheDocument();
    expect(container.querySelector('.dark-red')).toBeInTheDocument();
    expect(container.querySelector('.bg-washed-red')).toBeInTheDocument();
    expect(container.querySelector('.di')).toBeInTheDocument();
    expect(container.querySelector('.pa2')).toBeInTheDocument();
  });
  it('with status = success', () => {
    const { container } = render(
      <ReduxIntlProviders>
        <MessageStatus status="success" />
      </ReduxIntlProviders>,
    );
    expect(screen.getByText('Message sent.')).toBeInTheDocument();
    expect(container.querySelector('.dark-green')).toBeInTheDocument();
    expect(container.querySelector('.bg-washed-green')).toBeInTheDocument();
    expect(container.querySelector('.di')).toBeInTheDocument();
    expect(container.querySelector('.pa2')).toBeInTheDocument();
  });
  it('with status = success and a comment', () => {
    render(
      <ReduxIntlProviders>
        <MessageStatus status="success" comment="new comment started" />
      </ReduxIntlProviders>,
    );
    expect(screen.queryByText('Message sent.')).not.toBeInTheDocument();
  });
});
