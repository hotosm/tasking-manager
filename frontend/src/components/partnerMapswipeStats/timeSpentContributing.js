import { useState, useEffect, useRef } from 'react';
import { FormattedMessage } from 'react-intl';
import { Chart } from 'chart.js/auto';
import 'chartjs-adapter-date-fns';

import { CHART_COLOURS } from '../../config';
import { Dropdown } from '../dropdown';
import messages from './messages';

const MOCK_DATA = [
  { date: '2024-01-02', minutesSpent: 10 },
  { date: '2024-01-29', minutesSpent: 40 },
  { date: '2024-02-26', minutesSpent: 120 },
  { date: '2024-03-26', minutesSpent: 180 },
  { date: '2024-04-24', minutesSpent: 230 },
  { date: '2024-05-23', minutesSpent: 350 },
  { date: '2024-06-21', minutesSpent: 90 },
  { date: '2024-07-18', minutesSpent: 60 },
  { date: '2024-09-06', minutesSpent: 45 },
];

export const TimeSpentContributing = () => {
  const [chartDistribution, setChartDistribution] = useState('day'); // "day" or "month"
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (!chartRef.current) return;

    const context = chartRef.current.getContext('2d');
    // Create gradient for the area
    const gradient = context.createLinearGradient(0, 0, 0, 450);
    gradient.addColorStop(0, CHART_COLOURS.red);
    gradient.addColorStop(0.4, CHART_COLOURS.red);
    gradient.addColorStop(1, 'rgba(215, 63, 63, 0)');

    if (!chartInstance.current) {
      chartInstance.current = new Chart(context, {
        type: 'line',
        data: {
          labels: MOCK_DATA.map((entry) => entry.date),
          datasets: [
            {
              label: 'Time Spent',
              backgroundColor: gradient,
              data: MOCK_DATA.map((entry) => entry.minutesSpent),
              fill: true,
              tension: 0.4,
            },
          ],
        },
        options: getChartOptions(),
      });
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, []);

  useEffect(() => {
    if (chartInstance.current) {
      chartInstance.current.options = getChartOptions();
      chartInstance.current.update();
    }
  }, [chartDistribution]);

  const getChartOptions = () => {
    const xAxisTime =
      chartDistribution === 'day'
        ? {
            unit: 'day',
            tooltipFormat: 'MMM d, yyyy',
          }
        : {
            unit: 'month',
            tooltipFormat: 'MMM, yyyy',
          };

    return {
      responsive: true,
      maintainAspectRatio: false,
      legend: { display: false },
      scales: {
        x: {
          type: 'time',
          time: xAxisTime,
        },
        y: {
          beginAtZero: true,
          ticks: {
            callback: function (value) {
              const days = Math.floor(value / (24 * 60));
              const hours = Math.floor((value % (24 * 60)) / 60);
              const minutes = value % 60;

              let label = '';
              if (days > 0) label += `${days} day${days > 1 ? 's' : ''} `;
              if (hours > 0 || days > 0) label += `${hours} hr${hours !== 1 ? 's' : ''}`;
              if (minutes > 0 && days === 0) label += ` ${minutes} min${minutes !== 1 ? 's' : ''}`;

              return label.trim();
            },
            stepSize: 60,
          },
        },
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: function (context) {
              const value = context.parsed.y;
              const days = Math.floor(value / (24 * 60));
              const hours = Math.floor((value % (24 * 60)) / 60);
              const minutes = value % 60;

              let label = 'Time Spent: ';
              if (days > 0) label += `${days} day${days > 1 ? 's' : ''} `;
              if (hours > 0 || days > 0) label += `${hours} hour${hours !== 1 ? 's' : ''} `;
              if (minutes > 0) label += `${minutes} minute${minutes !== 1 ? 's' : ''}`;

              return label.trim();
            },
          },
        },
      },
    };
  };

  const dropdownOptions = [
    {
      label: <FormattedMessage {...messages.timeSpentContributingDayOption} />,
      value: 'day',
    },
    {
      label: <FormattedMessage {...messages.timeSpentContributingMonthOption} />,
      value: 'month',
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb4">
        <h3 className="f2 fw6 ttu barlow-condensed blue-dark mt0 pt2 mb0">
          <FormattedMessage {...messages.timeSpentContributing} />
        </h3>
        <Dropdown
          onChange={(options) => setChartDistribution(options[0].value)}
          options={dropdownOptions}
          value={chartDistribution}
          className="ba b--grey-light bg-white mr1 v-mid pv2 ph2"
        />
      </div>

      <div className="bg-white pa4 shadow-6" style={{ width: '100%', height: '550px' }}>
        <canvas ref={chartRef}></canvas>
      </div>
    </div>
  );
};
