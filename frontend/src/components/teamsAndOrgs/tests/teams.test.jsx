import '@testing-library/jest-dom';
import TestRenderer from 'react-test-renderer';
import { render, screen, waitFor, act } from '@testing-library/react';
import { FormattedMessage } from 'react-intl';
import { MemoryRouter } from 'react-router-dom';

import {
  createComponentWithIntl,
  ReduxIntlProviders,
  IntlProviders,
  renderWithRouter,
  createComponentWithMemoryRouter,
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
    <MemoryRouter>
      <TeamBox
        team={{ teamId: 1, name: 'Contributors', role: 'VALIDATOR' }}
        className="tc f6 ba dib"
      />
    </MemoryRouter>,
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
    <MemoryRouter>
      <TeamBox
        team={{
          teamId: 1,
          name: 'Contributors',
          role: 'VALIDATOR',
          organisation: 'My Org',
          logo: 'http://i.co/1.jpg',
        }}
        className="tc f6 ba dib"
      />
    </MemoryRouter>,
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
  const element = createComponentWithIntl(
    <MemoryRouter>
      <TeamsBoxList teams={teams} />
    </MemoryRouter>,
  );
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
      <MemoryRouter>
        <ReduxIntlProviders>
          <TeamsManagement
            query={{ searchQuery: undefined }}
            userDetails={{ role: 'ADMIN' }}
            managementView={true}
            teamsStatus={'loading'}
          />
        </ReduxIntlProviders>
      </MemoryRouter>,
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
      <MemoryRouter>
        <ReduxIntlProviders>
          <TeamsManagement
            query={{ searchQuery: undefined }}
            userDetails={{ role: 'ADMIN' }}
            managementView={true}
            teamsStatus={'success'}
          />
        </ReduxIntlProviders>
      </MemoryRouter>,
    );
    expect(container.getElementsByClassName('show-loading-animation mb3')).toHaveLength(0);
  });

  it('should render add button for organisation managers', () => {
    act(() => {
      store.dispatch({ type: 'SET_ORGANISATIONS', organisations: [2, 3] });
    });
    render(
      <MemoryRouter>
        <ReduxIntlProviders>
          <TeamsManagement
            query={{ searchQuery: undefined }}
            userDetails={{ role: 'MAPPER' }}
            managementView={true}
            teamsStatus={'success'}
          />
        </ReduxIntlProviders>
      </MemoryRouter>,
    );
    expect(
      screen.getByRole('button', {
        name: /new/i,
      }),
    ).toBeInTheDocument();
  });

  it("should not render 'Manage teams' but render 'My teams' text for non management view", () => {
    render(
      <MemoryRouter>
        <ReduxIntlProviders>
          <TeamsManagement
            query={{ searchQuery: undefined }}
            userDetails={{ role: 'ADMIN' }}
            managementView={true}
            teamsStatus={'success'}
          />
        </ReduxIntlProviders>
      </MemoryRouter>,
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
      <MemoryRouter>
        <ReduxIntlProviders>
          <TeamsManagement
            query={{ searchQuery: undefined }}
            teams={dummyTeams}
            userDetails={{ role: 'ADMIN' }}
            managementView={true}
            teamsStatus={'success'}
          />
        </ReduxIntlProviders>
      </MemoryRouter>,
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
      <MemoryRouter>
        <ReduxIntlProviders>
          <TeamsManagement
            query={{ searchQuery: undefined }}
            teams={[]}
            userDetails={{ role: 'ADMIN' }}
            managementView={false}
            teamsStatus={'success'}
          />
        </ReduxIntlProviders>
      </MemoryRouter>,
    );
    expect(screen.getByText(/No team found\./i)).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        name: /my teams/i,
      }),
    ).toBeInTheDocument();
  });
});

describe('Teams component', () => {
  it('should display loading placeholder when API is being fetched', () => {
    const { container } = render(
      <MemoryRouter>
        <IntlProviders>
          <Teams teams={[]} isReady={false} viewAllQuery="/view/all" />
        </IntlProviders>
      </MemoryRouter>,
    );
    expect(container.getElementsByClassName('show-loading-animation')).toHaveLength(36);
  });

  it('should display component details and teams passed', () => {
    render(
      <MemoryRouter>
        <IntlProviders>
          <Teams isReady teams={dummyTeams} viewAllQuery="/view/all" showAddButton />
        </IntlProviders>
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { name: /teams/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View all' })).toBeInTheDocument();
    expect(screen.getAllByRole('article').length).toBe(1);
    expect(screen.getByRole('heading', { name: dummyTeams[0].name }));
    expect(screen.getByRole('button', { name: /new/i })).toBeInTheDocument();
  });

  it('should navigate to project creation page on new button click', async () => {
    const { user, router } = createComponentWithMemoryRouter(
      <IntlProviders>
        <Teams isReady teams={dummyTeams} viewAllQuery="/view/all" showAddButton />
      </IntlProviders>,
    );
    await user.click(screen.getByRole('button', { name: /new/i }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/manage/teams/new/'));
  });

  it('should display no teams found message', () => {
    renderWithRouter(
      <IntlProviders>
        <Teams isReady teams={[]} viewAllQuery="/view/all" />
      </IntlProviders>,
    );
    expect(screen.getByText(/No teams found./i)).toBeInTheDocument();
  });

  it('should navigate to manage projects page when view all is clicked ', async () => {
    const { user, router } = createComponentWithMemoryRouter(
      <IntlProviders>
        <Teams isReady teams={[]} viewAllQuery="view/all" />
      </IntlProviders>,
    );
    await user.click(
      screen.getByRole('link', {
        name: /view all/i,
      }),
    );
    await waitFor(() => expect(router.state.location.pathname).toBe('/manage/teams/view/all'));
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
    renderWithRouter(
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
    const { user } = renderWithRouter(
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
    await user.type(inputField, 'not_sample_user');
    expect(
      screen.queryByRole('link', {
        name: team.members[0].username,
      }),
    ).not.toBeInTheDocument();
  });
});
