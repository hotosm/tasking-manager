import React, { useEffect, useState } from 'react';
import { Redirect } from '@reach/router';
import { useSelector } from 'react-redux';
import { FormattedMessage } from 'react-intl';
import ReactPlaceholder from 'react-placeholder';

import messages from '../components/userDetail/messages';
import { HeaderProfile } from '../components/userDetail/headerProfile';
import { ElementsMapped, TaskStats } from '../components/userDetail/elementsMapped';
import { UserTeams } from '../components/userDetail/userTeamsOrgs';
import { CountriesMapped } from '../components/userDetail/countriesMapped';
import { TopCauses } from '../components/userDetail/topCauses';
import { TopProjects } from '../components/userDetail/topProjects';
import { EditsByNumbers } from '../components/userDetail/editsByNumbers';
import { ContributionTimeline } from '../components/userDetail/contributionTimeline';
import { NotFound } from './notFound';
import { USER_STATS_API_URL } from '../config';
import { fetchExternalJSONAPI } from '../network/genericJSONRequest';
import { useFetch } from '../hooks/UseFetch';
import { useSetTitleTag } from '../hooks/UseMetaTags';

export const UserDetail = ({ username, withHeader = true }) => {
  useSetTitleTag(username);
  const token = useSelector((state) => state.auth.get('token'));
  const currentUser = useSelector((state) => state.auth.get('userDetails'));
  const [osmStats, setOsmStats] = useState({});
  const [errorDetails, loadingDetails, userDetails] = useFetch(
    `users/queries/${username}/`,
    username !== undefined,
  );
  const [errorStats, loadingStats, userStats] = useFetch(
    `users/${username}/statistics/`,
    username !== undefined,
  );
  const [projectsError, projectsLoading, userProjects] = useFetch(
    `projects/queries/${username}/touched/`,
    username !== undefined,
  );

  useEffect(() => {
    if (token && username) {
      fetchExternalJSONAPI(`${USER_STATS_API_URL}${username}`)
        .then((res) => setOsmStats(res))
        .catch((e) => console.log(e));
    }
  }, [token, username]);

  if (!token) {
    return <Redirect to={'/login'} noThrow />;
  }

  const blockClass = 'w-third-l w-50-m w-100 fl pa2';
  const titleClass = 'f3 fw6 ttu barlow-condensed blue-dark mt0 pt3 mb3';
  return errorDetails ? (
    <NotFound />
  ) : (
    <div className="bg-tan w-100">
      {withHeader && (
        <div className="w-100 cf pb3">
          <ReactPlaceholder
            type="media"
            showLoadingAnimation={true}
            rows={5}
            ready={!errorDetails && !loadingDetails}
          >
            <HeaderProfile userDetails={userDetails} changesets={osmStats.changeset_count} />
          </ReactPlaceholder>
        </div>
      )}
      <div className={withHeader ? 'w-100 ph4-l ph2 cf pb3' : ''}>
        <div className="mv4">
          <ElementsMapped userStats={userStats} osmStats={osmStats} />
        </div>
        <div className="mv4">
          <h3 className={titleClass}>
            <FormattedMessage {...messages.contributionTimelineTitle} />
          </h3>
          <ReactPlaceholder
            type="rect"
            showLoadingAnimation={true}
            style={{ height: '20em' }}
            ready={!errorStats && !loadingStats}
          >
            <ContributionTimeline userStats={userStats} />
          </ReactPlaceholder>
        </div>
        <div className="mv4">
          <h3 className={titleClass}>
            <FormattedMessage {...messages.projectsTitle} />
          </h3>
          <div className="w-100 cf">
            <div className="w-third-l w-100 fl pa2">
              <ReactPlaceholder
                type="rect"
                showLoadingAnimation={true}
                style={{ height: '24em' }}
                ready={!projectsError && !projectsLoading}
              >
                <TopProjects projects={userProjects} />
              </ReactPlaceholder>
            </div>
            <div className={blockClass}>
              <ReactPlaceholder
                type="rect"
                showLoadingAnimation={true}
                style={{ height: '24em' }}
                ready={!errorStats && !loadingStats}
              >
                <TopCauses userStats={userStats} />
              </ReactPlaceholder>
            </div>
            <div className={blockClass}>
              <EditsByNumbers osmStats={osmStats} />
            </div>
          </div>
        </div>
        <div className="mv4">
          <h3 className={titleClass}>
            <FormattedMessage {...messages.tasks} />
          </h3>
          <TaskStats
            userStats={userStats}
            username={currentUser.username !== username ? username : null}
          />
        </div>
        <div className="mv4">
          <h3 className={titleClass}>
            <FormattedMessage {...messages.countries} />
          </h3>
          <ReactPlaceholder
            type="rect"
            showLoadingAnimation={true}
            style={{ height: '24em' }}
            ready={!errorStats && !loadingStats && !projectsError && !projectsLoading}
          >
            <CountriesMapped projects={userProjects} userStats={userStats} />
          </ReactPlaceholder>
        </div>
        {currentUser.username !== username && (
          <div className="mv4">
            <h3 className={titleClass}>
              <FormattedMessage {...messages.teams} />
            </h3>
            <ReactPlaceholder
              type="rect"
              showLoadingAnimation={true}
              style={{ height: '10em' }}
              ready={!errorStats && !loadingStats}
            >
              <UserTeams userId={userDetails.id} />
            </ReactPlaceholder>
          </div>
        )}
      </div>
    </div>
  );
};
