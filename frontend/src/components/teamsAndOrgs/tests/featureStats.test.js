import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import { ReduxIntlProviders, QueryClientProviders } from '../../../utils/testWithIntl';
import { FeatureStats } from '../featureStats';

describe('Stats Section', () => {
  it('should display correct values and labels', async () => {
    render(
      <QueryClientProviders>
        <ReduxIntlProviders>
          <FeatureStats />
        </ReduxIntlProviders>
      </QueryClientProviders>,
    );
    expect(screen.getByText('Km road mapped')).toBeInTheDocument();
    expect(screen.getByText('Buildings mapped')).toBeInTheDocument();
    expect(screen.getByText('Points of interests mapped')).toBeInTheDocument();
    expect(screen.getByText('Km waterways mapped')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('2,380,562')).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText('101,367,027')).toBeInTheDocument());
    expect(screen.getByText('183,011')).toBeInTheDocument();
    expect(screen.getByText('350,906')).toBeInTheDocument();
  });
});
