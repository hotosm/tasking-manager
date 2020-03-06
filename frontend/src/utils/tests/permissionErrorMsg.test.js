import { getPermissionErrorMessage } from '../projectPermissions';

describe('BEGINNER user', () => {
  it('in a project that requires a level to map receives "userLevelToMap" message', () => {
    const project = {
      mappingPermission: 'LEVEL',
      percentMapped: 11,
      percentValidated: 1,
      percentBadImagery: 0,
    };
    expect(getPermissionErrorMessage(project, 'BEGINNER')).toBe('userLevelToMap');
  });
  it('in a project that requires a level or team to map receives "userLevelToMap" message', () => {
    const project = {
      mappingPermission: 'TEAMS_LEVEL',
      percentMapped: 11,
      percentValidated: 1,
      percentBadImagery: 0,
    };
    expect(getPermissionErrorMessage(project, 'BEGINNER')).toBe('userLevelToMap');
  });

  it('in a project that requires a level to VALIDATE receives "userLevelToValidate" message', () => {
    const project = {
      validationPermission: 'LEVEL',
      percentMapped: 100,
      percentValidated: 1,
      percentBadImagery: 0,
    };
    expect(getPermissionErrorMessage(project, 'BEGINNER')).toBe('userLevelToValidate');
  });
  it('in a project that requires a level or team to VALIDATE receives "userLevelToValidate" message', () => {
    const project = {
      validationPermission: 'TEAMS_LEVEL',
      percentMapped: 100,
      percentValidated: 1,
      percentBadImagery: 0,
    };
    expect(getPermissionErrorMessage(project, 'BEGINNER')).toBe('userLevelToValidate');
  });
});

describe('ADVANCED user', () => {
  it('in a project that requires a team to MAP receives "userIsNotMappingTeamMember" message', () => {
    const project = {
      mappingPermission: 'TEAMS',
      percentMapped: 11,
      percentValidated: 1,
      percentBadImagery: 0,
    };
    expect(getPermissionErrorMessage(project, 'ADVANCED')).toBe('userIsNotMappingTeamMember');
  });
  it('in a project that requires a level or team to MAP receives "userIsNotMappingTeamMember" message', () => {
    const project = {
      mappingPermission: 'TEAMS_LEVEL',
      percentMapped: 11,
      percentValidated: 1,
      percentBadImagery: 0,
    };
    expect(getPermissionErrorMessage(project, 'ADVANCED')).toBe('userIsNotMappingTeamMember');
  });

  it('in a project that requires a TEAM to VALIDATE receives "userIsNotValidationTeamMember" message', () => {
    const project = {
      validationPermission: 'TEAMS',
      percentMapped: 100,
      percentValidated: 1,
      percentBadImagery: 0,
    };
    expect(getPermissionErrorMessage(project, 'ADVANCED')).toBe('userIsNotValidationTeamMember');
  });
  it('in a project that requires a level or team to VALIDATE receives "userIsNotValidationTeamMember" message', () => {
    const project = {
      validationPermission: 'TEAMS_LEVEL',
      percentMapped: 100,
      percentValidated: 1,
      percentBadImagery: 0,
    };
    expect(getPermissionErrorMessage(project, 'ADVANCED')).toBe('userIsNotValidationTeamMember');
  });
});
