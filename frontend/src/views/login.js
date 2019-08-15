import React from 'react';

import { AuthButtons } from '../components/header';


export class Login extends React.Component {
  render() {
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
  }
}
