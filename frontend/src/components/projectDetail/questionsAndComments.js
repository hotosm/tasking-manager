import React, { useLayoutEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import ReactTextareaAutocomplete from '@webscopeio/react-textarea-autocomplete';
import { FormattedMessage, FormattedRelative } from 'react-intl';

import messages from './messages';
import { PaginatorLine } from '../paginator';
import { Button } from '../button';
import { CurrentUserAvatar } from '../user/avatar';
import { htmlFromMarkdown } from '../../utils/htmlFromMarkdown';
import { pushToLocalJSONAPI, fetchLocalJSONAPI } from '../../network/genericJSONRequest';

const formatUserNamesToLink = text => {
  const regex = /@\[([^\]]+)\]/gi;
  // Find usernames with a regular expression. They all start with '[@' and end with ']'
  const usernames = text && text.match(regex);
  if (usernames) {
    for (let i = 0; i < usernames.length; i++) {
      // Strip off the first two characters: '@['
      let username = usernames[i].substring(2, usernames[i].length);
      // Strip off the last character
      username = username.substring(0, username.length - 1);
      text = text.replace(
        usernames[i],
        '<a class="pointer blue-grey b underline" href="/user/' +
          username +
          '">' +
          username +
          '</a>',
      );
    }
  }
  return text;
};

const Item = ({ entity: { name } }) => (
  <div className="w-100 f6 pv2 ph3 f5 tc bg-tan blue-grey hover-bg-blue-grey hover-white pointer">
    {`${name}`}
  </div>
);

const PostProjectComment = ({ token, projectId, setStat }) => {
  const [comment, setComment] = useState('');

  const saveComment = () => {
    if (comment === '') {
      return null;
    }
    const url = `projects/${projectId}/comments/`;
    const body = JSON.stringify({ message: comment });

    pushToLocalJSONAPI(url, body, token).then(res => {
      setStat(true);
      setComment('');
    });
  };

  const fetchUsers = async user => {
    const url = `users/queries/filter/${user}/`;
    const res = await fetchLocalJSONAPI(url, token);
    const userItems = res.usernames.map(u => {
      return { name: u };
    });

    return userItems;
  };

  return (
    <div className="w-90 pv4 h4 bg-white center">
      <div className="fl w-10 tc pt2">
        <CurrentUserAvatar className="h3 w3 br-100" />
      </div>
      <div className="fl w-70 h-100">
        <ReactTextareaAutocomplete
          value={comment}
          listClassName="list ma0 pa0 ba b--grey-light bg-blue-grey w-40 overflow-auto"
          onChange={e => setComment(e.target.value)}
          className="w-100 f5 pa2"
          loadingComponent={() => <span>Loading</span>}
          rows={3}
          trigger={{
            '@': {
              dataProvider: fetchUsers,
              component: Item,
              output: (item, trigger) => '@[' + item.name + ']',
            },
          }}
        />
      </div>
      <div className="fl w-20 tc pt3">
        <Button onClick={saveComment} className="bg-red white f5" disabled={comment === ''}>
          <FormattedMessage {...messages.post} />
        </Button>
      </div>
    </div>
  );
};

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
          <PostProjectComment projectId={projectId} token={token} setStat={setStat} />
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
              <div className="h2 w2 bg-grey-light br-100 ma0">
                {comment.pictureUrl === null ? null : (
                  <img className="h2 w2 br-100" src={comment.pictureUrl} alt={comment.username} />
                )}
              </div>
            </div>
            <div className="fl ml3">
              <p className="b ma0">
                <a href={`/users/${comment.username}`} className="blue-dark b underline">
                  {comment.username}
                </a>
              </p>
              <span className="blue-grey f6">
                {<FormattedRelative value={comment.timestamp} />}{' '}
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
