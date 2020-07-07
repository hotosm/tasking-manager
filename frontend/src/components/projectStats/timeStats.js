import React from 'react';
import ReactPlaceholder from 'react-placeholder';
import { useFetch } from '../../hooks/UseFetch';

import { FormattedMessage } from 'react-intl';
import messages from './messages';
import { shortEnglishHumanizer } from '../userDetail/elementsMapped';

const StatsRow = ({ stats }) => {
  const fields = [
    'averageMappingTime',
    'averageValidationTime',
    'timeToFinishMapping',
    'timeToFinishValidating',
  ];

  const options = {
    units: ['h', 'm', 's'],
    round: true,
  };

  return (
    <div className="cf w-90 center">
      {fields.map((t) => {
        return (
          <div className="bg-white pa3 tc w-20 fl mh3 shadow-2">
            <div className="f2 b mb3 red  barlow-condensed">
              {shortEnglishHumanizer(stats[t] * 1000, options)}
            </div>
            <div className="f6 b blue-grey">
              <FormattedMessage {...messages[t]} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

const StatsCards = ({ stats }) => {
  return (
    <div className="bg-tan w-100">
      <div className="ph2 ph4-ns pv3 pt3 pb4">
        <h3 className="f2 ttu barlow-condensed pv3 ma0">
          <FormattedMessage {...messages.projectStatsTitle} />
        </h3>
        <StatsRow stats={stats} />
      </div>
    </div>
  );
};

export const TimeStats = ({ id }) => {
  const [error, loading, stats] = useFetch(`projects/${id}/statistics/`, id);

  return (
    <div>
      <ReactPlaceholder
        showLoadingAnimation={true}
        rows={26}
        ready={!error && !loading}
        className="pr3"
      >
        <StatsCards stats={stats} />
      </ReactPlaceholder>
    </div>
  );
};
