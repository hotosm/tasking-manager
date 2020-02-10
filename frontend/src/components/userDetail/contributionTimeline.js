import React from 'react';
import CalendarHeatmap from 'react-calendar-heatmap';
import ReactTooltip from 'react-tooltip';
import { FormattedMessage, injectIntl } from 'react-intl';
import messages from './messages';

const ContributionTimeline = props => {
  const { intl } = props;

  const today = new Date();

  const shiftDate = (date, numDays) => {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() + numDays);
    return newDate;
  };

  const countValues = props.userStats.contributionsByDay.map(r => {
    return r.count;
  });
  const maxValue = Math.max(...countValues);

  const HeatmapLegend = () => {
    const indexes = [30, 50, 70, 100];

    const legendFontStyle = 'ph2 f7 blue-grey ttc';
    return (
      <div className="nt4-ns w-100 cf tr fr">
        <span className={legendFontStyle}>
          <FormattedMessage {...messages.heatmapLegendLess} />
        </span>
        <div className={`dib h1 w1 bg-tan`}></div>
        {indexes.map(i => {
          return <div key={i} className={`dib h1 w1 bg-red o-${i}`}></div>;
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

  return (
    <div className="w-100 cf bg-white pv3 pr3 shadow-4">
      <div className="w-100 fl cf center">
        <CalendarHeatmap
          startDate={shiftDate(today, -365)}
          endDate={today}
          values={props.userStats.contributionsByDay}
          classForValue={value => {
            if (!value) {
              return 'fill-tan';
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
