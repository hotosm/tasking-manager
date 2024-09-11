import { useEffect, useRef } from 'react';
import { FormattedMessage } from 'react-intl';
import Chart from 'chart.js/auto';

import { CHART_COLOURS } from '../../config';
import messages from './messages';

export const SwipesByProjectType = () => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    if (!chartRef.current) return;

    const context = chartRef.current.getContext('2d');

    chartInstance.current = new Chart(context, {
      type: 'doughnut',
      data: {
        labels: ['Find', 'Validate'],
        datasets: [
          {
            data: [75, 25],
            backgroundColor: [
              CHART_COLOURS.orange, // Orange for Find
              CHART_COLOURS.green, // Green for Validate
              CHART_COLOURS.blue, // Blue for Compare
            ],
            borderColor: '#fff',
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
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
    <div style={{ width: '48.5%' }}>
      <h3 className="f2 fw6 ttu barlow-condensed blue-dark mt0 pt2 mb4">
        <FormattedMessage {...messages.swipesByProjectType} />
      </h3>

      <div className="bg-white pa4 shadow-6" style={{ height: '550px' }}>
        <canvas ref={chartRef}></canvas>
      </div>
    </div>
  );
};
