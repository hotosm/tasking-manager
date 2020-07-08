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
    spacer: '',
  };

  return (
    <div className="cf center">
      {fields.map((t, n) => (
        <div key={n} className="ph2 w-25-l w-50-m w-100 fl">
          <div className="tc pa3 bg-white shadow-4">
            <div className="f2 b red barlow-condensed">
              {shortEnglishHumanizer(stats[t] * 1000, options).replaceAll(',', '')}
            </div>
            <div className="f6 b blue-grey">
              <FormattedMessage {...messages[t]} />
            </div>
          </div>
        </div>
      ))}
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
    <ReactPlaceholder
      showLoadingAnimation={true}
      rows={26}
      ready={!error && !loading}
      className="pr3"
    >
      <StatsCards stats={stats} />
    </ReactPlaceholder>
  );
};
