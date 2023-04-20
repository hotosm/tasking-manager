import { useState, useMemo, Suspense } from 'react';
import { useSelector } from 'react-redux';

import { viewport } from '@placemarkio/geo-viewport';
import { FormattedMessage } from 'react-intl';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import ReactPlaceholder from 'react-placeholder';

import messages from './messages';
import useFirstTaskActionDate from '../../hooks/UseFirstTaskActionDate';
import useGetContributors from '../../hooks/UseGetContributors';
import { RelativeTimeWithUnit } from '../../utils/formattedRelativeTime';
import { formatOSMChaLink } from '../../utils/osmchaLink';
import { htmlFromMarkdown, formatUserNamesToLink } from '../../utils/htmlFromMarkdown';
import { getTaskContributors } from '../../utils/getTaskContributors';
import { getIdUrl, sendJosmCommands } from '../../utils/openEditor';
import { formatOverpassLink } from '../../utils/overpassLink';
import { pushToLocalJSONAPI } from '../../network/genericJSONRequest';
import { UserAvatar } from '../user/avatar';
import { CloseIcon } from '../svgIcons';
import { ID_EDITOR_URL } from '../../config';
import { Button, CustomButton } from '../button';
import { Dropdown } from '../dropdown';
import { useTaskDetail } from '../../api/projects';
import { Alert } from '../alert';
import { MessageStatus } from '../comments/status';
import { postTaskComment } from '../../api/questionsAndComments';

import './styles.scss';
import ReactPlaceholder from 'react-placeholder';

const CommentInputField = React.lazy(() =>
  import('../comments/commentInput' /* webpackChunkName: "commentInput" */),
);

const PostComment = ({ projectId, taskId, contributors, setCommentPayload }) => {
  const token = useSelector((state) => state.auth.token);
  const locale = useSelector((state) => state.preferences['locale']);
  const [comment, setComment] = useState('');

  const saveComment = () => {
    if (comment) {
      mutation.mutate({ message: comment });
    }
  };

  const mutation = useMutation({
    mutationFn: () => postTaskComment(projectId, taskId, comment, token, locale),
    onSuccess: (res) => {
      setCommentPayload(res.data);
      setComment('');
    },
  });

  return (
    <div className="w-100 pt3 ph3-ns ph1 flex flex-column">
      <Suspense fallback={<ReactPlaceholder showLoadingAnimation={true} rows={12} delay={300} />}>
        <CommentInputField
          comment={comment}
          setComment={setComment}
          enableHashtagPaste
          contributors={contributors}
          enableContributorsHashtag
          isShowUserPicture
          isShowTabNavs
        />
      </Suspense>
      <div className="ml-auto mb5 flex flex-column gap-1 items-end">
        <Button
          onClick={() => saveComment()}
          className="bg-red white f6"
          loading={mutation.isLoading}
          disabled={!comment}
        >
          <FormattedMessage {...messages.comment} />
        </Button>
        <MessageStatus status={mutation.status} comment={comment} />
      </div>
    </div>
  );
};

export const TaskHistory = ({ projectId, taskId }) => {
  const [historyOption, setHistoryOption] = useState('Comments');
  const { data: commentPayload, status } = useTaskDetail(projectId, taskId);

  const history = commentPayload?.taskHistory;
  const taskComments = commentPayload?.taskHistory.filter((t) => t.action === 'COMMENT');
  const taskChanges = commentPayload?.taskHistory.filter((t) => t.action !== 'COMMENT');

  let shownHistory;
  if (historyOption === 'Comments') {
    shownHistory = taskComments;
  } else if (historyOption === 'Activities') {
    shownHistory = taskChanges;
  } else {
    shownHistory = history;
  }

  const taskHistoryOptions = [
    { value: 'Comments', label: 'Comments' },
    { value: 'Activities', label: 'Activities' },
    { value: 'All', label: 'All' },
  ];

  const groupBySession = () => {
    if (shownHistory.length === 0) return;
    let res = [];
    let username = shownHistory[0].actionBy;

    shownHistory.forEach((history) => {
      if (history.actionBy === username) {
        res.length === 0 ? res.push([history]) : res[res.length - 1].push(history);
      } else {
        username = history.actionBy;
        res.push([history]);
      }
    });
    return res;
  };

  if (status === 'loading') {
    return (
      <div className="ma4">
        <ReactPlaceholder type="media" showLoadingAnimation delay={300} />
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="ma4 gray">
        <Alert type="error">
          <FormattedMessage {...messages.taskDetailFetchError} />
        </Alert>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="ma4 dark-gray tc">
        <FormattedMessage {...messages.noActivitiesToDisplay} />
      </div>
    );
  }
  return (
    <>
      <div className="ml3 pl1 pv2 blue-dark flex flex-wrap" aria-label="view task history options">
        {taskHistoryOptions.map((option) => (
          <label className="pt1 pr3 fl w-15" key={option.value}>
            <input
              value={option.value}
              checked={historyOption === option.value}
              onChange={() => setHistoryOption(option.value)}
              type="radio"
              className={`radio-input input-reset pointer v-mid dib h2 w2 mr2 br-100 ba b--blue-light`}
            />
            <FormattedMessage {...messages[`taskHistory${option.label}`]} />
          </label>
        ))}
      </div>
      <div className="timeline-container">
        {/* This can handle displaying a messaage for the no comments section
        because no activities will be handled earlier */}
        {shownHistory.length === 0 ? (
          <div className="ma4 dark-gray tc">
            <FormattedMessage {...messages.noCommentsYet} />
          </div>
        ) : (
          groupBySession()?.map((grouped, n) => (
            <div
              key={grouped[0].historyId}
              className={`grouped-ctr session ph3 mt4 bb b--grey-light`}
            >
              {grouped.map((history, n) => (
                <div className="flex activity relative" key={history.historyId}>
                  <div className="flex justify-center">
                    {n === 0 ? (
                      <UserAvatar
                        username={grouped[0].actionBy}
                        picture={grouped[0].pictureUrl}
                        colorClasses="white bg-blue-grey z-1 relative"
                      />
                    ) : (
                      <div className="oval z-1" />
                    )}
                  </div>
                  <div className="mh2 f6 blue-dark" style={{ marginTop: '-2px' }}>
                    <p className="ma0 blue-grey">
                      {n === 0 && (
                        <div className="mt2 dib">
                          <a
                            href={'/users/' + history.actionBy}
                            className="blue-dark b no-underline underline-hover"
                          >
                            {history.actionBy}
                          </a>
                          &nbsp;
                        </div>
                      )}
                      {getTaskActionMessage(history.action, history.actionText)}{' '}
                      <RelativeTimeWithUnit date={history.actionDate} />
                    </p>
                    {history.action === 'COMMENT' && (
                      <div
                        className="ma0 comment"
                        dangerouslySetInnerHTML={htmlFromMarkdown(
                          formatUserNamesToLink(history.actionText),
                        )}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </>
  );
};

export const TaskDataDropdown = ({ history, changesetComment, bbox }: Object) => {
  const firstDate = useFirstTaskActionDate(history);
  const contributors = useGetContributors(history);
  const osmchaLink = useMemo(
    () =>
      formatOSMChaLink({
        aoiBBOX: bbox,
        created: firstDate,
        usernames: contributors(),
        changesetComment: changesetComment,
      }),
    [bbox, firstDate, contributors, changesetComment],
  );

  if (history?.taskHistory?.length > 0) {
    return (
      <Dropdown
        value={null}
        options={[
          { label: <FormattedMessage {...messages.taskOnOSMCha} />, href: osmchaLink },
          {
            label: <FormattedMessage {...messages.overpassVisualization} />,
            href: formatOverpassLink(contributors(), bbox),
          },
          {
            label: <FormattedMessage {...messages.overpassDownload} />,
            href: formatOverpassLink(contributors(), bbox, true),
          },
        ]}
        display={<FormattedMessage {...messages.taskData} />}
        className="blue-dark bg-white v-mid pv2 ph2 ba b--grey-light link"
      />
    );
  } else {
    return <></>;
  }
};

export const TaskActivity = ({
  taskId,
  status,
  project,
  bbox,
  close,
  updateActivities,
  userCanValidate,
}: Object) => {
  const token = useSelector((state) => state.auth.token);
  const userDetails = useSelector((state) => state.auth.userDetails);
  // use it to hide the reset task action button
  const [resetSuccess, setResetSuccess] = useState(false);
  const queryClient = useQueryClient();

  const { data: commentPayload } = useTaskDetail(project.projectId, taskId, true);

  const uniqueContributors =
    commentPayload?.taskHistory &&
    getTaskContributors(commentPayload.taskHistory, userDetails.username);

  const setCommentPayload = (payload) => {
    queryClient.setQueryData(['task-detail', project.projectId, taskId], { data: payload });
  };

  const resetTask = () => {
    pushToLocalJSONAPI(
      `projects/${project.projectId}/tasks/actions/undo-last-action/${taskId}/`,
      {},
      token,
    ).then((res) => {
      setCommentPayload(res);
      if (updateActivities !== undefined) updateActivities(project.projectId);
      setResetSuccess(true);
    });
  };

  return (
    <div className="h-100 bg-white">
      <div className="w-100 pt2 pb3 pl4 pr2 blue-dark bg-tan relative">
        <CloseIcon className="h1 w1 fr pointer" onClick={() => close()} />
        <div className="f5 pa0 ma0 cf">
          <div className="w-40-l w-100 fl pt2">
            <p className="ttu f3 pa0 ma0 barlow-condensed b mb2">
              <FormattedMessage {...messages.taskActivity} values={{ n: taskId }} />
            </p>
            {project.projectInfo?.name ? (
              <span>
                <b>#{project.projectId}</b>: {project.projectInfo.name}
              </span>
            ) : (
              <FormattedMessage {...messages.projectId} values={{ id: project.projectId }} />
            )}
          </div>
          <div className="w-60-l w-100 fl tr pr3 pt2">
            {userCanValidate && (
              <div className="ph1 dib">
                {['VALIDATED', 'BADIMAGERY'].includes(status) && (
                  <EditorDropdown bbox={bbox} taskId={taskId} project={project} />
                )}
              </div>
            )}
            <div className="ph1 dib">
              {bbox && project.changesetComment && (
                <TaskDataDropdown
                  history={commentPayload}
                  bbox={bbox}
                  changesetComment={project.changesetComment}
                />
              )}
            </div>
          </div>
          <div className="fl tr w-100 pt2 pr3">
            {userCanValidate && ['VALIDATED', 'BADIMAGERY'].includes(status) && !resetSuccess && (
              <UndoLastTaskAction resetFn={resetTask} status={status} />
            )}
          </div>
        </div>
      </div>
      <div className="blue-dark overflow-y-auto vh-50">
        <TaskHistory projectId={project.projectId} taskId={taskId} />
      </div>
      <PostComment
        projectId={project.projectId}
        taskId={taskId}
        setCommentPayload={setCommentPayload}
        contributors={uniqueContributors}
      />
    </div>
  );
};

function EditorDropdown({ project, taskId, bbox }: Object) {
  const loadTaskOnEditor = (arr) => {
    if (arr[0].value === 'ID') {
      let windowObjectReference = window.open('', `iD-${project.projectId}-${taskId}`);
      const { center, zoom } = viewport(bbox, [window.innerWidth, window.innerHeight]);
      windowObjectReference.location.href = getIdUrl(
        project,
        center,
        zoom,
        [taskId],
        ID_EDITOR_URL,
      );
    }
    if (arr[0].value === 'JOSM') {
      sendJosmCommands(project, {}, [taskId], [window.innerWidth, window.innerHeight], bbox);
    }
  };

  return (
    <Dropdown
      options={[
        { label: 'iD Editor', value: 'ID' },
        { label: 'JOSM', value: 'JOSM' },
      ]}
      value={[]}
      display={<FormattedMessage {...messages.openEditor} />}
      className="bg-white b--grey-light ba pa2 dib v-mid"
      onChange={loadTaskOnEditor}
    />
  );
}

function UndoLastTaskAction({ status, resetFn }: Object) {
  const [showConfirmation, setShowConfirmation] = useState(false);

  return (
    <>
      {showConfirmation ? (
        <>
          <span className="dib pb2">
            <FormattedMessage {...messages[`confirmRevert${status}`]} />
            <span className="fw6">
              {' '}
              <FormattedMessage {...messages.proceed} />
            </span>
          </span>
          <CustomButton
            className="mh1 dib link ph3 f6 pv2 bg-white blue-dark ba b--white"
            onClick={() => setShowConfirmation(false)}
          >
            <FormattedMessage {...messages.no} />
          </CustomButton>
          <CustomButton
            className="mh1 dib link ph3 f6 pv2 bg-red white ba b--red"
            onClick={() => {
              resetFn();
              setShowConfirmation(false);
            }}
          >
            <FormattedMessage {...messages.yes} />
          </CustomButton>
        </>
      ) : (
        <CustomButton
          className="mh1 link ph3 f6 pv2 bg-red white ba b--red"
          onClick={() => setShowConfirmation(true)}
        >
          <FormattedMessage {...messages[`revert${status}`]} />
        </CustomButton>
      )}
    </>
  );
}

const getTaskActionMessage = (action, actionText) => {
  let message = '';
  switch (action) {
    case 'COMMENT':
      message = messages.taskHistoryComment;
      break;
    case 'LOCKED_FOR_MAPPING':
      message = messages.taskHistoryLockedMapping;
      break;
    case 'LOCKED_FOR_VALIDATION':
      message = messages.taskHistoryLockedValidation;
      break;
    case 'AUTO_UNLOCKED_FOR_MAPPING':
      message = messages.taskHistoryAutoUnlockedMapping;
      break;
    case 'AUTO_UNLOCKED_FOR_VALIDATION':
      message = messages.taskHistoryAutoUnlockedValidation;
      break;
    case 'EXTENDED_FOR_MAPPING':
      message = messages.taskHistoryExtendedForMapping;
      break;
    case 'EXTENDED_FOR_VALIDATION':
      message = messages.taskHistoryExtendedForValidation;
      break;
    case 'STATE_CHANGE':
      switch (actionText) {
        case 'BADIMAGERY':
          message = messages.taskHistoryBadImagery;
          break;
        case 'MAPPED':
          message = messages.taskHistoryMapped;
          break;
        case 'VALIDATED':
          message = messages.taskHistoryValidated;
          break;

        case 'INVALIDATED':
          message = messages.taskHistoryInvalidated;
          break;
        case 'SPLIT':
          message = messages.taskHistorySplit;
          break;
        case 'READY':
          message = messages.taskHistoryReady;
          break;
        default:
          break;
      }
      break;
    default:
      break;
  }
  if (message) {
    return <FormattedMessage {...message} />;
  }
};
