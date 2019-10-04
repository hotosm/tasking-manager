import React from 'react';
import { connect } from 'react-redux';
import { FormattedMessage } from 'react-intl';
import { Form, Field } from 'react-final-form';

import messages from './messages';
import { FormSubmitButton, Button } from '../button';
import { Dropdown } from '../dropdown';
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
  // 'default_editor',
  // 'mentions_notifications',
  // 'comments_notifications',
  // 'projects_notifications',
  // 'expert_mode',
];

function UserInterests() {
  return (
    <div className="bg-white blue-dark shadow-4 pa4 mb3">
      <span>Interests selection card</span>
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
      <div className="bg-white shadow-4 pa4 mb3">
        <h3 className="f3 blue-dark mt0 fw6">
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
                <fieldset className="bn" disabled={submitting || !this.props.userDetails.username}>
                  <div className="cf">
                    <label className={labelClasses}>
                      <FormattedMessage {...messages.name} />
                    </label>
                    <Field name="name" component="input" type="text" className={fieldClasses} />
                  </div>
                  <div className="cf">
                    <label className={labelClasses}>
                      <FormattedMessage {...messages.email} />
                    </label>
                    <Field
                      name="emailAddress"
                      type="email"
                      component="input"
                      className={fieldClasses}
                      required
                    />
                  </div>
                  <div className="cf">
                    <div className="w-100 w-50-ns fl pr3-ns">
                      <label className={labelClasses}>
                        <FormattedMessage {...messages.city} />
                      </label>
                      <Field name="city" component="input" type="text" className={fieldClasses} />
                    </div>
                    <div className="w-100 w-50-ns fl pl3-ns">
                      <label className={labelClasses}>
                        <FormattedMessage {...messages.country} />
                      </label>
                      <Field name="country" component="input" type="text" className={fieldClasses} />
                    </div>
                  </div>
                  <div className="cf pt3">
                    <div className="w-100 w-50-ns fl pr3-ns">
                      <label className={labelClasses}>
                        <FormattedMessage {...messages.slackUsername} />
                      </label>
                      <Field name="slackId" component="input" type="text" className={fieldClasses} />
                    </div>
                    <div className="w-100 w-50-ns fl pl3-ns">
                      <label className={labelClasses}>Twitter</label>
                      <Field name="twitterId" component="input" type="text" className={fieldClasses} />
                    </div>
                  </div>
                  <div className="cf">
                    <div className="w-100 w-50-ns fl pr3-ns">
                      <label className={labelClasses}>Facebook</label>
                      <Field name="facebookId" component="input" type="text" className={fieldClasses} />
                    </div>
                    <div className="w-100 w-50-ns fl pl3-ns">
                      <label className={labelClasses}>Linkedin</label>
                      <Field name="linkedinId" component="input" type="text" className={fieldClasses} />
                    </div>
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
                </fieldset>
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

class UserSettingsForm extends React.Component {
  render() {
    const labelClasses = 'db blue-dark f4 fw6';
    const leftColClasses = 'w-100 w-60-m w-70-l fl';
    const rightColClasses = 'w-100 w-40-m w-30-l pb4 pb0-ns fl tr-ns';
    return (
      <div className="bg-white shadow-4 pa4 mb3">
        <h3 className="f3 blue-dark mt0 fw6">
          <FormattedMessage {...messages.settings} />
        </h3>
        <div className="blue-grey">
          <div className="cf pb3">
            <div className={leftColClasses}>
              <label className={labelClasses}>
                <FormattedMessage {...messages.expertMode} />
              </label>
              <p>
                <FormattedMessage {...messages.expertModeDescription} />
              </p>
            </div>
            <div className={rightColClasses}>
              <input type="checkbox" />
            </div>
          </div>
          <div className="cf pb3">
            <div className={leftColClasses}>
              <label className={labelClasses}>
                <FormattedMessage {...messages.defaultEditor} />
              </label>
              <p>
                <FormattedMessage {...messages.defaultEditorDescription} />
              </p>
            </div>
            <div className={`dib ${rightColClasses}`}>
              <Dropdown
                onAdd={() => {}}
                onRemove={() => {}}
                onChange={() => {}}
                value={this.props.userDetails.default_editor}
                options={[{ label: 'iD editor', value: 'id' }, { label: 'JOSM', value: 'josm' }]}
                display={'Edit in'}
                className="blue-dark bg-white bn v-mid pv1 pl4"
              />
            </div>
          </div>
          <div className="cf">
            <div className={leftColClasses}>
              <label className={labelClasses}>
                <FormattedMessage {...messages.becomeValidator} />
              </label>
              <p>
                <FormattedMessage {...messages.becomeValidatorDescription} />
              </p>
            </div>
            <div className={rightColClasses}>
              <Button className="bg-blue-dark white mh1 mv2 dib">
                <FormattedMessage {...messages.apply} />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

UserSettingsForm = connect(
  mapStateToProps,
  { pushUserDetails },
)(UserSettingsForm);

class UserNotificationsForm extends React.Component {
  render() {
    const labelClasses = 'db blue-dark f4 fw6';
    const leftColClasses = 'w-100 w-60-m w-70-l fl';
    const rightColClasses = 'w-100 w-40-m w-30-l pb4 pb0-ns fl tr-ns';
    return (
      <div className="bg-white shadow-4 pa4 mb3">
        <h3 className="f3 blue-dark mt0 fw6">
          <FormattedMessage {...messages.notifications} />
        </h3>
        <div className="blue-grey">
          <div className="cf pb3">
            <div className={leftColClasses}>
              <label className={labelClasses}>
                <FormattedMessage {...messages.mentions} />
              </label>
              <p>
                <FormattedMessage {...messages.mentionsDescription} />
              </p>
            </div>
            <div className={rightColClasses}>
              <input type="checkbox" />
            </div>
          </div>
          <div className="cf pb3">
            <div className={leftColClasses}>
              <label className={labelClasses}>
                <FormattedMessage {...messages.projectUpdates} />
              </label>
              <p>
                <FormattedMessage {...messages.projectUpdatesDescription} />
              </p>
            </div>
            <div className={rightColClasses}>
              <input type="checkbox" />
            </div>
          </div>
          <div className="cf">
            <div className={leftColClasses}>
              <label className={labelClasses}>
                <FormattedMessage {...messages.comments} />
              </label>
              <p>
                <FormattedMessage {...messages.commentsDescription} />
              </p>
            </div>
            <div className={rightColClasses}>
              <input type="checkbox" />
            </div>
          </div>
        </div>
      </div>
    );
  }
}

UserNotificationsForm = connect(
  mapStateToProps,
  { pushUserDetails },
)(UserNotificationsForm);

export {
  UserInformationForm,
  UserSettingsForm,
  UserNotificationsForm,
  UserInterests,
  PROFILE_RELEVANT_FIELDS,
};
