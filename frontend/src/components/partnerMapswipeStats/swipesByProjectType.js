import { useEffect, useRef } from 'react';
import { FormattedMessage } from 'react-intl';
import Chart from 'chart.js/auto';

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
              'rgba(255, 159, 64, 0.8)', // Orange for Find
              'rgba(152, 251, 152, 0.8)', // Light green for Validate
              'rgba(54, 162, 235, 0.8)', // Bue for Compare
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
    <div>
      <h3 className="f2 fw6 ttu barlow-condensed blue-dark mt0 pt2 mb4">
        <FormattedMessage {...messages.swipesByProjectType} />
      </h3>

      <div className="bg-white pa4 shadow-6" style={{ width: '100%', height: '550px' }}>
        <canvas ref={chartRef}></canvas>
      </div>
    </div>
  );
};
