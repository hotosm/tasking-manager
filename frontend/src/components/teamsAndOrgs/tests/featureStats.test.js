import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import axios from 'axios';
import '@testing-library/jest-dom';

import { ReduxIntlProviders } from '../../../utils/testWithIntl';
import { FeatureStats } from '../featureStats';
import { homepageStats } from '../../../network/tests/mockData/homepageStats';

jest.mock('axios');

test('FeatureStats renders the correct values and labels', async () => {
  axios.get.mockResolvedValue({ data: homepageStats });

  render(
    <ReduxIntlProviders>
      <FeatureStats />
    </ReduxIntlProviders>,
  );
  expect(screen.getByText('Km road mapped')).toBeInTheDocument();
  expect(screen.getByText('Buildings mapped')).toBeInTheDocument();
  expect(screen.getByText('Points of interests mapped')).toBeInTheDocument();
  expect(screen.getByText('Km waterways mapped')).toBeInTheDocument();
  await waitFor(() => expect(screen.getByText('2,380,562')).toBeInTheDocument());
  expect(screen.getByText('101,367,027')).toBeInTheDocument();
  // Uncomment the following when POIs and waterways become available
  // expect(screen.getByText('183,011')).toBeInTheDocument();
  // expect(screen.getByText('350,906')).toBeInTheDocument();
  // We need to wait for network requests to complete -- otherwise, logging the errors to console may cause jest to fail
  // Note: The time is 2023-10-03T15:47:49Z, but time zones may mess things up (+- 12 hours).
  await waitFor(() => expect(screen.getByLabelText(/These statistics come from ohsomeNow Stats and were last updated at Oct 0[34], 2023, .{10,}. Missing fields will be made available soon!/)).toBeInTheDocument());
});
