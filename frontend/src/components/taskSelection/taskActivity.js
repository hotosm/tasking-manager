import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { FormattedMessage, FormattedRelative } from 'react-intl';

import messages from './messages';
import { CloseIcon } from '../svgIcons';
import { CurrentUserAvatar, UserAvatar } from '../user/avatar';
import { pushToLocalJSONAPI, fetchLocalJSONAPI } from '../../network/genericJSONRequest';
import { Button } from '../button';

const PostComment = ({ projectId, taskId, setStat, setCommentPayload }) => {
  const token = useSelector(state => state.auth.get('token'));
  const [comment, setComment] = useState('');

  const pushComment = () => {
    pushToLocalJSONAPI(
      `projects/${projectId}/comments/tasks/${taskId}/`,
      JSON.stringify({ comment: comment }),
      token,
    ).then(res => {
      setStat(true);
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
    <>
      <div className="w-100 pt3 h4">
        <div className="fl w-10 pr2 pl4">
          <CurrentUserAvatar className="h2 w2 br-100" />
        </div>
        <div className="fl w-90 h-100 pr3">
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            name="comment"
            type="textarea"
            placeholder="Write a comment"
            className="w-100 h-75 pa2 f6"
            rows="4"
          />
        </div>
      </div>
      <div className="w-100 pb3 tr pr3">
        <Button onClick={() => saveComment()} className="bg-red white f6">
          <FormattedMessage {...messages.comment} />
        </Button>
      </div>
    </>
  );
};

const TaskHistory = ({ projectId, taskId, commentStat, setStat, commentPayload }) => {
  const token = useSelector(state => state.auth.get('token'));
  const [response, setResponse] = useState(null);

  useEffect(() => {
    const getTaskInfo = async () => {
      const url = `projects/${projectId}/tasks/${taskId}/`;
      const res = await fetchLocalJSONAPI(url, token);
      setResponse(res);
    };

    if (commentStat === true) {
      getTaskInfo();
      setStat(false);
    }
    if (commentPayload) {
      setResponse(commentPayload);
    }
  }, [projectId, taskId, token, commentStat, setStat, commentPayload]);

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

  if (response === null) {
    return null;
  } else {
    return response.taskHistory.map((t, n) => (
      <div className="w-90 mh3 pv3 bb b--grey-light f6 cf" key={n}>
        <div className="fl w-10-ns w-100 ph2">
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
            {<FormattedRelative value={t.actionDate} />}
          </p>
          {t.action === 'COMMENT' ? <p className="i ma0 mt2 blue-grey">{t.actionText}</p> : null}
        </div>
      </div>
    ));
  }
};

export const TaskActivity = props => {
  const [commentStat, setStat] = useState(true);
  const [commentPayload, setCommentPayload] = useState(null);

  return (
    <div className="h-100 bg-white">
      <div className="w-100 pv3 ph4 blue-dark bg-tan relative">
        <CloseIcon className="h1 w1 fr pointer" onClick={() => props.close()} />
        <p className="ttu f3 pa0 ma0 barlow-condensed b mb2">
          <FormattedMessage {...messages.taskActivity} />
        </p>
        <p className="f5 pa0 ma0">
          <b>#{props.taskId}:</b> {props.projectName}
        </p>
      </div>
      <div className="blue-dark h5 overflow-scroll">
        <TaskHistory
          projectId={props.projectId}
          taskId={props.taskId}
          commentStat={commentStat}
          setStat={setStat}
          commentPayload={commentPayload}
        />
      </div>
      <PostComment
        projectId={props.projectId}
        taskId={props.taskId}
        setStat={setStat}
        setCommentPayload={setCommentPayload}
      />
    </div>
  );
};
