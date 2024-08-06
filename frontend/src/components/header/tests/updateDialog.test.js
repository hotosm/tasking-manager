import '@testing-library/jest-dom';
import { screen, fireEvent } from '@testing-library/react';

import messages from '../messages';
import { UpdateDialog } from '../updateDialog';
import { IntlProviders, renderWithRouter } from '../../../utils/testWithIntl';

describe('Update Dialog', () => {
  it('should not render prompt for mapping page', () => {
    const { container } = renderWithRouter(
      <IntlProviders>
        <UpdateDialog />
      </IntlProviders>,
      {
        route: '/projects/map/',
      },
    );
    fireEvent(
      document,
      new CustomEvent('onNewServiceWorker', { detail: { registration: 'hello' } }),
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('should not render prompt for validation page', () => {
    const { container } = renderWithRouter(
      <IntlProviders>
        <UpdateDialog />
      </IntlProviders>,
      {
        route: '/projects/validate/',
      },
    );
    fireEvent(
      document,
      new CustomEvent('onNewServiceWorker', { detail: { registration: 'hello' } }),
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('should render prompt for other pages', () => {
    renderWithRouter(
      <IntlProviders>
        <UpdateDialog />
      </IntlProviders>,
    );
    fireEvent(
      document,
      new CustomEvent('onNewServiceWorker', { detail: { registration: { waiting: true } } }),
    );
    expect(screen.getByText(messages.newVersionAvailable.defaultMessage)).toBeInTheDocument();
    expect(
      screen.getByText(messages.newVersionAvailableLineTwo.defaultMessage),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument();
  });

  it('should update the service worker', async () => {
    const { user } = renderWithRouter(
      <IntlProviders>
        <UpdateDialog />
      </IntlProviders>,
    );
    const postMessageMock = jest.fn();
    fireEvent(
      document,
      new CustomEvent('onNewServiceWorker', {
        detail: { registration: { waiting: { postMessage: postMessageMock } } },
      }),
    );

    Object.defineProperty(global.navigator, 'serviceWorker', {
      value: {
        addEventListener: jest.fn(),
      },
    });
    await user.click(screen.getByRole('button', { name: /refresh/i }));
    expect(postMessageMock).toHaveBeenCalled();
  });
});
