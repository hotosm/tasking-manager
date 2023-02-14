import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { IntlProviders, renderWithRouter } from '../../utils/testWithIntl';
import { FallbackComponent } from '../fallback';
import { SERVICE_DESK } from '../../config';
import messages from '../messages';

describe('Fallback component', () => {
  it('should render component details', () => {
    render(
      <IntlProviders>
        <FallbackComponent />
      </IntlProviders>,
    );
    expect(
      screen.getByRole('heading', {
        name: messages.errorFallback.defaultMessage,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        name: messages.errorFallback.defaultMessage,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: /return/i,
      }),
    ).toBeInTheDocument();
  });

  it('should render service desk link if present', () => {
    render(
      <IntlProviders>
        <FallbackComponent />
      </IntlProviders>,
    );
    expect(
      screen.getByRole('button', {
        name: messages.contactUs.defaultMessage,
      }),
    ).toBeInTheDocument();
    if (SERVICE_DESK) {
      expect(screen.queryByRole('link')).toHaveAttribute('href', SERVICE_DESK);
    } else {
      expect(screen.queryByRole('link')).toHaveAttribute('href', '/contact');
    }
  });

  it('should trigger navigate on return button click', async () => {
    const mockedUsedNavigate = jest.fn();
    jest.mock('@reach/router', () => ({
      navigate: () => mockedUsedNavigate,
    }));
    renderWithRouter(
      <IntlProviders>
        <FallbackComponent />
      </IntlProviders>,
    );
    const returnBtn = screen.getByRole('button', {
      name: messages.return.defaultMessage,
    });
    await userEvent.click(returnBtn);
    waitFor(() => expect(mockedUsedNavigate).toHaveBeenCalledTimes(1));
  });
});
