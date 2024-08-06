import '@testing-library/jest-dom';
import { screen, waitFor } from '@testing-library/react';

import { IntlProviders, renderWithRouter } from '../../utils/testWithIntl';
import { FallbackComponent } from '../fallback';
import { SERVICE_DESK } from '../../config';
import messages from '../messages';

/*
 * This was in "should trigger navigate on return button click". There are
 * references to some things being hoisted to different locations in Jest
 * documentation. For whatever reason, we have to mock it here, instead of later
 * in the test where we actually need to mock it.
 */
const mockedUsedNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockedUsedNavigate,
}));

describe('Fallback component', () => {
  it('should render component details', () => {
    renderWithRouter(
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
    renderWithRouter(
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
    const { user } = renderWithRouter(
      <IntlProviders>
        <FallbackComponent />
      </IntlProviders>,
    );

    const returnBtn = screen.getByRole('button', {
      name: messages.return.defaultMessage,
    });
    await user.click(returnBtn);
    await waitFor(() => expect(mockedUsedNavigate).toHaveBeenCalledTimes(1));
  });
});
