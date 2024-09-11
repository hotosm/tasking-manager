import { useEffect, useRef } from 'react';
import { FormattedMessage } from 'react-intl';
import Chart from 'chart.js/auto';

import messages from './messages';

export const SwipesByOrganisation = () => {
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
        labels: [
          'American Red Cross',
          'Arizona State University',
          'HOT',
          'Médecins Sans Frontières',
          'Others',
        ],
        datasets: [
          {
            data: [35, 25, 20, 15, 5],
            backgroundColor: [
              'rgba(255, 159, 64, 0.8)', // Orange for American Red Cross
              'rgba(255, 205, 86, 0.8)', // Yellow for Arizona State University
              'rgba(75, 192, 192, 0.8)', // Green for HOT
              'rgba(54, 162, 235, 0.8)', // Blue for Médecins Sans Frontières
              'rgba(201, 203, 207, 0.8)', // Grey for Others
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
            labels: {
              boxWidth: 15,
              padding: 15,
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
    <div style={{ width: '48%' }}>
      <h3 className="f2 fw6 ttu barlow-condensed blue-dark mt0 pt2 mb4">
        <FormattedMessage {...messages.swipesByOrganization} />
      </h3>

      <div className="bg-white pa4 shadow-6" style={{ height: '550px' }}>
        <canvas ref={chartRef}></canvas>
      </div>
    </div>
  );
};
