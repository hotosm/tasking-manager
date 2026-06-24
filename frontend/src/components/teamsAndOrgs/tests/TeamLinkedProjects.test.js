import '@testing-library/jest-dom';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { TeamLinkedProjects } from '../TeamLinkedProjects';
import { renderWithRouter, ReduxIntlProviders } from '../../../utils/testWithIntl';
import * as network from '../../../network/genericJSONRequest';
import { useFetchWithAbort } from '../../../hooks/UseFetch';

jest.mock('../../../network/genericJSONRequest');
jest.mock('../../../hooks/UseFetch');

describe('TeamLinkedProjects Component', () => {
  const defaultProps = {
    viewAllEndpoint: '/projects',
    border: true,
    canUserEditTeam: true,
  };

  const mockProjects = {
    results: [
      { projectId: 1, name: 'Project 1' },
      { projectId: 2, name: 'Project 2' },
    ],
  };

  beforeEach(() => {
    useFetchWithAbort.mockReturnValue([null, false, mockProjects, jest.fn()]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders linked projects', () => {
    renderWithRouter(<ReduxIntlProviders><TeamLinkedProjects {...defaultProps} /></ReduxIntlProviders>);
    expect(screen.getByText('Projects')).toBeInTheDocument();
    expect(screen.getByText('Project 1')).toBeInTheDocument();
    expect(screen.getByText('Project 2')).toBeInTheDocument();
  });

  it('opens unlink all confirmation modal', () => {
    renderWithRouter(<ReduxIntlProviders><TeamLinkedProjects {...defaultProps} /></ReduxIntlProviders>);
    fireEvent.click(screen.getByText(/Unlink all/i));
    expect(screen.getByText(/Are you sure you want to unlink/)).toBeInTheDocument();
  });

  it('can unlink all projects', async () => {
    network.fetchLocalJSONAPI.mockResolvedValue({});
    renderWithRouter(<ReduxIntlProviders><TeamLinkedProjects {...defaultProps} /></ReduxIntlProviders>);
    fireEvent.click(screen.getByText(/Unlink all/i));
    fireEvent.click(screen.getByText('Unlink'));

    await waitFor(() => expect(network.fetchLocalJSONAPI).toHaveBeenCalled());
    expect(screen.getByText('Projects Unlinked Successfully')).toBeInTheDocument();
  });

  it('handles project selection and selective unlink', async () => {
    network.pushToLocalJSONAPI.mockResolvedValue({});
    const { container } = renderWithRouter(<ReduxIntlProviders><TeamLinkedProjects {...defaultProps} /></ReduxIntlProviders>);
    
    // Select first project (checkbox click)
    const checkboxes = container.querySelectorAll('input[type="checkbox"]');
    fireEvent.click(checkboxes[0]);
    
    expect(screen.getByText(/project selected/)).toBeInTheDocument();
    fireEvent.click(screen.getByText('Unlink selected'));
    
    // Modal
    fireEvent.click(screen.getByText('Unlink'));

    await waitFor(() => expect(network.pushToLocalJSONAPI).toHaveBeenCalled());
    expect(screen.getByText('Project Unlinked Successfully')).toBeInTheDocument();
  });

  it('displays API error appropriately', async () => {
    network.fetchLocalJSONAPI.mockRejectedValue({ message: 'TeamMappingPermissionError' });
    renderWithRouter(<ReduxIntlProviders><TeamLinkedProjects {...defaultProps} /></ReduxIntlProviders>);
    fireEvent.click(screen.getByText(/Unlink all/i));
    fireEvent.click(screen.getByText('Unlink'));

    await waitFor(() => {
      expect(screen.getByText(/Certain projects have mapping permission to only team/)).toBeInTheDocument();
    });
  });

  it('handles TeamValidationPermissionError', async () => {
    network.fetchLocalJSONAPI.mockRejectedValue({ message: 'TeamValidationPermissionError' });
    renderWithRouter(<ReduxIntlProviders><TeamLinkedProjects {...defaultProps} /></ReduxIntlProviders>);
    fireEvent.click(screen.getByText(/Unlink all/i));
    fireEvent.click(screen.getByText('Unlink'));

    await waitFor(() => {
      expect(screen.getByText(/validation permission to only team/)).toBeInTheDocument();
    });
  });

  it('handles ProjectManagementPermissionError', async () => {
    network.fetchLocalJSONAPI.mockRejectedValue({ message: 'ProjectManagementPermissionError' });
    renderWithRouter(<ReduxIntlProviders><TeamLinkedProjects {...defaultProps} /></ReduxIntlProviders>);
    fireEvent.click(screen.getByText(/Unlink all/i));
    fireEvent.click(screen.getByText('Unlink'));

    await waitFor(() => {
      expect(screen.getByText(/project management permission assigned to this team/)).toBeInTheDocument();
    });
  });
});
