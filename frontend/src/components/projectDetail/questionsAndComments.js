import React, { useLayoutEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { RelativeTimeWithUnit } from '../../utils/formattedRelativeTime';
import { PaginatorLine } from '../paginator';
import { UserAvatar } from '../user/avatar';
import { htmlFromMarkdown } from '../../utils/htmlFromMarkdown';
import { formatUserNamesToLink } from '../../utils/formatUserNamesToLink';
import { MentionUserTextArea } from '../mentionUserTextArea';
import { fetchLocalJSONAPI } from '../../network/genericJSONRequest';

export const QuestionsAndComments = ({ projectId }) => {
  const token = useSelector(state => state.auth.get('token'));
  const [response, setResponse] = useState(null);
  const [page, setPage] = useState(1);
  const [commentsStat, setStat] = useState(true);

  const handlePagination = val => {
    setPage(val);
    setStat(true);
  };

  useLayoutEffect(() => {
    const getComments = async (pageNo, projectId, perPage, token) => {
      const url = `projects/${projectId}/comments/?perPage=${perPage}&page=${pageNo}`;
      const res = await fetchLocalJSONAPI(url, token);
      setResponse(res);
    };

    if (commentsStat === true && projectId) {
      getComments(page, projectId, 5, token);
      setStat(false);
    }
  }, [page, projectId, commentsStat, token]);

  return (
    <div className="bg-tan">
      <div className="ph6-l ph4 pb3 w-100 w-70-l">
        {response && response.chat.length ? (
          <CommentList comments={response.chat} />
        ) : (
          <div className="pv4 blue-grey tc">
            <FormattedMessage {...messages.noComments} />
          </div>
        )}

        {response && response.pagination && response.pagination.pages > 0 && (
          <PaginatorLine
            activePage={page}
            setPageFn={handlePagination}
            lastPage={response.pagination.pages}
            className="tr w-90 center pv3"
          />
        )}
        {token !== null && (
          <MentionUserTextArea
            postUrl={`projects/${projectId}/comments/`}
            onCommentUpload={setStat}
            action="PROJECT"
          />
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
              className="blue-grey f5 lh-title"
              dangerouslySetInnerHTML={htmlFromMarkdown(formatUserNamesToLink(comment.message))}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
