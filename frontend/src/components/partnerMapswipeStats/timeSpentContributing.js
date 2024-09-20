import { useState, useEffect, useRef } from 'react';
import { FormattedMessage } from 'react-intl';
import { Chart } from 'chart.js/auto';
import 'chartjs-adapter-date-fns';
import PropTypes from 'prop-types';
import { parse, format } from 'date-fns';

import { CHART_COLOURS } from '../../config';
import { formatSecondsToTwoUnits } from './overview';
import { EmptySetIcon } from '../svgIcons';
import messages from './messages';

export const TimeSpentContributing = ({ contributionTimeByDate = [] }) => {
  const [chartDistribution, setChartDistribution] = useState('day'); // "day" or "month"
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  const aggregateTimeSpentContributingByMonth = (data) => {
    const aggregatedData = {};

    data.forEach((item) => {
      const date = parse(item.date, 'yyyy-MM-dd', new Date());
      const monthKey = format(date, 'yyyy-MM');

      if (!aggregatedData[monthKey]) {
        aggregatedData[monthKey] = {
          date: format(date, 'MMM yyyy'),
          totalcontributionTime: 0,
        };
      }

      aggregatedData[monthKey].totalcontributionTime += item.totalcontributionTime;
    });

    return Object.values(aggregatedData).sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  useEffect(() => {
    if (!chartRef.current) return;

    const context = chartRef.current.getContext('2d');
    if (!chartInstance.current) {
      chartInstance.current = new Chart(context, {
        type: 'line',
        data: getChartDataConfig(),
        options: getChartOptions(),
      });
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (chartInstance.current) {
      chartInstance.current.data = getChartDataConfig();
      chartInstance.current.options = getChartOptions();
      chartInstance.current.update();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chartDistribution]);

  const getChartDataConfig = () => {
    const context = chartRef.current.getContext('2d');
    // Create gradient for the area
    const gradient = context.createLinearGradient(0, 0, 0, 450);
    gradient.addColorStop(0, `rgba(215, 63, 63, 0.5)`);
    gradient.addColorStop(1, 'rgba(215, 63, 63, 0)');

    const data =
      chartDistribution === 'day'
        ? contributionTimeByDate
        : aggregateTimeSpentContributingByMonth(contributionTimeByDate);

    return {
      labels: data.map((entry) => entry.date),
      datasets: [
        {
          label: 'Time Spent',
          backgroundColor: gradient,
          borderColor: CHART_COLOURS.red,
          borderWidth: 1.5,
          data: data.map((entry) => entry.totalcontributionTime),
          fill: true,
          tension: 0.4,
        },
      ],
    };
  };

  const getChartOptions = () => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      legend: { display: false },
      scales: {
        x:
          chartDistribution === 'day'
            ? {
                type: 'time',
                time: {
                  unit: 'day',
                  tooltipFormat: 'MMM d, yyyy',
                },
              }
            : {},
        y: {
          beginAtZero: true,
          ticks: {
            callback: function (value) {
              return formatSecondsToTwoUnits(value);
            },
            stepSize: 36 * 60,
          },
        },
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: function (context) {
              const value = context.parsed.y;
              return formatSecondsToTwoUnits(value);
            },
          },
        },
      },
    };
  };

  return (
    <div>
      <div className="flex items-center justify-between mb4">
        <h3 className="f2 fw6 ttu barlow-condensed blue-dark mt0 pt2 mb0">
          <FormattedMessage {...messages.timeSpentContributing} />
        </h3>
        <div>
          <button
            className={`ph4 pv2 ba b--black-20 br--none pointer br2 br--left ${
              chartDistribution === 'day' ? 'bg-blue-grey white' : 'bg-white hover-bg-near-white'
            }`}
            onClick={() => setChartDistribution('day')}
          >
            <FormattedMessage {...messages.timeSpentContributingDayOption} />
          </button>
          <button
            className={`ph4 pv2 ba b--black-20 pointer br2 br--right ${
              chartDistribution === 'month' ? 'bg-blue-grey white' : 'bg-white hover-bg-near-white'
            }`}
            onClick={() => setChartDistribution('month')}
          >
            <FormattedMessage {...messages.timeSpentContributingMonthOption} />
          </button>
        </div>
      </div>

      <div className="bg-white pa4 shadow-6 relative" style={{ width: '100%', height: '550px' }}>
        <canvas ref={chartRef}></canvas>
        {contributionTimeByDate.length === 0 && (
          <div className="absolute top-0 left-0 right-0 bottom-0 flex items-center justify-center flex-column">
            <EmptySetIcon className="red o2" width={30} height={30} />
            <p>No data found</p>
          </div>
        )}
      </div>
    </div>
  );
};

TimeSpentContributing.propTypes = {
  contributionTimeByDate: PropTypes.arrayOf(
    PropTypes.shape({
      totalcontributionTime: PropTypes.number,
      date: PropTypes.string,
    }),
  ),
};
