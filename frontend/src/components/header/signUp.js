import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { registerUser } from '../../store/actions/user';


class SignUp extends Component {
  constructor(props) {
    super(props);
    this.state = {email: '', details: '', 'success': false};
    this.onChange = this.onChange.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
  }

  onChange(e) {
    this.setState({ [e.target.name]: e.target.value });
  }

  onSubmit = (e) => {
    e.preventDefault();
    const formdata = {
      email: this.state.email,
    };
    let registerPromise = this.props.registerUser(formdata);
    registerPromise.then(res => {
      this.setState({...this.state, success: res.success, details: res.details})

      if (res.success === true) {
        setTimeout(() => window.location.href = 'https://www.openstreetmap.org/user/new', 1500);
      }
    })
  }

  render() {
    return (
      <div style={signUpStyle}>
        <p style={this.state.success ? successStyle : failureStyle} >{this.state.details}</p>
        <h1 style={{paddingBottom: '0.5em'}}>Sign up on OSM</h1>
        <p style={paragraphStyle}>You will be redirected to the OpenStreetMap website, where you need to <br/>
        create that you will use to login into Tasking Manager</p>
        <p style={paragraphStyle}>
          <b>So that we can keep in touch, could you please tell us your email
          address?
          </b>
        </p>
        <form onSubmit={this.onSubmit}>
          <div>
            <label style={{color: '#555C6C', fontSize: '12px'}}>Email: </label>
            <br />
            <input style={{width: '100%', lineHeight: '1.7'}}
              type="email"
              name="email"
              placeholder="Enter your email"
              onChange={this.onChange}
              value={this.state.email}
            />
          </div>
          <br />
          <button style={buttonStyle} type="submit">Submit & Proceed</button>
        </form>
      </div>
    );
  }
}


const failureStyle = {
  backgroundColor: '#ffcccc',
  fontSize: '13px',
  lineHeight: '3.3em',
  textAlign: 'center'
}

const successStyle = {
  backgroundColor: '#d9f2d9',
  fontSize: '13px',
  lineHeight: '3.3em',
  textAlign: 'center'
}

const paragraphStyle = {
  color: '#555C6C',
  fontSize: '14px',
  paddingBottom: '1.5em'
}

const signUpStyle = {
  textAlign: 'left',
  padding: '2em',
}

const buttonStyle = {
  margin: '6em 0em 1em 0em',
  float: 'right',
  fontSize: '14px',
  backgroundColor: '#d73f3f',
  color: 'white',
  padding: '1em 2em',
}

SignUp.propTypes = {
  registerUser: PropTypes.func.isRequired
};

SignUp = connect(null, { registerUser })(SignUp)

export {SignUp, signUpStyle, paragraphStyle, buttonStyle, successStyle, failureStyle};
