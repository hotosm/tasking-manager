import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link, useNavigate } from '@reach/router';
import { FormattedMessage } from 'react-intl';
import { Form } from 'react-final-form';

import messages from './messages';
import { useFetch } from '../hooks/UseFetch';
import { useEditTeamAllowed } from '../hooks/UsePermissions';
import { useSetTitleTag } from '../hooks/UseMetaTags';
import useForceUpdate from '../hooks/UseForceUpdate';
import { fetchLocalJSONAPI, pushToLocalJSONAPI } from '../network/genericJSONRequest';
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
import { FormSubmitButton, CustomButton } from '../components/button';
import { DeleteModal } from '../components/deleteModal';
import { NotFound } from './notFound';

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
  const token = useSelector((state) => state.auth.token);
  const [teams, setTeams] = useState(null);
  const [userTeamsOnly, setUserTeamsOnly] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (token && userDetails && userDetails.id) {
      let queryParam;
      if (managementView) {
        queryParam = userTeamsOnly ? `?manager=${userDetails.id}` : '';
      } else {
        queryParam = `?member=${userDetails.id}`;
      }
      setLoading(true);
      fetchLocalJSONAPI(`teams/${queryParam}`, token)
        .then((res) => {
          setTeams(res.teams);
          setLoading(false);
        })
        .catch((err) => setError(err));
    }
  }, [userDetails, token, managementView, userTeamsOnly]);

  return (
    <TeamsManagement
      teams={teams}
      userDetails={userDetails}
      managementView={managementView}
      userTeamsOnly={userTeamsOnly}
      setUserTeamsOnly={setUserTeamsOnly}
      isTeamsFetched={!loading && !error}
    />
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
  const [managers, setManagers] = useState([]);
  const [members, setMembers] = useState([]);

  useEffect(() => {
    if (userDetails && userDetails.username && managers.length === 0) {
      setManagers([{ username: userDetails.username, pictureUrl: userDetails.pictureUrl }]);
    }
  }, [userDetails, managers]);

  const addManagers = (values) => {
    const newValues = values.filter(
      (newUser) => !managers.map((i) => i.username).includes(newUser.username),
    );
    setManagers(managers.concat(newValues));
  };

  const removeManagers = (username) => {
    setManagers(managers.filter((i) => i.username !== username));
  };

  const addMembers = (values) => {
    const newValues = values.filter(
      (newUser) => !members.map((i) => i.username).includes(newUser.username),
    );
    setMembers(members.concat(newValues));
  };

  const removeMembers = (username) => {
    setMembers(members.filter((i) => i.username !== username));
  };

  const createTeam = (payload) => {
    delete payload['organisation'];
    pushToLocalJSONAPI('teams/', JSON.stringify(payload), token, 'POST').then((result) => {
      managers
        .filter((user) => user.username !== userDetails.username)
        .map((user) => joinTeamRequest(result.teamId, user.username, 'MANAGER', token));
      members.map((user) => joinTeamRequest(result.teamId, user.username, 'MEMBER', token));
      navigate(`/manage/teams/${result.teamId}`);
    });
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
              </div>
              <div className="w-40-l w-100 fl pl5-l pl0 ">
                <div className="mb3">
                  <Members
                    addMembers={addManagers}
                    removeMembers={removeManagers}
                    members={managers}
                    resetMembersFn={setManagers}
                    creationMode={true}
                  />
                </div>
                <div className="mb3">
                  <Members
                    addMembers={addMembers}
                    removeMembers={removeMembers}
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
  const userDetails = useSelector((state) => state.auth.userDetails);
  const token = useSelector((state) => state.auth.token);
  const [forceUpdated, forceUpdate] = useForceUpdate();
  const [error, loading, team] = useFetch(`teams/${props.id}/`, forceUpdated);
  const [initManagers, setInitManagers] = useState(false);
  const [managers, setManagers] = useState([]);
  const [members, setMembers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [canUserEditTeam] = useEditTeamAllowed(team);
  const [memberJoinTeamError, setMemberJoinTeamError] = useState(null);
  const [managerJoinTeamError, setManagerJoinTeamError] = useState(null);

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

  const updateManagers = () => {
    const { usersAdded, usersRemoved } = getMembersDiff(team.members, managers, true);
    Promise.all([
      ...usersAdded.map((user) => joinTeamRequest(team.teamId, user, 'MANAGER', token)),
      ...usersRemoved.map((user) => leaveTeamRequest(team.teamId, user, 'MANAGER', token)),
    ]).then(forceUpdate);
  };

  const updateMembers = () => {
    const { usersAdded, usersRemoved } = getMembersDiff(team.members, members);
    Promise.all([
      ...usersAdded.map((user) =>
        joinTeamRequest(team.teamId, user, 'MEMBER', token).catch((err) => {
          setMemberJoinTeamError(err.message);
          removeMembers(user);
        }),
      ),
      ...usersRemoved.map((user) => leaveTeamRequest(team.teamId, user, 'MEMBER', token)),
    ]).then(forceUpdate);
  };

  const updateTeam = (payload) => {
    if (payload.joinMethod !== 'BY_INVITE') {
      payload.visibility = 'PUBLIC';
    }
    pushToLocalJSONAPI(`teams/${props.id}/`, JSON.stringify(payload), token, 'PATCH').then(
      forceUpdate,
    );
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

export function TeamDetail(props) {
  useSetTitleTag(`Team #${props.id}`);
  const userDetails = useSelector((state) => state.auth.userDetails);
  const token = useSelector((state) => state.auth.token);
  const [error, loading, team] = useFetch(`teams/${props.id}/`);
  // eslint-disable-next-line
  const [projectsError, projectsLoading, projects] = useFetch(
    `projects/?teamId=${props.id}&omitMapResults=true`,
    props.id,
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
      `teams/${props.id}/actions/join/`,
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
      `teams/${props.id}/actions/leave/`,
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
              viewAllEndpoint={`/explore/?team=${props.id}`}
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
              <CustomButton
                className="w-100 h-100 bg-red white"
                disabledClassName="bg-red o-50 white w-100 h-100"
                onClick={() => leaveTeam()}
              >
                <FormattedMessage
                  {...messages[isMember === 'requested' ? 'cancelRequest' : 'leaveTeam']}
                />
              </CustomButton>
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
