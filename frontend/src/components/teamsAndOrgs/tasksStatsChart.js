import React from 'react';
import { Bar } from 'react-chartjs-2';

import { CHART_COLOURS } from '../../config';
import { useTimeDiff } from '../../hooks/UseTimeDiff';
import { formatTasksStatsData, formatTimelineTooltip } from '../../utils/formatChartJSData';

const TasksStatsChart = ({ stats }) => {
  const unit = useTimeDiff(stats);
  const options = {
    legend: { position: 'top', align: 'end', labels: { boxWidth: 12 } },
    tooltips: {
      callbacks: { label: (tooltip, data) => formatTimelineTooltip(tooltip, data, false) },
    },
    scales: {
      yAxes: [
        {
          stacked: true,
          ticks: {
            beginAtZero: true,
          },
        },
      ],
      xAxes: [
        {
          stacked: true,
          type: 'time',
          time: { unit: unit },
        },
      ],
    },
  };
  return (
    <Bar
      data={formatTasksStatsData(stats, CHART_COLOURS.orange, CHART_COLOURS.red)}
      options={options}
    />
  );
};

export default TasksStatsChart;
