import { FormattedMessage } from 'react-intl';

import { createComponentWithIntl } from '../../../utils/testWithIntl';
import { TaskStatus } from '../taskList';
import { LockIcon } from '../../svgIcons';

describe('test correct elements of TaskStatus', () => {
  it('with LOCKED_FOR_MAPPING status & lockHolder', () => {
    const element = createComponentWithIntl(
      <TaskStatus status="LOCKED_FOR_MAPPING" lockHolder="test_user" />,
    );
    const testInstance = element.root;

    expect(testInstance.findAllByType('span')[0].props.style).toEqual({
      backgroundColor: '#fff',
      height: '0.875rem',
      width: '0.875rem',
    });
    expect(testInstance.findAllByType('span')[0].props.className).toEqual(
      'ba bw1 b--grey-light dib v-mid',
    );
    expect(testInstance.findByType(FormattedMessage).props.id).toBe('project.tasks.locked_by_user');
    expect(testInstance.findByType(LockIcon).props.className).toBe('v-mid pl1 h1 w1');
  });

  it('with LOCKED_FOR_MAPPING status and without lockHolder', () => {
    const element = createComponentWithIntl(<TaskStatus status="LOCKED_FOR_MAPPING" />);
    const testInstance = element.root;

    expect(testInstance.findAllByType('span')[0].props.style).toEqual({
      backgroundColor: '#fff',
      height: '0.875rem',
      width: '0.875rem',
    });
    expect(testInstance.findAllByType('span')[0].props.className).toEqual(
      'ba bw1 b--grey-light dib v-mid',
    );
    expect(testInstance.findByType(FormattedMessage).props.id).toBe(
      'project.tasks.status.lockedForMapping',
    );
    expect(testInstance.findByType(LockIcon).props.className).toBe('v-mid pl1 h1 w1');
  });

  it('with LOCKED_FOR_VALIDATION status and with lockHolder', () => {
    const element = createComponentWithIntl(
      <TaskStatus status="LOCKED_FOR_VALIDATION" lockHolder="test_user" />,
    );
    const testInstance = element.root;

    expect(testInstance.findAllByType('span')[0].props.style).toEqual({
      backgroundColor: '#ade6ef',
      height: '1rem',
      width: '1rem',
    });
    expect(testInstance.findAllByType('span')[0].props.className).toEqual(' dib v-mid');
    expect(testInstance.findByType(FormattedMessage).props.id).toBe('project.tasks.locked_by_user');
    expect(testInstance.findByType(LockIcon).props.className).toBe('v-mid pl1 h1 w1');
  });

  it('with LOCKED_FOR_VALIDATION status and without lockHolder', () => {
    const element = createComponentWithIntl(<TaskStatus status="LOCKED_FOR_VALIDATION" />);
    const testInstance = element.root;

    expect(testInstance.findAllByType('span')[0].props.style).toEqual({
      backgroundColor: '#ade6ef',
      height: '1rem',
      width: '1rem',
    });
    expect(testInstance.findAllByType('span')[0].props.className).toEqual(' dib v-mid');
    expect(testInstance.findByType(FormattedMessage).props.id).toBe(
      'project.tasks.status.lockedForValidation',
    );
    expect(testInstance.findByType(LockIcon).props.className).toBe('v-mid pl1 h1 w1');
  });

  it('with READY status', () => {
    const element = createComponentWithIntl(<TaskStatus status="READY" />);
    const testInstance = element.root;

    expect(testInstance.findAllByType('span')[0].props.style).toEqual({
      backgroundColor: '#fff',
      height: '0.875rem',
      width: '0.875rem',
    });
    expect(testInstance.findAllByType('span')[0].props.className).toEqual(
      'ba bw1 b--grey-light dib v-mid',
    );
    expect(testInstance.findByType(FormattedMessage).props.id).toBe('project.tasks.status.ready');
    expect(() => testInstance.findByType(LockIcon)).toThrow(
      new Error('No instances found with node type: "LockIcon"'),
    );
  });

  it('with MAPPED status', () => {
    const element = createComponentWithIntl(<TaskStatus status="MAPPED" />);
    const testInstance = element.root;

    expect(testInstance.findAllByType('span')[0].props.style).toEqual({
      backgroundColor: '#ade6ef',
      height: '1rem',
      width: '1rem',
    });
    expect(testInstance.findAllByType('span')[0].props.className).toEqual(' dib v-mid');
    expect(testInstance.findByType(FormattedMessage).props.id).toBe('project.tasks.status.mapped');
    expect(() => testInstance.findByType(LockIcon)).toThrow(
      new Error('No instances found with node type: "LockIcon"'),
    );
  });

  it('with VALIDATED status', () => {
    const element = createComponentWithIntl(<TaskStatus status="VALIDATED" />);
    const testInstance = element.root;

    expect(testInstance.findAllByType('span')[0].props.style).toEqual({
      backgroundColor: '#40ac8c',
      height: '1rem',
      width: '1rem',
    });
    expect(testInstance.findAllByType('span')[0].props.className).toEqual(' dib v-mid');
    expect(testInstance.findByType(FormattedMessage).props.id).toBe(
      'project.tasks.status.validated',
    );
    expect(() => testInstance.findByType(LockIcon)).toThrow(
      new Error('No instances found with node type: "LockIcon"'),
    );
  });

  it('with INVALIDATED status', () => {
    const element = createComponentWithIntl(<TaskStatus status="INVALIDATED" />);
    const testInstance = element.root;

    expect(testInstance.findAllByType('span')[0].props.style).toEqual({
      backgroundColor: '#fceca4',
      height: '1rem',
      width: '1rem',
    });
    expect(testInstance.findAllByType('span')[0].props.className).toEqual(' dib v-mid');
    expect(testInstance.findByType(FormattedMessage).props.id).toBe(
      'project.tasks.status.invalidated',
    );
    expect(() => testInstance.findByType(LockIcon)).toThrow(
      new Error('No instances found with node type: "LockIcon"'),
    );
  });

  it('with BADIMAGERY status', () => {
    const element = createComponentWithIntl(<TaskStatus status="BADIMAGERY" />);
    const testInstance = element.root;

    expect(testInstance.findAllByType('span')[0].props.style).toEqual({
      backgroundColor: '#d8dae4',
      height: '1rem',
      width: '1rem',
    });
    expect(testInstance.findAllByType('span')[0].props.className).toEqual(' dib v-mid');
    expect(testInstance.findByType(FormattedMessage).props.id).toBe(
      'project.tasks.status.badImagery',
    );
    expect(() => testInstance.findByType(LockIcon)).toThrow(
      new Error('No instances found with node type: "LockIcon"'),
    );
  });
});
