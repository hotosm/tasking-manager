import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
  TimeSeriesScale,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';
import { useIntl } from 'react-intl';

import messages from '../projectDetail/messages';
import { CHART_COLOURS } from '../../config';
import { useTimeDiff } from '../../hooks/UseTimeDiff';
import { formatTasksStatsData, formatTimelineTooltip } from '../../utils/formatChartJSData';
import { xAxisTimeSeries } from '../../utils/chart';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend, TimeSeriesScale);

const TasksStatsChart = ({ stats }) => {
  const intl = useIntl();
  const unit = useTimeDiff(stats);

  const mappedTasksConfig = {
    color: CHART_COLOURS.orange,
    label: intl.formatMessage(messages.mappedTasks),
  };
  const validatedTasksConfig = {
    color: CHART_COLOURS.red,
    label: intl.formatMessage(messages.validatedTasks),
  };
  const options = {
    plugins: {
      legend: { position: 'top', align: 'end', labels: { boxWidth: 12 } },
      tooltip: {
        callbacks: { label: (context) => formatTimelineTooltip(context, false) },
      },
    },
    scales: {
      y: {
        stacked: true,
        ticks: {
          beginAtZero: true,
        },
      },
      x: {
        stacked: true,
        ...xAxisTimeSeries(unit),
      },
    },
  };
  return (
    <Bar
      data={formatTasksStatsData(stats, mappedTasksConfig, validatedTasksConfig)}
      options={options}
    />
  );
};

export default TasksStatsChart;
