import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { EmailVerification } from '../verifyEmail';
import { fetchLocalJSONAPI } from '../../network/genericJSONRequest';

let mockQueryParams = {
  token: 'token-123',
  username: 'paul',
};

jest.mock('../../network/genericJSONRequest', () => ({
  fetchLocalJSONAPI: jest.fn(),
}));

jest.mock('../../hooks/UseMetaTags', () => ({
  useSetTitleTag: jest.fn(),
}));

jest.mock('use-query-params', () => ({
  StringParam: 'StringParam',
  useQueryParam: (name) => [mockQueryParams[name], jest.fn()],
}));

jest.mock('react-placeholder', () => ({
  __esModule: true,
  default: ({ children, ready }) =>
    ready ? <div>{children}</div> : <div data-testid="email-placeholder">Loading</div>,
}));

jest.mock('react-intl', () => {
  const actualReactIntl = jest.requireActual('react-intl');

  return {
    ...actualReactIntl,
    FormattedMessage: ({ id, defaultMessage, values }) => (
      <span>
        {defaultMessage || id}
        {values &&
          Object.values(values).map((value, index) => (
            <span key={index}>{value}</span>
          ))}
      </span>
    ),
  };
});

const renderEmailVerification = () =>
  render(
    <MemoryRouter>
      <EmailVerification />
    </MemoryRouter>,
  );

beforeEach(() => {
  jest.clearAllMocks();

  mockQueryParams = {
    token: 'token-123',
    username: 'paul',
  };
});

describe('EmailVerification view', () => {
  it('calls the verification endpoint and shows the settings link when email is verified', async () => {
    fetchLocalJSONAPI.mockResolvedValueOnce({});

    renderEmailVerification();

    await waitFor(() => {
      expect(fetchLocalJSONAPI).toHaveBeenCalledWith(
        'system/authentication/email/?token=token-123&username=paul',
      );
    });

    expect(await screen.findByRole('link')).toHaveAttribute('href', '/settings');
  });

  it('does not show the settings link when the verification request fails', async () => {
    fetchLocalJSONAPI.mockRejectedValueOnce(new Error('Verification failed'));

    renderEmailVerification();

    await waitFor(() => {
      expect(fetchLocalJSONAPI).toHaveBeenCalledWith(
        'system/authentication/email/?token=token-123&username=paul',
      );
    });

    await waitFor(() => {
      expect(screen.queryByRole('link')).not.toBeInTheDocument();
    });
  });

  it('does not call the verification endpoint when token is missing', () => {
    mockQueryParams = {
      token: undefined,
      username: 'paul',
    };

    renderEmailVerification();

    expect(fetchLocalJSONAPI).not.toHaveBeenCalled();
    expect(screen.getByTestId('email-placeholder')).toBeInTheDocument();
  });

  it('does not call the verification endpoint when username is missing', () => {
    mockQueryParams = {
      token: 'token-123',
      username: undefined,
    };

    renderEmailVerification();

    expect(fetchLocalJSONAPI).not.toHaveBeenCalled();
    expect(screen.getByTestId('email-placeholder')).toBeInTheDocument();
  });
});