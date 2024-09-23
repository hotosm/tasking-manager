import { useEffect, useRef } from 'react';
import { FormattedMessage } from 'react-intl';
import Chart from 'chart.js/auto';
import PropTypes from 'prop-types';

import { CHART_COLOURS } from '../../config';
import { EmptySetIcon } from '../svgIcons';
import messages from './messages';

export const SwipesByProjectType = ({ contributionsByProjectType = [] }) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    if (!chartRef.current) return;

    const labelData = [];
    const data = {
      find: {
        totalcontributions: 0,
      },
      validate: {
        totalcontributions: 0,
      },
      compare: {
        totalcontributions: 0,
      },
    };

    contributionsByProjectType.forEach((stat) => {
      if (['build_area', 'buildarea'].includes(stat.projectType.toLowerCase())) {
        data.find.totalcontributions = stat.totalcontributions || 0;
        if (data.find.totalcontributions > 0) labelData.push('Find');
      } else if (['change_detection', 'changedetection'].includes(stat.projectType.toLowerCase())) {
        data.compare.totalcontributions = stat.totalcontributions || 0;
        if (data.compare.totalcontributions > 0) labelData.push('Compare');
      } else if (['foot_print', 'footprint'].includes(stat.projectType.toLowerCase())) {
        data.validate.totalcontributions = stat.totalcontributions || 0;
        if (data.validate.totalcontributions > 0) labelData.push('Validate');
      }
    });

    const chartData = [
      data.find.totalcontributions,
      data.validate.totalcontributions,
      data.compare.totalcontributions,
    ];

    const context = chartRef.current.getContext('2d');

    chartInstance.current = new Chart(context, {
      type: 'doughnut',
      data: {
        labels: labelData,
        datasets: [
          {
            data: chartData,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ width: '48.5%' }}>
      <h3 className="f2 fw6 ttu barlow-condensed blue-dark mt0 pt2 mb4">
        <FormattedMessage {...messages.swipesByProjectType} />
      </h3>

      <div className="bg-white pa4 shadow-6 relative" style={{ height: '550px' }}>
        <canvas ref={chartRef}></canvas>
        {contributionsByProjectType.length === 0 && (
          <div className="absolute top-0 left-0 right-0 bottom-0 flex items-center justify-center flex-column">
            <EmptySetIcon className="red" width={30} height={30} />
            <p>No data found</p>
          </div>
        )}
      </div>
    </div>
  );
};

SwipesByProjectType.propTypes = {
  contributionsByProjectType: PropTypes.arrayOf(
    PropTypes.shape({
      projectType: PropTypes.string,
      projectTypeDisplay: PropTypes.string,
      totalcontributions: PropTypes.numberstring,
    }),
  ),
};
