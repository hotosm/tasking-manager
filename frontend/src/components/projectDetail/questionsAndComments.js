import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { RelativeTimeWithUnit } from '../../utils/formattedRelativeTime';
import { useAsync } from '../../hooks/UseAsync';
import { PaginatorLine } from '../paginator';
import { Button } from '../button';
import { Alert } from '../alert';
import { CommentInputField } from '../comments/commentInput';
import { MessageStatus } from '../comments/status';
import { CurrentUserAvatar, UserAvatar } from '../user/avatar';
import { htmlFromMarkdown, formatUserNamesToLink } from '../../utils/htmlFromMarkdown';
import { pushToLocalJSONAPI, fetchLocalJSONAPI } from '../../network/genericJSONRequest';
import '@webscopeio/react-textarea-autocomplete/style.css';

const PostProjectComment = ({ projectId, updateComments }) => {
  const token = useSelector((state) => state.auth.get('token'));
  const [comment, setComment] = useState('');

  const saveComment = () => {
    return pushToLocalJSONAPI(
      `projects/${projectId}/comments/`,
      JSON.stringify({ message: comment }),
      token,
    ).then((res) => {
      updateComments(res);
      setComment('');
    });
  };
  const saveCommentAsync = useAsync(saveComment);

  return (
    <div className="w-90-ns w-100 cf pv4 bg-white center">
      <div className="cf w-100">
        <div className="fl w-10-ns w-20 pt2">
          <CurrentUserAvatar className="w3 h3 fr ph2 br-100" />
        </div>
        <div className="fl w-70-ns w-80 ph1 h-100">
          <CommentInputField comment={comment} setComment={setComment} enableHashtagPaste={true} />
        </div>
        <div className="fl w-20-ns w-100 tc-ns tr pt3 pr0-ns pr1">
          <Button
            onClick={() => saveCommentAsync.execute()}
            className="bg-red white f5"
            disabled={comment === '' || saveCommentAsync.status === 'pending'}
            loading={saveCommentAsync.status === 'pending'}
          >
            <FormattedMessage {...messages.post} />
          </Button>
        </div>
      </div>
      <div className="cf w-100 fr tr pr2">
        <MessageStatus status={saveCommentAsync.status} comment={comment} />
      </div>
    </div>
  );
};

export const QuestionsAndComments = ({ projectId }) => {
  const token = useSelector((state) => state.auth.get('token'));
  const [comments, setComments] = useState(null);
  const [page, setPage] = useState(1);

  const handlePagination = (val) => {
    setPage(val);
  };

  useEffect(() => {
    if (projectId && page) {
      fetchLocalJSONAPI(
        `projects/${projectId}/comments/?perPage=5&page=${page}`,
        token,
      ).then((res) => setComments(res));
    }
  }, [page, projectId, token]);

  return (
    <div className="bg-tan">
      <div className="ph6-l ph4-m ph2 pb3 w-100 w-70-l">
        {comments && comments.chat.length ? (
          <CommentList comments={comments.chat} />
        ) : (
          <div className="pv4 blue-grey tc">
            <FormattedMessage {...messages.noComments} />
          </div>
        )}

        {comments && comments.pagination && comments.pagination.pages > 0 && (
          <PaginatorLine
            activePage={page}
            setPageFn={handlePagination}
            lastPage={comments.pagination.pages}
            className="tr w-90 center pv3"
          />
        )}
        {token ? (
          <PostProjectComment projectId={projectId} updateComments={setComments} />
        ) : (
          <div className="w-90 center pa3">
            <Alert type="info">
              <FormattedMessage {...messages.loginTocomment} />
            </Alert>
          </div>
        )}
      </div>
    </div>
  );
};

function CommentList({ comments }: Object) {
  return (
    <div className="pt3">
      {comments.map((comment, n) => (
        <div className="w-90 center cf mb2 pa3 ba b--grey-light bg-white" key={n}>
          <div className="cf db">
            <div className="fl">
              {comment.pictureUrl === null ? null : (
                <UserAvatar
                  username={comment.username}
                  picture={comment.pictureUrl}
                  colorClasses="white bg-blue-grey"
                />
              )}
            </div>
            <div className="fl ml3">
              <p className="b ma0">
                <a href={`/users/${comment.username}`} className="blue-dark b underline">
                  {comment.username}
                </a>
              </p>
              <span className="blue-grey f6">
                <RelativeTimeWithUnit date={comment.timestamp} />
              </span>
            </div>
          </div>
          <div className="cf db">
            <div
              style={{ wordWrap: 'break-word' }}
              className="blue-grey f5 lh-title markdown-content"
              dangerouslySetInnerHTML={htmlFromMarkdown(formatUserNamesToLink(comment.message))}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
