import React, { useState, useEffect, useLayoutEffect } from 'react';
import { connect } from 'react-redux';
import { Link } from '@reach/router';
import { FormattedMessage } from 'react-intl';
import { Form, Field } from 'react-final-form';

import messages from './messages';
import { FormSubmitButton, Button } from '../button';
import { Dropdown } from '../dropdown';
import { SwitchToggle, RadioField } from '../formInputs';
import { pushUserDetails } from '../../store/actions/auth';
import { getEditors } from '../../utils/editorsList';
import { CheckIcon } from '../svgIcons';
import { API_URL } from '../../config';

const PROFILE_RELEVANT_FIELDS = [
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

const mapStateToProps = state => ({
  userDetails: state.auth.get('userDetails'),
  token: state.auth.get('token'),
});

function UserInterests({ token, userDetails }) {
  const [interests, setInterests] = useState([]);
  const [success, setSuccess] = useState(null);

  useLayoutEffect(() => {
    const getInterests = async username => {
      const url = `${API_URL}users/${username}/queries/interests/`;
      const headers = {
        'Content-Type': 'application/json',
        'Accept-Language': 'en',
        Authorization: `Token ${token}`,
      };
      const res = await fetch(url, { headers: headers });
      const data = await res.json();
      setInterests(data.interests);
    };

    if (userDetails.username) {
      getInterests(userDetails.username);
    }
  }, [token, userDetails]);

  const interestStyle = 'w-30 ba pv3 ph3 f6 tc mb2 mr3 relative ttc';
  const selectedStyle = 'f7 pa1 br-100 bg-black white absolute right-0 top-0';

  const changeSelect = id => {
    const index = interests.findIndex(i => i.id === id);

    const copy = interests.map((interest, idx) => {
      if (idx === index) {
        interest.userSelected = !interest.userSelected;
      }
      return interest;
    });

    setInterests(copy);
  };

  const updateInterests = () => {
    const postUpdate = async ids => {
      const url = `${API_URL}users/me/actions/set-interests/`;
      const headers = {
        'Content-Type': 'application/json',
        'Accept-Language': 'en',
        Authorization: `Token ${token}`,
      };

      const options = {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({ interests: ids }),
      };

      const res = await fetch(url, options);
      if (res.status !== 200) {
        setSuccess(false);
      } else {
        setSuccess(true);
      }
    };

    // Get all true ids.
    const trueInterests = interests.filter(i => i.userSelected === true);
    const ids = trueInterests.map(i => i.id);
    postUpdate(ids);
  };

  return (
    <div className="cf bg-white shadow-4 pa4 mb3">
      <h3 className="f3 blue-dark mt0 fw6">
        <FormattedMessage {...messages.interestsH3} />
      </h3>
      <p>
        <FormattedMessage {...messages.interestsTitle} />
      </p>
      <p>
        <FormattedMessage {...messages.interestsLead} />
      </p>
      <ul className="list w-100 pa0 flex flex-wrap">
        {interests.map(i => (
          <li
            onClick={() => changeSelect(i.id)}
            className={
              (i.userSelected === true ? 'b--black bw1 bg-washed-blue ' : 'b--light-silver ') +
              interestStyle
            }
            key={i.id}
          >
            {i.name}
            {i.userSelected === true ? <CheckIcon className={selectedStyle} /> : null}
          </li>
        ))}
      </ul>
      {success === null ? null : success === true ? (
        <span className="blue-dark bg-grey-light pa2 db">Interests updated successfully</span>
      ) : (
        <span className="bg-red white pa2 db">Interests update failed</span>
      )}
      <Button onClick={updateInterests} className="bg-blue-dark white mh1 mv2 dib">
        <FormattedMessage {...messages.save} />
      </Button>
    </div>
  );
}

function _UserInformationForm(props) {
  const labelClasses = 'db pt3 pb2';
  const fieldClasses = 'blue-grey w-100 pv3 ph2 input-reset ba b--grey-light bg-transparent';
  const formFields = PROFILE_RELEVANT_FIELDS.concat(['selfDescriptionGender']);
  const prepareUserDetailsToPush = (values, fields) => {
    let data = {};
    fields.filter(key => values.hasOwnProperty(key)).forEach(key => (data[key] = values[key]));
    return JSON.stringify(data);
  };

  return (
    <div className="bg-white shadow-4 pa4 mb3">
      <h3 className="f3 blue-dark mt0 fw6">
        <FormattedMessage {...messages.personalInfo} />
      </h3>
      <Form
        onSubmit={values =>
          props.pushUserDetails(prepareUserDetailsToPush(values, formFields), props.token)
        }
        initialValues={props.userDetails}
        render={({ handleSubmit, pristine, form, submitting, values }) => (
          <form onSubmit={handleSubmit} className="blue-grey">
            <fieldset className="bn" disabled={submitting || !props.userDetails.username}>
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
                <Field name="emailAddress" type="email" component="input" required>
                  {({ input, meta }) => (
                    <div>
                      <input {...input} type="email" className={fieldClasses} />
                      {meta.error && meta.touched && <div className="mt1 red">{meta.error}</div>}
                      {props.userDetails.emailAddress &&
                        !props.userDetails.isEmailVerified &&
                        !meta.dirty && (
                          <div className="mt1 red">
                            <FormattedMessage {...messages.emailConfirmationMsg} />
                          </div>
                        )}
                    </div>
                  )}
                </Field>
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
                  disabled={submitting || pristine}
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

const CustomField = props => {
  const labelClasses = 'db blue-dark f4 fw6';
  const leftColClasses = 'w-100 w-60-m w-70-l fl';
  const rightColClasses = 'w-100 w-40-m w-30-l pb4 pb0-ns fl tr-ns';
  return (
    <div className="cf pb3">
      <div className={leftColClasses}>
        <label className={labelClasses}>
          <FormattedMessage {...messages[props.labelId]} />
        </label>
        <p>
          <FormattedMessage {...messages[props.descriptionId]} />
        </p>
      </div>
      <div className={rightColClasses}>{props.children}</div>
    </div>
  );
};

function _SwitchToggleField(props) {
  const [value, setValue] = useState(null);
  useEffect(() => {
    if (value === null && props.userDetails.hasOwnProperty(props.fieldName)) {
      setValue(props.userDetails[props.fieldName]);
    }
  }, [value, props.userDetails, props.fieldName]);

  const onSwitchChange = () => {
    let payload = {};
    payload[props.fieldName] = !value;
    props.pushUserDetails(JSON.stringify(payload), props.token);
    setValue(!value);
  };

  return (
    <div className="fr pv2 dib">
      <SwitchToggle onChange={e => onSwitchChange()} isChecked={value} />
    </div>
  );
}

const SwitchToggleField = connect(
  mapStateToProps,
  { pushUserDetails },
)(_SwitchToggleField);

function _EditorDropdown(props) {
  const [value, setValue] = useState(null);
  useEffect(() => {
    if (value === null && props.userDetails.hasOwnProperty('defaultEditor')) {
      setValue(props.userDetails.defaultEditor);
    }
  }, [value, props.userDetails]);

  const onEditorSelect = arr => {
    if (arr.length === 1) {
      setValue(arr[0].value);
      props.pushUserDetails(JSON.stringify({ defaultEditor: arr[0].value }), props.token);
    } else if (arr.length > 1) {
      throw new Error('filter select array is big');
    }
  };

  return (
    <Dropdown
      onAdd={() => {}}
      onRemove={() => {}}
      onChange={onEditorSelect}
      value={value}
      options={getEditors()}
      display={<FormattedMessage {...messages.selectDefaultEditor} />}
      className="blue-dark bg-white ba b--grey-light v-mid pv2 pl4"
    />
  );
}

const EditorDropdown = connect(
  mapStateToProps,
  { pushUserDetails },
)(_EditorDropdown);

function _UserSettingsForm(props) {
  return (
    <div className="bg-white shadow-4 pa4 mb3">
      <h3 className="f3 blue-dark mt0 fw6">
        <FormattedMessage {...messages.settings} />
      </h3>
      <div className="blue-grey">
        <CustomField labelId="expertMode" descriptionId="expertModeDescription">
          <SwitchToggleField fieldName="isExpert" />
        </CustomField>
        <CustomField labelId="defaultEditor" descriptionId="defaultEditorDescription">
          <EditorDropdown />
        </CustomField>
        {props.userDetails.role === 'MAPPER' && (
          <CustomField labelId="becomeValidator" descriptionId="becomeValidatorDescription">
            <Link to="/learn">
              <Button className="bg-blue-dark white mh1 mv2 dib">
                <FormattedMessage {...messages.learnHow} />
              </Button>
            </Link>
          </CustomField>
        )}
      </div>
    </div>
  );
}

function UserNotificationsForm(props) {
  return (
    <div className="bg-white shadow-4 pa4 mb3">
      <h3 className="f3 blue-dark mt0 fw6">
        <FormattedMessage {...messages.notifications} />
      </h3>
      <div className="blue-grey">
        <CustomField labelId="mentions" descriptionId="mentionsDescription">
          <SwitchToggleField fieldName="mentionsNotifications" />
        </CustomField>
        <CustomField labelId="projectUpdates" descriptionId="projectUpdatesDescription">
          <SwitchToggleField fieldName="projectsNotifications" />
        </CustomField>
        <CustomField labelId="comments" descriptionId="commentsDescription">
          <SwitchToggleField fieldName="commentsNotifications" />
        </CustomField>
      </div>
    </div>
  );
}

const UserInformationForm = connect(
  mapStateToProps,
  { pushUserDetails },
)(_UserInformationForm);

const UserSettingsForm = connect(mapStateToProps)(_UserSettingsForm);

export {
  UserInformationForm,
  UserSettingsForm,
  UserNotificationsForm,
  UserInterests,
  PROFILE_RELEVANT_FIELDS,
};
