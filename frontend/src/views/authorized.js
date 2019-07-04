import React from 'react';
import { Redirect } from 'react-router-dom'
import { connect } from "react-redux";
import { setAuthDetails } from '../store/actions/authorize';

class Authorized extends React.Component {
  render() {
    const params = new URLSearchParams(this.props.location.search);
    const username = params.get('username');
    const session_token = params.get('session_token');
    const redirect_url = params.get('redirect_to') ? params.get('redirect_to') : '/';
    this.props.setAuthDetails(username, session_token);

    return(
       <Redirect to={redirect_url} />
    );
  }
}

let mapStateToProps = (state, props) => ({
    location: props.location,
});

Authorized = connect(
    mapStateToProps,
    {setAuthDetails}
)(Authorized);
export { Authorized };
