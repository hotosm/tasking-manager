import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { updateUserEmail } from '../../store/actions/auth';
import { PROFILE_RELEVANT_FIELDS } from '../user/forms/personalInformation';
import { ORG_PRIVACY_POLICY_URL } from '../../config';
import { Button } from '../button';

class UpdateEmail extends Component {
  constructor(props) {
    super(props);
    this.state = { email: '', success: false, details: '' };
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
    this.props.updateUserEmail(userData, this.props.token, PROFILE_RELEVANT_FIELDS.concat(['id']));
    this.setState({
      success: true,
      details: <FormattedMessage {...messages.emailUpdateSuccess} />,
    });
    this.props.closeModal();
  };

  render() {
    return (
      <div className="tl pa4 bg-white">
        <h1 className="pb2 ma0 barlow-condensed blue-dark">
          <FormattedMessage {...messages.emailUpdateTitle} />
        </h1>
        <p className="blue-dark lh-copy">
          <FormattedMessage {...messages.emailUpdateTextPart1} />
        </p>
        <p className="blue-dark lh-copy">
          <FormattedMessage {...messages.emailUpdateTextPart2} />
        </p>
        <form onSubmit={this.onSubmit}>
          <p>
            <FormattedMessage {...messages.emailPlaceholder}>
              {(msg) => {
                return (
                  <input
                    className="pa2 w-60-l w-100"
                    type="email"
                    name="email"
                    placeholder={msg}
                    onChange={this.onChange}
                    value={this.state.email}
                  />
                );
              }}
            </FormattedMessage>
          </p>
          <Button className="bg-red white" type="submit">
            <FormattedMessage {...messages.emailUpdateButton} />
          </Button>
          <p className="mb0">
            <a
              className="link pointer red fw5"
              target="_blank"
              rel="noopener noreferrer"
              href={`http://${ORG_PRIVACY_POLICY_URL}`}
            >
              <FormattedMessage {...messages.privacyPolicy} />
            </a>
          </p>
          <p className={this.state.details ? 'dib mb0' : 'dn'}>{this.state.details}</p>
        </form>
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  userDetails: state.auth.get('userDetails'),
  token: state.auth.get('token'),
});

UpdateEmail.propTypes = {
  updateUserEmail: PropTypes.func.isRequired,
  closeModal: PropTypes.func.isRequired,
};

UpdateEmail = connect(mapStateToProps, { updateUserEmail })(UpdateEmail);

export { UpdateEmail };
