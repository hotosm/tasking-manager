import React, { Suspense } from 'react';
import { Redirect } from '@reach/router';
import { useSelector } from 'react-redux';
import { HeaderProfile } from '../components/userDetail/headerProfile';
import { ElementsMapped } from '../components/userDetail/elementsMapped';
import { CountriesMapped } from '../components/userDetail/countriesMapped';
import { TopCauses } from '../components/userDetail/topCauses';
import { TopProjects } from '../components/userDetail/topProjects';
import { EditsByNumbers } from '../components/userDetail/editsByNumbers';
import ContributionTimeline from '../components/userDetail/contributionTimeline';
import { ClockIcon } from '../components/svgIcons';
import { fetchLocalJSONAPI, wrapPromise, fetchOSMStatsAPI } from '../network/genericJSONRequest';
import { FormattedMessage } from 'react-intl';
import messages from '../components/userDetail/messages';

const Fallback = () => {
  return (
    <div className="vh-75 flex items-start">
      <div className="pa3 mt4 bg-white shadow-4 w-20 center barlow-condensed f4 flex items-center justify-center ttc">
        <ClockIcon className="h2 w2 mr2" />
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

  const blockWidth = 'w-80 center';
  const blockStyle = { width: '31%' };
  const blockClass = 'bg-white pa3 shadow-4';

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
  const titleClass = 'f3 blue-dark mt0 fw6 pt3 ttu barlow-condensed mb3';

  return (
    <div className="bg-tan w-100">
      <Suspense fallback={<Fallback />}>
        <div className="bg-white w-100">
          <div className="w-80 center pt4 pb3">
            <HeaderProfile user={user} />
          </div>
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
            <div className="w-100 flex justify-between content-stretch">
              <div style={blockStyle} className={blockClass}>
                <TopProjects user={user} />
              </div>
              <div style={blockStyle} className={blockClass}>
                <TopCauses user={user} />
              </div>
              <div style={blockStyle} className={blockClass}>
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
