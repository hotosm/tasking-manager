import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link, useNavigate, useParams } from 'react-router-dom';
import ReactPlaceholder from 'react-placeholder';
import { FormattedMessage } from 'react-intl';
import { Form } from 'react-final-form';
import toast from 'react-hot-toast';
import { useQueryParams, BooleanParam } from 'use-query-params';

import messages from './messages';
import { useFetch } from '../hooks/UseFetch';
import { useModifyMembers } from '../hooks/UseModifyMembers';
import { useEditOrgAllowed } from '../hooks/UsePermissions';
import { pushToLocalJSONAPI, fetchLocalJSONAPI } from '../network/genericJSONRequest';
import { Members } from '../components/teamsAndOrgs/members';
import { Teams } from '../components/teamsAndOrgs/teams';
import { Projects } from '../components/teamsAndOrgs/projects';
import {
  OrganisationForm,
  CreateOrgInfo,
  OrgsManagement,
} from '../components/teamsAndOrgs/organisations';
import { FormSubmitButton, CustomButton } from '../components/button';
import { ChartLineIcon } from '../components/svgIcons';
import { DeleteModal } from '../components/deleteModal';
import { useSetTitleTag } from '../hooks/UseMetaTags';
import { Alert } from '../components/alert';
import { updateEntity } from '../utils/management';

export function ListOrganisations() {
  useSetTitleTag('Manage organizations');
  const token = useSelector((state) => state.auth.token);
  const userDetails = useSelector((state) => state.auth.userDetails);
  const isOrgManager = useSelector(
    (state) => state.auth.organisations && state.auth.organisations.length > 0,
  );
  const [organisations, setOrganisations] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useQueryParams({
    showAll: BooleanParam,
  });
  const [userOrgsOnly, setUserOrgsOnly] = useState(Boolean(!query.showAll));

  useEffect(() => {
    setQuery({ ...query, showAll: userOrgsOnly === false ? true : undefined });
    //eslint-disable-next-line
  }, [userOrgsOnly]);

  useEffect(() => {
    if (token && userDetails?.id) {
      setLoading(true);
      const queryParam = `${userOrgsOnly ? `?manager_user_id=${userDetails.id}` : ''}`;
      fetchLocalJSONAPI(`organisations/${queryParam}`, token)
        .then((orgs) => {
          setOrganisations(orgs.organisations);
          setLoading(false);
        })
        .catch((err) => setError(err));
    }
  }, [userDetails, token, userOrgsOnly]);

  return (
    <OrgsManagement
      organisations={organisations}
      userOrgsOnly={userOrgsOnly}
      setUserOrgsOnly={setUserOrgsOnly}
      isOrgManager={userDetails.role === 'ADMIN' || isOrgManager}
      isAdmin={userDetails.role === 'ADMIN'}
      isOrganisationsFetched={!loading && !error}
    />
  );
}

export function CreateOrganisation() {
  useSetTitleTag('Create new organization');
  const navigate = useNavigate();
  const userDetails = useSelector((state) => state.auth.userDetails);
  const token = useSelector((state) => state.auth.token);
  const {
    members: managers,
    setMembers: setManagers,
    addMember: addManagers,
    removeMember: removeManagers,
  } = useModifyMembers([{ username: userDetails.username, pictureUrl: userDetails.pictureUrl }]);
  const [error, setError] = useState(null);

  const createOrg = (payload) => {
    payload.managers = managers.map((user) => user.username);
    pushToLocalJSONAPI('organisations/', JSON.stringify(payload), token, 'POST')
      .then((result) => {
        toast.success(
          <FormattedMessage
            {...messages.entityCreationSuccess}
            values={{
              entity: 'organization',
            }}
          />,
        );
        navigate(`/manage/organisations/${result.organisationId}`);
      })
      .catch((err) => {
        setError(err.message);
      });
  };

  return (
    <Form
      onSubmit={(values) => createOrg(values)}
      render={({ handleSubmit, pristine, form, submitting, values }) => {
        return (
          <form onSubmit={handleSubmit} className="blue-grey">
            <div className="cf pv4 pb5">
              <h3 className="f2 mb3 ttu blue-dark fw7 ma0 barlow-condensed">
                <FormattedMessage {...messages.newOrganisation} />
              </h3>
              <div className="w-40-l w-100">
                <CreateOrgInfo formState={values} />
                <div className="cf pv2 ml2">
                  {error && (
                    <Alert type="error" compact>
                      {messages[`orgCreation${error}Error`] ? (
                        <FormattedMessage {...messages[`orgCreation${error}Error`]} />
                      ) : (
                        <FormattedMessage
                          {...messages.entityCreationFailure}
                          values={{
                            entity: 'organization',
                          }}
                        />
                      )}
                    </Alert>
                  )}
                </div>
                <Members
                  addMembers={addManagers}
                  removeMembers={removeManagers}
                  members={managers}
                  resetMembersFn={setManagers}
                  creationMode={true}
                />
              </div>
            </div>
            <div className="bottom-0 right-0 left-0 cf bg-white h3 fixed">
              <div className="w-80-ns w-60-m w-50 h-100 fl tr">
                <Link to={'../'}>
                  <CustomButton className="bg-white mr5 pr2 h-100 bn bg-white blue-dark">
                    <FormattedMessage {...messages.cancel} />
                  </CustomButton>
                </Link>
              </div>
              <div className="w-20-l w-40-m w-50 h-100 fr">
                <FormSubmitButton
                  disabled={submitting || pristine}
                  className="w-100 h-100 bg-red white"
                  disabledClassName="bg-red o-50 white w-100 h-100"
                >
                  <FormattedMessage {...messages.createOrganisation} />
                </FormSubmitButton>
              </div>
            </div>
          </form>
        );
      }}
    ></Form>
  );
}

export function EditOrganisation() {
  const { id } = useParams();
  const userDetails = useSelector((state) => state.auth.userDetails);
  const token = useSelector((state) => state.auth.token);
  const [initManagers, setInitManagers] = useState(false);
  const {
    members: managers,
    setMembers: setManagers,
    addMember: addManager,
    removeMember: removeManager,
  } = useModifyMembers([{ username: userDetails.username, pictureUrl: userDetails.pictureUrl }]);
  const [error, loading, organisation] = useFetch(`organisations/${id}/`, id);
  const [isUserAllowed] = useEditOrgAllowed(organisation);
  const [projectsError, projectsLoading, projects] = useFetch(
    `projects/?organisationId=${id}&omitMapResults=true&projectStatuses=PUBLISHED,DRAFT,ARCHIVED`,
    id,
  );
  const [errorMessage, setErrorMessage] = useState(null);
  useSetTitleTag(`Edit ${organisation.name}`);

  useEffect(() => {
    if (!initManagers && organisation && organisation.managers) {
      setManagers(organisation.managers);
      setInitManagers(true);
    }
  }, [organisation, managers, initManagers, setManagers]);

  const updateManagers = () => {
    let payload = JSON.stringify({ managers: managers.map((i) => i.username) });
    pushToLocalJSONAPI(`organisations/${id}/`, payload, token, 'PATCH')
      .then(() =>
        toast.success(
          <FormattedMessage
            {...messages.affiliationUpdationSuccess}
            values={{
              affiliation: 'managers',
            }}
          />,
        ),
      )
      .catch(() =>
        toast.error(
          <FormattedMessage
            {...messages.affiliationUpdationFailure}
            values={{
              affiliation: 'managers',
            }}
          />,
        ),
      );
  };

  const updateOrg = (payload) => {
    const onSuccess = () => setErrorMessage(null);
    const onFailure = (error) => setErrorMessage(error.message);
    updateEntity(`organisations/${id}/`, 'organization', payload, token, onSuccess, onFailure);
  };

  return (
    <ReactPlaceholder
      showLoadingAnimation={true}
      type={'media'}
      rows={26}
      delay={100}
      ready={!error && loading === false && typeof organisation === 'object'}
    >
      {isUserAllowed ? (
        <div className="cf">
          <div className="cf pv4 w-100">
            <div className="w-auto fl">
              <h3 className="f2 ttu blue-dark fw7 ma0 barlow-condensed v-mid dib">
                <FormattedMessage {...messages.manageOrganisation} />
              </h3>
              <DeleteModal
                id={organisation.organisationId}
                name={organisation.name}
                type="organisations"
              />
            </div>
            <div className="w-auto fr">
              <Link to={`/organisations/${organisation.organisationId}/stats/`}>
                <CustomButton
                  className="bg-red ba b--red white pv2 ph3"
                  icon={<ChartLineIcon className="h1 v-mid" />}
                >
                  <FormattedMessage {...messages.statistics} />
                </CustomButton>
              </Link>
            </div>
          </div>
          <div className="w-40-l w-100 mt4 fl">
            <OrganisationForm
              userDetails={userDetails}
              organisation={{
                name: organisation.name,
                url: organisation.url,
                slug: organisation.slug,
                logo: organisation.logo,
                description: organisation.description,
                type: organisation.type,
                subscriptionTier: organisation.subscriptionTier,
              }}
              updateOrg={updateOrg}
              disabledForm={error || loading}
              errorMessage={errorMessage}
            />
            <Members
              addMembers={addManager}
              removeMembers={removeManager}
              saveMembersFn={updateManagers}
              resetMembersFn={setManagers}
              members={managers}
            />
          </div>
          <div className="w-60-l w-100 mt4 pl5-l pl0 fr">
            <Projects
              projects={!projectsLoading && !projectsError && projects}
              viewAllEndpoint={`/manage/projects/?organisation=${organisation.name}`}
              ownerEntity="organisation"
            />
            <Teams
              teams={organisation.teams}
              viewAllQuery={`?organisationId=${id}`}
              isReady={!error && !loading}
            />
          </div>
        </div>
      ) : (
        <div className="cf w-100 pv5">
          <div className="tc">
            <h3 className="f3 fw8 mb4 barlow-condensed">
              <FormattedMessage {...messages.editOrgNotAllowed} />
            </h3>
          </div>
        </div>
      )}
    </ReactPlaceholder>
  );
}
