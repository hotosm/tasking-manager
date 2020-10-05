import React from 'react';
import { useSelector } from 'react-redux';
import { Redirect } from '@reach/router';

import { UserTopBar } from '../components/user/topBar';
import { OSMCard, APIKeyCard } from '../components/user/content';
import { PersonalInformationForm } from '../components/user/forms/personalInformation';
import { UserSettingsForm } from '../components/user/forms/settings';
import { UserNotificationsForm } from '../components/user/forms/notifications';
import { UserInterestsForm } from '../components/user/forms/interests';
import { useSetTitleTag } from '../hooks/UseMetaTags';

export function Settings() {
  useSetTitleTag(`Settings`);
  const token = useSelector((state) => state.auth.get('token'));
  const userDetails = useSelector((state) => state.auth.get('userDetails'));

  if (token) {
    return (
      <div className="pull-center">
        <UserTopBar />
        <div className="cf pa4 bg-tan">
          <div className="fl w-100 w-60-l pb3 pr3-l">
            <UserInterestsForm />
            <UserSettingsForm />
            <UserNotificationsForm />
            {userDetails.isExpert && <APIKeyCard token={token} />}
          </div>
          <div className="fl w-100 w-40-l pb3 pl3-l">
            <PersonalInformationForm />
            <OSMCard username={userDetails.username} />
          </div>
        </div>
      </div>
    );
  } else {
    return <Redirect from={'settings'} to={'/login'} noThrow />;
  }
}
