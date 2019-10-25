import React from 'react';
import { useSelector } from 'react-redux';
import { Redirect } from '@reach/router';
import { FormattedMessage } from 'react-intl';

import { AuthButtons } from '../components/header';
import messages from './messages';

export function Login({ redirect_to }: Object) {
  const userIsloggedIn = useSelector(state => state.auth.get('token'));
  if (!userIsloggedIn) {
    return (
      <div className="cf w-100 pv5">
        <h3 className="f2 fw5 barlow-condensed tc">
          <FormattedMessage {...messages.loginRequired} />
        </h3>
        <div className="tc pv4">
          <AuthButtons
            aStyle="mh1 v-mid dn dib-ns"
            logInStyle="blue-dark bg-white"
            signUpStyle="bg-blue-dark white ml1 v-mid dn dib-ns"
          />
        </div>
      </div>
    );
  } else {
    return <Redirect to={redirect_to || 'user'} noThrow />;
  }
}
