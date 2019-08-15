import React from 'react';
import { connect } from 'react-redux';
import { FormattedMessage } from 'react-intl';
import { Form, Field } from 'react-final-form';

import messages from './messages';
import { FormSubmitButton } from '../button';
import { pushUserDetails } from '../../store/actions/auth';

const PROFILE_RELEVANT_FIELDS = [
  'name',
  'emailAddress',
  'city',
  'country',
  'twitterId',
  'facebookId',
  'linkedinId',
  'slackId',
];

function UserInterests() {
  return (
    <div className="cf bg-white shadow-4 pa4 mb3">
      <h3 className="f2 mt0 fw6">
        <FormattedMessage {...messages.welcomeTitle} />
      </h3>
      <p>
        <FormattedMessage {...messages.interestsTitle} />
      </p>
      <p>
        <FormattedMessage {...messages.interestsLead} />
      </p>
    </div>
  );
}

class UserInformationForm extends React.Component {
  prepareUserDetailsToPush(values) {
    let data = {};
    PROFILE_RELEVANT_FIELDS.filter(key => values.hasOwnProperty(key)).forEach(
      key => (data[key] = values[key]),
    );
    return JSON.stringify(data);
  }

  render() {
    const labelClasses = 'db pt3 pb2';
    const fieldClasses = 'blue-grey w-100 pv3 ph2 input-reset ba b--grey-light bg-transparent';
    return (
      <div className="bg-white shadow-4 pa4">
        <h3 className="f3 mt0 fw6">
          <FormattedMessage {...messages.personalInfo} />
        </h3>
        <Form
          onSubmit={values =>
            this.props.pushUserDetails(this.prepareUserDetailsToPush(values), this.props.token)
          }
          initialValues={this.props.userDetails}
          render={({ handleSubmit, pristine, form, submitting, values }) => {
            return (
              <form onSubmit={handleSubmit} className="blue-grey">
                <div>
                  <label className={labelClasses}>
                    <FormattedMessage {...messages.name} />
                  </label>
                  <Field name="name" component="input" className={fieldClasses} />
                </div>
                <div>
                  <label className={labelClasses}>
                    <FormattedMessage {...messages.email} />
                  </label>
                  <Field name="emailAddress" type="email" component="input" className={fieldClasses} required />
                </div>
                <div className="cf">
                  <div className="w-100 w-50-ns fl pr3-ns">
                    <label className={labelClasses}>
                      <FormattedMessage {...messages.city} />
                    </label>
                    <Field name="city" component="input" className={fieldClasses} />
                  </div>
                  <div className="w-100 w-50-ns fl pl3-ns">
                    <label className={labelClasses}>
                      <FormattedMessage {...messages.country} />
                    </label>
                    <Field name="country" component="input" className={fieldClasses} />
                  </div>
                </div>
                <div>
                  <label className={labelClasses}>
                    <FormattedMessage {...messages.slackUsername} />
                  </label>
                  <Field name="slackId" component="input" className={fieldClasses} />
                </div>
                <div>
                  <label className={labelClasses}>Twitter</label>
                  <Field name="twitterId" component="input" className={fieldClasses} />
                </div>
                <div>
                  <label className={labelClasses}>Facebook</label>
                  <Field name="facebookId" component="input" className={fieldClasses} />
                </div>
                <div>
                  <label className={labelClasses}>Linkedin</label>
                  <Field name="linkedinId" component="input" className={fieldClasses} />
                </div>
                <div className="pt2">
                  <FormSubmitButton
                    disabled={submitting || pristine}
                    className="bg-blue-dark white mh1 mv2"
                    disabledClassName="bg-grey-light white mh1 mv2"
                  >
                    <FormattedMessage {...messages.save} />
                  </FormSubmitButton>
                </div>
              </form>
            );
          }}
        ></Form>
      </div>
    );
  }
}

const mapStateToProps = state => ({
  userDetails: state.auth.get('userDetails'),
  token: state.auth.get('token'),
});

UserInformationForm = connect(
  mapStateToProps,
  { pushUserDetails },
)(UserInformationForm);

export { UserInformationForm, UserInterests, PROFILE_RELEVANT_FIELDS };
