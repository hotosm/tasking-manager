import React from 'react';
import { useSelector } from 'react-redux';
import { redirectTo } from '@reach/router';

import { UserTopBar } from '../components/user/settings';
import { HelpCard } from '../components/user/help';
import { UserInformationForm, UserInterests } from '../components/user/forms';

export function Welcome() {
  const userIsloggedIn = useSelector(state => state.auth.get('token'));

  if (userIsloggedIn) {
    return (
      <div className="pull-center">
        <UserTopBar />
        <div className="cf pa4 bg-tan">
          <div className="fl w-100 w-60-l pb3 pr3-l">
            <UserInterests />
            <HelpCard />
          </div>
          <div className="fl w-100 w-40-l pb3 pl3-l">
            <UserInformationForm />
          </div>
        </div>
      </div>
    );
  } else {
    redirectTo('login');
  }
}
