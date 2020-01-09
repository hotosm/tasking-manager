import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { Button } from '../button';
import { CloseIcon } from '../svgIcons';
import { registerUser } from '../../store/actions/user';

import * as safeStorage from '../../utils/safe_storage';

class SignUp extends Component {
  constructor(props) {
    super(props);
    this.state = { email: '', details: '', success: false };
    this.onChange = this.onChange.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
  }

  onChange(e) {
    this.setState({ [e.target.name]: e.target.value });
  }

  onSubmit = e => {
    e.preventDefault();
    const formdata = {
      email: this.state.email,
    };
    let registerPromise = this.props.registerUser(formdata);
    registerPromise.then(res => {
      this.setState({ ...this.state, success: res.success, details: res.details });

      if (res.success === true) {
        setTimeout(() => (window.location.href = 'https://www.openstreetmap.org/user/new'), 1500);
        safeStorage.setItem('email_address', formdata.email)
      }
    });
  };

  render() {
    return (
      <div className="tl pa4 bg-white">
        <p className={this.state.details ? 'dib' : 'dn'}>{this.state.details}</p>
        <span
          className="fr relative blue-light pt1 link pointer"
          onClick={() => this.props.closeModal()}
        >
          <CloseIcon style={{ height: '18px', width: '18px' }} />
        </span>
        <h1 className="pb2 ma0 barlow-condensed blue-dark">
          <FormattedMessage {...messages.signUpOSM} />
        </h1>
        <p className="blue-dark lh-copy">
          <FormattedMessage {...messages.signUpTextPart1} />
        </p>
        <p className="blue-dark lh-copy">
          <FormattedMessage {...messages.signUpTextPart2} />
        </p>
        <p className="blue-dark lh-copy">
          <FormattedMessage {...messages.signUpQuestion} />
        </p>
        <form onSubmit={this.onSubmit}>
          <div>
            <input
              className="pa2 w-60-l w-100"
              type="email"
              name="email"
              placeholder="Your best email"
              onChange={this.onChange}
              value={this.state.email}
            />
          </div>
          <p className="blue-grey lh-copy">
            <FormattedMessage {...messages.signUpRedirect} />
          </p>
          <Button className="bg-red white" type="submit">
            <FormattedMessage {...messages.submitProceed} />
          </Button>
        </form>
      </div>
    );
  }
}

SignUp.propTypes = {
  registerUser: PropTypes.func.isRequired,
};

SignUp = connect(
  null,
  { registerUser },
)(SignUp);

export { SignUp };
