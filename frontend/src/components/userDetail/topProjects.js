import React from 'react';
import { FormattedMessage } from 'react-intl';
import messages from './messages';

const ProgressBar = ({ percent, barWidth }) => {
  const barHeight = '0.5em';

  return (
    <div
      style={{ height: barHeight, width: barWidth }}
      className="w-90 bg-grey-light br-pill relative mt2"
    >
      <div
        style={{ height: barHeight, width: `${percent * 100}%` }}
        className="bg-red br-pill absolute"
      ></div>
    </div>
  );
};

export const ListElements = ({ data, valueField, nameField, barWidth }) => {
  let maxValues = null;
  if (barWidth === true) {
    const values = data.map(d => d[valueField]);
    maxValues = Math.max(...values);
  }

  return (
    <ol className="pa0">
      {data.map((p, i) => {
        let barWidth = '100%';
        if (maxValues !== null) {
          const percent = (p[valueField] / maxValues) * 100;
          barWidth = `${percent}%`;
        }
        return (
          <li key={p.id} className="w-100 flex pv3">
            <div className="w-100 mr4">
              <p className="ma0 f7 b">{p[nameField]}</p>
              <ProgressBar percent={p.percent} barWidth={barWidth} />
            </div>
            <div className="w-30 tl self-end">
              <p className="ma0 f7">
                <span className="b mr1">{p[valueField]}</span>
                <span className="blue-grey">
                  <FormattedMessage {...messages.tasks} />
                </span>
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
};

export const TopProjects = ({ user }) => {
  const projects = user.projects.read();

  const compare = (a, b) => {
    if (a.total < b.total) {
      return 1;
    }
    if (a.total > b.total) {
      return -1;
    }
    return 0;
  };

  const data = projects.mappedProjects
    .map(p => {
      return {
        id: p.projectId,
        name: p.name,
        mapped: p.tasksMapped,
        validated: p.tasksValidated,
        total: p.tasksMapped + p.tasksValidated,
      };
    })
    .sort(compare)
    .slice(0, 5);

  const tasksNo = data.map(d => d.total);
  const maxTaskNo = Math.max(...tasksNo);

  const tasksPercent = data.map(d => {
    return { ...d, percent: d.total / maxTaskNo };
  });

  return (
    <div>
      <h3 className="f4 blue-dark mt0 fw6 pt3">
        <FormattedMessage {...messages.topProjectsMappedTitle} />
      </h3>
      <ListElements data={tasksPercent} valueField={'total'} nameField={'name'} />
    </div>
  );
};
