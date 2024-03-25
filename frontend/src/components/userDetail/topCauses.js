import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { FormattedMessage, useIntl } from 'react-intl';

import messages from './messages';
import { CHART_COLOURS } from '../../config';
import { formatChartData, formatTooltip } from '../../utils/formatChartJSData';

ChartJS.register(ArcElement, Tooltip, Legend);

const TopCauses = ({ userStats }) => {
  const intl = useIntl();
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
    return {
      label: c.name,
      field: c.name,
      backgroundColor: colours[i],
      borderColor: CHART_COLOURS.white,
    };
  });
  stats.Others = userStats.ContributionsByInterest.slice(sliceVal)
    .map((c) => c.countProjects)
    .reduce((a, b) => a + b, 0);

  interests.push({
    label: intl.formatMessage(messages.others),
    field: 'Others',
    backgroundColor: colours[colours.length - 1],
    borderColor: CHART_COLOURS.white,
  });
  const data = formatChartData(interests, stats);

  return (
    <div className="pv2 ph3 bg-white blue-dark shadow-6 h-100">
      <div className="ml2 mt1 mb3">
        <h3 className="f125 mv3 fw6">
          <FormattedMessage {...messages.topCausesTitle} />
        </h3>
        {userStats.projectsMapped && data.datasets[0].data.some((x) => !isNaN(x)) ? (
          <Doughnut
            data={data}
            options={{
              aspectRatio: 2,
              plugins: {
                legend: { position: 'right', labels: { boxWidth: 12 } },
                tooltip: { callbacks: { label: (context) => formatTooltip(context) } },
              },
            }}
          />
        ) : (
          <div className="h-100 tc pv5 blue-grey">
            <FormattedMessage {...messages.noProjectsData} />
          </div>
        )}
      </div>
    </div>
  );
};

export default TopCauses;
