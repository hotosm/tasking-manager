import React from 'react';
import { FormattedMessage } from 'react-intl';
import XYFrame from 'semiotic/lib/XYFrame';
import { scaleTime } from 'd3-scale';
import { curveStepAfter } from 'd3-shape';
import { group } from 'd3-array';

import messages from './messages';

const theme = [
  '#ac58e5',
  '#E0488B',
  '#9fd0cb',
  '#e0d33a',
  '#7566ff',
  '#533f82',
  '#7a255d',
  '#365350',
  '#a19a11',
  '#3f4482',
];

const frameProps = {
  size: [700, 400],
  margin: { left: 80, bottom: 90, right: 10, top: 40 },
  xScaleType: scaleTime(),
  xAccessor: function(e) {
    return new Date(e.date);
  },
  yAccessor: 'percent',
  yExtent: [0],
  lineType: { type: 'line', interpolator: curveStepAfter },
  lineStyle: (d, i) => ({
    stroke: theme[i],
    strokeWidth: 2,
    fill: theme[i],
    fillOpacity: 0.3,
  }),
  title: (
    <text textAnchor="middle">
      Tasks that were <tspan fill={'#ac58e5'}>Mapped</tspan> vs{' '}
      <tspan fill={'#E0488B'}>Validated</tspan>
    </text>
  ),
  axes: [
    {
      orient: 'left',
      label: 'Percent of Tasks (before any splits)',
      tickFormat: function(e) {
        return e + '';
      },
    },
    {
      orient: 'bottom',
      tickFormat: function(e, i) {
        let year = '';
        if (i === 0) {
          year = '/' + ('' + e.getFullYear()).substring(2, 4);
        }
        return e.getMonth() + 1 + '/' + e.getDate() + year;
      },
      label: { name: 'Date', locationDistance: 50 },
      ticks: 10
    },
  ],
};

export default props => {
  const inData = props.percentDoneVisData && props.percentDoneVisData.stats;

  if (!inData || inData.length === 0) {
    return <div className="f5 red pb4 pt2 ph4">
        <FormattedMessage {...messages.timelineNotAvailable}/>
    </div>;
  }
  /* separate validated and mapped into their own leaf objects: */
  const prepTaskDays = group(
    inData
      .map(n => ({
        date: n.date,
        count: n.mapped,
        type: 'mapped',
        cumulative: n.cumulative_mapped,
        percent: ((n.cumulative_mapped / n.total_tasks) * 100).toFixed(2),
        totalTasks: n.total_tasks,
      }))
      .concat(
        inData.map(n => ({
          date: n.date,
          count: n.validated,
          type: 'validated',
          cumulative: n.cumulative_validated,
          percent: ((n.cumulative_validated / n.total_tasks) * 100).toFixed(2),
          totalTasks: n.total_tasks,
        })),
      ),
    d => d.type,
  );

  /* reformat "": [{...}] to title:"",coordinates:[{...}] */
  const taskDaysSemioticLineGraph = Array.from(prepTaskDays).map(entry => ({
    title: entry[0],
    coordinates: entry[1],
  }));

  return (
    <XYFrame
      lines={taskDaysSemioticLineGraph}
      hoverAnnotation={[
        // The intersection line, with respect to the x axis
        { type: 'x', disable: ['connector', 'note'] },
        // The coincident points with radius = 5px
        { type: 'vertical-points', threshold: 0.1, r: () => 5 },
        // The body/window of the tooltip
        { type: 'frame-hover' },
      ]}
      tooltipContent={d => (
        <div className="z-1 w4 w4-m w5-l bg-black ba br2 b--blue-dark pa2 shadow-5 tooltip-content">
          <p className="f6 lh-copy near-black ma0 white f7 fw4 ttc">
            {console.log(d)}
            {d.parentLine.title}: {d.count} ({d.percent}% before splits)
          </p>
          <p className="f6 lh-copy near-black ma0 white f7 fw4">Date: {d.date.toString()}</p>
        </div>
      )}
      {...frameProps}
    />
  );
};
