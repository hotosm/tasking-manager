import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import { FormattedNumber } from 'react-intl';

import { StatsNumber, StatsSection } from '../stats';
import {
  IntlProviders,
  QueryClientProviders,
  createComponentWithIntl,
} from '../../../utils/testWithIntl';

it('test number formatting in English', () => {
  const testNumber = createComponentWithIntl(<StatsNumber value={744531} />);
  const testInstance = testNumber.root;
  expect(testInstance.findByType(FormattedNumber).props.value).toBe(744.5);
  expect(testInstance.findByType('span').children).toContain('K');
});

it('test number formatting smaller than 1000', () => {
  const testNumber = createComponentWithIntl(<StatsNumber value={744} />);
  const testInstance = testNumber.root;
  expect(testInstance.findByType(FormattedNumber).props.value).toBe(744);
  expect(testInstance.children).not.toContain('K');
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
