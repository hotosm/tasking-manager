import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { CHART_COLOURS } from '../../config';
import { formatChartData, formatTooltip } from '../../utils/formatChartJSData';

export const EditsByNumbers = ({ osmStats }) => {
  let reference = [
    { label: 'Building', field: 'total_building_count_add', backgroundColor: CHART_COLOURS.red },
    { label: 'Roads', field: 'total_road_km_add', backgroundColor: CHART_COLOURS.green },
    {
      label: 'Points of interests',
      field: 'total_poi_count_add',
      backgroundColor: CHART_COLOURS.orange,
    },
    { label: 'Waterways', field: 'total_waterway_count_add', backgroundColor: CHART_COLOURS.blue },
  ];

  const data = formatChartData(reference, osmStats);

  return (
    <div className="pb3 ph3 pt2 bg-white blue-dark shadow-4">
      <h3 className="f4 mt0 fw6 pt3">
        <FormattedMessage {...messages.editsTitle} />
      </h3>
      <Doughnut
        data={data}
        options={{
          legend: { position: 'bottom' },
          tooltips: { callbacks: { label: (tooltip, data) => formatTooltip(tooltip, data) } },
        }}
      />
    </div>
  );
};
