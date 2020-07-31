import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { FormattedMessage, useIntl } from 'react-intl';

import messages from './messages';
import typesMessages from '../messages';
import { CHART_COLOURS } from '../../config';
import { formatChartData, formatTooltip } from '../../utils/formatChartJSData';

export const EditsByNumbers = ({ osmStats }) => {
  const intl = useIntl();
  let reference = [
    {
      label: intl.formatMessage(typesMessages.buildings),
      field: 'total_building_count_add',
      backgroundColor: CHART_COLOURS.red,
    },
    {
      label: intl.formatMessage(typesMessages.roads),
      field: 'total_road_km_add',
      backgroundColor: CHART_COLOURS.green,
    },
    {
      label: intl.formatMessage(typesMessages.pointsOfInterest),
      field: 'total_poi_count_add',
      backgroundColor: CHART_COLOURS.orange,
    },
    {
      label: intl.formatMessage(typesMessages.waterways),
      field: 'total_waterway_count_add',
      backgroundColor: CHART_COLOURS.blue,
    },
  ];

  const data = formatChartData(reference, osmStats);

  return (
    <div className="pb3 ph3 pt2 bg-white blue-dark shadow-4">
      <h3 className="f4 mv3 fw6">
        <FormattedMessage {...messages.editsTitle} />
      </h3>
      {Object.keys(osmStats).length ? (
        <Doughnut
          data={data}
          options={{
            legend: { position: 'right', labels: { boxWidth: 12 } },
            tooltips: { callbacks: { label: (tooltip, data) => formatTooltip(tooltip, data) } },
          }}
        />
      ) : (
        <div className="h-100 tc pv5 blue-grey">
          <FormattedMessage {...messages.noEditsData} />
        </div>
      )}
    </div>
  );
};
