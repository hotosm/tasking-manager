import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { UserTopBar } from '../components/user/topBar';
import { OSMCard, APIKeyCard } from '../components/user/content';
import { PersonalInformationForm } from '../components/user/forms/personalInformation';
import { UserSettingsForm } from '../components/user/forms/settings';
import { UserNotificationsForm } from '../components/user/forms/notifications';
import { UserInterestsForm } from '../components/user/forms/interests';
import { useSetTitleTag } from '../hooks/UseMetaTags';

export function Settings() {
  useSetTitleTag(`Settings`);
  const navigate = useNavigate();
  const token = useSelector((state) => state.auth.token);
  const userDetails = useSelector((state) => state.auth.userDetails);

  useEffect(() => {
    if (!token) {
      navigate('/login');
    }
  }, [navigate, token]);

  return (
    <div className="pull-center">
      <UserTopBar />
      <div className="cf pa4 pb5 bg-blue-light-paper">
        <div className="fl w-100 w-60-l pb3 pr3-l">
          <UserInterestsForm />
          <UserSettingsForm />
          <UserNotificationsForm />
          {userDetails.isExpert && <APIKeyCard token={token} />}
        </div>
        <div className="fl w-100 w-40-l pb3 pl3-l">
          <PersonalInformationForm />
          {userDetails?.username && <OSMCard username={userDetails.username} />}
        </div>
      </div>
    </div>
  );
}
