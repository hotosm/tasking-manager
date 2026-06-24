import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { IntlProvider } from 'react-intl';

import ProjectTimeline from '../components/projectDetail/timeline';

// Mock chart components since canvas is hard to test in JSDOM
jest.mock('react-chartjs-2', () => ({
  Line: () => <div data-testid="mock-line-chart" />
}));

const Wrapper = ({ children }) => (
  <IntlProvider locale="en">
    {children}
  </IntlProvider>
);

describe('ProjectTimeline component', () => {
  it('renders line chart correctly', () => {
    const mockTasksByDay = [
      { date: '2023-01-01', mapped: 5, validated: 2 },
      { date: '2023-01-02', mapped: 10, validated: 8 }
    ];

    render(<ProjectTimeline tasksByDay={mockTasksByDay} />, { wrapper: Wrapper });
    expect(screen.getByTestId('mock-line-chart')).toBeInTheDocument();
  });
});
