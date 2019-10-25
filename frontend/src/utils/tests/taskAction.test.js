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
    percentMapped: 40,
    percentBadImagery: 0,
    percentValidated: 0,
    mapperLevel: 'BEGINNER',
  };
  const taskStatus = 'READY';
  expect(getTaskAction(user, project, taskStatus)).toBe('mapSelectedTask');
});

it('MAPPED TASK selected and USER able to validate returns validatedSelectedTask', () => {
  const user = { mappingLevel: 'BEGINNER', role: 'MAPPER' };
  const project = {
    percentMapped: 100,
    percentValidated: 50,
    percentBadImagery: 0,
    mapperLevel: 'BEGINNER',
    restrictMappingLevelToProject: false,
    restrictValidationRole: false,
  };
  const taskStatus = 'MAPPED';
  expect(getTaskAction(user, project, taskStatus)).toBe('validateSelectedTask');
});

it('completely mapped project returns mappingIsComplete message to a user that can not validate', () => {
  const user = { mappingLevel: 'BEGINNER', role: 'MAPPER' };
  const project = {
    percentMapped: 100,
    percentValidated: 50,
    percentBadImagery: 0,
    mapperLevel: 'INTERMEDIATE',
    restrictValidationRole: true,
  };
  const taskStatus = 'MAPPED';
  expect(getTaskAction(user, project, taskStatus)).toBe('mappingIsComplete');
});

it('completely mapped and validated project returns projectIsComplete to MAPPER', () => {
  const user = { mappingLevel: 'INTERMEDIATE', role: 'MAPPER' };
  const project = {
    percentMapped: 100,
    percentValidated: 100,
    percentBadImagery: 0,
    mapperLevel: 'INTERMEDIATE',
    restrictMappingLevelToProject: true,
  };
  const taskStatus = 'VALIDATED';
  expect(getTaskAction(user, project, taskStatus)).toBe('projectIsComplete');
});

it('completely mapped and validated project returns projectIsComplete to VALIDATOR', () => {
  const user = { mappingLevel: 'BEGINNER', role: 'MAPPER' };
  const project = {
    percentMapped: 100,
    percentValidated: 100,
    percentBadImagery: 0,
    mapperLevel: 'INTERMEDIATE',
    restrictMappingLevelToProject: true,
    restrictValidationRole: false,
  };
  const taskStatus = 'VALIDATED';
  expect(getTaskAction(user, project, taskStatus)).toBe('projectIsComplete');
});
