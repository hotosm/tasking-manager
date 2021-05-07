import React from 'react';
// import { FormattedMessage } from 'react-intl';

// import messages from './messages';
import { BarChartItem } from '../userDetail/barListChart';

export const OrganisationProjectStats = ({ projects }) => {
  const totalProjects = projects ? projects.draft + projects.published + projects.archived : 0;
  return (
    <div className="pv2 ph3 bg-white blue-dark shadow-4">
      {projects && (
        <>
          <h3 className="f4 mv0 fw6 pt3">{totalProjects} created projects</h3>
          <ol className="pa0 mt1 mb2">
            {projects.published > 0 && (
              <BarChartItem
                name={'Published'}
                percentValue={projects.published / totalProjects}
                number={`${projects.published} projects`}
              />
            )}
            {projects.archived > 0 && (
              <BarChartItem
                name={'Archived'}
                percentValue={projects.archived / totalProjects}
                number={`${projects.archived} projects`}
              />
            )}
            {projects.draft > 0 && (
              <BarChartItem
                name={'Draft'}
                percentValue={projects.draft / totalProjects}
                number={`${projects.draft} projects`}
              />
            )}
            {projects.stale > 0 && (
              <BarChartItem
                name={'Stale'}
                percentValue={projects.stale / totalProjects}
                number={`${projects.stale} projects`}
              />
            )}
            {projects.recent > 0 && (
              <BarChartItem
                name={'Recent'}
                percentValue={projects.recent / totalProjects}
                number={`${projects.recent} projects`}
              />
            )}
          </ol>
        </>
      )}
    </div>
  );
};
