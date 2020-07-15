import React from 'react';
import ReactPlaceholder from 'react-placeholder';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { useFetch } from '../hooks/UseFetch';
import { useTasksByStatus } from '../hooks/UseProjectCompletenessCalc';
import { useSetTitleTag } from '../hooks/UseMetaTags';
import { ProjectHeader } from '../components/projectDetail/header';
import { TimeStats } from '../components/projectStats/timeStats';
import { CompletionStats } from '../components/projectStats/completion';

const ContributorsStats = React.lazy(() => import('../components/projectStats/contributorsStats'));
const TasksByStatus = React.lazy(() => import('../components/projectStats/taskStatus'));
const ProjectTimeline = React.lazy(() => import('../components/projectDetail/timeline'));

export function ProjectStats({ id }: Object) {
  useSetTitleTag(`Project #${id} Stats`);
  const [error, loading, project] = useFetch(`projects/${id}/queries/summary/`, id);
  // eslint-disable-next-line
  const [errorTasks, loadingTasks, tasks] = useFetch(`projects/${id}/tasks/`, id);
  const tasksByStatus = useTasksByStatus(tasks);
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
      ready={!error && !loading}
      className="pr3"
    >
      <div className="pt3 cf bg-white blue-dark">
        <div className="w-100 fl ph2 ph4-ns">
          <ProjectHeader project={project} showEditLink={true} />
        </div>
        <div className="w-100 fl mt3 bg-tan">
          <React.Suspense fallback={<div className={`w7 h5`}>Loading...</div>}>
            <TasksByStatus stats={tasksByStatus} />
          </React.Suspense>
        </div>
        <div className="w-100 fl pb3">
          <React.Suspense fallback={<div className={`w7 h5`}>Loading...</div>}>
            <ReactPlaceholder
              showLoadingAnimation={true}
              rows={3}
              delay={500}
              ready={!contributorsError && !contributorsLoading}
            >
              <ContributorsStats contributors={contributors} />
            </ReactPlaceholder>
          </React.Suspense>
        </div>
        <div className="w-100 mb4 fl ph2 ph4-ns">
          <h3 className="barlow-condensed ttu f3">
            <FormattedMessage {...messages.projectTimeline} />
          </h3>
          <div className="w-100 w-50-l fl">
            <React.Suspense fallback={<div className={`w7 h5`}>Loading...</div>}>
              <ReactPlaceholder
                showLoadingAnimation={true}
                rows={3}
                delay={500}
                ready={!visualError && !visualLoading}
              >
                <ProjectTimeline tasksByDay={visualData.stats} />
              </ReactPlaceholder>
            </React.Suspense>
          </div>
          <div className="w-100 w-50-l fl">
            <CompletionStats tasksByStatus={tasksByStatus} />
          </div>
        </div>
        <div className="w-100 fl bg-tan pb3">
          <TimeStats id={id} />
        </div>
      </div>
    </ReactPlaceholder>
  );
}
