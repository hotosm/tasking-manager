import { useEffect, useRef } from 'react';
import { FormattedMessage } from 'react-intl';
import Chart from 'chart.js/auto';

import { CHART_COLOURS } from '../../config';
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
              CHART_COLOURS.red, // Orange for American Red Cross
              CHART_COLOURS.orange, // Yellow for Arizona State University
              CHART_COLOURS.green, // Green for HOT
              CHART_COLOURS.blue, // Blue for Médecins Sans Frontières
              CHART_COLOURS.gray, // Gray for Others
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
    <div style={{ width: '48.5%' }}>
      <h3 className="f2 fw6 ttu barlow-condensed blue-dark mt0 pt2 mb4">
        <FormattedMessage {...messages.swipesByOrganization} />
      </h3>

      <div className="bg-white pa4 shadow-6" style={{ height: '550px' }}>
        <canvas ref={chartRef}></canvas>
      </div>
    </div>
  );
};
