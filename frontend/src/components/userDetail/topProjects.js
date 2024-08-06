import React from 'react';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { BarListChart } from './barListChart';

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
    <div className="pv2 ph3 bg-white blue-dark shadow-6 h-100">
      <div className="ml2 mt1 mb4">
        <h3 className="f125 mv0 fw6 pt3">
          <FormattedMessage {...messages.topProjectsMappedTitle} />
        </h3>
        {data.length > 0 ? (
          <BarListChart
            data={tasksPercent}
            valueField={'total'}
            nameField={'name'}
            linkBase={'/projects/'}
            linkField={'id'}
          />
        ) : (
          <div className="h-100 tc pv5 mt3 blue-grey">
            <FormattedMessage {...messages.noTopProjectsData} />
          </div>
        )}
      </div>
    </div>
  );
};
