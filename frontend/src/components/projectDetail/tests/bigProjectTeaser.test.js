import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import { BigProjectTeaser } from '../bigProjectTeaser';
import { IntlProviders } from '../../../utils/testWithIntl';

describe('BigProjectTeaser component', () => {
  it('shows 5 total contributors for project last updated 1 minute ago', () => {
    render(
      <IntlProviders>
        <BigProjectTeaser
          lastUpdated={new Date() - 1e3 * 60}
          totalContributors={5}
          className={'pt3'}
          littleFont={'f7'}
          bigFont={'f6'}
        />
      </IntlProviders>,
    );
    expect(screen.queryByText('5')).toBeInTheDocument();
    expect(screen.getByText(/contributors/)).toBeInTheDocument();
    expect(screen.getByText(/Last contribution 1 minute ago/)).toBeInTheDocument();
  });

  it('shows 1 total contributor for project last updated a second ago', () => {
    render(
      <IntlProviders>
        <BigProjectTeaser
          lastUpdated={new Date() - 1e3}
          totalContributors={1}
          className={'pt3'}
          littleFont={'f7'}
          bigFont={'f6'}
        />
      </IntlProviders>,
    );
    expect(screen.queryByText('1')).toBeInTheDocument();
    expect(screen.getByText(/contributor/)).toBeInTheDocument();
    expect(screen.getByText(/Last contribution 1 second ago/)).toBeInTheDocument();
  });

  it('shows no contributors yet for project with no mapping or validation and last updated 4 days ago', () => {
    render(
      <IntlProviders>
        <BigProjectTeaser
          lastUpdated={new Date() - 1e3 * 60 * 60 * 24 * 4}
          totalContributors={0}
          className={'pt3'}
          littleFont={'f7'}
          bigFont={'f6'}
        />
      </IntlProviders>,
    );
    expect(screen.queryByText(/No contributors yet/)).toBeInTheDocument();
    expect(screen.getByText(/Last contribution 4 days ago/)).toBeInTheDocument();
  });
});
