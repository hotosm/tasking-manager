import React, { Suspense } from 'react';
import { Redirect } from '@reach/router';
import { useSelector } from 'react-redux';
import { FormattedMessage } from 'react-intl';

import messages from '../components/userDetail/messages';
import { HeaderProfile } from '../components/userDetail/headerProfile';
import { ElementsMapped } from '../components/userDetail/elementsMapped';
import { CountriesMapped } from '../components/userDetail/countriesMapped';
import { TopCauses } from '../components/userDetail/topCauses';
import { TopProjects } from '../components/userDetail/topProjects';
import { EditsByNumbers } from '../components/userDetail/editsByNumbers';
import ContributionTimeline from '../components/userDetail/contributionTimeline';
import { ClockIcon } from '../components/svgIcons';
import { fetchLocalJSONAPI, wrapPromise, fetchOSMStatsAPI } from '../network/genericJSONRequest';

const Fallback = () => {
  return (
    <div className="vh-75 flex items-start">
      <div className="pa3 mt4 bg-white blue-dark shadow-4 w-20 center barlow-condensed f4 flex items-center justify-center ttc">
        <ClockIcon className="mr2" height="25px" />
        <span>
          <FormattedMessage {...messages.loading} />
        </span>
      </div>
    </div>
  );
};

export const UserDetail = ({ username }) => {
  const token = useSelector(state => state.auth.get('token'));
  if (!token) {
    return <Redirect to={'login'} noThrow />;
  }

  const blockWidth = 'ph6-l ph4-m ph2';
  const blockClass = 'w-33-l w-50-m w-100 fl pa2';

  const userDetails = () => {
    return {
      details: wrapPromise(fetchLocalJSONAPI(`users/queries/${username}/`, token)),
      stats: wrapPromise(fetchLocalJSONAPI(`users/${username}/statistics/`, token)),
      projects: wrapPromise(fetchLocalJSONAPI(`projects/queries/${username}/touched/`, token)),
      osmDetails: wrapPromise(fetchLocalJSONAPI(`users/${username}/openstreetmap/`, token)),
      osmStats: wrapPromise(fetchOSMStatsAPI(`users/${username}`)),
    };
  };

  const user = userDetails();
  const titleClass = 'f3 fw6 ttu barlow-condensed blue-dark mt0 pt3 mb3';

  return (
    <div className="bg-tan w-100">
      <Suspense fallback={<Fallback />}>
        <div className="bg-white blue-dark w-100 cf ph6-l ph4-m ph2 pv3">
          <HeaderProfile user={user} />
        </div>
        <div className={blockWidth}>
          <div className="mv4">
            <ElementsMapped user={user} />
          </div>
          <div className="mv4">
            <h3 className={titleClass}>
              <FormattedMessage {...messages.contributionTimelineTitle} />
            </h3>
            <ContributionTimeline user={user} />
          </div>
          <div className="mv4">
            <h3 className={titleClass}>
              <FormattedMessage {...messages.statsTitle} />
            </h3>
            <div className="w-100 cf">
              <div className="w-33-l w-100 fl pa2">
                <TopProjects user={user} />
              </div>
              <div className={blockClass}>
                <TopCauses user={user} />
              </div>
              <div className={blockClass}>
                <EditsByNumbers user={user} />
              </div>
            </div>
          </div>
          <div className="mt3 pb4">
            <CountriesMapped user={user} />
          </div>
        </div>
      </Suspense>
    </div>
  );
};
