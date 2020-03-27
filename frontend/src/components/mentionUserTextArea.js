import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import ReactTextareaAutocomplete from '@webscopeio/react-textarea-autocomplete';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { pushToLocalJSONAPI, fetchLocalJSONAPI } from '../network/genericJSONRequest';
import { Button } from './button';
import { CurrentUserAvatar } from './user/avatar';

export const Item = ({ entity: { name } }) => (
  <div className="w-100 f6 pv2 ph3 f5 tc bg-tan blue-grey hover-bg-blue-grey hover-white pointer">
    {`${name}`}
  </div>
);

export const MentionUserTextArea = ({ action, onCommentUpload, postUrl }) => {
  const token = useSelector((state) => state.auth.get('token'));
  const [comment, setComment] = useState('');

  const saveComment = () => {
    if (comment === '') {
      return null;
    }

    let payload = {};
    switch (action) {
      case 'TASK':
        payload = { comment: comment };
        break;
      case 'PROJECT':
        payload = { message: comment };
        break;
      default:
        break;
    }
    const body = JSON.stringify(payload);

    pushToLocalJSONAPI(postUrl, body, token).then((res) => {
      switch (action) {
        case 'TASK':
          onCommentUpload(res);
          break;
        case 'PROJECT':
          onCommentUpload(true);
          break;
        default:
          break;
      }
      setComment('');
    });
  };

  const fetchUsers = async (user) => {
    const url = `users/queries/filter/${user}/`;
    const res = await fetchLocalJSONAPI(url, token);
    const userItems = res.usernames.map((u) => {
      return { name: u };
    });
    return userItems;
  };

  return (
    <div className="w-90-ns pt3 pv2 bg-white flex flex-row justify-around center">
      <div className="w-10 ph1 tc">
        <CurrentUserAvatar className="w-70-l w4 w3-m br-100" />
      </div>
      <div className="w-100 pr3 flex flex-column">
        <FormattedMessage {...messages.writeComment}>
          {(msg) => {
            return (
              <div style={{maxHeight: "6em"}}>
                <ReactTextareaAutocomplete
                  value={comment}
                  listClassName="list ma0 pa0 ba b--grey-light bg-blue-grey w-40"
                  onChange={(e) => setComment(e.target.value)}
                  className="w-100 pa2 f6"
                  loadingComponent={() => <span>Loading</span>}
                  rows={4}
                  placeholder={msg}
                  trigger={{
                    '@': {
                      dataProvider: fetchUsers,
                      component: Item,
                      output: (item, trigger) => '@[' + item.name + ']',
                    },
                  }}
                />
              </div>
            );
          }}
        </FormattedMessage>
        <div className="tc pt3 self-end">
          <Button onClick={saveComment} className="bg-red white f5" disabled={comment === ''}>
            <FormattedMessage {...messages.comment} />
          </Button>
        </div>
      </div>
    </div>
  );
};
