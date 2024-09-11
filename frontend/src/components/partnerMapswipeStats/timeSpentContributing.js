import { useEffect, useRef } from 'react';
import { FormattedMessage } from 'react-intl';
import { Chart } from 'chart.js/auto';
import 'chartjs-adapter-date-fns';

import { CHART_COLOURS } from '../../config';
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
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const context = chartRef.current.getContext('2d');
    // Create gradient for the area
    const gradient = context.createLinearGradient(0, 0, 0, 450);
    gradient.addColorStop(0, CHART_COLOURS.red);
    gradient.addColorStop(0.4, CHART_COLOURS.red);
    gradient.addColorStop(1, 'rgba(215, 63, 63, 0)');

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
      options: {
        responsive: true,
        maintainAspectRatio: false,
        legend: { display: false },
        scales: {
          x: {
            type: 'time',
            time: {
              unit: 'day',
              tooltipFormat: 'MMM d, yyyy',
            },
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
                if (minutes > 0 && days === 0)
                  label += ` ${minutes} min${minutes !== 1 ? 's' : ''}`;

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
      },
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, []);

  return (
    <div>
      <h3 className="f2 fw6 ttu barlow-condensed blue-dark mt0 pt2 mb4">
        <FormattedMessage {...messages.timeSpentContributing} />
      </h3>

      <div className="bg-white pa4 shadow-6" style={{ width: '100%', height: '550px' }}>
        <canvas ref={chartRef}></canvas>
      </div>
    </div>
  );
};
