import React from 'react';
import { connect } from "react-redux";

class Login extends React.Component {
  render() {
    console.log(this.props.location);
    return(
      <div className="pt180 pull-center">This is the login page</div>
    );
  }
}


Login = connect(
  (state, props) => ({
    location: props.location
  })
)(Login);
export { Login };
