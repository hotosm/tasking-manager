import React from 'react';
import { Doughnut, Bar } from 'react-chartjs-2';
import { FormattedMessage, useIntl } from 'react-intl';

import messages from './messages';
import userMessages from '../user/messages';
import { CHART_COLOURS } from '../../config';
import { formatChartData, formatTooltip } from '../../utils/formatChartJSData';
import { useContributorStats } from '../../hooks/UseContributorStats';
import { StatsCardContent } from '../statsCardContent';

export default function ContributorsStats({ contributors }) {
  const intl = useIntl();
  const stats = useContributorStats(contributors.userContributions);
  const getUserLevelLabel = (level) => intl.formatMessage(userMessages[`mapperLevel${level}`]);
  const getUserExpLabel = (id) => intl.formatMessage(messages[`${id}`]);

  let userLevelsReference = [
    {
      label: getUserLevelLabel('BEGINNER'),
      field: 'beginnerUsers',
      backgroundColor: CHART_COLOURS.green,
    },
    {
      label: getUserLevelLabel('INTERMEDIATE'),
      field: 'intermediateUsers',
      backgroundColor: CHART_COLOURS.blue,
    },
    {
      label: getUserLevelLabel('ADVANCED'),
      field: 'advancedUsers',
      backgroundColor: CHART_COLOURS.orange,
    },
  ];
  let userExperienceReference = [
    {
      label: getUserExpLabel('lessThan1MonthExp'),
      field: 'lessThan1MonthExp',
      backgroundColor: CHART_COLOURS.red,
    },
    {
      label: getUserExpLabel('lessThan3MonthExp'),
      field: 'lessThan3MonthExp',
      backgroundColor: CHART_COLOURS.red,
    },
    {
      label: getUserExpLabel('lessThan6MonthExp'),
      field: 'lessThan6MonthExp',
      backgroundColor: CHART_COLOURS.red,
    },
    {
      label: getUserExpLabel('lessThan12MonthExp'),
      field: 'lessThan12MonthExp',
      backgroundColor: CHART_COLOURS.red,
    },
    {
      label: getUserExpLabel('moreThan1YearExp'),
      field: 'moreThan1YearExp',
      backgroundColor: CHART_COLOURS.red,
    },
  ];

  return (
    <div className="ph2 ph4-ns">
      <h3 className="f3 ttu barlow-condensed">
        <FormattedMessage {...messages.contributors} />
      </h3>
      <div className="cf w-third-l w-100 fl pa2">
        <div className="cf bg-tan tc">
          <StatsCardContent
            value={stats.mappers}
            label={<FormattedMessage {...messages.mappers} />}
            className="pv3-l pv2 mb3 shadow-4 bg-white"
          />
          <StatsCardContent
            value={stats.validators}
            label={<FormattedMessage {...messages.validators} />}
            className="pv3-l pv2 mb3 shadow-4 bg-white"
          />
          <StatsCardContent
            value={contributors.userContributions.length}
            label={<FormattedMessage {...messages.totalContributors} />}
            className="pv3-l pv2 mb3 shadow-4 bg-white"
          />
        </div>
      </div>
      <div className="w-third-l w-100 fl pa2">
        <div className="cf bg-white pb4 ph3 pt2 shadow-4">
          <h3 className="f4 mv3 fw6">
            <FormattedMessage {...messages.usersExperience} />
          </h3>
          <Bar
            data={formatChartData(userExperienceReference, stats)}
            options={{
              legend: { display: false },
              tooltips: { callbacks: { label: (tooltip, data) => formatTooltip(tooltip, data) } },
            }}
          />
        </div>
      </div>
      <div className="w-third-l w-100 fl pa2">
        <div className="cf bg-white pb4 ph3 pt2 shadow-4">
          <h3 className="f4 mv3 fw6">
            <FormattedMessage {...messages.usersLevel} />
          </h3>
          <Doughnut
            data={formatChartData(userLevelsReference, stats)}
            options={{
              legend: { position: 'right', labels: { boxWidth: 12 } },
              tooltips: { callbacks: { label: (tooltip, data) => formatTooltip(tooltip, data) } },
            }}
          />
        </div>
      </div>
    </div>
  );
}
