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

    const chartData = [],
      labelsData = [],
      backgroundColors = [];

    contributionsByProjectType.forEach((stat) => {
      if (['build_area', 'buildarea'].includes(stat.projectType.toLowerCase())) {
        const contributionsCount = stat.totalcontributions || 0;
        if (contributionsCount > 0) {
          chartData.push(contributionsCount);
          labelsData.push('Find');
          backgroundColors.push(CHART_COLOURS.orange);
        }
      } else if (['foot_print', 'footprint'].includes(stat.projectType.toLowerCase())) {
        const contributionsCount = stat.totalcontributions || 0;
        if (contributionsCount > 0) {
          chartData.push(contributionsCount);
          labelsData.push('Validate');
          backgroundColors.push(CHART_COLOURS.green);
        }
      } else if (['change_detection', 'changedetection'].includes(stat.projectType.toLowerCase())) {
        const contributionsCount = stat.totalcontributions || 0;
        if (contributionsCount > 0) {
          chartData.push(contributionsCount);
          labelsData.push('Compare');
          backgroundColors.push(CHART_COLOURS.blue);
        }
      }
    });

    const context = chartRef.current.getContext('2d');

    chartInstance.current = new Chart(context, {
      type: 'doughnut',
      data: {
        labels: labelsData,
        datasets: [
          {
            data: chartData,
            backgroundColor: backgroundColors,
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
    <div className="mapswipe-stats-piechart">
      <h3 className="f2 fw6 ttu barlow-condensed blue-dark mt0 pt2 mb4">
        <FormattedMessage {...messages.swipesByProjectType} />
      </h3>

      <div className="bg-white pa4 shadow-6 relative" style={{ height: '450px' }}>
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
