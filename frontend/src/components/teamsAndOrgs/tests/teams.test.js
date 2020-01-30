import React from 'react';
import TestRenderer from 'react-test-renderer';
import { FormattedMessage } from 'react-intl';

import { createComponentWithIntl } from '../../../utils/testWithIntl';
import { TeamBox, TeamsBoxList } from '../teams';

describe('test TeamBox', () => {
  const element = TestRenderer.create(
    <TeamBox team={{ teamId: 1, name: 'Contributors', role: 'VALIDATOR' }} className="dib" />,
  );
  const testInstance = element.root;
  it('test if props are correctly set', () => {
    expect(testInstance.findByType('div').props.className).toBe('tc br1 f6 ba dib');
    expect(testInstance.findByType('div').children).toEqual(['Contributors']);
  });
});

describe('test TeamBoxList', () => {
  const teams = [
    { teamId: 1, name: 'Contributors', role: 'VALIDATOR' },
    { teamId: 2, name: 'Private Team', role: 'MAPPER' },
    { teamId: 3, name: 'My Best Team', role: 'PROJECT_MANAGER' },
  ];
  const element = createComponentWithIntl(<TeamsBoxList teams={teams} />);
  const testInstance = element.root;
  it('Mapping and validation sections are present', () => {
    expect(testInstance.findAllByType(FormattedMessage)[0].props.id).toBe(
      'management.teams.mapping',
    );
    expect(testInstance.findAllByType(FormattedMessage)[1].props.id).toBe(
      'management.teams.validation',
    );
  });
  it('links are present and correct', () => {
    expect(testInstance.findAllByType('a').length).toBe(2);
    expect(testInstance.findAllByType('a')[0].props.href).toBe('/teams/2/membership/');
  });
  it('TeamBox are present and with the correct props', () => {
    expect(testInstance.findAllByType(TeamBox).length).toBe(2);
    expect(testInstance.findAllByProps({ className: 'tc br1 f6 ba dib pv2 ph3 mt2' }).length).toBe(
      2,
    );
    expect(
      testInstance.findAllByProps({ className: 'tc br1 f6 ba dib pv2 ph3 mt2' })[0].children,
    ).toEqual(['Private Team']);
  });
});

describe('test TeamBoxList without mapping and validation teams', () => {
  const teams = [
    { teamId: 3, name: 'My Best Team', role: 'PROJECT_MANAGER' },
    { teamId: 4, name: 'My Other Team', role: 'PROJECT_MANAGER' },
  ];
  const element = createComponentWithIntl(<TeamsBoxList teams={teams} />);
  const testInstance = element.root;
  it('Mapping and validation sections are present', () => {
    expect(() =>
      testInstance
        .findAllByType('h4')
        .toThrow(new Error('No instances found with node type: "h4"')),
    );
    expect(() =>
      testInstance
        .findAllByType(TeamBox)
        .toThrow(new Error('No instances found with node type: "TeamBox"')),
    );
  });
});
