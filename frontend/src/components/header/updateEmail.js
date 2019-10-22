import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { updateUserEmail } from '../../store/actions/auth';
import {signUpStyle, paragraphStyle, buttonStyle, successStyle, failureStyle} from './signUp';
import { PROFILE_RELEVANT_FIELDS } from '../user/forms';


class UpdateEmail extends Component {
  constructor(props) {
    super(props);
    this.state = {email: '', success: false, details: ''};
    this.onChange = this.onChange.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
  }

  onChange(e) {
    this.setState({ [e.target.name]: e.target.value });
  }

  onSubmit = (e) => {
    e.preventDefault();
    let userData = this.props.userDetails;
    userData.emailAddress = this.state.email;
    this.props.updateUserEmail(userData, this.props.token, PROFILE_RELEVANT_FIELDS);
    this.setState({success: true, details: 'Email updated successfully'})
    this.props.closeModal();
  }

  render() {
    return (
      <div style={signUpStyle}>
        <h1 style={{paddingBottom: '0.5em'}}>Update user email</h1>
        <p style={paragraphStyle}>When you contribute to the Tasking Manager,
          it is important that notifications about the tasks and projects you contributed to are
          reaching you. Before you begin mapping: Please add your email address.</p>
        <p>
          <b>See <a target="_blank" rel="noopener noreferrer" href="https://www.hotosm.org/privacy"> here </a> for more information about
          how HOT will use and share your data.</b>
        </p>
        <form onSubmit={this.onSubmit}>
          <div>
            <label style={{color: '#555C6C', fontSize: '12px'}}>Email: </label>
            <br />
            <input style={{width: '100%', lineHeight: '1.7'}}
              type="email"
              name="email"
              placeholder="Enter your email address"
              onChange={this.onChange}
              value={this.state.email}
            />
          </div>
          <br />
          <button style={buttonStyle} type="submit">Update</button>
          <p style={this.state.success ? successStyle : failureStyle} >{this.state.details}</p>
        </form>
      </div>
    );
  }
}

const mapStateToProps = state => ({
  userDetails: state.auth.get('userDetails'),
  token: state.auth.get('token')
});

UpdateEmail.propTypes = {
  updateUserEmail: PropTypes.func.isRequired,
  closeModal: PropTypes.func.isRequired
};

UpdateEmail = connect(mapStateToProps, { updateUserEmail })(UpdateEmail)

export { UpdateEmail };
