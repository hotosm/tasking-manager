import React from 'react';
import { Redirect } from 'react-router-dom'
import { connect } from "react-redux";
import { API_URL } from '../config';

class Login extends React.Component {
  render() {
    let login_url = API_URL + 'auth/login'; 
    return(
      <Redirect to={login_url} strict={true}/>
    );
  }
}


Login = connect(
  (state, props) => ({
    location: props.location
  })
)(Login);
export { Login };
