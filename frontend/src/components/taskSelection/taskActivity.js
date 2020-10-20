import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { viewport } from '@mapbox/geo-viewport';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { useInterval } from '../../hooks/UseInterval';
import useFirstTaskActionDate from '../../hooks/UseFirstTaskActionDate';
import useGetContributors from '../../hooks/UseGetContributors';
import { RelativeTimeWithUnit } from '../../utils/formattedRelativeTime';
import { formatOSMChaLink } from '../../utils/osmchaLink';
import { htmlFromMarkdown, formatUserNamesToLink } from '../../utils/htmlFromMarkdown';
import { getIdUrl, sendJosmCommands } from '../../utils/openEditor';
import { formatOverpassLink } from '../../utils/overpassLink';
import { pushToLocalJSONAPI, fetchLocalJSONAPI } from '../../network/genericJSONRequest';
import { CurrentUserAvatar, UserAvatar } from '../user/avatar';
import { CloseIcon } from '../svgIcons';
import { ID_EDITOR_URL } from '../../config';
import { Button, CustomButton } from '../button';
import { Dropdown } from '../dropdown';
import { CommentInputField } from '../comments/commentInput';

const PostComment = ({ projectId, taskId, setCommentPayload }) => {
  const token = useSelector((state) => state.auth.get('token'));
  const [comment, setComment] = useState('');

  const pushComment = () => {
    pushToLocalJSONAPI(
      `projects/${projectId}/comments/tasks/${taskId}/`,
      JSON.stringify({ comment: comment }),
      token,
    ).then((res) => {
      setCommentPayload(res);
      setComment('');
    });
  };

  const saveComment = () => {
    if (comment) {
      pushComment();
    }
  };

  return (
    <div className="w-100 pt3 ph3-ns ph1">
      <div className="fl w-10">
        <CurrentUserAvatar className="h2 w2 fr mr2 br-100" />
      </div>
      <div className="fl w-70 f6">
        <CommentInputField comment={comment} setComment={setComment} enableHashtagPaste={true} />
      </div>
      <div className="w-20 fr pt3 tr">
        <Button onClick={() => saveComment()} className="bg-red white f6">
          <FormattedMessage {...messages.comment} />
        </Button>
      </div>
    </div>
  );
};

export const TaskHistory = ({ projectId, taskId, commentPayload }) => {
  const token = useSelector((state) => state.auth.get('token'));
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (commentPayload) {
      setHistory(commentPayload.taskHistory);
    }
  }, [commentPayload]);

  const getTaskInfo = useCallback(
    (projectId, taskId, token) =>
      fetchLocalJSONAPI(`projects/${projectId}/tasks/${taskId}/`, token).then((res) =>
        setHistory(res.taskHistory),
      ),
    [],
  );

  useEffect(() => {
    if (commentPayload === undefined && projectId && taskId && token) {
      getTaskInfo(projectId, taskId, token);
    }
  }, [projectId, taskId, token, commentPayload, getTaskInfo]);

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

  if (!history) {
    return null;
  } else {
    return history.map((t, n) => (
      <div className="w-90 mh3 pv3 bb b--grey-light f6 cf" key={n}>
        <div className="fl w-10-ns w-100 mr2 tr">
          <UserAvatar
            username={t.actionBy}
            picture={t.pictureUrl}
            colorClasses="white bg-blue-grey"
          />
        </div>
        <div className="w-80-ns w-100 fl">
          <p className="ma0 pt2">
            <a href={'/users/' + t.actionBy} className="blue-dark b underline">
              {t.actionBy}
            </a>{' '}
            {getTaskActionMessage(t.action, t.actionText)}{' '}
            <RelativeTimeWithUnit date={t.actionDate} />
          </p>
          {t.action === 'COMMENT' ? (
            <p
              className="ma0 mt2 blue-grey markdown-content"
              dangerouslySetInnerHTML={htmlFromMarkdown(formatUserNamesToLink(t.actionText))}
            ></p>
          ) : null}
        </div>
      </div>
    ));
  }
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

  if (history && history.taskHistory && history.taskHistory.length > 0) {
    return (
      <Dropdown
        onAdd={() => {}}
        onRemove={() => {}}
        onChange={() => {}}
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
  const token = useSelector((state) => state.auth.get('token'));
  // use it to hide the reset task action button
  const [resetSuccess, setResetSuccess] = useState(false);
  const [commentPayload, setCommentPayload] = useState(null);

  const getHistory = useCallback(
    () =>
      fetchLocalJSONAPI(`projects/${project.projectId}/tasks/${taskId}/`, token)
        .then((res) => setCommentPayload(res))
        .catch((e) => console.log(e)),
    [project.projectId, taskId, token],
  );

  useEffect(() => {
    if (token && project.projectId && taskId) {
      getHistory();
    }
  }, [project.projectId, taskId, token, getHistory]);
  // update the task history each 60 seconds
  useInterval(() => getHistory(), 60000);

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
            {project.projectInfo && project.projectInfo.name ? (
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
      <div className="blue-dark overflow-scroll vh-50">
        <TaskHistory
          projectId={project.projectId}
          taskId={taskId}
          commentPayload={commentPayload}
        />
      </div>
      <PostComment
        projectId={project.projectId}
        taskId={taskId}
        setCommentPayload={setCommentPayload}
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
      onAdd={() => {}}
      onRemove={() => {}}
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
