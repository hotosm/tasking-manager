import React, { useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { FormattedMessage, useIntl } from 'react-intl';
import { useSelector } from 'react-redux';
import Popup from 'reactjs-popup';
import ReactPlaceholder from 'react-placeholder/lib';
import { RectShape } from 'react-placeholder/lib/placeholders';

import messages from './messages';
import { Button, CustomButton } from '../button';
import { ExternalLinkIcon, UserGroupIcon } from '../svgIcons';
import { useDebouncedCallback } from '../../hooks/UseThrottle';
import { createOSMTeamsLoginWindow } from '../../utils/login';
import {
  useOSMTeamInfo,
  useOSMTeamModerators,
  useOSMTeams,
  useOSMTeamUsers,
} from '../../hooks/UseOSMTeams';
import { UserAvatar } from '../user/avatar';
import { OSM_TEAMS_API_URL } from '../../config';
import { fetchExternalJSONAPI } from '../../network/genericJSONRequest';
import { filterOSMTeamsMembers, getMembersDiff } from '../../utils/teamMembersDiff';
import { joinTeamRequest, leaveTeamRequest } from '../../views/teams';
import { Alert } from '../alert';

const OSMTeamsLink = () => (
  <a className="red link" target="_blank" rel="noopener noreferrer" href={OSM_TEAMS_API_URL}>
    OSM Teams
  </a>
);

const reSyncUsers = ({
  tmTeamId,
  members,
  managers,
  osmTeamsId,
  osmteams_token,
  token,
  forceUpdate,
  setErrors,
}) => {
  setErrors(false);
  Promise.all([
    fetchExternalJSONAPI(
      new URL(`/api/teams/${osmTeamsId}/members`, OSM_TEAMS_API_URL),
      `Bearer ${osmteams_token}`,
      'GET',
    ),
    fetchExternalJSONAPI(
      new URL(`/api/teams/${osmTeamsId}/moderators`, OSM_TEAMS_API_URL),
      `Bearer ${osmteams_token}`,
      'GET',
    ),
  ]).then(([osmTeamsUsers, osmTeamsModerators]) => {
    const { members: osmTeamsMembers, managers: osmTeamsManagers } = filterOSMTeamsMembers(
      osmTeamsUsers.members.data,
      osmTeamsModerators,
    );
    const { usersAdded, usersRemoved } = getMembersDiff(
      members,
      osmTeamsMembers.map((user) => ({ username: user.name, function: 'MEMBER', active: true })),
      false,
    );
    const { usersAdded: managersAdded, usersRemoved: managersRemoved } = getMembersDiff(
      managers,
      osmTeamsManagers.map((user) => ({ username: user.name, function: 'MANAGER', active: true })),
      true,
    );
    const errors = [];
    Promise.all([
      ...managersRemoved.map((user) => leaveTeamRequest(tmTeamId, user, 'MANAGER', token)),
      ...usersRemoved.map((user) => leaveTeamRequest(tmTeamId, user, 'MEMBER', token)),
      ...managersAdded.map((user) =>
        joinTeamRequest(tmTeamId, user, 'MANAGER', token).catch((e) =>
          errors.push({ username: user, function: 'MANAGER' }),
        ),
      ),
      ...usersAdded.map((user) =>
        joinTeamRequest(tmTeamId, user, 'MEMBER', token).catch((e) =>
          errors.push({ username: user, function: 'MEMBER' }),
        ),
      ),
    ]);
    setErrors(errors);
    forceUpdate();
  });
};

export const TeamSync = ({
  osmTeamsId,
  setOsmTeamsId,
  setManagers,
  setMembers,
  managers,
  members,
  tmTeamId,
  updateMode,
  forceUpdate,
  updateTeam,
}) => {
  const intl = useIntl();
  let [searchParams, setSearchParams] = useSearchParams();
  const osmteams_token = useSelector((state) => state.auth.osmteams_token);
  const token = useSelector((state) => state.auth.token);
  const [errors, setErrors] = useState(searchParams?.get('syncUsersErrors'));
  const [showSelectionModal, setShowSelectionModal] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const reSyncParams = {
    tmTeamId,
    members,
    managers,
    osmTeamsId,
    osmteams_token,
    token,
    setManagers,
    setMembers,
    forceUpdate,
    setErrors,
  };

  return (
    <div className="mb2 bg-white b--grey-light pa4">
      <div className="pb2">
        <h3 className="f3 blue-dark mv2 fw6 db">
          <FormattedMessage {...messages.syncWithOSMTeams} />
        </h3>
        <div className="db blue-grey">
          <FormattedMessage
            {...messages[osmTeamsId ? 'osmTeamsReSyncHelp' : 'osmTeamsIntegrationDescription']}
            values={{
              osmTeams: <OSMTeamsLink />,
            }}
          />
        </div>
      </div>
      {osmteams_token ? (
        osmTeamsId ? (
          <>
            {osmTeamsId && <TeamBasicInfo teamId={osmTeamsId} />}
            {updateMode && (
              <>
                <Button
                  className="ba b--red white bg-red mh1"
                  loading={isSyncing}
                  onClick={() => {
                    setIsSyncing(true);
                    reSyncUsers(reSyncParams);
                    setIsSyncing(false);
                  }}
                >
                  <FormattedMessage {...messages.updateUsers} />
                </Button>
                {errors && (
                  <div
                    className="pt2 pointer"
                    role="button"
                    onClick={() => setErrors(false)}
                    title={intl.formatMessage(messages.dismiss)}
                  >
                    <Alert type="error">
                      <FormattedMessage
                        {...messages[
                          typeof errors === 'object' ? 'syncUsersError' : 'syncUsersGenericError'
                        ]}
                        values={{
                          users:
                            typeof errors === 'object'
                              ? errors.map((u) => u.username).join(', ')
                              : [],
                          number: errors.length,
                        }}
                      />
                      <p className="mb0 mt1">
                        <FormattedMessage {...messages.syncUsersErrorExtra} />
                      </p>
                    </Alert>
                  </div>
                )}
              </>
            )}
          </>
        ) : !showSelectionModal ? (
          <CustomButton
            className="pv2 ph3 ba b--red white bg-red mv1"
            onClick={(e) => setShowSelectionModal(true)}
          >
            <FormattedMessage {...messages.selectTeam} />
          </CustomButton>
        ) : (
          <SelectOSMTeamsModal
            osmTeamsId={osmTeamsId}
            setOsmTeamsId={setOsmTeamsId}
            setManagers={setManagers}
            setMembers={setMembers}
            tmTeamId={tmTeamId}
            updateTeam={updateTeam}
            forceUpdate={forceUpdate}
            closeSelectionModal={() => setShowSelectionModal(false)}
          />
        )
      ) : (
        <OSMTeamsAuthButton />
      )}
      {searchParams.get('access_token') && (
        <SuccessfulAuthenticationModal
          onCloseFn={() => {
            const newSearchParams = { ...searchParams };
            delete newSearchParams.access_token;
            setSearchParams(newSearchParams);
          }}
        />
      )}
    </div>
  );
};

const TeamBasicInfo = ({ teamId }) => {
  const intl = useIntl();
  const [error, isLoading, team] = useOSMTeamInfo(teamId);

  if (teamId && error) {
    return (
      <div>
        <FormattedMessage {...messages.osmTeamInfoError} />
      </div>
    );
  }

  return (
    <ReactPlaceholder
      type="text"
      className="pt3"
      rows={2}
      showLoadingAnimation={true}
      delay={10}
      ready={!isLoading}
    >
      <div className="bg-white blue-dark ph2 dib w-100 ba br2 b--grey-light mb3">
        <p className="blue-grey f6 mv2 pt1">OSM Teams #{team.id}</p>
        <h4 className="mt2 mb3">
          {team.name}
          <a
            target="_blank"
            rel="noopener noreferrer"
            href={`${OSM_TEAMS_API_URL}/teams/${teamId}`}
            className="bg-white blue-light bn mv2"
            title={intl.formatMessage(messages.openOnOsmTeams)}
          >
            <ExternalLinkIcon className={'pl1'} />
          </a>
        </h4>
      </div>
    </ReactPlaceholder>
  );
};

const TeamInfo = ({ members, managers, teamId, isLoadingMembers }) => {
  const intl = useIntl();
  const [error, isLoading, team] = useOSMTeamInfo(teamId);
  if (error)
    return (
      <div>
        <FormattedMessage {...messages.osmTeamInfoError} />
      </div>
    );

  return (
    <div>
      <h3>
        <FormattedMessage {...messages.selectedTeam} />
      </h3>
      <ReactPlaceholder
        type="text"
        className="pt3"
        rows={6}
        showLoadingAnimation={true}
        delay={10}
        ready={!isLoading && !isLoadingMembers}
      >
        <div className="pl2">
          <h4 className="mb1 mt0">
            {team.name}
            <a
              target="_blank"
              rel="noopener noreferrer"
              href={`${OSM_TEAMS_API_URL}/teams/${teamId}`}
              className="bg-white blue-light bn mv2"
              title={intl.formatMessage(messages.openOnOsmTeams)}
            >
              <ExternalLinkIcon className={'pl1'} />
            </a>
          </h4>
          <p>
            <i>{team.bio}</i>
          </p>
          <h5 className="mb1">
            <FormattedMessage {...messages.managers} />
          </h5>
          <div>
            {managers.map((user) => (
              <UserAvatar
                key={user.id}
                username={user.name}
                picture={user.image}
                size="small"
                colorClasses="white bg-blue-grey mv1"
              />
            ))}
          </div>
          <h5 className="mb1">
            <FormattedMessage {...messages.members} />
          </h5>
          <div>
            {members.map((user) => (
              <UserAvatar
                key={user.id}
                username={user.name}
                picture={user.image}
                size="small"
                colorClasses="white bg-blue-grey mv1"
              />
            ))}
          </div>
        </div>
      </ReactPlaceholder>
    </div>
  );
};

export const SelectOSMTeamsModal = ({
  osmTeamsId,
  setOsmTeamsId,
  setManagers,
  setMembers,
  tmTeamId,
  updateTeam,
  forceUpdate,
  closeSelectionModal,
}) => {
  const token = useSelector((state) => state.auth.token);
  const [error, isLoading, myTeams] = useOSMTeams();
  const [selectedTeamId, setSelectedTeamId] = useState();
  const [syncStatus, setSyncStatus] = useState();
  const [teamMembersError, teamMembersIsLoading, teamMembers] = useOSMTeamUsers(
    osmTeamsId || selectedTeamId,
  );
  const [teamModeratorsError, teamModeratorsIsLoading, teamModerators] = useOSMTeamModerators(
    osmTeamsId || selectedTeamId,
  );
  const { members, managers } = filterOSMTeamsMembers(
    teamMembers?.members?.data || [],
    teamModerators?.length ? teamModerators : [],
  );

  const syncToExistingTeam = () => {
    setSyncStatus('started');
    updateTeam(selectedTeamId);
    setSyncStatus('waiting');
    const errors = [];
    managers.map((user) =>
      joinTeamRequest(tmTeamId, user.name, 'MANAGER', token).catch((e) =>
        errors.push({ username: user.name, function: 'MANAGER' }),
      ),
    );
    members.map((user) =>
      joinTeamRequest(tmTeamId, user.name, 'MEMBER', token).catch((e) =>
        errors.push({ username: user.name, function: 'MEMBER' }),
      ),
    );
    forceUpdate();
    setOsmTeamsId(selectedTeamId);
  };

  const syncToNewTeam = () => {
    setSyncStatus('started');
    setOsmTeamsId(selectedTeamId);
    setManagers(managers.map((user) => ({ username: user.name })));
    setMembers(members.map((user) => ({ username: user.name })));
    setSyncStatus('finished');
  };

  return (
    <Popup modal closeOnDocumentClick closeOnEscape open onClose={() => closeSelectionModal()}>
      {(close) => (
        <>
          <div className="db cf blue-dark ph2">
            {osmTeamsId || selectedTeamId ? (
              <div>
                <TeamInfo
                  members={members || []}
                  managers={managers || []}
                  teamId={osmTeamsId || selectedTeamId}
                  isLoadingMembers={teamMembersIsLoading || teamModeratorsIsLoading}
                />
                {(teamMembersError || teamModeratorsError) && (
                  <FormattedMessage {...messages.osmTeamInfoError} />
                )}
              </div>
            ) : (
              <>
                <h3>
                  <FormattedMessage {...messages.selectTeam} />
                </h3>
                <div className="w-100 flex flex-wrap">
                  {error ? (
                    <FormattedMessage {...messages.osmTeamsError} />
                  ) : (
                    <ReactPlaceholder
                      ready={!isLoading}
                      customPlaceholder={
                        <>
                          <RectShape
                            color="#DDD"
                            className="show-loading-animation"
                            style={{ width: 250, height: 60 }}
                          />
                          <RectShape
                            color="#DDD"
                            className="show-loading-animation"
                            style={{ width: 250, height: 60 }}
                          />
                        </>
                      }
                    >
                      {myTeams?.data?.map((team) => (
                        <OSMTeamCard key={team.id} team={team} selectTeam={setSelectedTeamId} />
                      ))}
                    </ReactPlaceholder>
                  )}
                </div>
              </>
            )}
          </div>
          <div className="db cf fr blue-dark pa2 w-100">
            {(selectedTeamId || osmTeamsId) && (
              <Button
                className="bn blue-dark bg-grey-light mh1 fl"
                onClick={() => {
                  setSelectedTeamId(null);
                  setOsmTeamsId(null);
                }}
                disabled={syncStatus === 'started'}
              >
                <FormattedMessage {...messages.back} />
              </Button>
            )}
            <div className="fr di">
              <Button className="mh1 bg-white blue-dark" onClick={() => close()}>
                <FormattedMessage {...messages.cancel} />
              </Button>
              {(osmTeamsId || selectedTeamId) && (
                <Button
                  className="ba b--red white bg-red mh1"
                  disabled={syncStatus}
                  onClick={() => {
                    if (tmTeamId) {
                      syncToExistingTeam();
                    } else {
                      syncToNewTeam();
                      close();
                    }
                  }}
                >
                  <FormattedMessage {...messages.confirmSelection} />
                </Button>
              )}
            </div>
          </div>
        </>
      )}
    </Popup>
  );
};

const OSMTeamCard = ({ team, selectTeam }) => (
  <div role="button" onClick={() => selectTeam(team.id)} className="w-50-ns w-100 dib">
    <div className="bg-white blue-dark br1 mv2 mh1 pv2 ph3 ba br1 b--grey-light shadow-hover">
      <div className="di pr2">
        <div className="z-1 dib br-100 tc h2 w2 bg-blue-light white">
          <span className="relative w-50 dib">
            <UserGroupIcon style={{ paddingTop: '0.575rem' }} className="white" />
          </span>
        </div>
      </div>
      <h2 className="f4 mv0 di text-overflow">{team.name}</h2>
    </div>
  </div>
);

const OSMTeamsAuthButton = () => {
  const location = useLocation();
  const [debouncedCreateLoginWindow] = useDebouncedCallback(
    (redirectTo) => createOSMTeamsLoginWindow(redirectTo),
    3000,
    { leading: true },
  );

  return (
    <>
      <p className="mt0 mb2 db blue-grey i f6">
        <FormattedMessage {...messages.connectOSMTeams} />
      </p>
      <Button
        onClick={() => debouncedCreateLoginWindow(location.pathname)}
        className="pv2 ph3 ba b--blue-dark white bg-blue-dark mv1"
      >
        <FormattedMessage {...messages.authenticate} />
      </Button>
    </>
  );
};

const SuccessfulAuthenticationModal = ({ onCloseFn }) => {
  return (
    <Popup modal closeOnDocumentClick closeOnEscape open onClose={() => onCloseFn()}>
      {(close) => (
        <div className="db cf blue-dark ph2 pb2">
          <h3>
            <FormattedMessage {...messages.authenticationModalTitle} />
          </h3>
          <p>
            <FormattedMessage {...messages.authenticationModalDescription} />
          </p>
          <Button className="mh1 fr bg-red white" onClick={() => close()}>
            <FormattedMessage {...messages.close} />
          </Button>
        </div>
      )}
    </Popup>
  );
};
