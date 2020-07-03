import React from 'react';
import { Link } from '@reach/router';
import { FormattedMessage } from 'react-intl';

import messages from './messages';

const ProgressBar = ({ percent }) => {
  const barHeight = '0.5em';

  return (
    <div className="w-100 relative mt2">
      <div
        style={{ height: barHeight, width: `${percent * 100}%` }}
        className="bg-red br-pill absolute"
      ></div>
    </div>
  );
};

export const ListElements = ({ data, valueField, nameField, linkBase, linkField }) => {
  return (
    <ol className="pa0 mt1 mb0">
      {data.map((p, i) => {
        return (
          <li key={i} className="w-100 flex pv3">
            <div className="w-100 mr4">
              <p className="ma0 f7 b">
                {linkBase ? (
                  <Link className="link blue-dark" to={`${linkBase}${p[linkField]}`}>
                    {p[nameField]}
                  </Link>
                ) : (
                  p[nameField]
                )}
              </p>
              <ProgressBar percent={p.percent} />
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

export const TopProjects = ({ projects }) => {
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
    .map((p) => {
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

  const tasksNo = data.map((d) => d.total);
  const maxTaskNo = Math.max(...tasksNo);

  const tasksPercent = data.map((d) => {
    return { ...d, percent: d.total / maxTaskNo };
  });

  return (
    <div className="pv2 ph3 bg-white blue-dark shadow-4">
      <h3 className="f4 mv0 fw6 pt3">
        <FormattedMessage {...messages.topProjectsMappedTitle} />
      </h3>
      <ListElements
        data={tasksPercent}
        valueField={'total'}
        nameField={'name'}
        linkBase={'/projects/'}
        linkField={'id'}
      />
    </div>
  );
};
