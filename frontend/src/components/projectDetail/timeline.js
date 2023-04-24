import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  TimeSeriesScale,
  Legend,
  Tooltip,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';
import { useIntl } from 'react-intl';

import messages from './messages';
import { formatTimelineData, formatTimelineTooltip } from '../../utils/formatChartJSData';
import { CHART_COLOURS } from '../../config';
import { useTimeDiff } from '../../hooks/UseTimeDiff';
import { xAxisTimeSeries } from '../../utils/chart';

ChartJS.register(
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  TimeSeriesScale,
  Legend,
  Tooltip,
);

export default function ProjectTimeline({ tasksByDay }: Object) {
  const intl = useIntl();
  const unit = useTimeDiff(tasksByDay);
  const mappedTasksConfig = {
    color: CHART_COLOURS.orange,
    label: intl.formatMessage(messages.mappedTasks),
  };
  const validatedTasksConfig = {
    color: CHART_COLOURS.red,
    label: intl.formatMessage(messages.validatedTasks),
  };

  return (
    <Line
      data={formatTimelineData(tasksByDay, mappedTasksConfig, validatedTasksConfig)}
      options={{
        plugins: {
          legend: { position: 'top', align: 'end', labels: { boxWidth: 12 } },
          tooltip: {
            callbacks: { label: (context) => formatTimelineTooltip(context, true) },
          },
        },
        scales: {
          y: { ticks: { beginAtZero: true } },
          x: { ...xAxisTimeSeries(unit) },
        },
      }}
    />
  );
}
