import '@testing-library/jest-dom';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { Members, JoinRequests } from '../members';
import { renderWithRouter, ReduxIntlProviders } from '../../../utils/testWithIntl';
import * as network from '../../../network/genericJSONRequest';

jest.mock('../../../network/genericJSONRequest');

describe('Members Component', () => {
  const members = [{ username: 'user1', pictureUrl: null }];
  const defaultProps = {
    addMembers: jest.fn(),
    removeMembers: jest.fn(),
    saveMembersFn: jest.fn(),
    resetMembersFn: jest.fn(),
    members,
    type: 'members',
    totalMembersOnTeam: 2,
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with initial members', () => {
    const { container } = renderWithRouter(
      <ReduxIntlProviders><Members {...defaultProps} /></ReduxIntlProviders>
    );
    expect(screen.getByText('Members')).toBeInTheDocument();
    expect(screen.getByTitle('user1')).toBeInTheDocument();
  });

  it('renders correctly with type managers', () => {
    renderWithRouter(
      <ReduxIntlProviders><Members {...defaultProps} type="managers" /></ReduxIntlProviders>
    );
    expect(screen.getByText('Managers')).toBeInTheDocument();
  });

  it('shows no members message when array is empty', () => {
    renderWithRouter(
      <ReduxIntlProviders><Members {...defaultProps} members={[]} /></ReduxIntlProviders>
    );
    expect(screen.getByText('There are no members yet.')).toBeInTheDocument();
  });

  it('shows member join team error', () => {
    renderWithRouter(
      <ReduxIntlProviders><Members {...defaultProps} memberJoinTeamError="UserAlreadyInList" /></ReduxIntlProviders>
    );
    expect(screen.getByText(/already a member/i)).toBeInTheDocument();
  });

  it('can enter edit mode and render search', async () => {
    network.fetchLocalJSONAPI.mockResolvedValue({ users: [{ username: 'user2' }] });
    const { container } = renderWithRouter(
      <ReduxIntlProviders><Members {...defaultProps} /></ReduxIntlProviders>
    );
    
    fireEvent.click(screen.getByText('Edit'));
    
    // ReactSelect becomes visible
    // We can test if "Done" and "Cancel" buttons appear
    expect(screen.getByText('Done')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();

    // cancel
    fireEvent.click(screen.getByText('Cancel'));
    expect(defaultProps.resetMembersFn).toHaveBeenCalled();
  });

  it('submits members on done', () => {
    const { container } = renderWithRouter(
      <ReduxIntlProviders><Members {...defaultProps} /></ReduxIntlProviders>
    );
    fireEvent.click(screen.getByText('Edit'));
    fireEvent.click(screen.getByText('Done'));
    expect(defaultProps.saveMembersFn).toHaveBeenCalled();
  });
});

describe('JoinRequests Component', () => {
  const requests = [{ username: 'reqUser1', joinedDate: '2023-01-01' }];
  const defaultProps = {
    requests,
    teamId: 1,
    addMembers: jest.fn(),
    updateRequests: jest.fn(),
    managers: [{ username: 'manager1', function: 'MANAGER', joinRequestNotifications: true }],
    updateTeam: jest.fn(),
    joinMethod: 'BY_REQUEST',
    members: [],
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders join requests', () => {
    renderWithRouter(
      <ReduxIntlProviders><JoinRequests {...defaultProps} /></ReduxIntlProviders>
    );
    expect(screen.getByText('Join requests')).toBeInTheDocument();
    expect(screen.getByText('reqUser1')).toBeInTheDocument();
  });

  it('accepts request', async () => {
    network.pushToLocalJSONAPI.mockResolvedValue({});
    renderWithRouter(
      <ReduxIntlProviders><JoinRequests {...defaultProps} /></ReduxIntlProviders>
    );
    fireEvent.click(screen.getByText('Accept'));
    await waitFor(() => expect(network.pushToLocalJSONAPI).toHaveBeenCalled());
    expect(defaultProps.addMembers).toHaveBeenCalled();
    expect(defaultProps.updateRequests).toHaveBeenCalled();
  });

  it('rejects request', async () => {
    network.pushToLocalJSONAPI.mockResolvedValue({});
    renderWithRouter(
      <ReduxIntlProviders><JoinRequests {...defaultProps} /></ReduxIntlProviders>
    );
    fireEvent.click(screen.getByText('Reject'));
    await waitFor(() => expect(network.pushToLocalJSONAPI).toHaveBeenCalled());
    expect(defaultProps.addMembers).not.toHaveBeenCalled();
    expect(defaultProps.updateRequests).toHaveBeenCalled();
  });

  it('shows no requests when empty', () => {
    renderWithRouter(
      <ReduxIntlProviders><JoinRequests {...defaultProps} requests={[]} /></ReduxIntlProviders>
    );
    expect(screen.getByText("There aren't any requests to join the team.")).toBeInTheDocument();
  });
});
