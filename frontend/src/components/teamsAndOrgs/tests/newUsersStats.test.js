import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import { ReduxIntlProviders } from '../../../utils/testWithIntl';
import { NewUsersStats } from '../newUsersStats';

describe('NewUsersStats', () => {
  it('render week stats', async () => {
    render(
      <ReduxIntlProviders>
        <NewUsersStats datePeriod={'week'} />
      </ReduxIntlProviders>,
    );
    await waitFor(() => expect(screen.getByText('Mapped at least one task')).toBeInTheDocument());
    expect(screen.getByText('Mapped at least one task')).toBeInTheDocument();
    expect(screen.getByText('36%')).toBeInTheDocument();
    expect(screen.getByText('Confirmed email address')).toBeInTheDocument();
    expect(screen.getByText('26%')).toBeInTheDocument();
    expect(screen.getByText('1,044 users registered in the last 7 days')).toBeInTheDocument();
  });

  it('render month stats', async () => {
    render(
      <ReduxIntlProviders>
        <NewUsersStats datePeriod={'month'} />
      </ReduxIntlProviders>,
    );
    await waitFor(() => expect(screen.getByText('Mapped at least one task')).toBeInTheDocument());
    expect(screen.getByText('36%')).toBeInTheDocument();
    expect(screen.getByText('Confirmed email address')).toBeInTheDocument();
    expect(screen.getByText('26%')).toBeInTheDocument();
    expect(screen.getByText('1,044 users registered in the last 30 days')).toBeInTheDocument();
  });
});
