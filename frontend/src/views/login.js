import React from 'react';
import { useSelector } from 'react-redux';
import { Redirect } from '@reach/router';
import { FormattedMessage } from 'react-intl';

import { AuthButtons } from '../components/header';
import messages from './messages';
import { useSetTitleTag } from '../hooks/UseMetaTags';

export function Login({ redirectTo }: Object) {
  useSetTitleTag('Login');
  const userIsloggedIn = useSelector((state) => state.auth.get('token'));
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
            redirectTo={redirectTo || '/welcome'}
          />
        </div>
      </div>
    );
  } else {
    return <Redirect to={redirectTo || '/welcome'} noThrow />;
  }
}
