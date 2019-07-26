import React from 'react';
import { Redirect } from "@reach/router";
import { connect } from "react-redux";
import { setAuthDetails } from '../store/actions/auth';


 class Authorized extends React.Component {
  state = {
    redirectUrl: '/',
    isReadyToRedirect: false
  }
  componentDidMount() {
    const params = new URLSearchParams(this.props.location.search);
    const username = params.get('username');
    const session_token = params.get('session_token');
    this.props.authenticateUser(username, session_token);
    this.setState({
      redirect_url: params.get('redirect_to') ? params.get('redirect_to') : '/',
      isReadyToRedirect: true
    });
  }
  render() {
    return (
      this.state.isReadyToRedirect ? <Redirect to={this.state.redirectUrl} noThrow /> : <div>redirecting</div>
    );
  }
}

 let mapStateToProps = (state, props) => ({
    location: props.location,
});

 const mapDispatchToProps = (dispatch) => {
  return {
    authenticateUser: (username, token) => dispatch(setAuthDetails(username, token))
  };
};

 Authorized = connect(
    mapStateToProps,
    mapDispatchToProps
)(Authorized);
export { Authorized };