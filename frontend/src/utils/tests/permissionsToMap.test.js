import { userCanMap } from '../projectPermissions';

it('READ_ONLY role USER can NOT map', () => {
  const user = { mappingLevel: 'ADVANCED', role: 'READ_ONLY' };
  const project = { mapperLevel: 'BEGINNER' };
  expect(userCanMap(user, project)).toBe(false);
});

/****  ENFORCED LEVEL PROJECTS  ****/
it('BEGINNER level USER can map a BEGINNER PROJECT', () => {
  const user = { mappingLevel: 'BEGINNER', role: 'MAPPER' };
  const project = { restrictMappingLevelToProject: true, mapperLevel: 'BEGINNER' };
  expect(userCanMap(user, project)).toBe(true);
});

it('INTERMEDIATE level USER can map a BEGINNER PROJECT', () => {
  const user = { mappingLevel: 'INTERMEDIATE', role: 'MAPPER' };
  const project = { restrictMappingLevelToProject: true, mapperLevel: 'BEGINNER' };
  expect(userCanMap(user, project)).toBe(true);
});

it('ADVANCED level USER can map a BEGINNER PROJECT', () => {
  const user = { mappingLevel: 'INTERMEDIATE', role: 'MAPPER' };
  const project = { restrictMappingLevelToProject: true, mapperLevel: 'BEGINNER' };
  expect(userCanMap(user, project)).toBe(true);
});

it('BEGINNER level USER can NOT map an INTERMEDIATE PROJECT', () => {
  const user = { mappingLevel: 'BEGINNER', role: 'MAPPER' };
  const project = { restrictMappingLevelToProject: true, mapperLevel: 'INTERMEDIATE' };
  expect(userCanMap(user, project)).toBe(false);
});

it('INTERMEDIATE level USER can map an INTERMEDIATE PROJECT', () => {
  const user = { mappingLevel: 'INTERMEDIATE', role: 'MAPPER' };
  const project = { restrictMappingLevelToProject: true, mapperLevel: 'INTERMEDIATE' };
  expect(userCanMap(user, project)).toBe(true);
});

it('ADVANCED level USER can map an INTERMEDIATE PROJECT', () => {
  const user = { mappingLevel: 'ADVANCED', role: 'MAPPER' };
  const project = { restrictMappingLevelToProject: true, mapperLevel: 'INTERMEDIATE' };
  expect(userCanMap(user, project)).toBe(true);
});

it('BEGINNER level USER can NOT map an ADVANCED PROJECT', () => {
  const user = { mappingLevel: 'BEGINNER', role: 'MAPPER' };
  const project = { restrictMappingLevelToProject: true, mapperLevel: 'ADVANCED' };
  expect(userCanMap(user, project)).toBe(false);
});

it('INTERMEDIATE level USER can NOT map an ADVANCED PROJECT', () => {
  const user = { mappingLevel: 'INTERMEDIATE', role: 'MAPPER' };
  const project = { restrictMappingLevelToProject: true, mapperLevel: 'ADVANCED' };
  expect(userCanMap(user, project)).toBe(false);
});

it('ADVANCED level USER can map an ADVANCED PROJECT', () => {
  const user = { mappingLevel: 'ADVANCED', role: 'MAPPER' };
  const project = { restrictMappingLevelToProject: true, mapperLevel: 'ADVANCED' };
  expect(userCanMap(user, project)).toBe(true);
});

/* NOT ENFORCED LEVEL PROJECTS */
it('BEGINNER level USER can map an ADVANCED PROJECT with restrictMappingLevelToProject = false', () => {
  const user = { mappingLevel: 'BEGINNER', role: 'MAPPER' };
  const project = { restrictMappingLevelToProject: false, mapperLevel: 'ADVANCED' };
  expect(userCanMap(user, project)).toBe(true);
});

it('INTERMEDIATE level USER can map an ADVANCED PROJECT with restrictMappingLevelToProject = false', () => {
  const user = { mappingLevel: 'INTERMEDIATE', role: 'MAPPER' };
  const project = { restrictMappingLevelToProject: false, mapperLevel: 'ADVANCED' };
  expect(userCanMap(user, project)).toBe(true);
});

it('ADVANCED level USER can map an ADVANCED PROJECT with restrictMappingLevelToProject = false', () => {
  const user = { mappingLevel: 'ADVANCED', role: 'MAPPER' };
  const project = { restrictMappingLevelToProject: false, mapperLevel: 'ADVANCED' };
  expect(userCanMap(user, project)).toBe(true);
});

/******  PRIVATE PROJECTS  ******/
it('READ_ONLY role USER can NOT map a PRIVATE project', () => {
  const user = { username: 'user1', mappingLevel: 'ADVANCED', role: 'READ_ONLY' };
  const project = { private: true, allowedUsernames: ['user1'], mapperLevel: 'BEGINNER' };
  expect(userCanMap(user, project)).toBe(false);
});

it('ADVANCED user can NOT map a PRIVATE BEGINNER project if his username is NOT ALLOWED', () => {
  const user = { username: 'user3000', mappingLevel: 'ADVANCED', role: 'MAPPER' };
  const project = {
    restrictMappingLevelToProject: true,
    private: true,
    allowedUsernames: ['user1'],
    mapperLevel: 'BEGINNER',
  };
  expect(userCanMap(user, project)).toBe(false);
});

it('INTERMEDIATE USER can map a PRIVATE INTERMEDIATE project if his username is ALLOWED', () => {
  const user = { username: 'user1', mappingLevel: 'INTERMEDIATE', role: 'MAPPER' };
  const project = {
    restrictMappingLevelToProject: true,
    private: true,
    allowedUsernames: ['user1'],
    mapperLevel: 'INTERMEDIATE',
  };
  expect(userCanMap(user, project)).toBe(true);
});

it('INTERMEDIATE USER can NOT map a PRIVATE ADVANCED project if his username is ALLOWED', () => {
  const user = { username: 'user1', mappingLevel: 'INTERMEDIATE', role: 'MAPPER' };
  const project = {
    restrictMappingLevelToProject: true,
    private: true,
    allowedUsernames: ['user1'],
    mapperLevel: 'ADVANCED',
  };
  expect(userCanMap(user, project)).toBe(false);
});

it('ADVANCED USER can map a PRIVATE ADVANCED project if his username is ALLOWED', () => {
  const user = { username: 'user1', mappingLevel: 'ADVANCED', role: 'MAPPER' };
  const project = {
    restrictMappingLevelToProject: true,
    private: true,
    allowedUsernames: ['user1'],
    mapperLevel: 'ADVANCED',
  };
  expect(userCanMap(user, project)).toBe(true);
});

it('ADVANCED level USER can NOT map a BEGINNER PROJECT with restrictMappingLevelToProject = false if his username is NOT ALLOWED', () => {
  const user = { username: 'user3000', mappingLevel: 'ADVANCED', role: 'MAPPER' };
  const project = {
    restrictMappingLevelToProject: false,
    private: true,
    allowedUsernames: ['user1'],
    mapperLevel: 'BEGINNER',
  };
  expect(userCanMap(user, project)).toBe(false);
});

it('ADVANCED ADMIN USER can NOT map a BEGINNER PROJECT with restrictMappingLevelToProject = false if his username is NOT ALLOWED', () => {
  const user = { username: 'user3000', mappingLevel: 'ADVANCED', role: 'ADMIN' };
  const project = {
    restrictMappingLevelToProject: false,
    private: true,
    allowedUsernames: ['user1'],
    mapperLevel: 'BEGINNER',
  };
  expect(userCanMap(user, project)).toBe(false);
});

it('ADVANCED PROJECT_MANAGER USER can NOT map a BEGINNER PROJECT with restrictMappingLevelToProject = false if his username is NOT ALLOWED', () => {
  const user = { username: 'user3000', mappingLevel: 'ADVANCED', role: 'PROJECT_MANAGER' };
  const project = {
    restrictMappingLevelToProject: false,
    private: true,
    allowedUsernames: ['user1'],
    mapperLevel: 'BEGINNER',
  };
  expect(userCanMap(user, project)).toBe(false);
});

it('ADVANCED VALIDATOR USER can NOT map a BEGINNER PROJECT with restrictMappingLevelToProject = false if his username is NOT ALLOWED', () => {
  const user = { username: 'user3000', mappingLevel: 'ADVANCED', role: 'VALIDATOR' };
  const project = {
    restrictMappingLevelToProject: false,
    private: true,
    allowedUsernames: ['user1'],
    mapperLevel: 'BEGINNER',
  };
  expect(userCanMap(user, project)).toBe(false);
});
