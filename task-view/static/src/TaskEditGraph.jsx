import React from "react";

import './css/TaskEditGraph.scss';

const width = 200;
const height = 30;
const x = d3.scaleLinear().domain([0, 8]).range([0, width]);
const r = d3.scaleSqrt().domain([20, 100]).range([4, 15]).clamp(true);
const color = d3.scaleOrdinal()
  .domain(['machine', 'editor', 'reviewer'])
  .range(['#979797', '#4F7EFF', '#FC7373']);

const rectWidth = 15;

const newLength = d => {
  var total = 0;
  Object.keys(d.data.lengths).forEach(k => {
    if (k.startsWith('new')) {
      total += d.data.lengths[k];
    }
  });
  return total;
}

export default class TaskEditGraph extends React.Component {

  render() {
    var { edits } = this.props;

    var elements = edits.map((e, i) => {
            let len = newLength(e);
            let h = r(len);
            return <g key={i} transform={`translate(${i * (rectWidth + 2)}, 0)`}>
                     <rect
                      key={i}
                      x={-rectWidth/2}
                      y={height - h}
                      width={rectWidth}
                      height={h}
                      fill={color(e.role)} />
                      <text y={height - h - 3} fill={color(e.role)}>{Math.round(len)}</text>
                    </g>
          });
    return (
      <svg className="task-edit-graph">
        <g transform='translate(10, 0)'>
        { elements }
        </g>
      </svg>
     );
  }
}
