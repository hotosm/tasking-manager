import { render, screen, waitFor } from '@testing-library/react';
import { StatsNumber, StatsSection } from '../stats';
import {
  IntlProviders,
  QueryClientProviders,
} from '../../../utils/testWithIntl';

it('test number formatting in English', async () => {
  render(
    <IntlProviders>
      <StatsNumber value={744531} />
    </IntlProviders>,
  );
  expect(await screen.findByText('744.5K')).toBeInTheDocument();
});

it('test number formatting smaller than 1000', async () => {
  render(
    <IntlProviders>
      <StatsNumber value={744} />
    </IntlProviders>,
  )
  expect(await screen.findByText('744')).toBeInTheDocument();
  expect(screen.queryByText('K')).not.toBeInTheDocument();
});

describe('Stats Section', () => {
  it('should display OSM and TM stats', async () => {
    render(
      <QueryClientProviders>
        <IntlProviders>
          <StatsSection />
        </IntlProviders>
      </QueryClientProviders>,
    );
    // A stat from OSM's TM Stat
    await waitFor(() => expect(screen.getByText('101.4M')).toBeInTheDocument());
    // A stat from TM Stat
    await waitFor(() => expect(screen.getByText(3)).toBeInTheDocument());
  });
});
