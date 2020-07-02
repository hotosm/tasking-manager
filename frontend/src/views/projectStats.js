import React from 'react';
import ReactPlaceholder from 'react-placeholder';

import { useFetch } from '../hooks/UseFetch';
import { ProjectHeader } from '../components/projectDetail/header';
import { ProjectInfoPanel } from '../components/projectDetail/infoPanel';

const TaskLineGraphViz = React.lazy(() => import('../components/projectDetail/taskLineGraphViz'));

export function ProjectStats({ id }: Object) {
  const [error, loading, project] = useFetch(`projects/${id}/queries/summary/`, id);
  // eslint-disable-next-line
  const [errorTasks, loadingTasks, tasks] = useFetch(`projects/${id}/tasks/`, id);
  const [contributorsError, contributorsLoading, contributors] = useFetch(
    `projects/${id}/contributions/`,
    id,
  );
  const [visualError, visualLoading, visualData] = useFetch(
    `projects/${id}/contributions/queries/day/`,
    id,
  );

  return (
    <ReactPlaceholder
      showLoadingAnimation={true}
      rows={26}
      ready={!error && !contributorsError && !loading && !contributorsLoading}
      className="pr3"
    >
      <div className="ph2 ph4-ns pv3 cf bg-white blue-dark">
        <div className="w-100 w-60-l fl">
          <ProjectHeader project={project} showEditLink={true} />
          <div className="relative pt2">
            <ProjectInfoPanel
              project={project}
              tasks={tasks}
              contributors={contributors.userContributions}
              type="detail"
            />
          </div>
        </div>
        <div className="w-100 w-40-l fr">
          <React.Suspense fallback={<div className={`w7 h5`}>Loading...</div>}>
            <ReactPlaceholder
              showLoadingAnimation={true}
              rows={3}
              delay={500}
              ready={!visualError && !visualLoading}
            >
              <TaskLineGraphViz percentDoneVisData={visualData} />
            </ReactPlaceholder>
          </React.Suspense>
        </div>
      </div>
    </ReactPlaceholder>
  );
}
