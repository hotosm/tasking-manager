import { Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  Legend,
  LinearScale,
  Title,
  Tooltip,
} from 'chart.js';
import { FormattedMessage, useIntl } from 'react-intl';

import messages from './messages';
import userMessages from '../user/messages';
import { CHART_COLOURS } from '../../config';
import { formatChartData, formatTooltip } from '../../utils/formatChartJSData';
import { useContributorStats } from '../../hooks/UseContributorStats';
import { StatsCardContent } from '../statsCard';

export default function ContributorsStats({ contributors }) {
  ChartJS.register(BarElement, CategoryScale, Legend, LinearScale, Title, Tooltip, ArcElement);
  const intl = useIntl();
  const stats = useContributorStats(contributors);
  const getUserLevelLabel = (level) => intl.formatMessage(userMessages[`mapperLevel${level}`]);
  const getUserExpLabel = (id) => intl.formatMessage(messages[`${id}`]);

  let userLevelsReference = [
    {
      label: getUserLevelLabel('BEGINNER'),
      field: 'beginnerUsers',
      backgroundColor: CHART_COLOURS.green,
      borderColor: CHART_COLOURS.white,
    },
    {
      label: getUserLevelLabel('INTERMEDIATE'),
      field: 'intermediateUsers',
      backgroundColor: CHART_COLOURS.blue,
      borderColor: CHART_COLOURS.white,
    },
    {
      label: getUserLevelLabel('ADVANCED'),
      field: 'advancedUsers',
      backgroundColor: CHART_COLOURS.orange,
      borderColor: CHART_COLOURS.white,
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
            className="pv3-l pv2 mb3-l mb2 shadow-4 bg-white"
          />
          <StatsCardContent
            value={stats.validators}
            label={<FormattedMessage {...messages.validators} />}
            className="pv3-l pv2 mb3-l mb2 shadow-4 bg-white"
          />
          <StatsCardContent
            value={contributors.length}
            label={<FormattedMessage {...messages.totalContributors} />}
            className="pv3-l pv2 mb3-l mb2 shadow-4 bg-white"
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
              plugins: {
                legend: { display: false },
                tooltip: { callbacks: { label: (context) => formatTooltip(context) } },
              },
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
              aspectRatio: 2,
              plugins: {
                legend: { position: 'right', labels: { boxWidth: 12 } },
                tooltip: { callbacks: { label: (context) => formatTooltip(context) } },
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}
