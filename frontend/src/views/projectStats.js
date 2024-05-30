import React from 'react';
import { useParams } from 'react-router-dom';
import ReactPlaceholder from 'react-placeholder';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { useTasksByStatus } from '../hooks/UseProjectCompletenessCalc';
import { useSetTitleTag } from '../hooks/UseMetaTags';
import { ProjectHeader } from '../components/projectDetail/header';
import { TimeStats } from '../components/projectStats/timeStats';
import { CompletionStats } from '../components/projectStats/completion';
import { EditsStats } from '../components/projectStats/edits';
import { retrieveDefaultChangesetComment } from '../utils/defaultChangesetComment';
import {
  useProjectContributionsQuery,
  useProjectSummaryQuery,
  useProjectTimelineQuery,
  useTasksQuery,
} from '../api/projects';
import { useOsmHashtagStatsQuery } from '../api/stats';
import { Alert } from '../components/alert';

const ContributorsStats = React.lazy(() => import('../components/projectStats/contributorsStats'));
const TasksByStatus = React.lazy(() => import('../components/projectStats/taskStatus'));
const ProjectTimeline = React.lazy(() => import('../components/projectDetail/timeline'));

export function ProjectStats() {
  const { id } = useParams();
  useSetTitleTag(`Project #${id} Stats`);
  const { data: project, status: projectStatus } = useProjectSummaryQuery(id, {
    useErrorBoundary: true,
  });
  const { data: tasks, status: tasksStatus } = useTasksQuery(id);
  const tasksByStatus = useTasksByStatus(tasks);
  const { data: contributions, status: contributionsStatus } = useProjectContributionsQuery(id);
  const { data: timelineData, status: timelineDataStatus } = useProjectTimelineQuery(id);
  const defaultComment = project && retrieveDefaultChangesetComment(project.changesetComment, id);
  const { data: edits, status: editsStatus } = useOsmHashtagStatsQuery(defaultComment);

  return (
    <ReactPlaceholder
      showLoadingAnimation={true}
      rows={26}
      ready={projectStatus === 'success'}
      className="pa4-ns"
    >
      <div className="cf bg-tan">
        <div className="w-100 fl pv3 ph2 ph4-ns bg-white blue-dark">
          <ProjectHeader project={project} showEditLink={true} />
        </div>
        <div className="w-100 fl">
          {tasksStatus === 'loading' && (
            <ReactPlaceholder showLoadingAnimation={true} rows={5} delay={500} ready={false} />
          )}
          {tasksStatus === 'error' && (
            <Alert type="error">
              <FormattedMessage {...messages.tasksStatsError} />
            </Alert>
          )}
          {tasksStatus === 'success' && (
            <React.Suspense fallback={<div className={`w7 h5`}>Loading...</div>}>
              <TasksByStatus stats={tasksByStatus} />
            </React.Suspense>
          )}
        </div>
        {defaultComment?.[0] && (
          <div className="w-100 fl">
            {editsStatus === 'loading' && (
              <ReactPlaceholder showLoadingAnimation={true} rows={5} delay={500} ready={false} />
            )}
            {editsStatus === 'error' && (
              <Alert type="error">
                <FormattedMessage {...messages.editsStatsError} />
              </Alert>
            )}
            {editsStatus === 'success' && (
              <React.Suspense fallback={<div className={`w7 h5`}>Loading...</div>}>
                <EditsStats data={edits} />
              </React.Suspense>
            )}
          </div>
        )}
        <div className="w-100 fl pb4">
          {contributionsStatus === 'error' && (
            <Alert type="error">
              <FormattedMessage {...messages.contributionsStatsError} />
            </Alert>
          )}
          {contributionsStatus === 'loading' && (
            <ReactPlaceholder showLoadingAnimation={true} rows={7} delay={500} ready={false} />
          )}
          {contributionsStatus === 'success' && (
            <React.Suspense fallback={<div className={`w7 h5`}>Loading...</div>}>
              <ContributorsStats contributors={contributions} />
            </React.Suspense>
          )}
        </div>
        <div className="w-100 mb2 fl ph2 ph4-ns">
          <h3 className="barlow-condensed ttu f3">
            <FormattedMessage {...messages.projectTimeline} />
          </h3>
          <div className="bg-white pv3 ph2 fl w-100 shadow-4">
            <div className="w-100 w-50-l fl">
              {timelineDataStatus === 'loading' && (
                <ReactPlaceholder
                  showLoadingAnimation={true}
                  rows={3}
                  delay={500}
                  ready={timelineDataStatus === 'success'}
                />
              )}
              {timelineDataStatus === 'error' && (
                <Alert type="error">
                  <FormattedMessage {...messages.timelineDataError} />
                </Alert>
              )}
              {timelineDataStatus === 'success' && (
                <React.Suspense fallback={<div className={`w7 h5`}>Loading...</div>}>
                  <ProjectTimeline tasksByDay={timelineData} />
                </React.Suspense>
              )}
            </div>
            <div className="w-100 w-50-l fl">
              {tasksStatus === 'error' && (
                <Alert type="error">
                  <FormattedMessage {...messages.tasksStatsError} />
                </Alert>
              )}
              {tasksStatus === 'loading' && (
                <ReactPlaceholder showLoadingAnimation={true} rows={5} delay={500} ready={false} />
              )}
              {tasksStatus === 'success' && <CompletionStats tasksByStatus={tasksByStatus} />}
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
