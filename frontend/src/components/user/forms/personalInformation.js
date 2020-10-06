import React, { useState } from 'react';
import { connect } from 'react-redux';
import { FormattedMessage } from 'react-intl';
import { Form, Field } from 'react-final-form';

import messages from '../messages';
import { FormSubmitButton } from '../../button';
import { UserCountrySelect } from '../../formInputs';
import { RadioField } from '../../formInputs';
import { pushUserDetails } from '../../../store/actions/auth';
import { fetchLocalJSONAPI } from '../../../network/genericJSONRequest';
import { CheckIcon, CloseIcon } from '../../svgIcons';
import { ORG_CODE } from '../../../config';

export const PROFILE_RELEVANT_FIELDS = [
  'name',
  'emailAddress',
  'city',
  'country',
  'twitterId',
  'facebookId',
  'linkedinId',
  'slackId',
  'gender',
];

const mapStateToProps = (state) => ({
  userDetails: state.auth.get('userDetails'),
  token: state.auth.get('token'),
});

const RequiredIndicator = () => <span className="ml1 b red">*</span>;

function _PersonalInformationForm(props) {
  const labelClasses = 'db pt3 pb2';
  const fieldClasses = 'blue-grey w-100 pv3 ph2 input-reset ba b--grey-light bg-transparent';
  const formFields = PROFILE_RELEVANT_FIELDS.concat(['selfDescriptionGender']);
  const [resendStatus, setResend] = useState(null);

  const prepareUserDetailsToPush = (values, fields) => {
    let data = { id: props.userDetails.id };
    fields.filter((key) => values.hasOwnProperty(key)).forEach((key) => (data[key] = values[key]));
    return JSON.stringify(data);
  };

  const resendEmail = () => {
    fetchLocalJSONAPI('users/me/actions/verify-email/', props.token, 'PATCH')
      .then(() => setResend(true))
      .catch(() => setResend(false));
  };

  const composeValidators = (...validators) => (value) =>
    validators.reduce((error, validator) => error || validator(value), undefined);
  const isUrl = (value) =>
    value &&
    value.match(
      /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/gi,
    ) ? (
      <FormattedMessage {...messages.urlDetectedError} />
    ) : undefined;

  return (
    <div className="bg-white shadow-4 pa4 mb3">
      <h3 className="f3 blue-dark mt0 fw6">
        <FormattedMessage {...messages.personalInfo} />
      </h3>
      <Form
        onSubmit={(values) =>
          props.pushUserDetails(prepareUserDetailsToPush(values, formFields), props.token, true)
        }
        initialValues={props.userDetails}
        render={({ handleSubmit, pristine, form, submitting, values, hasValidationErrors }) => (
          <form onSubmit={handleSubmit} className="blue-grey">
            <fieldset className="bn ph0" disabled={submitting || !props.userDetails.username}>
              <div className="cf">
                <label className={labelClasses}>
                  <FormattedMessage {...messages.name} />
                  <RequiredIndicator />
                </label>
                <Field
                  name="name"
                  component="input"
                  type="text"
                  className={fieldClasses}
                  autoComplete="name"
                />
              </div>
              <div className="cf">
                <label className={labelClasses}>
                  <FormattedMessage {...messages.email} />
                  <RequiredIndicator />
                </label>
                <Field
                  name="emailAddress"
                  type="email"
                  component="input"
                  required
                  autoComplete="email"
                >
                  {({ input, meta }) => (
                    <div>
                      <input {...input} type="email" className={fieldClasses} />
                      {meta.error && meta.touched && <div className="mt1 red">{meta.error}</div>}
                      {props.userDetails.emailAddress &&
                        !props.userDetails.isEmailVerified &&
                        !meta.dirty && (
                          <div className="mt1 red">
                            <FormattedMessage {...messages.emailConfirmationMsg} />
                            <span
                              onClick={resendEmail}
                              className="ml2 ma0 pa0 link pointer red b underline f6"
                            >
                              <FormattedMessage {...messages.emailResend} />
                            </span>
                            {resendStatus === true ? (
                              <CheckIcon
                                style={{ width: '0.7em', height: '0.7em' }}
                                className="ml1 h1 w1 blue-dark"
                              />
                            ) : null}
                            {resendStatus === false ? (
                              <CloseIcon
                                style={{ width: '0.7em', height: '0.7em' }}
                                className="ml1 h1 w1 red"
                              />
                            ) : null}
                          </div>
                        )}
                    </div>
                  )}
                </Field>
                <p className="f6 mv2">
                  <RequiredIndicator /> <FormattedMessage {...messages.required} />
                </p>
              </div>
              <div className="cf">
                <div className="w-100 w-50-ns fl pr3-ns">
                  <label className={labelClasses}>
                    <FormattedMessage {...messages.city} />
                  </label>
                  <Field
                    name="city"
                    component="input"
                    type="text"
                    className={fieldClasses}
                    autoComplete="address-level2"
                  />
                </div>
                <div className="w-100 w-50-ns fl pl3-ns">
                  <label className={labelClasses}>
                    <FormattedMessage {...messages.country} />
                  </label>
                  <UserCountrySelect className={fieldClasses} />
                </div>
              </div>
              <div className="cf pt3">
                <div className="w-100 w-50-ns fl pr3-ns">
                  <label className={labelClasses}>
                    <FormattedMessage {...messages.slackUsername} values={{ org: ORG_CODE }} />
                  </label>
                  <Field
                    name="slackId"
                    component="input"
                    type="text"
                    validate={composeValidators(isUrl)}
                  >
                    {({ input, meta }) => (
                      <div>
                        <input {...input} type="text" className={fieldClasses} />
                        {meta.error && meta.touched && <div className="mt1 red">{meta.error}</div>}
                      </div>
                    )}
                  </Field>
                </div>
                <div className="w-100 w-50-ns fl pl3-ns">
                  <label className={labelClasses}>Twitter</label>
                  <Field
                    name="twitterId"
                    component="input"
                    type="text"
                    validate={composeValidators(isUrl)}
                  >
                    {({ input, meta }) => (
                      <div>
                        <input {...input} type="text" className={fieldClasses} />
                        {meta.error && meta.touched && <div className="mt1 red">{meta.error}</div>}
                      </div>
                    )}
                  </Field>
                </div>
              </div>
              <div className="cf">
                <div className="w-100 w-50-ns fl pr3-ns">
                  <label className={labelClasses}>Facebook</label>
                  <Field
                    name="facebookId"
                    component="input"
                    type="text"
                    validate={composeValidators(isUrl)}
                  >
                    {({ input, meta }) => (
                      <div>
                        <input {...input} type="text" className={fieldClasses} />
                        {meta.error && meta.touched && <div className="mt1 red">{meta.error}</div>}
                      </div>
                    )}
                  </Field>
                </div>
                <div className="w-100 w-50-ns fl pl3-ns">
                  <label className={labelClasses}>LinkedIn</label>
                  <Field
                    name="linkedinId"
                    component="input"
                    type="text"
                    validate={composeValidators(isUrl)}
                  >
                    {({ input, meta }) => (
                      <div>
                        <input {...input} type="text" className={fieldClasses} />
                        {meta.error && meta.touched && <div className="mt1 red">{meta.error}</div>}
                      </div>
                    )}
                  </Field>
                </div>
              </div>
              <div className="cf w-100 w-50-ns">
                <div>
                  <label className={labelClasses}>
                    <FormattedMessage {...messages.gender} />
                  </label>
                  <div className="pv2">
                    <RadioField name="gender" value="FEMALE" />
                    <FormattedMessage {...messages.female} />
                  </div>
                  <div className="pv2">
                    <RadioField name="gender" value="MALE" />
                    <FormattedMessage {...messages.male} />
                  </div>
                  <div className="pv2">
                    <RadioField name="gender" value="PREFER_NOT" />
                    <FormattedMessage {...messages.preferNotToSay} />
                  </div>
                  <div className="pv2">
                    <RadioField name="gender" value="SELF_DESCRIBE" />
                    <FormattedMessage {...messages.selfDescribe} />
                  </div>
                  <Field name="gender" subscription={{ value: true }}>
                    {({ input: { value } }) =>
                      value === 'SELF_DESCRIBE' ? (
                        <Field
                          name="selfDescriptionGender"
                          component="input"
                          type="text"
                          className={fieldClasses}
                          required
                        />
                      ) : null
                    }
                  </Field>
                </div>
              </div>
              <div className="pt2">
                <FormSubmitButton
                  disabled={submitting || pristine || hasValidationErrors}
                  className="bg-blue-dark white mh1 mv2"
                  disabledClassName="bg-grey-light white mh1 mv2"
                >
                  <FormattedMessage {...messages.save} />
                </FormSubmitButton>
              </div>
            </fieldset>
          </form>
        )}
      ></Form>
    </div>
  );
}

export const PersonalInformationForm = connect(mapStateToProps, { pushUserDetails })(
  _PersonalInformationForm,
);
