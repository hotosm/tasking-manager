import React, { useLayoutEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { FormattedRelative } from 'react-intl';
import { PaginatorLine } from '../paginator';
import { API_URL } from '../../config';
import { Button } from '../button';
import { CurrentUserAvatar } from '../user/avatar';
import { htmlFromMarkdown } from '../../utils/htmlFromMarkdown';
import ReactTextareaAutocomplete from '@webscopeio/react-textarea-autocomplete';
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
  <div className="w-100 f6 bg-white pv2 ph3 f5 tc blue-grey hover-bg-navy hover-white pointer">{`${name}`}</div>
);

const PostProjectComment = ({ token, projectId, setStat }) => {
  const [comment, setComment] = useState('');

  const saveComment = () => {
    if (comment === '') {
      return null;
    }
    const url = `${API_URL}projects/${projectId}/comments/`;
    const body = JSON.stringify({ message: comment });

    pushToLocalJSONAPI(url, body, token).then(res => {
      setStat(true);
      setComment('');
    });
  };

  const fetchUsers = async user => {
    const url = `${API_URL}users/queries/filter/${user}/`;
    const res = await fetchLocalJSONAPI(url, token);
    const userItems = res.usernames.map(u => {
      return { name: u };
    });

    return userItems;
  };

  return (
    <div className="w-90 pv4 h4 bg-light-gray center">
      <div className="fl w-10 pa3">
        <CurrentUserAvatar className="h2 w2 br-100" />
      </div>
      <div className="fl w-70 h-100">
        <ReactTextareaAutocomplete
          value={comment}
          listClassName="list ma0 pa0 ba b--light-silver w-40 overflow-auto"
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
      <div className="fl w-20 black bg-light-gray tc">
        <Button onClick={saveComment} className="bg-red white f5">
          Save
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
      const url = `${API_URL}projects/${projectId}/comments/?perPage=${perPage}&page=${pageNo}`;
      const res = await fetchLocalJSONAPI(url, token);
      setResponse(res);
    };

    if (commentsStat === true && projectId) {
      getComments(page, projectId, 5, token);
      setStat(false);
    }
  }, [page, projectId, commentsStat, token]);

  return (
    <div>
      <div className="ph6-l ph4 pb3 w-100 w-70-l">
        {response === null
          ? null
          : response.chat.map(d => (
              <div className="w-90 center cf mb2 pa3 ba b--light-gray">
                <div className="fl w-10">
                  <div className="h2 w2 bg-light-gray br-100 ma0">
                    {d.pictureUrl === null ? null : (
                      <img className="h2 w2 br-100" src={d.pictureUrl} alt={d.username} />
                    )}
                  </div>
                </div>
                <div className="fl w-90 mb3">
                  <p className="b ma0">
                    <a href={'/user/' + d.username} className="black b underline">
                      {d.username}
                    </a>
                  </p>
                  <span className="moon-gray">{<FormattedRelative value={d.timestamp} />} </span>
                </div>

                <div>
                  <div
                    style={{ wordWrap: 'break-word' }}
                    className="blue-grey lh-title"
                    dangerouslySetInnerHTML={htmlFromMarkdown(formatUserNamesToLink(d.message))}
                  />
                </div>
              </div>
            ))}

        {response === null ? null : (
          <PaginatorLine
            activePage={page}
            setPageFn={handlePagination}
            lastPage={response.pagination.pages}
            className="tr w-90 center pv3"
          />
        )}
        {token === null ? (
          <div>In order to start contributing, please login first.</div>
        ) : (
          <PostProjectComment projectId={projectId} token={token} setStat={setStat} />
        )}
      </div>
    </div>
  );
};
