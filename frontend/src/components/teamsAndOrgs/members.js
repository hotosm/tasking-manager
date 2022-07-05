import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from '@reach/router';
import { useSelector } from 'react-redux';
import { FormattedMessage } from 'react-intl';
import AsyncSelect from 'react-select/async';

import messages from './messages';
import { UserAvatar } from '../user/avatar';
import { EditModeControl } from './editMode';
import { Button } from '../button';
import { SwitchToggle } from '../formInputs';
import { fetchLocalJSONAPI, pushToLocalJSONAPI } from '../../network/genericJSONRequest';
import { Alert } from '../alert';
import { useOnClickOutside } from '../../hooks/UseOnClickOutside';

export function Members({
  addMembers,
  removeMembers,
  saveMembersFn,
  resetMembersFn,
  members,
  type,
  memberJoinTeamError,
  setMemberJoinTeamError,
  managerJoinTeamError,
  setManagerJoinTeamError,
}: Object) {
  const token = useSelector((state) => state.auth.get('token'));
  const [editMode, setEditMode] = useState(false);
  const [membersBackup, setMembersBackup] = useState(null);
  const selectPlaceHolder = <FormattedMessage {...messages.searchUsers} />;
  let title = <FormattedMessage {...messages.managers} />;
  if (type === 'members') {
    title = <FormattedMessage {...messages.members} />;
  }
  const errorRef = useRef(null);
  useOnClickOutside(errorRef, () => {
    setMemberJoinTeamError?.(null) || setManagerJoinTeamError?.(null);
  });

  // store the first array of members in order to restore it if the user cancels an
  // add and remove members operation
  useEffect(() => {
    if (membersBackup === null && editMode) {
      setMembersBackup(members);
    }
  }, [members, editMode, setMembersBackup, membersBackup]);

  const submitMembers = () => {
    if (saveMembersFn) {
      saveMembersFn();
    }
    setMembersBackup(members);
    setEditMode(false);
  };
  const promiseOptions = (inputValue) =>
    new Promise((resolve) => {
      setTimeout(async () => {
        const result = await fetchLocalJSONAPI(`users/?username=${inputValue}`, token);
        resolve(result.users);
      }, 1000);
    });

  const doesMemberExistInTeam = (username) =>
    members.some((member) => member.username === username);

  const formatOptionLabel = (member, menu) => (
    <>
      <div>{member.username}</div>
      {doesMemberExistInTeam(member.username) && menu.context === 'menu' && (
        <div className="f7 lh-copy gray">
          <FormattedMessage {...messages.alreadyInTeam} />
        </div>
      )}
    </>
  );

  return (
    <>
      <div className={`bg-white b--grey-light pa4 ${editMode ? 'bt bl br' : 'ba'}`}>
        <div className="cf db">
          <h3 className="f3 blue-dark mv2 fw6 fl">{title}</h3>
          <EditModeControl editMode={editMode} switchModeFn={setEditMode} />
        </div>
        <div className="cf mb1">
          {editMode && (
            <AsyncSelect
              classNamePrefix="react-select"
              isMulti
              cacheOptions
              defaultOptions
              placeholder={selectPlaceHolder}
              isClearable={false}
              isOptionDisabled={(option) => doesMemberExistInTeam(option.username)}
              formatOptionLabel={(option, menu) => formatOptionLabel(option, menu)}
              getOptionLabel={(option) => option.username}
              getOptionValue={(option) => option.username}
              loadOptions={promiseOptions}
              onChange={(values) => addMembers(values || [])}
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
              colorClasses="white bg-blue-grey mv1"
              removeFn={members.length > 1 && removeMembers}
              editMode={members.length > 1 && editMode}
            />
          ))}
          {members.length === 0 && (
            <div className="tc mt3">
              <FormattedMessage {...messages.noMembers} />
            </div>
          )}
          {(memberJoinTeamError || managerJoinTeamError) && (
            <div className="cf pv2" ref={errorRef}>
              <Alert type="error">
                <FormattedMessage
                  {...messages[`${memberJoinTeamError || managerJoinTeamError}Error`]}
                />
              </Alert>
            </div>
          )}
        </div>
      </div>
      {editMode && (
        <div className="cf pt0">
          <div className="w-70-l w-50 fl tr dib bg-grey-light">
            <Button
              className="blue-dark bg-grey-light h3"
              onClick={() => {
                resetMembersFn(membersBackup || []);
                setEditMode(false);
              }}
            >
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

export function JoinRequests({
  requests,
  teamId,
  addMembers,
  updateRequests,
  members,
  updateTeam,
  isTeamInviteOnly,
}: Object) {
  const token = useSelector((state) => state.auth.get('token'));
  const loggedInUsername = useSelector((state) => state.auth.get('userDetails')).username;
  const isJoinRequestEnabled = members?.filter((member) => member.username === loggedInUsername)[0]
    ?.joinRequestNotifications;
  const [isChecked, setIsChecked] = useState(isJoinRequestEnabled);

  const acceptRejectRequest = useCallback(
    (user, action) => {
      const payload = JSON.stringify({
        username: user.username,
        role: 'MEMBER',
        type: 'join-response',
        action: action,
      });
      pushToLocalJSONAPI(`teams/${teamId}/actions/join/`, payload, token, 'PATCH').then((res) => {
        if (action === 'accept') {
          addMembers([user]);
        }
        updateRequests(requests.filter((i) => i.username !== user.username));
      });
    },
    [teamId, requests, updateRequests, addMembers, token],
  );

  const handleJoinRequestNotificationsChange = (e) => {
    const { checked } = e.target;
    setIsChecked(checked);
    let tempMembers = members;
    const memberIndex = tempMembers.findIndex((member) => member.username === loggedInUsername);
    Object.assign(tempMembers[memberIndex], {
      joinRequestNotifications: checked,
      active: checked.toString(),
    });
    updateTeam({ members });
  };

  return (
    <div className="bg-white b--grey-light pa4 ba blue-dark">
      <div className="cf db">
        <h3 className="f3 blue-dark mt0 fw6 fl">
          <FormattedMessage {...messages.joinRequests} />
        </h3>
      </div>
      {isTeamInviteOnly && (
        <div className="flex justify-between blue-grey">
          <FormattedMessage {...messages.newJoinRequestNotification} />
          <div className="fl ml5">
            <SwitchToggle
              isChecked={isChecked}
              onChange={(e) => handleJoinRequestNotificationsChange(e)}
              labelPosition="right"
            />
          </div>
        </div>
      )}
      <div className="cf db mt3">
        {requests.map((user, n) => (
          <div className="cf db pt2" key={n}>
            <div className="fl pt1">
              <UserAvatar
                username={user.username}
                picture={user.pictureUrl}
                colorClasses="white bg-blue-grey"
              />
              <Link to={`/users/${user.username}`} className="v-mid link blue-dark">
                <span>{user.username}</span>
              </Link>
            </div>
            <div className="fr">
              <Button
                className="pr2 blue-dark bg-white"
                onClick={() => acceptRejectRequest(user, 'reject')}
              >
                <FormattedMessage {...messages.reject} />
              </Button>
              <Button
                className="pr2 bg-red white"
                onClick={() => acceptRejectRequest(user, 'accept')}
              >
                <FormattedMessage {...messages.accept} />
              </Button>
            </div>
          </div>
        ))}
        {requests.length === 0 && (
          <div className="tc mt3">
            <FormattedMessage {...messages.noRequests} />
          </div>
        )}
      </div>
    </div>
  );
}
