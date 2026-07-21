import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ExploreProjectsTable } from '../exploreProjectsTable';
import { IntlProviders, renderWithRouter } from '../../../utils/testWithIntl';

const mockProjects = [
  {
    projectId: 1,
    name: 'Project 1',
    author: 'user1',
    organisationName: 'Org 1',
    percentMapped: 50,
    percentValidated: 10,
    totalContributors: 5,
    priority: 'URGENT',
    difficulty: 'EASY',
    status: 'DRAFT',
    country: ['Country 1'],
    lastUpdated: new Date().toISOString(),
    dueDate: new Date(new Date().getTime() + 86400000).toISOString(), // future date
  },
  {
    projectId: 2,
    name: 'Project 2',
    author: null, // to test missing author
    organisationName: 'Org 2',
    percentMapped: 20,
    percentValidated: 5,
    totalContributors: 2,
    priority: 'HIGH',
    difficulty: 'MODERATE',
    status: 'PUBLISHED',
    country: [], // missing country
    lastUpdated: null,
    dueDate: new Date(new Date().getTime() - 86400000).toISOString(), // past date
  },
  {
    projectId: 3,
    name: 'Project 3',
    author: 'user3',
    organisationName: 'Org 3',
    percentMapped: 100,
    percentValidated: 100,
    totalContributors: 10,
    priority: 'LOW',
    difficulty: 'CHALLENGING',
    status: 'ARCHIVED',
    country: null,
    lastUpdated: new Date(new Date().getTime() - 86400000).toISOString(),
    dueDate: null, // missing due date
  }
];

describe('ExploreProjectsTable', () => {
  it('renders all columns with different data variations', () => {
    const { container } = renderWithRouter(
      <IntlProviders>
        <ExploreProjectsTable projects={mockProjects} status="success" />
      </IntlProviders>
    );

    // Verify Project 1
    expect(screen.getByText('Project 1')).toBeInTheDocument();
    expect(screen.getByText('user1')).toBeInTheDocument();
    expect(screen.getByText('Easy')).toBeInTheDocument();
    expect(screen.getByText('Draft')).toBeInTheDocument();
    expect(screen.getByText('Country 1')).toBeInTheDocument();

    // Verify Project 2
    expect(screen.getByText('Project 2')).toBeInTheDocument();
    expect(screen.getByText('Moderate')).toBeInTheDocument();
    expect(screen.getByText('Published')).toBeInTheDocument();
    expect(screen.getByText('Finished')).toBeInTheDocument(); // Since due date is past

    // Verify Project 3
    expect(screen.getByText('Project 3')).toBeInTheDocument();
    expect(screen.getByText('Challenging')).toBeInTheDocument();
    expect(screen.getByText('Archived')).toBeInTheDocument();

    // Check for empty author --
    expect(screen.getAllByText('--').length).toBeGreaterThan(0);
  });

  it('renders empty message when no projects and status is not pending/error', () => {
    renderWithRouter(
      <IntlProviders>
        <ExploreProjectsTable projects={[]} status="success" />
      </IntlProviders>
    );
    expect(screen.getByText(/No projects were found/i)).toBeInTheDocument();
  });

  it('does not render empty message if status is pending', () => {
    renderWithRouter(
      <IntlProviders>
        <ExploreProjectsTable projects={[]} status="pending" />
      </IntlProviders>
    );
    expect(screen.queryByText(/No projects were found/i)).not.toBeInTheDocument();
  });

  it('navigates when clicking a row', () => {
    const { container } = renderWithRouter(
      <IntlProviders>
        <ExploreProjectsTable projects={[mockProjects[0]]} status="success" />
      </IntlProviders>
    );
    
    // click the row (it's inside the tbody > tr)
    const row = screen.getByText('Project 1').closest('tr');
    fireEvent.click(row);
    
    expect(window.location.pathname).toContain('/projects/1');
  });
});
