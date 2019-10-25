import { userCanValidate } from '../projectPermissions';

it('READ_ONLY role USER can NOT validate', () => {
  const user = { mappingLevel: 'ADVANCED', role: 'READ_ONLY' };
  const project = { mapperLevel: 'BEGINNER' };
  expect(userCanValidate(user, project)).toBe(false);
});

/* ENFORCED VALIDATION ROLE PROJECTS  ****/
it('BEGINNER MAPPER role USER can NOT validate PROJECT that requires validation role', () => {
  const user = { mappingLevel: 'BEGINNER', role: 'MAPPER' };
  const project = { restrictValidationRole: true, restrictValidationLevelIntermediate: false };
  expect(userCanValidate(user, project)).toBe(false);
});

it('INTERMEDIATE MAPPER role USER can NOT validate PROJECT that requires validation role', () => {
  const user = { mappingLevel: 'INTERMEDIATE', role: 'MAPPER' };
  const project = { restrictValidationRole: true, restrictValidationLevelIntermediate: false };
  expect(userCanValidate(user, project)).toBe(false);
});

it('ADVANCED MAPPER role USER can NOT validate PROJECT that requires validation role', () => {
  const user = { mappingLevel: 'ADVANCED', role: 'MAPPER' };
  const project = { restrictValidationRole: true, restrictValidationLevelIntermediate: false };
  expect(userCanValidate(user, project)).toBe(false);
});

it('ADMIN role USER can validate a PROJECT that requires validation role', () => {
  const user = { mappingLevel: 'BEGINNER', role: 'ADMIN' };
  const project = { restrictValidationRole: true, restrictValidationLevelIntermediate: false };
  expect(userCanValidate(user, project)).toBe(true);
});

it('PROJECT_MANAGER role USER can validate a PROJECT that requires validation role', () => {
  const user = { mappingLevel: 'BEGINNER', role: 'PROJECT_MANAGER' };
  const project = { restrictValidationRole: true, restrictValidationLevelIntermediate: false };
  expect(userCanValidate(user, project)).toBe(true);
});

it('VALIDATOR role USER can validate a PROJECT that requires validation role', () => {
  const user = { mappingLevel: 'BEGINNER', role: 'VALIDATOR' };
  const project = { restrictValidationRole: true, restrictValidationLevelIntermediate: false };
  expect(userCanValidate(user, project)).toBe(true);
});

/* ENFORCED VALIDATION ROLE & ENFORCE INTERMEDIATE/ADVANCED VALIDATOR LEVEL PROJECTS */
it('BEGINNER MAPPER role USER can NOT validate PROJECT that requires a role and level', () => {
  const user = { mappingLevel: 'BEGINNER', role: 'MAPPER' };
  const project = { restrictValidationRole: true, restrictValidationLevelIntermediate: true };
  expect(userCanValidate(user, project)).toBe(false);
});

it('INTERMEDIATE MAPPER role USER can NOT validate PROJECT that requires a role and level', () => {
  const user = { mappingLevel: 'INTERMEDIATE', role: 'MAPPER' };
  const project = { restrictValidationRole: true, restrictValidationLevelIntermediate: true };
  expect(userCanValidate(user, project)).toBe(false);
});

it('ADVANCED MAPPER role USER can NOT validate PROJECT that requires a role and level', () => {
  const user = { mappingLevel: 'ADVANCED', role: 'MAPPER' };
  const project = { restrictValidationRole: true, restrictValidationLevelIntermediate: true };
  expect(userCanValidate(user, project)).toBe(false);
});

it('BEGINNER ADMIN role USER can NOT validate a PROJECT that requires a role and level', () => {
  const user = { mappingLevel: 'BEGINNER', role: 'ADMIN' };
  const project = { restrictValidationRole: true, restrictValidationLevelIntermediate: true };
  expect(userCanValidate(user, project)).toBe(false);
});

it('INTERMEDIATE ADMIN role USER can validate PROJECT that requires a role and level', () => {
  const user = { mappingLevel: 'INTERMEDIATE', role: 'ADMIN' };
  const project = { restrictValidationRole: true, restrictValidationLevelIntermediate: true };
  expect(userCanValidate(user, project)).toBe(true);
});

it('ADVANCED ADMIN role USER can validate PROJECT that requires a role and level', () => {
  const user = { mappingLevel: 'ADVANCED', role: 'ADMIN' };
  const project = { restrictValidationRole: true, restrictValidationLevelIntermediate: true };
  expect(userCanValidate(user, project)).toBe(true);
});

it('BEGINNER PROJECT_MANAGER role USER can NOT validate a PROJECT that requires a role and level', () => {
  const user = { mappingLevel: 'BEGINNER', role: 'PROJECT_MANAGER' };
  const project = { restrictValidationRole: true, restrictValidationLevelIntermediate: true };
  expect(userCanValidate(user, project)).toBe(false);
});

it('INTERMEDIATE PROJECT_MANAGER role USER can validate PROJECT that requires a role and level', () => {
  const user = { mappingLevel: 'INTERMEDIATE', role: 'PROJECT_MANAGER' };
  const project = { restrictValidationRole: true, restrictValidationLevelIntermediate: true };
  expect(userCanValidate(user, project)).toBe(true);
});

it('ADVANCED PROJECT_MANAGER role USER can validate PROJECT that requires a role and level', () => {
  const user = { mappingLevel: 'ADVANCED', role: 'PROJECT_MANAGER' };
  const project = { restrictValidationRole: true, restrictValidationLevelIntermediate: true };
  expect(userCanValidate(user, project)).toBe(true);
});

it('BEGINNER VALIDATOR role USER can NOT validate a PROJECT that requires a role and level', () => {
  const user = { mappingLevel: 'BEGINNER', role: 'VALIDATOR' };
  const project = { restrictValidationRole: true, restrictValidationLevelIntermediate: true };
  expect(userCanValidate(user, project)).toBe(false);
});

it('INTERMEDIATE VALIDATOR role USER can validate PROJECT that requires a role and level', () => {
  const user = { mappingLevel: 'INTERMEDIATE', role: 'VALIDATOR' };
  const project = { restrictValidationRole: true, restrictValidationLevelIntermediate: true };
  expect(userCanValidate(user, project)).toBe(true);
});

it('ADVANCED VALIDATOR role USER can validate PROJECT that requires a role and level', () => {
  const user = { mappingLevel: 'ADVANCED', role: 'VALIDATOR' };
  const project = { restrictValidationRole: true, restrictValidationLevelIntermediate: true };
  expect(userCanValidate(user, project)).toBe(true);
});

/* NOT ENFORCED VALIDATION ROLE & NOT ENFORCE INTERMEDIATE/ADVANCED VALIDATOR LEVEL PROJECTS */

it('BEGINNER MAPPER role USER can validate PROJECT with restrictValidationRole = false', () => {
  const user = { mappingLevel: 'BEGINNER', role: 'MAPPER' };
  const project = { restrictValidationRole: false, restrictValidationLevelIntermediate: false };
  expect(userCanValidate(user, project)).toBe(true);
});

it('INTERMEDIATE MAPPER role USER can validate PROJECT with restrictValidationRole = false', () => {
  const user = { mappingLevel: 'INTERMEDIATE', role: 'MAPPER' };
  const project = { restrictValidationRole: false, restrictValidationLevelIntermediate: false };
  expect(userCanValidate(user, project)).toBe(true);
});

it('ADVANCED MAPPER role USER can validate PROJECT with restrictValidationRole = false', () => {
  const user = { mappingLevel: 'ADVANCED', role: 'MAPPER' };
  const project = { restrictValidationRole: false, restrictValidationLevelIntermediate: false };
  expect(userCanValidate(user, project)).toBe(true);
});

/* NOT ENFORCED VALIDATION ROLE & ENFORCE INTERMEDIATE/ADVANCED VALIDATOR LEVEL PROJECTS */
it('BEGINNER MAPPER role USER can NOT validate PROJECT that requires INTERMEDIATE level', () => {
  const user = { mappingLevel: 'BEGINNER', role: 'MAPPER' };
  const project = { restrictValidationRole: false, restrictValidationLevelIntermediate: true };
  expect(userCanValidate(user, project)).toBe(false);
});

it('INTERMEDIATE MAPPER role USER can validate PROJECT that requires INTERMEDIATE level', () => {
  const user = { mappingLevel: 'INTERMEDIATE', role: 'MAPPER' };
  const project = { restrictValidationRole: false, restrictValidationLevelIntermediate: true };
  expect(userCanValidate(user, project)).toBe(true);
});

it('ADVANCED MAPPER role USER can validate PROJECT that requires INTERMEDIATE level', () => {
  const user = { mappingLevel: 'ADVANCED', role: 'MAPPER' };
  const project = { restrictValidationRole: false, restrictValidationLevelIntermediate: true };
  expect(userCanValidate(user, project)).toBe(true);
});

/* PRIVATE PROJECTS */
it('BEGINNER VALIDATOR role USER can NOT validate PRIVATE PROJECT even if username is ALLOWED', () => {
  const user = { username: 'user1', mappingLevel: 'BEGINNER', role: 'VALIDATOR' };
  const project = {
    private: true,
    allowedUsernames: ['user1'],
    restrictValidationRole: true,
    restrictValidationLevelIntermediate: true,
  };
  expect(userCanValidate(user, project)).toBe(false);
});

it('INTERMEDIATE VALIDATOR role USER can NOT validate PROJECT if their username is NOT ALLOWED', () => {
  const user = { username: 'user3000', mappingLevel: 'INTERMEDIATE', role: 'VALIDATOR' };
  const project = {
    private: true,
    allowedUsernames: ['user1'],
    restrictValidationRole: true,
    restrictValidationLevelIntermediate: true,
  };
  expect(userCanValidate(user, project)).toBe(false);
});

it('INTERMEDIATE VALIDATOR role USER can validate PROJECT if their username is ALLOWED', () => {
  const user = { username: 'user1', mappingLevel: 'INTERMEDIATE', role: 'VALIDATOR' };
  const project = {
    private: true,
    allowedUsernames: ['user1'],
    restrictValidationRole: true,
    restrictValidationLevelIntermediate: true,
  };
  expect(userCanValidate(user, project)).toBe(true);
});

it('ADVANCED VALIDATOR role USER can NOT validate PROJECT if their username is NOT ALLOWED', () => {
  const user = { username: 'user3000', mappingLevel: 'ADVANCED', role: 'VALIDATOR' };
  const project = {
    private: true,
    allowedUsernames: ['user1'],
    restrictValidationRole: true,
    restrictValidationLevelIntermediate: true,
  };
  expect(userCanValidate(user, project)).toBe(false);
});

it('ADVANCED VALIDATOR role USER can validate PROJECT if their username is ALLOWED', () => {
  const user = { username: 'user1', mappingLevel: 'ADVANCED', role: 'VALIDATOR' };
  const project = {
    private: true,
    allowedUsernames: ['user1'],
    restrictValidationRole: true,
    restrictValidationLevelIntermediate: true,
  };
  expect(userCanValidate(user, project)).toBe(true);
});
