import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { registerUser } from '../store/actions/user';


class SignUp extends Component {
  constructor(props) {
    super(props);
    this.state = {
      name: '',
      lastname: '',
      email: '',
    };

    this.onChange = this.onChange.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
  }

  onChange(e) {
    this.setState({ [e.target.name]: e.target.value });
  }

  onSubmit = (e) => {
    e.preventDefault();
    const formdata = {
      name: this.state.name,
      lastname: this.state.lastname,
      email: this.state.email,
    };
    this.props.registerUser(formdata);
  }

  render() {
    return (
      <div style={signUpStyle}>
        <h1>Sign up</h1>
        <form onSubmit={this.onSubmit}>
          <div>
            <label>Name: </label>
            <br />
            <input
              type="text"
              name="name"
              onChange={this.onChange}
              value={this.state.name}
            />
          </div>
          <br />
          <div>
            <label>LastName: </label>
            <br />
            <input
              type="text"
              name="lastname"
              onChange={this.onChange}
              value={this.state.lastname}
            />
          </div>
          <br />
          <div>
            <label>Email: </label>
            <br />
            <input
              type="email"
              name="email"
              onChange={this.onChange}
              value={this.state.email}
            />
          </div>
          <br />
          <button type="submit">Submit</button>
        </form>
      </div>
    );
  }
}

const signUpStyle = {
  textAlign: 'center',
  padding: '2em'
}


SignUp.propTypes = {
  registerUser: PropTypes.func.isRequired
};

SignUp = connect(null, { registerUser })(SignUp)

export { SignUp };

