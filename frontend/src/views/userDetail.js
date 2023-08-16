import React, { useEffect, useState, Suspense } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FormattedMessage } from 'react-intl';
import ReactPlaceholder from 'react-placeholder';

import messages from '../components/userDetail/messages';
import { HeaderProfile } from '../components/userDetail/headerProfile';
import { ElementsMapped, TaskStats } from '../components/userDetail/elementsMapped';
import { UserTeams } from '../components/userDetail/userTeamsOrgs';
import { CountriesMapped } from '../components/userDetail/countriesMapped';
import { TopProjects } from '../components/userDetail/topProjects';
import { ContributionTimeline } from '../components/userDetail/contributionTimeline';
import { NotFound } from './notFound';
import { OHSOME_STATS_BASE_URL } from '../config';
import { fetchExternalJSONAPI } from '../network/genericJSONRequest';
import { useFetch } from '../hooks/UseFetch';
import { useSetTitleTag } from '../hooks/UseMetaTags';

const TopCauses = React.lazy(() =>
  import('../components/userDetail/topCauses' /* webpackChunkName: "topCauses" */),
);
const EditsByNumbers = React.lazy(() =>
  import('../components/userDetail/editsByNumbers' /* webpackChunkName: "editsByNumbers" */),
);

export const UserDetail = ({ withHeader = true }) => {
  const navigate = useNavigate();
  const loggedInUsername = useSelector((state) => state.auth.userDetails.username);
  const { username: usernameParam } = useParams();
  const username = usernameParam || loggedInUsername;
  useSetTitleTag(username);
  const token = useSelector((state) => state.auth.token);
  const currentUser = useSelector((state) => state.auth.userDetails);
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
    if (!token) {
      navigate('/login');
    }
  }, [navigate, token]);

  useEffect(() => {
    if (userDetails.id) {
      fetchExternalJSONAPI(`${OHSOME_STATS_BASE_URL}/hot-tm-user?userId=${userDetails.id}`, true)
        .then((res) => setOsmStats(res.result))
        .catch((e) => console.log(e));
    }
  }, [userDetails.id]);

  const titleClass = 'contributions-titles fw5 ttu barlow-condensed blue-dark mt0';

  return errorDetails ? (
    <NotFound />
  ) : (
    <div className="w-100">
      {withHeader && (
        <div className="w-100 cf pb3">
          <ReactPlaceholder
            type="media"
            showLoadingAnimation={true}
            rows={5}
            ready={!errorDetails && !loadingDetails}
          >
            <HeaderProfile userDetails={userDetails} changesets={osmStats.changesets} />
          </ReactPlaceholder>
        </div>
      )}
      <div className={withHeader ? 'w-100 ph4-l ph2 cf pb3 bg-washed-blue' : ''}>
        <div className="mt4">
          <ElementsMapped userStats={userStats} osmStats={osmStats} />
        </div>
        <div>
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
          <div className="user-projects-ctr">
            <div>
              <ReactPlaceholder
                type="rect"
                showLoadingAnimation={true}
                style={{ height: '24em' }}
                ready={!projectsError && !projectsLoading}
              >
                <TopProjects projects={userProjects} />
              </ReactPlaceholder>
            </div>
            <div>
              <ReactPlaceholder
                type="rect"
                showLoadingAnimation={true}
                style={{ height: '24em' }}
                ready={!errorStats && !loadingStats}
              >
                <Suspense fallback={<div />}>
                  <TopCauses userStats={userStats} />
                </Suspense>
              </ReactPlaceholder>
            </div>
            <div>
              <Suspense fallback={<div />}>
                <EditsByNumbers osmStats={osmStats} />
              </Suspense>
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
