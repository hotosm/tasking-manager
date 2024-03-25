import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import { RelativeTimeWithUnit } from '../formattedRelativeTime';
import { ReduxIntlProviders } from '../testWithIntl';

describe('RelativeTimeWithUnit renders', () => {
  it('1 hour ago', () => {
    render(
      <ReduxIntlProviders>
        <RelativeTimeWithUnit date={Date.now() - 1e3 * 60 * 60} />
      </ReduxIntlProviders>,
    );
    expect(screen.getByText('1 hour ago')).toBeInTheDocument();
  });
  it('in 1 hour', () => {
    render(
      <ReduxIntlProviders>
        <RelativeTimeWithUnit date={Date.now() + 1e3 * 60 * 60} />
      </ReduxIntlProviders>,
    );
    expect(screen.getByText('in 1 hour')).toBeInTheDocument();
  });
  it('1 day ago', () => {
    render(
      <ReduxIntlProviders>
        <RelativeTimeWithUnit date={Date.now() - 1e3 * 60 * 60 * 24} />
      </ReduxIntlProviders>,
    );
    expect(screen.getByText('1 day ago')).toBeInTheDocument();
  });
  it('1 week ago', () => {
    render(
      <ReduxIntlProviders>
        <RelativeTimeWithUnit date={Date.now() - 1e3 * 60 * 60 * 24 * 7} />
      </ReduxIntlProviders>,
    );
    expect(screen.getByText('1 week ago')).toBeInTheDocument();
  });
});
