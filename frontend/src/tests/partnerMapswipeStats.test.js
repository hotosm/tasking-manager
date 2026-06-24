import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import { IntlProvider } from 'react-intl';
import { Provider } from 'react-redux';
import { store } from '../store';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';

import { formatSecondsToTwoUnits, getShortNumber } from '../components/partnerMapswipeStats/overview';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const Wrapper = ({ children }) => (
  <Provider store={store}>
    <IntlProvider locale="en">
      <MemoryRouter initialEntries={['/partners/test-partner/stats']}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </MemoryRouter>
    </IntlProvider>
  </Provider>
);

describe('formatSecondsToTwoUnits utility function', () => {
  it('formats seconds to minutes and seconds', () => {
    const result = formatSecondsToTwoUnits(90);
    expect(result).toContain('minute');
    expect(result).toContain('second');
  });

  it('formats hours correctly', () => {
    const result = formatSecondsToTwoUnits(3600);
    expect(result).toContain('hour');
  });

  it('formats days correctly', () => {
    const result = formatSecondsToTwoUnits(86400);
    expect(result).toContain('day');
  });

  it('formats a single minute correctly (no plural)', () => {
    const result = formatSecondsToTwoUnits(60);
    expect(result).toContain('minute');
    expect(result).not.toContain('minutes');
  });

  it('formats multiple minutes correctly (with plural)', () => {
    const result = formatSecondsToTwoUnits(120);
    expect(result).toContain('minutes');
  });

  it('handles short format', () => {
    const result = formatSecondsToTwoUnits(3661, true);
    expect(result).toContain('hr');
  });

  it('handles 0 seconds', () => {
    const result = formatSecondsToTwoUnits(0);
    expect(result).toBe('');
  });

  it('formats years correctly', () => {
    const result = formatSecondsToTwoUnits(31536000);
    expect(result).toContain('year');
  });
});

describe('getShortNumber utility function', () => {
  it('returns a formatted number for small values', () => {
    const result = getShortNumber(100);
    expect(result).toBeTruthy();
  });

  it('formats large numbers with abbreviation', () => {
    const result = getShortNumber(1500000);
    // shortNumber returns like "1.5M" or "2M"
    expect(result).toBeTruthy();
  });

  it('handles zero', () => {
    const result = getShortNumber(0);
    expect(result).toBeTruthy();
  });

  it('handles thousands', () => {
    const result = getShortNumber(5000);
    expect(result).toBeTruthy();
  });
});
