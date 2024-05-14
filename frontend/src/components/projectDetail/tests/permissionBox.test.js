import React from 'react';
import { FormattedMessage } from 'react-intl';

import { createComponentWithIntl } from '../../../utils/testWithIntl';
import { PermissionBox } from '../permissionBox';

describe('test if PermissionBox', () => {
  it('without validation returns correct style and strings', () => {
    const element = createComponentWithIntl(<PermissionBox permission="ANY" className="red" />);
    const testInstance = element.root;

    expect(testInstance.findByType('div').props.className).toBe('tc br1 f6 ba red');
    expect(testInstance.findByType(FormattedMessage).props.id).toBe('project.permissions.any');
  });

  it('without permission TEAMS returns correct style and strings', () => {
    const element = createComponentWithIntl(
      <PermissionBox permission="TEAMS" className="orange" />,
    );
    const testInstance = element.root;

    expect(testInstance.findByType('div').props.className).toBe('tc br1 f6 ba orange');
    expect(testInstance.findByType(FormattedMessage).props.id).toBe('project.permissions.teams');
  });

  it('with validation and TEAMS permission returns correct style and strings', () => {
    const element = createComponentWithIntl(
      <PermissionBox permission="TEAMS" validation className="red" />,
    );
    const testInstance = element.root;

    expect(testInstance.findByType('div').props.className).toBe('tc br1 f6 ba red');
    expect(testInstance.findAllByType(FormattedMessage)[0].props.id).toBe(
      'project.permissions.teams',
    );
    expect(testInstance.findAllByType(FormattedMessage)[1].props.id).toBe(
      'project.detail.validation_team',
    );
  });

  it('with validation and TEAMS_LEVEL permission returns correct style and strings', () => {
    const element = createComponentWithIntl(
      <PermissionBox permission="TEAMS_LEVEL" validation className="red" />,
    );
    const testInstance = element.root;

    expect(testInstance.findByType('div').props.className).toBe('tc br1 f6 ba red');
    expect(testInstance.findAllByType(FormattedMessage)[0].props.id).toBe(
      'project.permissions.teamsAndLevel',
    );
    expect(testInstance.findAllByType(FormattedMessage)[0].props.values.team).toBeTruthy();
    expect(testInstance.findAllByType(FormattedMessage)[1].props.id).toBe(
      'project.detail.validation_team',
    );
  });
});
