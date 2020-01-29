import React from 'react';
import CalendarHeatmap from 'react-calendar-heatmap';
import ReactTooltip from 'react-tooltip';
import { FormattedMessage, injectIntl } from 'react-intl';
import messages from './messages';

const ContributionTimeline = props => {
  const { intl } = props;

  const today = new Date();
  const stats = props.user.stats.read();

  const shiftDate = (date, numDays) => {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() + numDays);
    return newDate;
  };

  const countValues = stats.contributionsByDay.map(r => {
    return r.count;
  });
  const maxValue = Math.max(...countValues);

  const HeatmapLegend = () => {
    const indexes = Array(5)
      .fill()
      .map((x, i) => i);

    const size = '1.3em';
    const legendFontStyle = 'ph2 f7 blue-grey ttc';
    return (
      <div className="nt4 flex items-center w-100 justify-end">
        <span className={legendFontStyle}>
          <FormattedMessage {...messages.heatmapLegendLess} />
        </span>
        {indexes.map(i => {
          return (
            <svg style={{ width: size, height: size }}>
              <rect width={size} height={size} className={`heatmap-color-${i}`} />{' '}
            </svg>
          );
        })}
        <span className={legendFontStyle}>
          <FormattedMessage {...messages.heatmapLegendMore} />
        </span>
      </div>
    );
  };

  const getHeatmapClass = v => {
    const rate = v.count / maxValue;

    if (0.0 <= rate && rate < 0.25) {
      return 'heatmap-color-1';
    }

    if (0.25 <= rate && rate < 0.5) {
      return 'heatmap-color-2';
    }

    if (0.5 <= rate && rate < 0.75) {
      return 'heatmap-color-3';
    }

    if (0.75 <= rate && rate <= 1) {
      return 'heatmap-color-4';
    }
  };

  return (
    <div className="w-100 bg-white pv3 pr3 shadow-4">
      <div className="w-100 center">
        <CalendarHeatmap
          startDate={shiftDate(today, -365)}
          endDate={today}
          values={stats.contributionsByDay}
          classForValue={value => {
            if (!value) {
              return 'heatmap-color-0';
            }
            return getHeatmapClass(value);
          }}
          showWeekdayLabels={true}
          tooltipDataAttrs={value => {
            let val = intl.formatMessage(messages.heatmapNoContribution);
            if (value.count !== null) {
              val = `${value.count} ${
                value.count > 1
                  ? intl.formatMessage(messages.heatmapContributions)
                  : intl.formatMessage(messages.heatmapContribution)
              }`;
            }

            return {
              'data-tip': val,
            };
          }}
        />
        <ReactTooltip />
      </div>
      <HeatmapLegend />
    </div>
  );
};

export default injectIntl(ContributionTimeline);
