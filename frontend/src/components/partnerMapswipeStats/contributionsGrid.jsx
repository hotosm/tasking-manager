import CalendarHeatmap from 'react-calendar-heatmap';
import { Tooltip } from 'react-tooltip';
import { FormattedMessage, useIntl } from 'react-intl';
import { format } from 'date-fns';
import PropTypes from 'prop-types';

import messages from './messages';

const LEGEND_INDEXES = [30, 50, 70, 100];

const Legend = () => {
  const legendFontStyle = 'ph2 f7 blue-grey ttc';

  return (
    <div className="nt4-ns w-100 tr fr flex items-center justify-end">
      <span className={legendFontStyle}>
        <FormattedMessage {...messages.contributionsGridLegendLess} />
      </span>
      <div className={`dib h1 w1 bg-tan`}></div>
      {LEGEND_INDEXES.map((i) => (
        <div key={i} className={`dib h1 w1 bg-red o-${i}`}></div>
      ))}
      <span className={legendFontStyle}>
        <FormattedMessage {...messages.contributionsGridLegendMore} />
      </span>
    </div>
  );
};

export const ContributionsGrid = ({ contributionsByDate = [], startDate, endDate }) => {
  const gridData = contributionsByDate.map((contribution) => ({
    date: contribution.taskDate,
    count: contribution.totalcontributions,
  }));
  const intl = useIntl();

  const countValues = gridData.map((contribution) => contribution.count);
  const maxValue = Math.max(...countValues);

  const getHeatmapClass = (value) => {
    const rate = value.count / maxValue;

    if (0.0 <= rate && rate < 0.25) {
      return 'fill-red o-30';
    }

    if (0.25 <= rate && rate < 0.5) {
      return 'fill-red o-50';
    }

    if (0.5 <= rate && rate < 0.75) {
      return 'fill-red o-70';
    }

    if (0.75 <= rate && rate <= 1) {
      return 'fill-red o-100';
    }
  };

  const endDateYear = endDate.split('-')[0];
  const formattedEndDate = format(new Date(endDateYear, 11, 31), 'yyyy-MM-dd');

  return (
    <div>
      <h3 className="f2 fw6 ttu barlow-condensed blue-dark mt0 mb4">
        <FormattedMessage {...messages.contributions} />
      </h3>

      <div className="bg-white pv4 pr4 shadow-6" style={{ fontSize: '1rem' }}>
        <CalendarHeatmap
          startDate={startDate}
          endDate={formattedEndDate}
          values={gridData}
          classForValue={(value) => {
            if (!value) return 'fill-tan';
            return getHeatmapClass(value);
          }}
          showWeekdayLabels={true}
          tooltipDataAttrs={(value) => {
            let tooltipContent = intl.formatMessage(messages.contributionsGridEmpty);
            if (value.count !== null) {
              tooltipContent = `${value.count} ${intl.formatMessage(
                messages.contributionsGridTooltip,
              )} on ${value.date}`;
            }

            return {
              'data-tooltip-float': true,
              'data-tooltip-content': tooltipContent,
              'data-tooltip-id': 'partnerMapswipeContributionsGridTooltip',
            };
          }}
        />
        <Tooltip id="partnerMapswipeContributionsGridTooltip" />
        <Legend />
      </div>
    </div>
  );
};

ContributionsGrid.propTypes = {
  contributionsByDate: PropTypes.arrayOf(
    PropTypes.shape({
      taskDate: PropTypes.string,
      totalcontributions: PropTypes.number,
    }),
  ),
  startDate: PropTypes.instanceOf(Date),
  endDate: PropTypes.instanceOf(Date),
};
