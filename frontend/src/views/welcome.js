import React from 'react';
import { useSelector } from 'react-redux';
import { Redirect } from '@reach/router';

import { UserTopBar } from '../components/user/settings';
import { HelpCard, FirstProjectBanner } from '../components/user/content';
import { calculateCompleteness } from '../components/user/completeness';
import { UserInformationForm } from '../components/user/forms';
import { WelcomeCard } from '../components/user/content';

function IncompleteProfile() {
  return (
    <>
      <UserTopBar />
      <div className="cf pa4 bg-tan">
        <div className="fl w-100 w-60-l pb3 pr3-l">
          <WelcomeCard />
          <HelpCard />
        </div>
        <div className="fl w-100 w-40-l pb3 pl3-l">
          <UserInformationForm />
        </div>
      </div>
    </>
  );
}

function NewContributor() {
  return (
    <div className="cf pa4 bg-tan">
      <div className="fl w-100 pb3">
        <FirstProjectBanner />
        <p>Space for recommended projects</p>
      </div>
    </div>
  );
}

export function Welcome() {
  const userDetails = useSelector(state => state.auth.get('userDetails'));
  const userIsloggedIn = useSelector(state => state.auth.get('token'));

  if (userIsloggedIn) {
    const completeness = calculateCompleteness(userDetails);
    return (
      <div className="pull-center">
        {completeness <= 0.5 ? (
          <IncompleteProfile />
        ) : userDetails.tasksMapped ? (
          <Redirect to={'projects'} noThrow />
        ) : (
          <NewContributor />
        )}
      </div>
    );
  } else {
    return <Redirect to={'login'} noThrow />;
  }
}
