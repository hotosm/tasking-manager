import React, { useState, useLayoutEffect } from 'react';
import { useSelector } from 'react-redux';
import { FormattedMessage, FormattedRelative } from 'react-intl';
import { CurrentUserAvatar } from '../user/avatar';
import { API_URL } from '../../config';
import messages from './messages';
import { Button } from '../button';

const PostComment = ({ token, projectId, taskId, setStat }) => {
  const [comment, setComment] = useState('');

  const saveComment = () => {
    const setComment = async () => {
      const url = `${API_URL}projects/${projectId}/comments/tasks/${taskId}/`;
      const headers = {
        'Content-Type': 'application/json',
        'Accept-Language': 'en',
        Authorization: `Token ${token}`,
      };

      const options = {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({ comment: comment }),
      };

      const res = await fetch(url, options);
      if (res.status === 200) {
        setStat(true);
      }
    };

    if (comment !== '') {
      setComment();
    }
  };

  return (
    <div className="bt">
      <div className="w-100 pv3 h4">
        <div className="fl w-10 tr pr2">
          <CurrentUserAvatar className="h2 w2 br-100" />
        </div>
        <div className="fl w-90 h-100">
          <input
            value={comment}
            onChange={e => setComment(e.target.value)}
            name="comment"
            type="textarea"
            placeholder="Write a comment"
            className="w-90 h-75 f6"
            rows="4"
          />
        </div>
      </div>

      <div className="w-100 pv3 black bg-light-gray tr pr2">
        <Button onClick={saveComment} className="bg-black white f6">
          Comment
        </Button>
      </div>
    </div>
  );
};

const TaskHistory = ({ projectId, taskId, token, commentStat, setStat }) => {
  const [response, setResponse] = useState(null);

  useLayoutEffect(() => {
    const getTaskInfo = async () => {
      const url = `${API_URL}projects/${projectId}/tasks/${taskId}/`;
      const headers = {
        'Content-Type': 'application/json',
        'Accept-Language': 'en',
        Authorization: `Token ${token}`,
      };
      const res = await fetch(url, { headers: headers });
      const res_json = await res.json();
      setResponse(res_json);
    };

    if (commentStat === true) {
      getTaskInfo();
      setStat(false);
    }
  }, [projectId, taskId, token, commentStat, setStat]);

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

    return <FormattedMessage {...message} />;
  };

  if (response === null) {
    return null;
  } else {
    return response.taskHistory.map(t => (
      <div className="w-90 mh3 pv3 bb b--light-gray f6 cf">
        <div className="fl w-10 ph2">
          <div className="h2 w2 bg-light-gray br-100 ma0">
            {t.pictureUrl === null ? null : (
              <img className="h2 w2 br-100" src={t.pictureUrl} alt={t.actionBy} />
            )}
          </div>
        </div>
        <div className="w-80 fl">
          <p className="ma0 pt2">
            <a href={'/user/' + t.actionBy} className="black b underline">
              {t.actionBy}
            </a>{' '}
            {getTaskActionMessage(t.action, t.actionText)}{' '}
            <span className="moon-gray">{<FormattedRelative value={t.actionDate} />} </span>
          </p>
          {t.action === 'COMMENT' ? <p className="i ma0 mt2">{t.actionText}</p> : null}
        </div>
      </div>
    ));
  }
};

export const TaskActivity = props => {
  const token = useSelector(state => state.auth.get('token'));
  const [commentStat, setStat] = useState(true);

  return (
    <div className="h-100">
      <div className="w-100 pv3 ph4 black bg-light-gray relative">
        <p className="ttu f3 pa0 ma0 barlow-condensed b mb2">task activity</p>
        <p className="f5 pa0 ma0">
          <b>#{props.taskId}:</b> {props.projectName}
        </p>
      </div>
      <div className="gray h5 overflow-scroll">
        <TaskHistory
          token={token}
          projectId={props.projectId}
          taskId={props.taskId}
          commentStat={commentStat}
          setStat={setStat}
        />
      </div>
      <PostComment
        token={token}
        projectId={props.projectId}
        taskId={props.taskId}
        setStat={setStat}
      />
    </div>
  );
};
