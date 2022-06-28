import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { IntlProviders } from '../../../utils/testWithIntl';
import { InterestsManagement } from '../index';

const dummyInterests = [
  {
    id: 1,
    name: 'Interest 1',
  },
  {
    id: 2,
    name: 'Interest 2',
  },
];

describe('InterestsManagement component', () => {
  it('renders loading placeholder when API is being fetched', () => {
    const { container, getByRole } = render(
      <IntlProviders>
        <InterestsManagement isInterestsFetched={false} />
      </IntlProviders>,
    );
    expect(
      screen.getByRole('heading', {
        name: /manage categories/i,
      }),
    ).toBeInTheDocument();
    expect(container.getElementsByClassName('show-loading-animation')).toHaveLength(4);
    expect(
      getByRole('button', {
        name: /new/i,
      }),
    ).toBeInTheDocument();
  });

  it('does not render loading placeholder after API is fetched', () => {
    const { container } = render(
      <IntlProviders>
        <InterestsManagement isInterestsFetched={true} />
      </IntlProviders>,
    );
    expect(container.getElementsByClassName('show-loading-animation')).toHaveLength(0);
  });

  it('renders interests list card after API is fetched', async () => {
    const { container, getByText } = render(
      <IntlProviders>
        <InterestsManagement interests={dummyInterests} isInterestsFetched={true} />
      </IntlProviders>,
    );
    expect(
      screen.getByRole('heading', {
        name: /manage categories/i,
      }),
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(getByText(/Interest 1/i));
    });
    expect(getByText(/Interest 2/i)).toBeInTheDocument();
    expect(container.querySelectorAll('svg').length).toBe(3);
  });
});
