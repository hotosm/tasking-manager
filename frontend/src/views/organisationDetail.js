import React from 'react';
import ReactPlaceholder from 'react-placeholder';
import { FormattedMessage } from 'react-intl';
import { useParams } from 'react-router-dom';
import { encodeQueryParams, StringParam } from 'use-query-params';
import queryString from 'query-string';

import messages from './messages';
import { useFetch } from '../hooks/UseFetch';
import { useEditOrgAllowed } from '../hooks/UsePermissions';
import { Teams } from '../components/teamsAndOrgs/teams';
import { Projects } from '../components/teamsAndOrgs/projects';
import { UserAvatarList } from '../components/user/avatar';
import { EditButton } from '../components/button';
import { useSetTitleTag } from '../hooks/UseMetaTags';

export function OrganisationDetail() {
  const { slug } = useParams();
  const [error, loading, organisation] = useFetch(`organisations/${slug}/`, slug);
  const [isUserAllowed] = useEditOrgAllowed(organisation);
  //eslint-disable-next-line
  const [projectsError, projectsLoading, projects] = useFetch(
    `projects/?organisationId=${organisation.organisationId}&omitMapResults=true`,
    organisation.organisationId !== undefined,
  );
  useSetTitleTag(`${organisation.name}`);

  return (
    <ReactPlaceholder
      showLoadingAnimation={true}
      type={'media'}
      rows={26}
      delay={100}
      ready={!error && loading === false && typeof organisation === 'object'}
    >
      <div className="w-100 cf pv3 ph2 ph4-ns bg-white blue-dark">
        <div className="cf pt4 w-100">
          <div className="w-auto fl">
            {organisation.logo && (
              <img src={organisation.logo} className="w3 dib v-mid mr3" alt={organisation.name} />
            )}
            <h3 className="f2 fw6 mv2 ttu barlow-condensed blue-dark dib v-mid">
              {organisation.name}
            </h3>
          </div>
          {isUserAllowed && (
            <div className="w-auto fr pt2">
              <EditButton url={`/manage/organisations/${organisation.organisationId}`}>
                <FormattedMessage {...messages.editOrganisation} />
              </EditButton>
            </div>
          )}
        </div>
        <div className="cf w-50-l w-100 base-font">
          <div className="w-auto fl">
            <p className="f5 fw5">{organisation.description}</p>
            <p className="f5 fw5">
              {organisation.url && (
                <a href={organisation.url} className="link red">
                  {organisation.url}
                </a>
              )}
            </p>
          </div>
        </div>
        <div className="w-100 mt4">
          <Projects
            projects={projects}
            viewAllEndpoint={`/explore/?${queryString.stringify(
              encodeQueryParams(
                {
                  organisation: StringParam,
                },
                {
                  organisation: organisation.name,
                },
              ),
            )}`}
            ownerEntity="organisation"
            showManageButtons={false}
            border={false}
          />
          <Teams teams={organisation.teams} isReady={!error && !loading} border={false} />
          <div className="cf w-100 pv3">
            <h3 className="f3 barlow-condensed ttu blue-dark mt2 mb3 fw6 dib v-mid">
              <FormattedMessage {...messages.managers} />
            </h3>
            <div className="db">
              <UserAvatarList size="large" textColor="white" users={organisation.managers} />
            </div>
          </div>
        </div>
      </div>
    </ReactPlaceholder>
  );
}
