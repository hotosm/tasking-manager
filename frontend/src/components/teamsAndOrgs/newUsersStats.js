import React from 'react';
import ReactPlaceholder from 'react-placeholder';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { BarChartItem } from '../userDetail/barListChart';
import { useDateRangeQueryParams } from '../../hooks/UseDateRangeQueryParams';
import { useFetch } from '../../hooks/UseFetch';

export const NewUsersStats = ({ datePeriod }) => {
  const queryParam = useDateRangeQueryParams(datePeriod);
  const [errorStats, loadingStats, stats] = useFetch(`users/statistics/?${queryParam}`, queryParam);
  const activeUsers = stats.total > 0 ? stats.contributed / stats.total : 0;
  const emailVerifiedUsers = stats.total > 0 ? stats.emailVerified / stats.total : 0;

  return (
    <div className="pv2 ph3 bg-white blue-dark shadow-4">
      <ReactPlaceholder
        showLoadingAnimation={true}
        rows={6}
        ready={!errorStats && !loadingStats}
        className="pv3 ph2 ph4-ns"
      >
        <h3 className="f4 mv0 fw6 pt3">
          {datePeriod === 'month' && (
            <FormattedMessage {...messages.newUsersOnLastMonth} values={{ number: stats.total }} />
          )}
          {datePeriod === 'week' && (
            <FormattedMessage {...messages.newUsersOnLastWeek} values={{ number: stats.total }} />
          )}
        </h3>
        <ol className="pa0 mt1 mb2">
          <BarChartItem
            name={<FormattedMessage {...messages.activeNewUsers} />}
            percentValue={activeUsers}
            number={`${Math.round(activeUsers * 100)}%`}
          />
          <BarChartItem
            name={<FormattedMessage {...messages.emailVerified} />}
            percentValue={emailVerifiedUsers}
            number={`${Math.round(emailVerifiedUsers * 100)}%`}
          />
        </ol>
      </ReactPlaceholder>
    </div>
  );
};
