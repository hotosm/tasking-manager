import React from 'react';
import ResponsiveOrdinalFrame from 'semiotic/lib/OrdinalFrame';
import { FormattedMessage } from 'react-intl';

import messages from './messages';

const Legend = ({ data, oAccessor }) => {
  const size = '1.5em';

  return (
    <ul className="list ma0 pa0 f6 pt3">
      {data.map((d, n) => {
        return (
          <li key={n} className="w-100 flex mv3 items-center ttc">
            <svg style={{ width: size, height: size }} className="mr2">
              <rect width={size} height={size} className={d.classColor} />
            </svg>
            {d[oAccessor]}
          </li>
        );
      })}
    </ul>
  );
};

export const DonutChart = ({ data, oAccessor, dynamicColumnWidth }) => {
  const values = data.map(d => d[dynamicColumnWidth]);
  const total = values.reduce((a, b) => a + b, 0);

  const dataPercent = data.map(d => {
    return { ...d, percent: Math.round((d[dynamicColumnWidth] / total) * 100) };
  });

  const frameProps = {
    data: dataPercent,
    size: [150, 150],
    type: { type: 'bar', innerRadius: 40 },
    projection: 'radial',
    dynamicColumnWidth: dynamicColumnWidth,
    oAccessor: oAccessor,
    pieceClass: d => d.classColor,
    pieceHoverAnnotation: true,
    tooltipContent: d => {
      return (
        <div>
          <div className="br2 bg-blue-dark white ph3 pv2 f7 center flex">
            <div className="orange mr2 b">{`${d.percent}%`}</div>
            <div className="ttc"> {d[oAccessor]}</div>
          </div>
        </div>
      );
    },
  };

  return (
    <div>
      <div className="center w-50">
        <ResponsiveOrdinalFrame {...frameProps} />
      </div>
      <Legend data={data} oAccessor={oAccessor} />
    </div>
  );
};

export const EditsByNumbers = ({ user }) => {
  const osmStats = user.osmStats.read();

  let data = [
    { feature: 'Building', field: 'total_building_count_add', classColor: 'fill-green' },
    { feature: 'Roads', field: 'total_road_km_add', classColor: 'fill-red' },
    { feature: 'Points of interests', field: 'total_poi_count_add', classColor: 'fill-yellow' },
    { feature: 'Waterways', field: 'total_waterway_count_add', classColor: 'fill-blue' },
  ];

  data = data.map(f => {
    return { ...f, edits: osmStats[f.field] };
  });

  return (
    <div className="pb3 ph3 pt2 bg-white blue-dark shadow-4">
      <h3 className="f4 mt0 fw6 pt3">
        <FormattedMessage {...messages.editsTitle} />
      </h3>

      <DonutChart data={data} oAccessor={'feature'} dynamicColumnWidth={'edits'} />
    </div>
  );
};
