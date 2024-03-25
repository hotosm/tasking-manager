import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';
import { Form } from 'react-final-form';
import {
  BooleanParam,
  NumberParam,
  StringParam,
  useQueryParams,
  withDefault,
} from 'use-query-params';
import toast from 'react-hot-toast';
import Popup from 'reactjs-popup';

import messages from './messages';
import { useFetch } from '../hooks/UseFetch';
import { useEditTeamAllowed } from '../hooks/UsePermissions';
import { useSetTitleTag } from '../hooks/UseMetaTags';
import useForceUpdate from '../hooks/UseForceUpdate';
import { useModifyMembers } from '../hooks/UseModifyMembers';
import { pushToLocalJSONAPI } from '../network/genericJSONRequest';
import {
  getMembersDiff,
  filterActiveMembers,
  filterActiveManagers,
  filterInactiveMembersAndManagers,
  formatMemberObject,
} from '../utils/teamMembersDiff';
import { Members, JoinRequests } from '../components/teamsAndOrgs/members';
import {
  TeamInformation,
  TeamForm,
  TeamsManagement,
  TeamSideBar,
} from '../components/teamsAndOrgs/teams';
import { MessageMembers } from '../components/teamsAndOrgs/messageMembers';
import { Projects } from '../components/teamsAndOrgs/projects';
import { LeaveTeamConfirmationAlert } from '../components/teamsAndOrgs/leaveTeamConfirmationAlert';
import { FormSubmitButton, CustomButton } from '../components/button';
import { DeleteModal } from '../components/deleteModal';
import { NotFound } from './notFound';
import { PaginatorLine } from '../components/paginator';
import { updateEntity } from '../utils/management';
import { EntityError } from '../components/alert';
import { useTeamsQuery } from '../api/teams';

export function ManageTeams() {
  useSetTitleTag('Manage teams');
  return <ListTeams managementView={true} />;
}

export function MyTeams() {
  useSetTitleTag('My teams');
  return (
    <div className="w-100 cf blue-dark">
      <ListTeams />
    </div>
  );
}

export function ListTeams({ managementView = false }: Object) {
  const userDetails = useSelector((state) => state.auth.userDetails);
  const [query, setQuery] = useQueryParams({
    page: withDefault(NumberParam, 1),
    showAll: BooleanParam,
    searchQuery: withDefault(StringParam, undefined),
  });
  const [userTeamsOnly, setUserTeamsOnly] = useState(Boolean(!query.showAll));

  const { searchQuery, ...restQuery } = query;

  const { data: teams, status: teamsStatus } = useTeamsQuery({
    fullMemberList: false,
    paginate: true,
    team_name: searchQuery, // Pass the searchQuery as team_name
    ...(managementView ? userTeamsOnly && { manager: userDetails.id } : { member: userDetails.id }),
    ...restQuery,
  });

  useEffect(() => {
    setQuery({ ...query, page: 1, showAll: userTeamsOnly === false ? true : undefined });
    //eslint-disable-next-line
  }, [userTeamsOnly]);

  const handlePagination = (val) => {
    setQuery({ ...query, page: val }, 'pushIn');
  };

  return (
    <>
      <TeamsManagement
        teams={teams?.teams}
        userDetails={userDetails}
        managementView={managementView}
        userTeamsOnly={userTeamsOnly}
        setUserTeamsOnly={setUserTeamsOnly}
        query={query}
        setQuery={setQuery}
        teamsStatus={teamsStatus}
      />
      <PaginatorLine
        className="flex items-center flex-end gap-1"
        activePage={query.page}
        setPageFn={handlePagination}
        lastPage={teams?.pagination?.pages || 1}
      />
    </>
  );
}

const joinTeamRequest = (team_id, username, role, token) => {
  return pushToLocalJSONAPI(
    `teams/${team_id}/actions/add/`,
    JSON.stringify({ username: username, role: role }),
    token,
    'POST',
  );
};

const leaveTeamRequest = (team_id, username, role, token) => {
  return pushToLocalJSONAPI(
    `teams/${team_id}/actions/leave/`,
    JSON.stringify({ username: username, role: role }),
    token,
    'POST',
  );
};

export function CreateTeam() {
  useSetTitleTag('Create new team');
  const navigate = useNavigate();
  const userDetails = useSelector((state) => state.auth.userDetails);
  const token = useSelector((state) => state.auth.token);
  const {
    members: managers,
    setMembers: setManagers,
    addMember: addManager,
    removeMember: removeManager,
  } = useModifyMembers([{ username: userDetails.username, pictureUrl: userDetails.pictureUrl }]);
  const { members, setMembers, addMember, removeMember } = useModifyMembers([]);
  const [isError, setIsError] = useState(false);

  const createTeam = (payload) => {
    delete payload['organisation'];
    setIsError(false);
    pushToLocalJSONAPI('teams/', JSON.stringify(payload), token, 'POST')
      .then((result) => {
        managers
          .filter((user) => user.username !== userDetails.username)
          .map((user) => joinTeamRequest(result.teamId, user.username, 'MANAGER', token));
        members.map((user) => joinTeamRequest(result.teamId, user.username, 'MEMBER', token));
        toast.success(
          <FormattedMessage
            {...messages.entityCreationSuccess}
            values={{
              entity: 'team',
            }}
          />,
        );
        navigate(`/manage/teams/${result.teamId}`);
      })
      .catch(() => setIsError(true));
  };

  return (
    <Form
      onSubmit={(values) => createTeam(values)}
      initialValues={{ visibility: 'PUBLIC' }}
      render={({ handleSubmit, pristine, submitting, values }) => {
        return (
          <form onSubmit={handleSubmit} className="blue-grey">
            <div className="cf pb5">
              <h3 className="f2 mb3 ttu blue-dark fw7 barlow-condensed">
                <FormattedMessage {...messages.newTeam} />
              </h3>
              <div className="w-40-l w-100 fl">
                <div className="bg-white b--grey-light ba pa4 mb3">
                  <h3 className="f3 blue-dark mv0 fw6">
                    <FormattedMessage {...messages.teamInfo} />
                  </h3>
                  <TeamInformation />
                </div>
                {isError && <EntityError entity="team" />}
              </div>
              <div className="w-40-l w-100 fl pl5-l pl0 ">
                <div className="mb3">
                  <Members
                    addMembers={addManager}
                    removeMembers={removeManager}
                    members={managers}
                    resetMembersFn={setManagers}
                    creationMode={true}
                  />
                </div>
                <div className="mb3">
                  <Members
                    addMembers={addMember}
                    removeMembers={removeMember}
                    members={members}
                    resetMembersFn={setMembers}
                    creationMode={true}
                    type={'members'}
                  />
                </div>
              </div>
            </div>
            <div className="fixed left-0 right-0 bottom-0 cf bg-white h3">
              <div className="w-80-ns w-60-m w-50 h-100 fl tr">
                <Link to={'../'}>
                  <CustomButton className="bg-white mr5 pr2 h-100 bn bg-white blue-dark">
                    <FormattedMessage {...messages.cancel} />
                  </CustomButton>
                </Link>
              </div>
              <div className="w-20-l w-40-m w-50 h-100 fr">
                <FormSubmitButton
                  disabled={submitting || pristine || !values.organisation_id}
                  className="w-100 h-100 bg-red white"
                  disabledClassName="bg-red o-50 white w-100 h-100"
                >
                  <FormattedMessage {...messages.createTeam} />
                </FormSubmitButton>
              </div>
            </div>
          </form>
        );
      }}
    />
  );
}

export function EditTeam(props) {
  const { id } = useParams();
  const userDetails = useSelector((state) => state.auth.userDetails);
  const token = useSelector((state) => state.auth.token);
  const [forceUpdated, forceUpdate] = useForceUpdate();
  const [error, loading, team] = useFetch(`teams/${id}/`, forceUpdated);
  const [initManagers, setInitManagers] = useState(false);
  const [managers, setManagers] = useState([]);
  const [members, setMembers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [canUserEditTeam] = useEditTeamAllowed(team);
  const [memberJoinTeamError, setMemberJoinTeamError] = useState(null);
  const [managerJoinTeamError, setManagerJoinTeamError] = useState(null);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    if (!initManagers && team && team.members) {
      setManagers(filterActiveManagers(team.members));
      setMembers(filterActiveMembers(team.members));
      setRequests(filterInactiveMembersAndManagers(team.members));
      setInitManagers(true);
    }
  }, [team, managers, initManagers]);

  useEffect(() => {
    if (team && team.members) {
      setManagers(filterActiveManagers(team.members));
      setMembers(filterActiveMembers(team.members));
    }
  }, [team]);

  useSetTitleTag(`Edit ${team.name}`);

  const addManagers = (values) => {
    const newValues = values
      .filter((newUser) => !managers.map((i) => i.username).includes(newUser.username))
      .map((user) => formatMemberObject(user, true));
    setManagers((prevManagers) => prevManagers.concat(newValues));
  };

  const removeManagers = (username) => {
    setManagers((prevManagers) => prevManagers.filter((i) => i.username !== username));
  };

  const addMembers = (values) => {
    const newValues = values
      .filter((newUser) => !members.map((i) => i.username).includes(newUser.username))
      .map((user) => formatMemberObject(user));
    setMembers((prevMembers) => prevMembers.concat(newValues));
  };

  const removeMembers = (username) => {
    setMembers((prevMembers) => prevMembers.filter((i) => i.username !== username));
  };

  const updateAffiliation = (affiliationType) => {
    const role = affiliationType === 'managers' ? 'MANAGER' : 'MEMBER';
    const { usersAdded, usersRemoved } = getMembersDiff(
      team.members,
      affiliationType === 'managers' ? managers : members,
      affiliationType === 'managers',
    );

    Promise.all([
      ...usersAdded.map((user) =>
        joinTeamRequest(team.teamId, user, role, token).catch((err) => {
          affiliationType === 'managers'
            ? setManagerJoinTeamError(err.message)
            : setMemberJoinTeamError(err.message);
          affiliationType === 'managers' ? removeManagers(user) : removeMembers(user);
        }),
      ),
      ...usersRemoved.map((user) => leaveTeamRequest(team.teamId, user, role, token)),
    ])
      .then(() => {
        toast.success(
          <FormattedMessage
            {...messages.affiliationUpdationSuccess}
            values={{
              affiliation: affiliationType,
            }}
          />,
        );
        forceUpdate();
      })
      .catch(() =>
        toast.error(
          <FormattedMessage
            {...messages.affiliationUpdationFailure}
            values={{
              affiliation: affiliationType,
            }}
          />,
        ),
      );
  };

  const updateManagers = () => {
    updateAffiliation('managers');
  };

  const updateMembers = () => {
    updateAffiliation('members');
  };

  const onUpdateTeamFailure = () => setIsError(true);

  const updateTeam = (payload) => {
    if (payload.joinMethod !== 'BY_INVITE') {
      payload.visibility = 'PUBLIC';
    }
    updateEntity(`teams/${id}/`, 'team', payload, token, forceUpdate, onUpdateTeamFailure);
  };

  if (team && team.teamId && !canUserEditTeam) {
    return (
      <div className="cf w-100 pv5">
        <div className="tc">
          <h3 className="f3 fw8 mb4 barlow-condensed">
            <FormattedMessage {...messages.teamEditNotAllowed} />
          </h3>
        </div>
      </div>
    );
  }

  return (
    <div className="cf pb4 bg-tan">
      <div className="cf mt4">
        <h3 className="f2 ttu blue-dark fw7 barlow-condensed v-mid ma0 dib ttu">
          <FormattedMessage {...messages.manageTeam} />
        </h3>
        <DeleteModal id={team.teamId} name={team.name} type="teams" />
      </div>
      <div className="w-40-l w-100 mt4 fl">
        <TeamForm
          userDetails={userDetails}
          team={{
            name: team.name,
            description: team.description,
            joinMethod: team.joinMethod,
            visibility: team.visibility,
            organisation_id: team.organisation_id,
          }}
          updateTeam={updateTeam}
          disabledForm={error || loading}
        />
        {isError && <EntityError entity="team" action="updation" />}
      </div>
      <div className="w-40-l w-100 mt4 pl5-l pl0 fl">
        <Members
          addMembers={addManagers}
          removeMembers={removeManagers}
          saveMembersFn={updateManagers}
          resetMembersFn={setManagers}
          members={managers}
          managerJoinTeamError={managerJoinTeamError}
          setManagerJoinTeamError={setManagerJoinTeamError}
        />
        <div className="h1"></div>
        <Members
          addMembers={addMembers}
          removeMembers={removeMembers}
          saveMembersFn={updateMembers}
          resetMembersFn={setMembers}
          members={members}
          type="members"
          memberJoinTeamError={memberJoinTeamError}
          setMemberJoinTeamError={setMemberJoinTeamError}
        />
        <div className="h1"></div>
        <JoinRequests
          requests={requests}
          teamId={team.teamId}
          addMembers={addMembers}
          updateRequests={setRequests}
          managers={managers}
          updateTeam={updateTeam}
          joinMethod={team.joinMethod}
          members={team.members}
        />
        <div className="h1"></div>
        <MessageMembers teamId={team.teamId} members={team.members} />
      </div>
    </div>
  );
}

export function TeamDetail() {
  const { id } = useParams();
  useSetTitleTag(`Team #${id}`);
  const userDetails = useSelector((state) => state.auth.userDetails);
  const token = useSelector((state) => state.auth.token);
  const [error, loading, team] = useFetch(`teams/${id}/`);
  // eslint-disable-next-line
  const [projectsError, projectsLoading, projects] = useFetch(
    `projects/?teamId=${id}&omitMapResults=true&projectStatuses=PUBLISHED,DRAFT,ARCHIVED`,
    id,
  );
  const [isMember, setIsMember] = useState(false);
  const [managers, setManagers] = useState([]);
  const [members, setMembers] = useState([]);

  useEffect(() => {
    if (team && team.members) {
      setManagers(filterActiveManagers(team.members));
      setMembers(filterActiveMembers(team.members));
      const membersFiltered = team.members.filter(
        (member) => member.username === userDetails.username,
      );
      if (membersFiltered.length) {
        setIsMember(membersFiltered.filter((i) => i.active === true).length ? true : 'requested');
      }
    }
  }, [team, userDetails.username]);

  const joinTeam = () => {
    pushToLocalJSONAPI(
      `teams/${id}/actions/join/`,
      JSON.stringify({ role: 'MEMBER', username: userDetails.username }),
      token,
      'POST',
    ).then((res) => {
      setIsMember(team.inviteOnly ? 'requested' : true);
      setMembers((members) => [...members, userDetails]);
    });
  };

  const leaveTeam = () => {
    pushToLocalJSONAPI(
      `teams/${id}/actions/leave/`,
      JSON.stringify({ username: userDetails.username }),
      token,
      'POST',
    ).then((res) => {
      setIsMember(false);
      setMembers((members) => members.filter((member) => member.username !== userDetails.username));
    });
  };

  if (!loading && error) {
    return <NotFound />;
  } else {
    return (
      <>
        <div className="cf pa4-ns pa2 bg-tan blue-dark overflow-y-scroll-ns vh-minus-185-ns h-100">
          <div className="w-40-l w-100 mt2 fl">
            <TeamSideBar
              team={team}
              members={members}
              managers={managers}
              requestedToJoin={isMember === 'requested'}
            />
          </div>
          <div className="w-60-l w-100 mt2 pl5-l pl0 fl">
            <Projects
              projects={projects}
              viewAllEndpoint={`/explore/?team=${id}`}
              ownerEntity="team"
              showManageButtons={false}
            />
          </div>
        </div>
        <div className="fixed bottom-0 cf bg-white h3 w-100">
          <div
            className={`${
              team.joinMethod === 'BY_INVITE' && !isMember ? 'w-100-ns' : 'w-80-ns'
            } w-60-m w-50 h-100 fl tr`}
          >
            <Link to={'/contributions/teams'}>
              <CustomButton className="bg-white mr5 pr2 h-100 bn bg-white blue-dark">
                <FormattedMessage {...messages.myTeams} />
              </CustomButton>
            </Link>
          </div>
          <div className="w-20-l w-40-m w-50 h-100 fr">
            {isMember ? (
              <Popup
                trigger={
                  <CustomButton
                    className="w-100 h-100 bg-red white"
                    disabledClassName="bg-red o-50 white w-100 h-100"
                  >
                    <FormattedMessage
                      {...messages[isMember === 'requested' ? 'cancelRequest' : 'leaveTeam']}
                    />
                  </CustomButton>
                }
                modal
                closeOnEscape
              >
                {(close) => (
                  <LeaveTeamConfirmationAlert
                    teamName={team.name}
                    close={close}
                    leaveTeam={leaveTeam}
                  />
                )}
              </Popup>
            ) : (
              team.joinMethod !== 'BY_INVITE' && (
                <CustomButton
                  className="w-100 h-100 bg-red white"
                  disabledClassName="bg-red o-50 white w-100 h-100"
                  onClick={() => joinTeam()}
                >
                  <FormattedMessage {...messages.joinTeam} />
                </CustomButton>
              )
            )}
          </div>
        </div>
      </>
    );
  }
}
