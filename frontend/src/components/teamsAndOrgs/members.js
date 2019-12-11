import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { FormattedMessage } from 'react-intl';
import AsyncSelect from 'react-select/async';

import messages from './messages';
import { UserAvatar } from '../user/avatar';
import { EditModeControl } from './editMode';
import { Button } from '../button';
import { fetchLocalJSONAPI } from '../../network/genericJSONRequest';

export function Members({ addMembers, removeMembers, saveMembersFn, members, type }: Object) {
  const token = useSelector(state => state.auth.get('token'));
  const [editMode, setEditMode] = useState(false);
  let roleQueryParam = 'role=PROJECT_MANAGER';
  let selectPlaceHolder = <FormattedMessage {...messages.searchManagers} />;
  let title = <FormattedMessage {...messages.managers} />;
  if (type === 'members') {
    roleQueryParam = '';
    selectPlaceHolder = <FormattedMessage {...messages.searchUsers} />;
    title = <FormattedMessage {...messages.members} />;
  }

  const submitMembers = () => {
    if (saveMembersFn) {
      saveMembersFn();
    }
    setEditMode(false);
  };
  const promiseOptions = inputValue =>
    new Promise(resolve => {
      setTimeout(async () => {
        const result = await fetchLocalJSONAPI(
          `users/?username=${inputValue}&${roleQueryParam}`,
          token,
        );
        resolve(result.users);
      }, 1000);
    });

  return (
    <>
      <div className={`bg-white b--grey-light pa4 ${editMode ? 'bt bl br' : 'ba'}`}>
        <div className="cf db">
          <h3 className="f3 blue-dark mt0 fw6 fl">{title}</h3>
          <EditModeControl editMode={editMode} switchModeFn={setEditMode} />
        </div>
        <div className="cf mb1">
          {editMode && (
            <AsyncSelect
              isMulti
              cacheOptions
              defaultOptions
              placeholder={selectPlaceHolder}
              isClearable={false}
              getOptionLabel={option => option.username}
              getOptionValue={option => option.username}
              loadOptions={promiseOptions}
              onChange={values => addMembers(values || [])}
              className="z-2"
            />
          )}
        </div>
        <div className="cf db mt3">
          {members.map((user, n) => (
            <UserAvatar
              key={n}
              username={user.username}
              picture={user.pictureUrl}
              size="large"
              colorClasses="white bg-blue-grey"
              removeFn={removeMembers}
              editMode={editMode}
            />
          ))}
        </div>
      </div>
      {editMode && (
        <div className="cf pt0">
          <div className="w-70-l w-50 fl tr dib bg-grey-light">
            <Button className="blue-dark bg-grey-light h3" onClick={() => setEditMode(false)}>
              <FormattedMessage {...messages.cancel} />
            </Button>
          </div>
          <div className="w-30-l w-50 fr dib">
            <Button className="white bg-red h3 w-100" onClick={() => submitMembers()}>
              <FormattedMessage {...messages.done} />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
