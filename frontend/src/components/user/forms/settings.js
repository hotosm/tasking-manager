import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import { Link } from '@reach/router';
import { FormattedMessage } from 'react-intl';

import messages from '../messages';
import { Button } from '../../button';
import { Dropdown } from '../../dropdown';
import { CustomField } from './customField';
import { SwitchToggleField } from './switchToggleField';
import { LocaleSelector } from '../../localeSelect';
import { pushUserDetails } from '../../../store/actions/auth';
import { getEditors } from '../../../utils/editorsList';

const mapStateToProps = (state) => ({
  userDetails: state.auth.get('userDetails'),
  token: state.auth.get('token'),
});

function _EditorDropdown(props) {
  const [value, setValue] = useState(null);
  useEffect(() => {
    if (value === null && props.userDetails.hasOwnProperty('defaultEditor')) {
      setValue(props.userDetails.defaultEditor);
    }
  }, [value, props.userDetails]);

  const onEditorSelect = (arr) => {
    if (arr.length === 1) {
      setValue(arr[0].value);
      props.pushUserDetails(
        JSON.stringify({ defaultEditor: arr[0].value, id: props.userDetails.id }),
        props.token,
        true,
      );
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

const EditorDropdown = connect(mapStateToProps, { pushUserDetails })(_EditorDropdown);

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
        <CustomField labelId="language" descriptionId="languageDescription">
          <LocaleSelector className="ba b--grey-light br1" />
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

export const UserSettingsForm = connect(mapStateToProps)(_UserSettingsForm);
