import { useEffect, useRef } from 'react';
import { FormattedMessage } from 'react-intl';
import { Chart } from 'chart.js/auto';
import PropTypes from 'prop-types';
import { parse, getDay } from 'date-fns';

import { CHART_COLOURS } from '../../config';
import { formatSecondsToTwoUnits } from './overview';
import { EmptySetIcon } from '../svgIcons';
import messages from './messages';

export const TimeSpentContributingByDay = ({ contributionTimeByDate = [] }) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const chartData = aggregateContributionTimeByWeekday();

    chartInstance.current = new Chart(chartRef.current.getContext('2d'), {
      type: 'bar',
      data: {
        labels: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        datasets: [
          {
            label: 'Time Spent',
            backgroundColor: `rgba(215, 63, 63, 0.4)`,
            borderWidth: 2,
            borderColor: CHART_COLOURS.red,
            data: chartData.map((entry) => entry.totalcontributionTime),
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        legend: { display: false },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function (value) {
                return formatSecondsToTwoUnits(value);
              },
              stepSize: 48 * 60,
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
      },
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const aggregateContributionTimeByWeekday = () => {
    const aggregatedData = {};
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Initialize aggregatedData with all weekdays
    weekdays.forEach((day, index) => {
      aggregatedData[index] = {
        weekday: day,
        totalcontributionTime: 0,
      };
    });

    contributionTimeByDate.forEach((item) => {
      const date = parse(item.date, 'yyyy-MM-dd', new Date());
      const weekdayIndex = getDay(date);

      aggregatedData[weekdayIndex].totalcontributionTime += item.totalcontributionTime;
    });

    // Convert to array and sort by weekday index
    return Object.entries(aggregatedData)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([_, value]) => value);
  };

  return (
    <div>
      <h3 className="f2 fw6 ttu barlow-condensed blue-dark mt0 pt2 mb4">
        <FormattedMessage {...messages.timeSpentContributingByDay} />
      </h3>

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

TimeSpentContributingByDay.propTypes = {
  contributionTimeByDate: PropTypes.arrayOf(
    PropTypes.shape({
      totalcontributionTime: PropTypes.number,
      date: PropTypes.string,
    }),
  ),
};
