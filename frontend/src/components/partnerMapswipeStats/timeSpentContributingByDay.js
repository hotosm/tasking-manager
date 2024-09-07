import { useEffect, useRef } from 'react';
import { FormattedMessage } from 'react-intl';
import { Chart } from 'chart.js/auto';

import messages from './messages';

const MOCK_DATA = [
  { x: 'Sun', y: 15 * 60 + 16 }, // 15 hours 16 minutes
  { x: 'Mon', y: 30 * 60 }, // 1 day 6 hours
  { x: 'Tue', y: 45 * 60 }, // 1 day 21 hours
  { x: 'Wed', y: 61 * 60 }, // 2 days 13 hours
  { x: 'Thu', y: 61 * 60 }, // 2 days 13 hours
  { x: 'Fri', y: 45 * 60 }, // 1 day 21 hours
  { x: 'Sat', y: 15 * 60 + 16 }, // 15 hours 16 minutes
];

export const TimeSpentContributingByDay = () => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const timeSpentData = [];
    for (const data of MOCK_DATA) {
      timeSpentData.push(data.y);
    }

    chartInstance.current = new Chart(chartRef.current.getContext('2d'), {
      type: 'bar',
      data: {
        labels: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        datasets: [
          {
            label: 'Time Spent',
            backgroundColor: '#d73f3f',
            data: timeSpentData,
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
              stepSize: 24 * 60, // One day
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
        <FormattedMessage {...messages.timeSpentContributingByDay} />
      </h3>

      <div className="bg-white pa4 shadow-6" style={{ width: '100%', height: '550px' }}>
        <canvas ref={chartRef}></canvas>
      </div>
    </div>
  );
};
