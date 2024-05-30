import React from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { FormattedMessage, useIntl } from 'react-intl';

import statusMessages from '../taskSelection/messages';
import messages from './messages';
import { formatChartData, formatTooltip } from '../../utils/formatChartJSData';
import { TASK_COLOURS } from '../../config';
import { StatsCardContent } from '../statsCard';

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const TasksByStatus = ({ stats }) => {
  const intl = useIntl();
  const getLabel = (status) => intl.formatMessage(statusMessages[`taskStatus_${status}`]);

  let reference = [
    {
      label: getLabel('INVALIDATED'),
      field: 'invalidated',
      backgroundColor: TASK_COLOURS.INVALIDATED,
      borderColor: TASK_COLOURS.INVALIDATED,
    },
    {
      label: getLabel('READY'),
      field: 'ready',
      backgroundColor: TASK_COLOURS.READY,
    },
    {
      label: getLabel('LOCKED_FOR_MAPPING'),
      field: 'lockedForMapping',
      backgroundColor: TASK_COLOURS.LOCKED_FOR_MAPPING,
      borderColor: '#929db3',
    },
    {
      label: getLabel('MAPPED'),
      field: 'mapped',
      backgroundColor: TASK_COLOURS.MAPPED,
      borderColor: TASK_COLOURS.MAPPED,
    },
    {
      label: getLabel('LOCKED_FOR_VALIDATION'),
      field: 'lockedForValidation',
      backgroundColor: TASK_COLOURS.LOCKED_FOR_VALIDATION,
      borderColor: '#929db3',
    },
    {
      label: getLabel('VALIDATED'),
      field: 'validated',
      backgroundColor: TASK_COLOURS.VALIDATED,
      borderColor: TASK_COLOURS.VALIDATED,
    },
    {
      label: getLabel('BADIMAGERY'),
      field: 'badImagery',
      backgroundColor: TASK_COLOURS.BADIMAGERY,
      borderColor: TASK_COLOURS.BADIMAGERY,
    },
  ];
  const data = formatChartData(reference, stats);

  return (
    <div className="cf w-100 mb3 ph2 ph4-ns bg-tan blue-dark">
      <h3 className="barlow-condensed ttu f3">
        <FormattedMessage {...messages.status} />
      </h3>
      <div className="cf w-100">
        <div className="w-third-ns w-100 fl pv3">
          <Doughnut
            data={data}
            options={{
              aspectRatio: 2,
              plugins: {
                legend: { position: 'right', labels: { boxWidth: 12 } },
                tooltip: { callbacks: { label: (context) => formatTooltip(context) } },
              },
            }}
          />
        </div>
        <div className="w-two-thirds-ns w-100 fl pv3">
          {reference.map((status, n) => (
            <StatsCardContent
              key={n}
              value={stats[status.field]}
              label={status.label}
              className="w-25-ns w-50 fl tc pt3 pb4"
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default TasksByStatus;
