import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from '@reach/router';
import { FormattedMessage } from 'react-intl';
import ReactPlaceholder from 'react-placeholder';
import { Form, Field } from 'react-final-form';

import messages from './messages';
import { useEditTeamAllowed } from '../../hooks/UsePermissions';
import { UserAvatar, UserAvatarList } from '../user/avatar';
import { AddButton, ViewAllLink, Management, VisibilityBox, InviteOnlyBox } from './management';
import { SwitchToggle, RadioField, OrganisationSelect } from '../formInputs';
import { EditModeControl } from './editMode';
import { Button, EditButton } from '../button';

export function TeamsManagement({
  teams,
  userDetails,
  managementView,
  userTeamsOnly,
  setUserTeamsOnly,
}: Object) {
  const isOrgManager = useSelector(
    (state) => state.auth.get('organisations') && state.auth.get('organisations').length > 0,
  );

  return (
    <Management
      title={
        managementView ? (
          <FormattedMessage
            {...messages.manage}
            values={{ entity: <FormattedMessage {...messages.teams} /> }}
          />
        ) : (
          <FormattedMessage {...messages.myTeams} />
        )
      }
      isAdmin={userDetails.role === 'ADMIN' && managementView}
      showAddButton={(userDetails.role === 'ADMIN' || isOrgManager) && managementView}
      managementView={managementView}
      userOnly={userTeamsOnly}
      setUserOnly={setUserTeamsOnly}
      userOnlyLabel={<FormattedMessage {...messages.myTeams} />}
    >
      {teams.length ? (
        teams.map((team, n) => <TeamCard team={team} key={n} managementView={managementView} />)
      ) : (
        <div className="pb3 pt2">
          <FormattedMessage {...messages.noTeams} />
        </div>
      )}
    </Management>
  );
}

export function Teams({ teams, viewAllQuery, showAddButton = false, isReady }: Object) {
  return (
    <div className="bg-white b--grey-light ba pa4">
      <div className="cf db">
        <h3 className="f3 blue-dark mv0 fw6 dib v-mid">
          <FormattedMessage {...messages.teams} />
        </h3>
        {showAddButton && (
          <Link to={'/manage/teams/new/'} className="dib ml4">
            <AddButton />
          </Link>
        )}
        <ViewAllLink link={`/manage/teams/${viewAllQuery ? viewAllQuery : ''}`} />
        <div className="cf pt4">
          <ReactPlaceholder
            showLoadingAnimation={true}
            type="rect"
            color="#f0efef"
            style={{ width: 250, height: 300 }}
            delay={10}
            ready={isReady}
          >
            {teams && teams.slice(0, 6).map((team, n) => <TeamCard team={team} key={n} />)}
            {teams && teams.length === 0 && (
              <span className="blue-grey">
                <FormattedMessage {...messages.noTeamsFound} />
              </span>
            )}
          </ReactPlaceholder>
        </div>
      </div>
    </div>
  );
}

export function TeamCard({ team, managementView }: Object) {
  return (
    <Link
      to={managementView ? `/manage/teams/${team.teamId}/` : `/teams/${team.teamId}/membership/`}
    >
      <article className="fl w-30-l base-font w-50-m w-100 mb3 pr3 blue-dark mw5">
        <div className="bg-white ph3 pb3 ba br1 b--grey-light shadow-hover">
          <h3 className="f4 fw6 h3 lh-title mt3 mb2 overflow-y-hidden" title={team.name}>
            {team.name}
          </h3>
          <div className="db h2" title={team.organisation}>
            <img src={team.logo} alt={team.organisation} className="h2" />
          </div>
          <h4 className="f6 fw5 mb2 mt3 ttu blue-light">
            <FormattedMessage {...messages.managers} />
          </h4>
          <div className="db h2">
            <UserAvatarList
              size="small"
              textColor="white"
              users={team.members.filter((user) => user.function === 'MANAGER' && user.active)}
              maxLength={8}
            />
          </div>
          <h4 className="f6 fw5 mv2 ttu blue-light">
            <FormattedMessage {...messages.teamMembers} />
          </h4>
          <div className="db h2">
            <UserAvatarList
              size="small"
              textColor="white"
              users={team.members.filter((user) => user.function !== 'MANAGER' && user.active)}
              maxLength={8}
            />
          </div>
          <div className="cf pt3">
            <div className="db">
              <VisibilityBox visibility={team.visibility} extraClasses="pv1 ph2 dib" />
            </div>
            <div className="db pt2 h2">
              {team.inviteOnly && <InviteOnlyBox className="pv1 ph2 dib" />}
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}

export function TeamInformation(props) {
  const labelClasses = 'db pt3 pb2';
  const fieldClasses = 'blue-grey w-100 pv3 ph2 input-reset ba b--grey-light bg-transparent';

  return (
    <>
      <div className="cf">
        <label className={labelClasses}>
          <FormattedMessage {...messages.name} />
        </label>
        <Field name="name" component="input" type="text" className={fieldClasses} required />
      </div>
      <div className="cf">
        <label className={labelClasses}>
          <FormattedMessage {...messages.description} />
        </label>
        <Field name="description" component="textarea" type="text" className={fieldClasses} />
      </div>
      <div className="cf">
        <label className={labelClasses}>
          <FormattedMessage {...messages.organisation} />
        </label>
        <OrganisationSelect name="organisation_id" />
      </div>
      <div className="cf pt1">
        <label className={labelClasses}>
          <FormattedMessage {...messages.inviteOnly} />
        </label>
        <Field name="inviteOnly" className={fieldClasses}>
          {(props) => (
            <div className="fl">
              <SwitchToggle
                isChecked={props.input.value}
                onChange={props.input.onChange}
                label={<FormattedMessage {...messages.inviteOnlyDescription} />}
                labelPosition="right"
              />
            </div>
          )}
        </Field>
      </div>
      <div className="cf pt1">
        <label className={labelClasses}>
          <FormattedMessage {...messages.visibility} />
        </label>
        <div className="pv2">
          <RadioField name="visibility" value="PUBLIC" />
          <span className="fw8 f5">
            <FormattedMessage {...messages.public} />
          </span>
        </div>
        <div className="pv2">
          <RadioField name="visibility" value="PRIVATE" />
          <span className="fw8 f5">
            <FormattedMessage {...messages.private} />
          </span>
        </div>
      </div>
    </>
  );
}

export function TeamForm(props) {
  const [editMode, setEditMode] = useState(false);

  return (
    <Form
      onSubmit={(values) => props.updateTeam(values)}
      initialValues={props.team}
      render={({ handleSubmit, pristine, form, submitting, values }) => {
        return (
          <div className="blue-grey mb3">
            <div className={`bg-white b--grey-light pa4 ${editMode ? 'bt bl br' : 'ba'}`}>
              <h3 className="f3 fw6 dib blue-dark mv0">
                <FormattedMessage {...messages.teamInfo} />
              </h3>
              <EditModeControl editMode={editMode} switchModeFn={setEditMode} />
              <form id="team-form" onSubmit={handleSubmit}>
                <fieldset
                  className="bn pa0"
                  disabled={submitting || props.disabledForm || !editMode}
                >
                  <TeamInformation />
                </fieldset>
              </form>
            </div>
            {editMode && (
              <div className="cf pt0 h3">
                <div className="w-70-l w-50 fl tr dib bg-grey-light">
                  <Button className="blue-dark bg-grey-light h3" onClick={() => setEditMode(false)}>
                    <FormattedMessage {...messages.cancel} />
                  </Button>
                </div>
                <div className="w-30-l w-50 h-100 fr dib">
                  <Button
                    onClick={() => {
                      document
                        .getElementById('team-form')
                        .dispatchEvent(new Event('submit', { cancelable: true }));
                      setEditMode(false);
                    }}
                    className="w-100 h-100 bg-red white"
                    disabledClassName="bg-red o-50 white w-100 h-100"
                  >
                    <FormattedMessage {...messages.save} />
                  </Button>
                </div>
              </div>
            )}
          </div>
        );
      }}
    ></Form>
  );
}

export function TeamSideBar({ team, members, managers, requestedToJoin }: Object) {
  const [isUserTeamManager] = useEditTeamAllowed(team);

  return (
    <ReactPlaceholder
      showLoadingAnimation={true}
      type="media"
      rows={20}
      ready={
        typeof team.teamId === 'number' &&
        typeof organisations !== undefined &&
        typeof pmTeams !== undefined
      }
    >
      <div className="cf pb2">
        <div className="w-20 pv2 dib fl">
          <span className="blue-grey v-mid">
            <FormattedMessage {...messages.team} /> #{team.teamId}
          </span>
        </div>
        <div className="w-80 dib fr tr">
          {isUserTeamManager && (
            <EditButton url={`/manage/teams/${team.teamId}`}>
              <FormattedMessage {...messages.editTeam} />
            </EditButton>
          )}
          {team.inviteOnly && <InviteOnlyBox className="pv2 ph3 dib mh1 mv1" />}
          <VisibilityBox visibility={team.visibility} extraClasses="pv2 ph3 mh1 mv1 dib" />
        </div>
      </div>
      <h3 className="f2 ttu blue-dark fw7 barlow-condensed v-mid ma0 dib ttu">{team.name}</h3>
      <p className="blue-grey">{team.description}</p>
      <div className="cf">
        <div className="w-100 w-50-m fl">
          <h4>
            <FormattedMessage {...messages.organisation} />
          </h4>
          <p>
            {typeof team.logo === 'string' && (
              <img src={team.logo} alt="organisation logo" className="mw4" />
            )}
          </p>
          <p>{team.organisation}</p>
        </div>
        <div className="w-100 w-50-m fl">
          <h4>
            <FormattedMessage {...messages.managers} />
          </h4>
          <div className="cf db mt3">
            {managers.map((user, n) => (
              <UserAvatar
                key={n}
                username={user.username}
                picture={user.pictureUrl}
                size="large"
                colorClasses="white bg-blue-grey mv1"
              />
            ))}
          </div>
          <h4>
            <FormattedMessage {...messages.members} />
          </h4>
          <div className="cf db mt3">
            {members.map((user, n) => (
              <UserAvatar
                key={n}
                username={user.username}
                picture={user.pictureUrl}
                colorClasses="white bg-blue-grey mv1"
              />
            ))}
          </div>
          <div className="cf db mt3">
            {requestedToJoin && (
              <span className="red pr5-ns">
                <FormattedMessage {...messages.waitingApproval} />
              </span>
            )}
          </div>
        </div>
      </div>
    </ReactPlaceholder>
  );
}

export function TeamsBoxList({ teams }: Object) {
  const mappingTeams = teams.filter((team) => team.role === 'MAPPER');
  const validationTeams = teams.filter((team) => team.role === 'VALIDATOR');
  return (
    <>
      {mappingTeams.length > 0 && (
        <>
          <h4 className="mb2 fw6">
            <FormattedMessage {...messages.mappingTeams} />
          </h4>
          <div>
            {mappingTeams.map((team) => (
              <TeamBox key={team.teamId} team={team} className="dib pv2 ph3 mt2 ba f6 tc" />
            ))}
          </div>
        </>
      )}
      {validationTeams.length > 0 && (
        <>
          <h4 className="mb2 fw6">
            <FormattedMessage {...messages.validationTeams} />
          </h4>
          <div>
            {validationTeams.map((team) => (
              <TeamBox key={team.teamId} team={team} className="dib pv2 ph3 mt2 ba f6 tc" />
            ))}
          </div>
        </>
      )}
    </>
  );
}

export const TeamBox = ({ team, className }: Object) => (
  <Link className="link blue-grey mr2" to={`/teams/${team.teamId}/membership/`}>
    <div className={`br1 ${className}`}>
      {team.logo && (
        <img alt={team.organisation} src={team.logo} className="object-fit-contain h2 pr2 v-mid" />
      )}
      {team.name}
    </div>
  </Link>
);
