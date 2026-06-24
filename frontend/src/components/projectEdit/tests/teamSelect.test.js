import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TeamSelect } from '../teamSelect';
import { StateContext } from '../../../views/projectEdit';
import { ReduxIntlProviders, QueryClientProviders } from '../../../utils/testWithIntl';
import * as UseFetchHook from '../../../hooks/UseFetch';
import * as apiTeams from '../../../api/teams';

const mockProjectInfo = {
  teams: [
    { teamId: 1, name: 'Team Alpha', role: 'MAPPER' },
  ],
};

const mockOrganisations = {
  organisations: [
    { organisationId: 10, name: 'Org 1' },
    { organisationId: 20, name: 'Org 2' },
  ],
};

const mockTeams = {
  teams: [
    { teamId: 1, name: 'Team Alpha', organisationId: 10 },
    { teamId: 2, name: 'Team Beta', organisationId: 20 },
    { teamId: 3, name: 'Team Gamma', organisationId: 10 },
  ],
};

const renderComponent = (projectInfo = mockProjectInfo, setProjectInfo = jest.fn()) => {
  return render(
    <ReduxIntlProviders>
      <QueryClientProviders>
        <StateContext.Provider value={{ projectInfo, setProjectInfo }}>
          <TeamSelect />
        </StateContext.Provider>
      </QueryClientProviders>
    </ReduxIntlProviders>
  );
};

describe('TeamSelect', () => {
  beforeEach(() => {
    jest.spyOn(UseFetchHook, 'useFetchWithAbort').mockReturnValue([null, false, mockOrganisations]);
    jest.spyOn(apiTeams, 'useTeamsQuery').mockReturnValue({ data: mockTeams, isFetching: false });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders existing teams correctly', () => {
    renderComponent();
    expect(screen.getByText('Team Alpha')).toBeInTheDocument();
    expect(screen.getByText('Mapper')).toBeInTheDocument(); // MAPPER role
  });

  it('handles remove team', async () => {
    const setProjectInfo = jest.fn();
    const user = userEvent.setup();
    renderComponent(mockProjectInfo, setProjectInfo);

    const wasteIconParent = document.querySelector('.red.bg-grey-light');
    if(wasteIconParent) await user.click(wasteIconParent);

    expect(setProjectInfo).toHaveBeenCalledWith({
      teams: [],
    });
  });

  it('handles edit team', async () => {
    const user = userEvent.setup();
    renderComponent();

    const pencilIconParent = document.querySelectorAll('.bg-grey-light')[0]; // edit button
    if(pencilIconParent) await user.click(pencilIconParent);

    expect(screen.getByRole('button', { name: /Update/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Cancel/i })).not.toBeDisabled();
  });

  it('disables add button initially', () => {
    renderComponent();
    const addBtn = screen.getByRole('button', { name: /Add/i });
    expect(addBtn).toBeDisabled();
  });

  it('can open team link', () => {
    renderComponent();
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/teams/1/membership/');
  });
});
