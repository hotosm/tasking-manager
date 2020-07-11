import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { CHART_COLOURS } from '../../config';
import { formatChartData, formatTooltip } from '../../utils/formatChartJSData';

export const TopCauses = ({ userStats }) => {
  const sliceVal = 3;
  const colours = [
    CHART_COLOURS.green,
    CHART_COLOURS.orange,
    CHART_COLOURS.red,
    CHART_COLOURS.blue,
  ];
  const stats = {};

  let interests = userStats.ContributionsByInterest.slice(0, sliceVal).map((c, i) => {
    stats[c.name] = c.countProjects;
    return { label: c.name, field: c.name, backgroundColor: colours[i] };
  });
  stats.Others = userStats.ContributionsByInterest.slice(sliceVal)
    .map((c) => c.countProjects)
    .reduce((a, b) => a + b, 0);

  interests.push({
    label: 'Others',
    field: 'Others',
    backgroundColor: colours[colours.length - 1],
  });
  const data = formatChartData(interests, stats);

  return (
    <div className="pb3 ph3 pt2 bg-white blue-dark shadow-4">
      <h3 className="f4 mv3 fw6">
        <FormattedMessage {...messages.topCausesTitle} />
      </h3>
      {userStats.projectsMapped ? (
        <Doughnut
          data={data}
          options={{
            legend: { position: 'right', labels: { boxWidth: 12 } },
            tooltips: { callbacks: { label: (tooltip, data) => formatTooltip(tooltip, data) } },
          }}
        />
      ) : (
        <div className="h-100 tc pv5 blue-grey">
          <FormattedMessage {...messages.noProjectsData} />
        </div>
      )}
    </div>
  );
};
