import React from 'react';
import { Redirect } from '@reach/router';
import { connect } from 'react-redux';
import { setAuthDetails } from '../store/actions/auth';

class Authorized extends React.Component {
  state = {
    isReadyToRedirect: false,
  };
  params = new URLSearchParams(this.props.location.search);

  componentDidMount() {
    const username = this.params.get('username');
    const sessionToken = this.params.get('session_token');
    const userPicture = this.params.get('picture');
    this.props.authenticateUser(username, sessionToken, userPicture);
    this.setState({
      isReadyToRedirect: true,
    });
  }
  render() {
    const redirectUrl =
      this.params.get('redirect_to') && this.params.get('redirect_to') !== '/'
        ? this.params.get('redirect_to')
        : 'welcome';
    return this.state.isReadyToRedirect ? (
      <Redirect to={redirectUrl} noThrow />
    ) : (
      <div>redirecting</div>
    );
  }
}

let mapStateToProps = (state, props) => ({
  location: props.location,
});

const mapDispatchToProps = dispatch => {
  return {
    authenticateUser: (username, token, userPicture) =>
      dispatch(setAuthDetails(username, token, userPicture)),
  };
};

Authorized = connect(
  mapStateToProps,
  mapDispatchToProps,
)(Authorized);
export { Authorized };
