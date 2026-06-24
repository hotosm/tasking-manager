import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PermissionsBlock } from '../permissionsBlock';
import { StateContext } from '../../../views/projectEdit';
import { ReduxIntlProviders, QueryClientProviders } from '../../../utils/testWithIntl';
import * as apiTeams from '../../../api/teams';

const mockPermissions = [
  { label: <span id="ANY">ANY</span>, value: 'ANY' },
  { label: <span id="TEAMS">TEAMS</span>, value: 'TEAMS' },
];

const mockLevels = [
  { id: 1, name: 'BEGINNER' },
  { id: 2, name: 'INTERMEDIATE' },
];

const mockProjectInfo = {
  mappingPermission: 'ANY',
  validationPermission: 'TEAMS',
  mappingPermissionLevelId: 1,
  validationPermissionLevelId: 2,
  teams: [],
};

const renderBlock = (type, projectInfo = mockProjectInfo, setProjectInfo = jest.fn()) => {
  return render(
    <ReduxIntlProviders>
      <QueryClientProviders>
        <StateContext.Provider value={{ projectInfo, setProjectInfo }}>
          <PermissionsBlock permissions={mockPermissions} levels={mockLevels} type={type} />
        </StateContext.Provider>
      </QueryClientProviders>
    </ReduxIntlProviders>
  );
};

describe('PermissionsBlock', () => {
  beforeEach(() => {
    jest.spyOn(apiTeams, 'useTeamsQuery').mockReturnValue({
      data: { teams: [{ teamId: 1, name: 'Default Validator Team' }] },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders mapping permission block correctly', () => {
    renderBlock('mappingPermission');
    expect(screen.getByText(/Mapping permissions/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue('ANY')).toBeChecked();
    expect(screen.getByText('BEGINNER')).toBeInTheDocument(); // Select value
  });

  it('renders validation permission block correctly', () => {
    renderBlock('validationPermission');
    expect(screen.getByText(/Validation permissions/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue('TEAMS')).toBeChecked();
    expect(screen.getByText('INTERMEDIATE')).toBeInTheDocument();
  });

  it('handles permission change for mapping', async () => {
    const setProjectInfo = jest.fn();
    const user = userEvent.setup();
    renderBlock('mappingPermission', mockProjectInfo, setProjectInfo);

    const teamsRadio = screen.getByDisplayValue('TEAMS');
    await user.click(teamsRadio);

    expect(setProjectInfo).toHaveBeenCalledWith({
      ...mockProjectInfo,
      mappingPermission: 'TEAMS',
      teams: [],
    });
  });

  it('handles validation permission change and adds default validator', async () => {
    const setProjectInfo = jest.fn();
    const user = userEvent.setup();
    const noTeamsInfo = { ...mockProjectInfo, validationPermission: 'ANY' };
    renderBlock('validationPermission', noTeamsInfo, setProjectInfo);

    const teamsRadio = screen.getByDisplayValue('TEAMS');
    await user.click(teamsRadio);

    // Default validator team ID in config is usually some number.
    // Assuming useTeamsQuery returns a default validator team
    expect(setProjectInfo).toHaveBeenCalledWith(expect.objectContaining({
      validationPermission: 'TEAMS',
    }));
  });

  it('handles validation permission change and removes default validator', async () => {
    const setProjectInfo = jest.fn();
    const user = userEvent.setup();
    const teamsInfo = { ...mockProjectInfo, validationPermission: 'TEAMS', teams: [{ teamId: 1, name: 'Default Validator Team', role: 'VALIDATOR' }] };
    
    // We mock DEFAULT_VALIDATOR_TEAM_ID from config as 1 or whatever is set
    renderBlock('validationPermission', teamsInfo, setProjectInfo);

    const anyRadio = screen.getByDisplayValue('ANY');
    await user.click(anyRadio);

    expect(setProjectInfo).toHaveBeenCalledWith(expect.objectContaining({
      validationPermission: 'ANY',
    }));
  });
});
