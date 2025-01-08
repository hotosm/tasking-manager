import { FormattedMessage } from 'react-intl';
import { screen } from '@testing-library/react';
import {
  createComponentWithMemoryRouter,
  IntlProviders,
  ReduxIntlProviders,
  renderWithRouter,
} from '../../../utils/testWithIntl';
import { UserPermissionErrorContent } from '../permissionErrorModal';
import { Button } from '../../button';
import messages from '../messages';
import userEvent from '@testing-library/user-event';

describe('test if UserPermissionErrorContent', () => {
  const project = {
    mappingPermission: 'LEVEL',
    percentMapped: 11,
    percentValidated: 1,
    percentBadImagery: 0,
  };
  let value = false;
  const closeTestFn = (v) => (value = v);
  const setup = () => renderWithRouter(
    <ReduxIntlProviders>
      <UserPermissionErrorContent
        project={project}
        userLevel="BEGINNER"
        close={() => closeTestFn(true)}
      />
    </ReduxIntlProviders>,
  );
  const user = userEvent.setup();
  it('has a span with a CloseIcon as children', () => {
    const { container } = setup();
    expect(container.querySelector('span.fr.relative.blue-light.pt1.link.pointer')).toBeInTheDocument();
    expect(container.querySelector('span.fr.relative.blue-light.pt1.link.pointer').children[0].tagName).toBe("svg");
  });
  it('when clicking on the CloseIcon parent element, executes the closeTestFn', async () => {
    const { container } = setup();
    expect(value).toBeFalsy();
    screen.debug();
    await user.click(
      container.querySelector('span.fr.relative.blue-light.pt1.link.pointer'),
    );
    expect(value).toBeTruthy();
  });
  it('has a red Button', () => {
    const { container } = setup();
    expect(container.querySelector('button.white.bg-red')).toBeInTheDocument();
  });
  it('has a Button with a correct FormattedMessage', () => {
    setup();
    expect(screen.getByText(messages.selectAnotherProject.defaultMessage)).toBeInTheDocument();
  });
  it('has a h3 with a correct FormattedMessage', () => {
    setup();
    expect(screen.getByText(messages.permissionErrorTitle.defaultMessage)).toBeInTheDocument();
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
