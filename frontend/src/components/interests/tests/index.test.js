import '@testing-library/jest-dom';
import { screen, waitFor } from '@testing-library/react';
import { IntlProviders, renderWithRouter } from '../../../utils/testWithIntl';
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
    const { container, getByRole } = renderWithRouter(
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
    const { container } = renderWithRouter(
      <IntlProviders>
        <InterestsManagement isInterestsFetched={true} />
      </IntlProviders>,
    );
    expect(container.getElementsByClassName('show-loading-animation')).toHaveLength(0);
  });

  it('renders interests list card after API is fetched', async () => {
    const { container, getByText } = renderWithRouter(
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
    expect(container.querySelectorAll('svg').length).toBe(5);
  });

  it('filters interests list by the search query', async () => {
    const { user, container } = renderWithRouter(
      <IntlProviders>
        <InterestsManagement interests={dummyInterests} isInterestsFetched={true} />
      </IntlProviders>,
    );
    const textField = screen.getByRole('textbox');
    expect(textField).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText(/Interest 1/i));
    });
    expect(container.querySelectorAll('svg').length).toBe(5);
    await user.clear(textField);
    await user.type(textField, '2');
    expect(screen.getByText(/Interest 2/i)).toBeInTheDocument();
    expect(screen.queryByText(/Interest 1/i)).not.toBeInTheDocument();
  });
});
