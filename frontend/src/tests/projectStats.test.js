import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { IntlProvider } from 'react-intl';

import ContributorsStats from '../components/projectStats/contributorsStats';
import TasksByStatus from '../components/projectStats/taskStatus';
import * as genericJSONRequest from '../network/genericJSONRequest';

const Wrapper = ({ children }) => (
  <IntlProvider locale="en">
    {children}
  </IntlProvider>
);

describe('ContributorsStats component', () => {
  beforeEach(() => {
    jest.spyOn(genericJSONRequest, 'fetchLocalJSONAPI').mockResolvedValue({
      levels: [
        { name: 'BEGINNER', color: '#ff0000' },
        { name: 'INTERMEDIATE', color: '#00ff00' },
        { name: 'ADVANCED', color: '#0000ff' },
      ],
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const mockContributors = [
    { username: 'mapper1', mappingLevel: 'BEGINNER', date: '2022-01-01', mappedTasks: 5, validatedTasks: 0 },
    { username: 'validator1', mappingLevel: 'ADVANCED', date: '2021-01-01', mappedTasks: 0, validatedTasks: 10 },
  ];

  it('renders stats correctly', async () => {
    render(<ContributorsStats contributors={mockContributors} />, { wrapper: Wrapper });
    expect(screen.getByText(/contributors/i)).toBeInTheDocument();
    
    await waitFor(() => {
      // It should fetch levels and render the components
      expect(genericJSONRequest.fetchLocalJSONAPI).toHaveBeenCalledWith('levels/');
    });
  });

  it('renders with empty contributors array', async () => {
    render(<ContributorsStats contributors={[]} />, { wrapper: Wrapper });
    await waitFor(() => {
      expect(screen.getByText(/contributors/i)).toBeInTheDocument();
    });
  });
});

describe('TasksByStatus component', () => {
  const mockStats = {
    invalidated: 5,
    ready: 10,
    lockedForMapping: 2,
    mapped: 20,
    lockedForValidation: 3,
    validated: 15,
    badImagery: 1
  };

  it('renders correctly', () => {
    render(<TasksByStatus stats={mockStats} />, { wrapper: Wrapper });
    // Text labels are generated via intl, so we look for basic structure
    expect(screen.getByText(/status/i)).toBeInTheDocument();
  });

  it('renders with empty stats object (fallback/zero)', () => {
    render(<TasksByStatus stats={{}} />, { wrapper: Wrapper });
    expect(screen.getByText(/status/i)).toBeInTheDocument();
  });
});
