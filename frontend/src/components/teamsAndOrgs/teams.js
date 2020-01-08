import React, { useState, useEffect } from 'react';
import { Link } from '@reach/router';
import { FormattedMessage } from 'react-intl';
import ReactPlaceholder from 'react-placeholder';
import { Form, Field } from 'react-final-form';

import messages from './messages';
import { UserAvatar } from '../user/avatar';
import { AddButton, ViewAllLink, Management, VisibilityBox } from './management';
import { fetchLocalJSONAPI } from '../../network/genericJSONRequest';
import { SwitchToggle, RadioField, OrganisationSelect } from '../formInputs';
import { EditModeControl } from './editMode';
import { Button } from '../button';

export function TeamsManagement({ teams, userDetails, managementView }: Object) {
  const [isOrgManager, setIsOrgManager] = useState(false);
  useEffect(() => {
    if (userDetails.role !== 'ADMIN' && userDetails.id) {
      fetchLocalJSONAPI(`organisations/?manager_user_id=${userDetails.id}`).then(r => {
        if (r.organisations.lenght > 0) {
          setIsOrgManager(true);
        }
      });
    }
  }, [userDetails.role, userDetails.id]);
  return (
    <Management
      title={<FormattedMessage {...messages.myTeams} />}
      showAddButton={(userDetails.role === 'ADMIN' || isOrgManager) && managementView}
      managementView={managementView}
    >
      {teams.length ? (
        teams.map((team, n) => <TeamCard team={team} key={n} managementView={managementView} />)
      ) : (
        <div>
          <FormattedMessage {...messages.noTeams} />
        </div>
      )}
    </Management>
  );
}

export function Teams({ teams, viewAllQuery }: Object) {
  return (
    <div className="bg-white b--grey-light ba pa4">
      <div className="cf db">
        <h3 className="f3 blue-dark mv0 fw6 dib v-mid">
          <FormattedMessage {...messages.teams} />
        </h3>
        <Link to={'/manage/teams/new/'} className="dib ml4">
          <AddButton />
        </Link>
        <ViewAllLink link={`/manage/teams/${viewAllQuery ? viewAllQuery : ''}`} />
        <div className="cf pt4">
          <ReactPlaceholder
            showLoadingAnimation={true}
            type="rect"
            color="#f0efef"
            style={{ width: 250, height: 300 }}
            delay={10}
            ready={teams}
          >
            {teams && teams.slice(0, 6).map((team, n) => <TeamCard team={team} key={n} />)}
            {teams && teams.length === 0 &&
              <span className="blue-grey">
                <FormattedMessage {...messages.noTeamsFound} />
              </span>
            }
          </ReactPlaceholder>
        </div>
      </div>
    </div>
  );
}

export function TeamCard({ team, managementView }: Object) {
  return (
    <Link to={managementView ? `/manage/teams/${team.teamId}/` : `/teams/${team.teamId}/membership/`}>
      <article className="fl w-30-l base-font w-50-m w-100 mb3 pr3 blue-dark mw5">
        <div className="bg-white ph3 pb3 ba br1 b--grey-light shadow-hover">
          <h3 className="fw7">{team.name}</h3>
          <div className="db h2" title={team.organisation}>
            <img src={team.logo} alt={team.organisation} className="h2"/>
          </div>
          <h4 className="f6 fw5 mb3 ttu blue-light">
            <FormattedMessage {...messages.managers} />
          </h4>
          <div className="db h2">
            {team.members
              .filter(user => user.function === 'MANAGER')
              .filter(user => user.function === 'MANAGER')
              .map((user, n) => (
                <UserAvatar
                  key={n}
                  username={user.username}
                  picture={user.pictureUrl}
                  colorClasses="white bg-blue-grey"
                />
              ))}
          </div>
          <h4 className="f6 fw5 mb3 ttu blue-light">
            <FormattedMessage {...messages.teamMembers} />
          </h4>
          <div className="db h2">
            {team.members
              .filter(user => user.function !== 'MANAGER')
              .map((user, n) => (
                <UserAvatar
                  key={n}
                  username={user.username}
                  picture={user.pictureUrl}
                  colorClasses="white bg-blue-grey"
                />
              ))}
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
        <OrganisationSelect name="organisation" />
      </div>
      <div className="cf pt1">
        <label className={labelClasses}>
          <FormattedMessage {...messages.inviteOnly} />
        </label>
        <Field name="inviteOnly" className={fieldClasses}>
          {props => (
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
        <div className="pv2">
          <RadioField name="visibility" value="SECRET" />
          <span className="fw8 f5">
            <FormattedMessage {...messages.secret} />
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
      onSubmit={values => props.updateTeam(values)}
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

export function TeamSideBar({team, members, managers}: Object) {
  return (
    <ReactPlaceholder
      showLoadingAnimation={true}
      type="media"
      rows={20}
      ready={typeof(team.teamId) === 'number'}
    >
      <div className="cf">
        <div className="w-70 dib fl">
          <span className="blue-grey">
            #{team.teamId}
          </span>
        </div>
        <div className="mw4 dib fr">
          <VisibilityBox visibility={team.visibility} extraClasses={'pv2 ph3'} />
        </div>
      </div>
      <h3 className="f2 ttu blue-dark fw7 barlow-condensed v-mid ma0 dib ttu">
        {team.name}
      </h3>
      <p className="blue-grey">{team.description}</p>
      <h4><FormattedMessage {...messages.organisation} /></h4>
      <p><img src={team.logo} alt="organisation logo"/></p>
      <h4><FormattedMessage {...messages.managers} /></h4>
      <div className="cf db mt3">
        {managers.map((user, n) => (
          <UserAvatar
            key={n}
            username={user.username}
            picture={user.pictureUrl}
            colorClasses="white bg-blue-grey"
          />
        ))}
      </div>
      <h4><FormattedMessage {...messages.members} /></h4>
      <div className="cf db mt3">
        {members.map((user, n) => (
          <UserAvatar
            key={n}
            username={user.username}
            picture={user.pictureUrl}
            colorClasses="white bg-blue-grey"
          />
        ))}
      </div>
    </ReactPlaceholder>
  );
}
