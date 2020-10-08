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
import { EditsStats } from '../components/projectStats/edits';

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
  // To fix: set this URL with an ENV VAR later
  const [errorEdits, loadingEdits, edits] = useFetch(
    `https://osm-stats-production-api.azurewebsites.net/stats/${
      project && project.changesetComment && project.changesetComment.replace('#', '').split(' ')[0]
    }`,
    project && project.changesetComment !== undefined,
  );

  return (
    <ReactPlaceholder
      showLoadingAnimation={true}
      rows={26}
      ready={!error && !loading}
      className="pr3"
    >
      <div className="cf bg-tan">
        <div className="w-100 fl pv3 ph2 ph4-ns bg-white blue-dark">
          <ProjectHeader project={project} showEditLink={true} />
        </div>
        <div className="w-100 fl">
          <React.Suspense fallback={<div className={`w7 h5`}>Loading...</div>}>
            <TasksByStatus stats={tasksByStatus} />
          </React.Suspense>
        </div>
        <div className="w-100 fl">
          <React.Suspense fallback={<div className={`w7 h5`}>Loading...</div>}>
            <ReactPlaceholder
              showLoadingAnimation={true}
              rows={5}
              delay={500}
              ready={!errorEdits && !loadingEdits}
            >
              <EditsStats data={edits} />
            </ReactPlaceholder>
          </React.Suspense>
        </div>
        <div className="w-100 fl pb4">
          <React.Suspense fallback={<div className={`w7 h5`}>Loading...</div>}>
            <ReactPlaceholder
              showLoadingAnimation={true}
              rows={7}
              delay={500}
              ready={!contributorsError && !contributorsLoading}
            >
              <ContributorsStats contributors={contributors} />
            </ReactPlaceholder>
          </React.Suspense>
        </div>
        <div className="w-100 mb2 fl ph2 ph4-ns">
          <h3 className="barlow-condensed ttu f3">
            <FormattedMessage {...messages.projectTimeline} />
          </h3>
          <div className="bg-white pv3 ph2 fl w-100 shadow-4">
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
        </div>
        <div className="w-100 fl bg-tan pb3 mb4">
          <TimeStats id={id} />
        </div>
      </div>
    </ReactPlaceholder>
  );
}

export default ProjectStats;
