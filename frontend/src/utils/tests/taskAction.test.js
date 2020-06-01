import {
  getTaskAction,
  getMessageOnValidationContext,
  getMessageOnMappingContext,
} from '../projectPermissions';

/*****  MAPPING CONTEXT  *****/
it('when taskStatus is null, returns mapATask', () => {
  expect(getMessageOnMappingContext()).toBe('mapATask');
});
it('when taskStatus is READY, returns mapSelectedTask', () => {
  expect(getMessageOnMappingContext('READY')).toBe('mapSelectedTask');
});
it('when taskStatus is INVALIDATED, returns mapSelectedTask', () => {
  expect(getMessageOnMappingContext('INVALIDATED')).toBe('mapSelectedTask');
});
it('when taskStatus is BADIMAGERY, returns mapAnotherTask', () => {
  expect(getMessageOnMappingContext('BADIMAGERY')).toBe('mapAnotherTask');
});
it('when taskStatus is MAPPED, returns mapAnotherTask', () => {
  expect(getMessageOnMappingContext('MAPPED')).toBe('mapAnotherTask');
});
it('when taskStatus is LOCKED_FOR_MAPPING, returns mapAnotherTask', () => {
  expect(getMessageOnMappingContext('LOCKED_FOR_MAPPING')).toBe('mapAnotherTask');
});
it('when taskStatus is LOCKED_FOR_VALIDATION, returns mapAnotherTask', () => {
  expect(getMessageOnMappingContext('LOCKED_FOR_VALIDATION')).toBe('mapAnotherTask');
});
it('when taskStatus is VALIDATED, returns mapATask', () => {
  expect(getMessageOnMappingContext('VALIDATED')).toBe('mapAnotherTask');
});

/*****  VALIDATION CONTEXT  *****/
it('when taskStatus is null, returns mapATask', () => {
  expect(getMessageOnValidationContext(true, null)).toBe('mapATask');
});
it('when taskStatus is MAPPED, returns validateSelectedTask', () => {
  expect(getMessageOnValidationContext(true, 'MAPPED')).toBe('validateSelectedTask');
});
it('when taskStatus is VALIDATED, returns validateAnotherTask', () => {
  expect(getMessageOnValidationContext(true, 'VALIDATED')).toBe('validateAnotherTask');
});
it('when taskStatus is LOCKED_FOR_VALIDATION, returns validateAnotherTask', () => {
  expect(getMessageOnValidationContext(true, 'LOCKED_FOR_VALIDATION')).toBe('validateAnotherTask');
});
it('when taskStatus is LOCKED_FOR_MAPPING, returns mapAnotherTask', () => {
  expect(getMessageOnValidationContext(true, 'LOCKED_FOR_MAPPING')).toBe('mapAnotherTask');
});
it('when taskStatus is BADIMAGERY, returns mapAnotherTask', () => {
  expect(getMessageOnValidationContext(true, 'BADIMAGERY')).toBe('mapAnotherTask');
});
it('when taskStatus is READY, returns mapSelectedTask', () => {
  expect(getMessageOnValidationContext(true, 'READY')).toBe('mapSelectedTask');
});
it('when taskStatus is INVALIDATED, returns mapSelectedTask', () => {
  expect(getMessageOnValidationContext(true, 'INVALIDATED')).toBe('mapSelectedTask');
});

it('READY TASK selected and USER able to map returns mapSelectedTask', () => {
  const user = { mappingLevel: 'BEGINNER', role: 'MAPPER' };
  const project = {
    percentMapped: 80,
    percentBadImagery: 20,
    percentValidated: 0,
    mappingPermission: 'ANY',
    validationPermission: 'TEAMS_LEVEL',
    teams: [],
  };
  const taskStatus = 'READY';
  expect(getTaskAction(user, project, taskStatus)).toBe('mapSelectedTask');
});

it('READY TASK selected and USER unable to map returns selectAnotherProject', () => {
  const user = { mappingLevel: 'BEGINNER', role: 'MAPPER' };
  const project = {
    percentMapped: 40,
    percentBadImagery: 0,
    percentValidated: 0,
    mappingPermission: 'TEAMS',
    validationPermission: 'TEAMS',
    teams: [],
  };
  const taskStatus = 'READY';
  expect(getTaskAction(user, project, taskStatus)).toBe('selectAnotherProject');
});

it('MAPPED TASK selected and USER able to map, but unable to validate, returns mapAnotherTask', () => {
  const user = { mappingLevel: 'BEGINNER', role: 'MAPPER' };
  const project = {
    percentMapped: 99,
    percentBadImagery: 0,
    percentValidated: 0,
    mappingPermission: 'ANY',
    validationPermission: 'LEVEL',
    teams: [],
  };
  const taskStatus = 'MAPPED';
  expect(getTaskAction(user, project, taskStatus)).toBe('mapAnotherTask');
});

it('MAPPED TASK selected and USER able to validate returns validatedSelectedTask', () => {
  const user = { mappingLevel: 'BEGINNER', role: 'MAPPER' };
  const project = {
    percentMapped: 100,
    percentValidated: 70,
    percentBadImagery: 30,
    mappingPermission: 'ANY',
    validationPermission: 'ANY',
    teams: [],
  };
  const taskStatus = 'MAPPED';
  expect(getTaskAction(user, project, taskStatus)).toBe('validateSelectedTask');
});

it('No tasks selected and USER able to validate returns validatedATask', () => {
  const user = { mappingLevel: 'INTERMEDIATE', role: 'MAPPER' };
  const project = {
    percentMapped: 100,
    percentValidated: 70,
    percentBadImagery: 30,
    mappingPermission: 'LEVEL',
    validationPermission: 'LEVEL',
    teams: [],
  };
  expect(getTaskAction(user, project, null)).toBe('validateATask');
});

it('completely mapped project returns mappingIsComplete message to a user that can not validate', () => {
  const user = { mappingLevel: 'INTERMEDIATE', role: 'MAPPER' };
  const project = {
    percentMapped: 100,
    percentValidated: 50,
    percentBadImagery: 0,
    mappingPermission: 'LEVEL',
    validationPermission: 'TEAMS',
    teams: [],
  };
  const taskStatus = 'MAPPED';
  expect(getTaskAction(user, project, taskStatus)).toBe('mappingIsComplete');
});

it('completely mapped and validated project returns projectIsComplete to user able to map', () => {
  const user = { mappingLevel: 'INTERMEDIATE', role: 'MAPPER' };
  const project = {
    percentMapped: 100,
    percentValidated: 100,
    percentBadImagery: 0,
    mappingPermission: 'ANY',
    validationPermission: 'ANY',
    teams: [],
  };
  const taskStatus = 'VALIDATED';
  expect(getTaskAction(user, project, taskStatus)).toBe('projectIsComplete');
});

it('completely mapped and validated project returns projectIsComplete to user able to validate', () => {
  const user = { mappingLevel: 'BEGINNER', role: 'MAPPER' };
  const project = {
    percentMapped: 100,
    percentValidated: 100,
    percentBadImagery: 0,
    mappingPermission: 'ANY',
    validationPermission: 'ANY',
    teams: [],
  };
  const taskStatus = 'VALIDATED';
  expect(getTaskAction(user, project, taskStatus)).toBe('projectIsComplete');
});
