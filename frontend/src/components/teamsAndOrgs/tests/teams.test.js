import '@testing-library/jest-dom';
import TestRenderer from 'react-test-renderer';
import userEvent from '@testing-library/user-event';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { FormattedMessage } from 'react-intl';

import {
  createComponentWithIntl,
  ReduxIntlProviders,
  IntlProviders,
  renderWithRouter,
} from '../../../utils/testWithIntl';
import { TeamBox, TeamsBoxList, TeamsManagement, Teams, TeamCard, TeamSideBar } from '../teams';
import { store } from '../../../store';
import { teams, team } from '../../../network/tests/mockData/teams';

const dummyTeams = [
  {
    teamId: 3,
    name: 'My Best Team',
    role: 'PROJECT_MANAGER',
    joinMethod: 'BY_INVITE',
    members: [
      {
        username: 'ram',
        function: 'MEMBER',
        active: true,
        pictureUrl: null,
      },
    ],
  },
];

describe('test TeamBox', () => {
  const element = TestRenderer.create(
    <TeamBox
      team={{ teamId: 1, name: 'Contributors', role: 'VALIDATOR' }}
      className="tc f6 ba dib"
    />,
  );
  const testInstance = element.root;
  it('props are correctly set', () => {
    expect(testInstance.findByType('div').props.className).toBe('br1 tc f6 ba dib');
    expect(testInstance.findByType('div').children).toEqual(['Contributors']);
  });
  it('does not have img', () => {
    expect(() =>
      testInstance
        .findAllByType('img')
        .toThrow(new Error('No instances found with node type: "img"')),
    );
  });
});

describe('test TeamBox with img', () => {
  const element = TestRenderer.create(
    <TeamBox
      team={{
        teamId: 1,
        name: 'Contributors',
        role: 'VALIDATOR',
        organisation: 'My Org',
        logo: 'http://i.co/1.jpg',
      }}
      className="tc f6 ba dib"
    />,
  );
  const testInstance = element.root;
  it('img exists and is correctly formatted', () => {
    expect(testInstance.findByType('img').props.src).toBe('http://i.co/1.jpg');
    expect(testInstance.findByType('img').props.alt).toBe('My Org');
    expect(testInstance.findByType('img').props.className).toBe('object-fit-contain h2 pr2 v-mid');
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
    expect(testInstance.findAllByProps({ className: 'br1 dib pv2 ph3 mt2 ba f6 tc' }).length).toBe(
      2,
    );
    expect(
      testInstance.findAllByProps({ className: 'br1 dib pv2 ph3 mt2 ba f6 tc' })[0].children,
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

describe('TeamsManagement component', () => {
  it('renders loading placeholder when API is being fetched', async () => {
    const { container, getByRole } = render(
      <ReduxIntlProviders>
        <TeamsManagement
          userDetails={{ role: 'ADMIN' }}
          managementView={true}
          isTeamsFetched={false}
        />
      </ReduxIntlProviders>,
    );
    expect(
      getByRole('button', {
        name: /new/i,
      }),
    ).toBeInTheDocument();
    expect(container.querySelectorAll('button')).toHaveLength(3);
    expect(container.getElementsByClassName('show-loading-animation mb3')).toHaveLength(4);
  });

  it('does not render loading placeholder after API is fetched', () => {
    const { container } = render(
      <ReduxIntlProviders>
        <TeamsManagement
          userDetails={{ role: 'ADMIN' }}
          managementView={true}
          isTeamsFetched={true}
        />
      </ReduxIntlProviders>,
    );
    expect(container.getElementsByClassName('show-loading-animation mb3')).toHaveLength(0);
  });

  it('should render add button for organisation managers', () => {
    act(() => {
      store.dispatch({ type: 'SET_ORGANISATIONS', organisations: [2, 3] });
    });
    render(
      <ReduxIntlProviders>
        <TeamsManagement
          userDetails={{ role: 'MAPPER' }}
          managementView={true}
          isTeamsFetched={true}
        />
      </ReduxIntlProviders>,
    );
    expect(
      screen.getByRole('button', {
        name: /new/i,
      }),
    ).toBeInTheDocument();
  });

  it("should not render 'Manage teams' but render 'My teams' text for non management view", () => {
    render(
      <ReduxIntlProviders>
        <TeamsManagement
          userDetails={{ role: 'ADMIN' }}
          managementView={true}
          isTeamsFetched={true}
        />
      </ReduxIntlProviders>,
    );
    expect(
      screen.getByRole('heading', {
        name: /manage teams/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', {
        name: /my teams/i,
      }),
    ).not.toBeInTheDocument();
  });

  it('renders teams list card after API is fetched', async () => {
    const { container, getByText } = render(
      <ReduxIntlProviders>
        <TeamsManagement
          teams={dummyTeams}
          userDetails={{ role: 'ADMIN' }}
          managementView={true}
          isTeamsFetched={true}
        />
      </ReduxIntlProviders>,
    );
    expect(container.querySelectorAll('h3')[0].textContent).toBe('Manage Teams');
    expect(container.querySelectorAll('article').length).toBe(1);
    expect(getByText('My Best Team')).toBeInTheDocument();
    expect(getByText('Managers')).toBeInTheDocument();
    expect(getByText('Team members')).toBeInTheDocument();
    expect(getByText('My Best Team').closest('a').href).toContain('/teams/3/membership/');
  });

  it('renders relevant text if user is not a member of any team', async () => {
    render(
      <ReduxIntlProviders>
        <TeamsManagement
          teams={[]}
          userDetails={{ role: 'ADMIN' }}
          managementView={false}
          isTeamsFetched={true}
        />
      </ReduxIntlProviders>,
    );
    expect(screen.getByText(/No team found\./i)).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        name: /my teams/i,
      }),
    ).toBeInTheDocument();
  });

  it('filters teams list by the search query', async () => {
    render(
      <ReduxIntlProviders>
        <TeamsManagement
          teams={dummyTeams}
          userDetails={{ role: 'ADMIN' }}
          managementView={true}
          isTeamsFetched={true}
        />
      </ReduxIntlProviders>,
    );
    const textField = screen.getByRole('textbox');
    fireEvent.change(textField, {
      target: {
        value: 'my best',
      },
    });
    expect(screen.getByRole('heading', { name: 'My Best Team' })).toHaveTextContent('My Best Team');
    fireEvent.change(textField, {
      target: {
        value: 'not my best',
      },
    });
    expect(screen.queryByRole('heading', { name: 'My Best Team' })).not.toBeInTheDocument();
    expect(screen.queryByText('No team found.')).toBeInTheDocument();
  });

  it('should filter search query when the close icon button is clicked', async () => {
    render(
      <ReduxIntlProviders>
        <TeamsManagement
          teams={teams.teams}
          userDetails={{ role: 'ADMIN' }}
          managementView={true}
          isTeamsFetched={true}
        />
      </ReduxIntlProviders>,
    );

    const textfield = screen.getByRole('textbox');
    await userEvent.type(textfield, 'hot');
    expect(textfield.value).toBe('hot');
    const clearIcon = screen.getByLabelText('clear');
    expect(clearIcon).toBeInTheDocument();
    await userEvent.click(clearIcon);
    expect(textfield.value).toBe('');
  });
});

describe('Teams component', () => {
  it('should display loading placeholder when API is being fetched', () => {
    const { container } = render(
      <IntlProviders>
        <Teams teams={[]} isReady={false} viewAllQuery="/view/all" />
      </IntlProviders>,
    );
    expect(container.getElementsByClassName('show-loading-animation')).toHaveLength(36);
  });

  it('should display component details and teams passed', () => {
    render(
      <IntlProviders>
        <Teams isReady teams={dummyTeams} viewAllQuery="/view/all" showAddButton />
      </IntlProviders>,
    );
    expect(screen.getByRole('heading', { name: /teams/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View all' })).toBeInTheDocument();
    expect(screen.getAllByRole('article').length).toBe(1);
    expect(screen.getByRole('heading', { name: dummyTeams[0].name }));
    expect(screen.getByRole('button', { name: /new/i })).toBeInTheDocument();
  });

  it('should navigate to project creation page on new button click', async () => {
    const { history } = renderWithRouter(
      <IntlProviders>
        <Teams isReady teams={dummyTeams} viewAllQuery="/view/all" showAddButton />
      </IntlProviders>,
    );
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /new/i }));
    await waitFor(() => expect(history.location.pathname).toBe('/manage/teams/new/'));
  });

  it('should display no teams found message', () => {
    render(
      <IntlProviders>
        <Teams isReady teams={[]} viewAllQuery="/view/all" />
      </IntlProviders>,
    );
    expect(screen.getByText(/No teams found./i)).toBeInTheDocument();
  });

  it('should navigate to manage projects page when view all is clicked ', async () => {
    const { history } = renderWithRouter(
      <IntlProviders>
        <Teams isReady teams={[]} viewAllQuery="view/all" />
      </IntlProviders>,
    );
    const user = userEvent.setup();
    await user.click(
      screen.getByRole('link', {
        name: /view all/i,
      }),
    );
    await waitFor(() => expect(history.location.pathname).toBe('/manage/teams/view/all'));
  });

  it('should not display border and add button when props is false', () => {
    const { container } = renderWithRouter(
      <IntlProviders>
        <Teams isReady teams={[]} viewAllQuery="view/all" border={false} showAddButton={false} />
      </IntlProviders>,
    );
    expect(container.firstChild).not.toHaveClass('b--grey-light ba pa4');
    expect(screen.queryByRole('button', { name: /new/i })).not.toBeInTheDocument();
  });

  it('should direct to teams management page when no query for view all link is provided', () => {
    renderWithRouter(
      <IntlProviders>
        <Teams isReady teams={[]} border={false} />
      </IntlProviders>,
    );
    expect(screen.queryByRole('link', { name: 'View all' })).not.toBeInTheDocument();
  });
});

describe('Team Card', () => {
  test('should render component details', () => {
    const team = teams.teams[0];
    render(
      <IntlProviders>
        <TeamCard team={team} />
      </IntlProviders>,
    );
    expect(
      screen.getByRole('link', {
        name: /Organisation Name 123/i,
      }),
    ).toBeInTheDocument();
    [team.name, /managers/i, /team members/i].forEach((heading) =>
      expect(
        screen.getByRole('heading', {
          name: heading,
        }),
      ).toBeInTheDocument(),
    );
    expect(
      screen.getByRole('img', {
        name: team.organisation,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', {
        name: team.members[0].username,
      }),
    ).toBeInTheDocument();
    ['Private', 'By invite'].forEach((text) => expect(screen.getByText(text)).toBeInTheDocument());
  });
});

describe('TeamSideBar component', () => {
  it('should search for users by search query', async () => {
    render(
      <ReduxIntlProviders>
        <TeamSideBar team={team} managers={[]} members={team.members} />
      </ReduxIntlProviders>,
    );
    const inputField = screen.getByRole('textbox');
    expect(inputField).toBeInTheDocument();
    expect(
      screen.getByRole('link', {
        name: team.members[0].username,
      }),
    ).toBeInTheDocument();
    await userEvent.type(inputField, 'not_sample_user');
    expect(
      screen.queryByRole('link', {
        name: team.members[0].username,
      }),
    ).not.toBeInTheDocument();
  });
});
