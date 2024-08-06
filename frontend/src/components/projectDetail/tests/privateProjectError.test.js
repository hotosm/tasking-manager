import '@testing-library/jest-dom';
import { screen } from '@testing-library/react';

import PrivateProjectError from '../privateProjectError';
import {
  createComponentWithMemoryRouter,
  IntlProviders,
  renderWithRouter,
} from '../../../utils/testWithIntl';

describe('PrivateProjectError component', () => {
  it('renders all items', () => {
    const { container } = renderWithRouter(
      <IntlProviders>
        <PrivateProjectError />
      </IntlProviders>,
    );
    expect(
      screen.getByRole('heading', { name: "You don't have permission to access this project" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/please contact the project manager to request access\./i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: /explore other projects/i,
      }),
    ).toBeEnabled();
    expect(container.querySelectorAll('svg').length).toBe(1);
  });

  it('should navigate to explore projects page', async () => {
    const { user, router } = createComponentWithMemoryRouter(
      <IntlProviders>
        <PrivateProjectError />
      </IntlProviders>,
    );

    await user.click(
      screen.getByRole('button', {
        name: /explore other projects/i,
      }),
    );
    expect(router.state.location.pathname).toBe('/explore');
  });
});
