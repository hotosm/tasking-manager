import { Link } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';
import ReactPlaceholder from 'react-placeholder';
import 'react-placeholder/lib/reactPlaceholder.css';

import messages from './messages';
import { RelativeTimeWithUnit } from '../../utils/formattedRelativeTime';
import { TaskStatus } from '../taskSelection/taskList';
import { PaginatorLine } from '../paginator';
import { SwitchToggle } from '../formInputs';

export function AssignedTaskCard({
  projectId,
  projectName,
  taskId,
  taskStatus,
  stage,
  assigneeType,
  teamName,
  assignedBy,
  assignedDate,
}: Object) {
  const taskLink = `/projects/${projectId}/tasks?search=${taskId}`;
  return (
    <article className="db base-font bg-white w-75-l w-100 mb1 mh2 blue-dark mw8">
      <div className="pv3 ph3 ba br1 b--grey-light cf">
        <div className="w-third-ns w-100 fl">
          <Link to={taskLink} className="no-underline link blue-dark dib">
            <h4 className="mv0 fw6 f5">
              <FormattedMessage
                {...messages.projectTask}
                values={{ task: taskId, project: projectId }}
              />
            </h4>
          </Link>
          {projectName && <div className="pt1 blue-grey f6 truncate">{projectName}</div>}
        </div>
        <div className="w-third-ns w-100 fl pv2">
          <span className="fw6">
            <FormattedMessage {...messages.assignedForStage} values={{ stage }} />
          </span>
          {assigneeType === 'TEAM' && teamName && (
            <span className="blue-grey f6 pl2">
              <FormattedMessage {...messages.assignedViaTeam} values={{ team: teamName }} />
            </span>
          )}
          <div className="pt1 blue-grey f6">
            <FormattedMessage
              {...messages.assignedByUser}
              values={{ user: assignedBy, time: <RelativeTimeWithUnit date={assignedDate} /> }}
            />
          </div>
        </div>
        <div className="w-third-ns w-100 fl pv2">
          <TaskStatus status={taskStatus} />
        </div>
      </div>
    </article>
  );
}

export function AssignedTasks({ data, isLoading, isError, pendingOnly, setPendingOnly, setPage }) {
  const tasks = data?.tasks || [];
  const pagination = data?.pagination;
  return (
    <div>
      <div className="mv3 ml2">
        <SwitchToggle
          label={<FormattedMessage {...messages.showCompletedAssignments} />}
          labelPosition="right"
          isChecked={!pendingOnly}
          onChange={() => setPendingOnly(!pendingOnly)}
        />
      </div>
      {isError && (
        <div className="bg-tan pa4 mt3">
          <FormattedMessage {...messages.assignedTasksError} />
        </div>
      )}
      <div className="cf db">
        <ReactPlaceholder showLoadingAnimation ready={!isLoading} type="media" rows={10}>
          {!isError && tasks.length === 0 && (
            <div className="mb3 ml2 blue-grey">
              <FormattedMessage {...messages.noAssignedTasks} />
            </div>
          )}
          {tasks.map((task) => (
            <AssignedTaskCard key={`${task.projectId}-${task.taskId}-${task.stage}`} {...task} />
          ))}
        </ReactPlaceholder>
      </div>
      {pagination && pagination.pages > 1 && (
        <PaginatorLine
          activePage={pagination.page}
          lastPage={pagination.pages}
          setPageFn={setPage}
          className="flex items-center pt2"
        />
      )}
    </div>
  );
}
