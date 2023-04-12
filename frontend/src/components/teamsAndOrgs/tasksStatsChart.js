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
import { enUS } from 'date-fns/locale';
import { formatISO } from 'date-fns';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend, TimeSeriesScale);

/**
 * x axis configuration common between this and {@link ../projectDetail/timeline.js}
 * @param unit The base unit for the axis
 * @typedef {import('chart.js').ScaleOptionsByType} ScaleOptionsByType
 * @returns {ScaleOptionsByType} The options to use for x axis configuration
 */
export function xAxis(unit) {
  return {
    type: 'timeseries',
    adapters: { date: { locale: enUS } },
    time: {
      unit: unit,
      tooltipFormat: enUS.formatLong.date,
    },
    ticks: {
      source: 'labels',
      callback: (value, index, ticks) => formatISO(ticks[index].value, { representation: 'date' }),
    },
  };
}

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
        ...xAxis(unit),
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
