import '@testing-library/jest-dom';
import React from 'react';
import { FormattedMessage } from 'react-intl';
import { MemoryRouter } from 'react-router-dom';
import { screen } from '@testing-library/react';

import {
  createComponentWithIntl,
  createComponentWithMemoryRouter,
  IntlProviders,
  renderWithRouter,
} from '../../../utils/testWithIntl';
import { UserPermissionErrorContent } from '../permissionErrorModal';
import { CloseIcon } from '../../svgIcons';
import { Button } from '../../button';
import messages from '../messages';

describe('test if UserPermissionErrorContent', () => {
  const project = {
    mappingPermission: 'LEVEL',
    percentMapped: 11,
    percentValidated: 1,
    percentBadImagery: 0,
  };
  let value = false;
  const closeTestFn = (v) => (value = v);
  const element = createComponentWithIntl(
    <MemoryRouter>
      <UserPermissionErrorContent
        project={project}
        userLevel="BEGINNER"
        close={() => closeTestFn(true)}
      />
    </MemoryRouter>,
  );
  const testInstance = element.root;
  it('has a span with a CloseIcon as children', () => {
    expect(
      testInstance.findByProps({ className: 'fr relative blue-light pt1 link pointer' }).type,
    ).toBe('span');
    expect(
      testInstance.findByProps({ className: 'fr relative blue-light pt1 link pointer' }).props
        .children.type,
    ).toStrictEqual(CloseIcon);
  });
  it('when clicking on the CloseIcon parent element, executes the closeTestFn', () => {
    expect(value).toBeFalsy();
    testInstance
      .findByProps({ className: 'fr relative blue-light pt1 link pointer' })
      .props.onClick();
    expect(value).toBeTruthy();
  });
  it('has a red Button', () => {
    expect(testInstance.findByType(Button).props.className).toBe('white bg-red');
  });
  it('has a Button with a correct FormattedMessage', () => {
    expect(testInstance.findByType(Button).props.children.type).toBe(FormattedMessage);
    expect(testInstance.findByType(Button).props.children.props.id).toBe(
      'project.selectTask.footer.button.selectAnotherProject',
    );
  });
  it('has a h3 with a correct FormattedMessage', () => {
    expect(testInstance.findByType('h3').props.children.type).toBe(FormattedMessage);
    expect(testInstance.findByType('h3').props.children.props.id).toBe(
      'project.permissions.error.title',
    );
  });
});

describe('UserPermissionErrorContent', () => {
  it('should display message for user is not a mapping team member', () => {
    const project = {
      mappingPermission: 'TEAMS',
      percentMapped: 11,
      percentValidated: 1,
      percentBadImagery: 0,
      teams: [
        {
          teamId: 6,
          name: 'Team Mapper',
          role: 'MAPPER',
        },
      ],
    };
    renderWithRouter(
      <IntlProviders>
        <UserPermissionErrorContent project={project} userLevel="BEGINNER" />
      </IntlProviders>,
    );
    expect(
      screen.getByText(messages.permissionError_userIsNotMappingTeamMember.defaultMessage),
    ).toBeInTheDocument();
  });

  it('should display message for user is not a validation team member', () => {
    const project = {
      mappingPermission: 'TEAMS',
      percentMapped: 100,
      percentValidated: 1,
      percentBadImagery: 0,
      validationPermission: 'TEAMS',
      teams: [
        {
          teamId: 11,
          name: 'Team Validators',
          role: 'VALIDATOR',
        },
      ],
    };
    renderWithRouter(
      <IntlProviders>
        <UserPermissionErrorContent project={project} userLevel="BEGINNER" />
      </IntlProviders>,
    );
    expect(
      screen.getByText(messages.permissionError_userIsNotValidationTeamMember.defaultMessage),
    ).toBeInTheDocument();
  });

  it('should navigate to explore', async () => {
    const project = {
      mappingPermission: 'TEAMS',
      percentMapped: 100,
      percentValidated: 1,
      percentBadImagery: 0,
      validationPermission: 'TEAMS',
      teams: [
        {
          teamId: 8,
          name: 'Team Managers',
          role: 'PROJECT_MANAGER',
        },
        {
          teamId: 11,
          name: 'Team Validators',
          role: 'VALIDATOR',
        },
        {
          teamId: 6,
          name: 'Team Mapper',
          role: 'MAPPER',
        },
      ],
    };
    const { user, router } = createComponentWithMemoryRouter(
      <IntlProviders>
        <UserPermissionErrorContent project={project} userLevel="BEGINNER" />
      </IntlProviders>,
    );
    await user.click(
      screen.getByRole('button', {
        name: /select another project/i,
      }),
    );
    expect(router.state.location.pathname).toBe('/explore');
  });
});
