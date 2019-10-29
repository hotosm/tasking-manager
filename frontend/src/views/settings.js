import React from 'react';
import { useSelector } from 'react-redux';
import { Redirect } from '@reach/router';

import { UserTopBar } from '../components/user/settings';
import { OSMCard, APIKeyCard } from '../components/user/content';
import {
  UserInformationForm,
  UserInterests,
  UserSettingsForm,
  UserNotificationsForm,
} from '../components/user/forms';

export function Settings() {
  const token = useSelector(state => state.auth.get('token'));
  const userDetails = useSelector(state => state.auth.get('userDetails'));

  if (token) {
    return (
      <div className="pull-center">
        <UserTopBar />
        <div className="cf pa4 bg-tan">
          <div className="fl w-100 w-60-l pb3 pr3-l">
            <UserInterests />
            <UserSettingsForm />
            <UserNotificationsForm />
            {userDetails.expertMode && <APIKeyCard token={token} />}
          </div>
          <div className="fl w-100 w-40-l pb3 pl3-l">
            <UserInformationForm />
            <OSMCard username={userDetails.username} />
          </div>
        </div>
      </div>
    );
  } else {
    return <Redirect from={'settings'} to={'login'} noThrow />;
  }
}
