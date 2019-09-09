import React from 'react';
import { useSelector } from 'react-redux';
import { Redirect } from '@reach/router';

import { AuthButtons } from '../components/header';

export function Login() {
  const userIsloggedIn = useSelector(state => state.auth.get('token'));
  if (!userIsloggedIn) {
    return (
      <div className="cf w-100 pv5">
        <div className="tc">
          <AuthButtons
            aStyle="mh1 v-mid dn dib-ns"
            logInStyle="blue-dark bg-white"
            signUpStyle="bg-blue-dark white ml1 v-mid dn dib-ns"
          />
        </div>
      </div>
    );
  } else {
    return <Redirect to={'user'} noThrow />;
  }
}
