import { screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { IntlProviders, renderWithRouter } from '../../../utils/testWithIntl';
import { CampaignsManagement } from '../campaigns';

const dummyCampaigns = [
  {
    id: 1,
    name: 'Campaign 1',
  },
  {
    id: 2,
    name: 'Campaign 2',
  },
];

describe('CampaignsManagement component', () => {
  it('renders loading placeholder when API is being fetched', () => {
    const { container, getByRole } = renderWithRouter(
      <IntlProviders>
        <CampaignsManagement userDetails={{ role: 'ADMIN' }} isCampaignsFetched={false} />
      </IntlProviders>,
    );
    expect(
      screen.getByRole('heading', {
        name: /manage campaigns/i,
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
        <CampaignsManagement userDetails={{ role: 'ADMIN' }} isCampaignsFetched={true} />
      </IntlProviders>,
    );
    expect(container.getElementsByClassName('show-loading-animation')).toHaveLength(0);
  });

  it('renders campaigns list card after API is fetched', async () => {
    const { container, getByText } = renderWithRouter(
      <IntlProviders>
        <CampaignsManagement
          campaigns={dummyCampaigns}
          userDetails={{ role: 'ADMIN' }}
          isCampaignsFetched={true}
        />
      </IntlProviders>,
    );
    expect(
      screen.getByRole('heading', {
        name: /manage campaigns/i,
      }),
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(getByText(/Campaign 1/i));
    });
    expect(getByText(/Campaign 2/i)).toBeInTheDocument();
    expect(container.querySelectorAll('svg').length).toBe(5);
  });

  it('filters campaigns list by the search query', async () => {
    const { user } = renderWithRouter(
      <IntlProviders>
        <CampaignsManagement
          campaigns={dummyCampaigns}
          userDetails={{ role: 'ADMIN' }}
          isCampaignsFetched={true}
        />
      </IntlProviders>,
    );
    const textField = screen.getByRole('textbox');
    await user.clear(textField);
    await user.type(textField, '2');
    expect(screen.getByRole('heading', { name: 'Campaign 2' })).toHaveTextContent('Campaign 2');
    await user.clear(textField);
    await user.type(textField, 'not 2');
    expect(screen.queryByRole('heading', { name: 'Campaign 2' })).not.toBeInTheDocument();
    expect(screen.queryByText('There are no campaigns yet.')).toBeInTheDocument();
  });
});
