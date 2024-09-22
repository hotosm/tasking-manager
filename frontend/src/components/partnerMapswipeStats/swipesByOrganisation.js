import { useEffect, useRef } from 'react';
import { FormattedMessage } from 'react-intl';
import Chart from 'chart.js/auto';

import { CHART_COLOURS } from '../../config';
import messages from './messages';

function withGroupedLowContributors(contributionsByOrganization, keepTop = 4) {
  if (contributionsByOrganization.length <= keepTop) {
    return contributionsByOrganization;
  }

  contributionsByOrganization.sort((a, b) => b.totalcontributions - a.totalcontributions)
  const topContributors = contributionsByOrganization.slice(0, keepTop)
  const others = contributionsByOrganization.slice(keepTop)
    .reduce((acc, c) => ({ ...acc, totalcontributions: acc.totalcontributions + c.totalcontributions }),
      { organizationName: 'Others', totalcontributions: 0 })
  topContributors.push(others)
  return topContributors
}
export const SwipesByOrganisation = ({ contributionsByOrganization = [] }) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  contributionsByOrganization = withGroupedLowContributors(contributionsByOrganization)

  useEffect(() => {
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    if (!chartRef.current) return;

    const context = chartRef.current.getContext('2d');

    chartInstance.current = new Chart(context, {
      type: 'doughnut',
      data: {
        labels: contributionsByOrganization.map(c => c.organizationName),
        datasets: [
          {
            data: contributionsByOrganization.map(c => c.totalcontributions),
            backgroundColor: [
              CHART_COLOURS.red,
              CHART_COLOURS.orange,
              CHART_COLOURS.green,
              CHART_COLOURS.blue,
              CHART_COLOURS.gray,
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
