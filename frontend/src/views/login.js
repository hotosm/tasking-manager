import React from 'react';
import { redirectTo } from "@reach/router";
import { API_URL } from '../config';


export class Login extends React.Component {
  componentDidMount() {
    let loginUrl = API_URL + 'auth/login';
    redirectTo(loginUrl);
  }
}