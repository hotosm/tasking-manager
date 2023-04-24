import { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';
import Select from 'react-select';

import messages from '../messages';
import { Button } from '../../button';
import { CustomField } from './customField';
import { SwitchToggleField } from './switchToggleField';
import { LocaleSelector } from '../../localeSelect';
import { pushUserDetails } from '../../../store/actions/auth';
import { getEditors } from '../../../utils/editorsList';

const mapStateToProps = (state) => ({
  userDetails: state.auth.userDetails,
  token: state.auth.token,
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
    <div className="settings-width ml-auto">
      <Select
        classNamePrefix="react-select"
        onChange={(e) => onEditorSelect([e])}
        options={getEditors()}
        placeholder={<FormattedMessage {...messages.selectDefaultEditor} />}
        value={getEditors().find((editor) => editor.value === value)}
      />
    </div>
  );
}

const EditorDropdown = connect(mapStateToProps, { pushUserDetails })(_EditorDropdown);

function _UserSettingsForm(props) {
  return (
    <div className="bg-white b--card ba br1 pa4 mb4">
      <h3 className="f3 blue-dark mt0 fw7">
        <FormattedMessage {...messages.settings} />
      </h3>
      <div className="blue-grey">
        <CustomField labelId="expertMode" descriptionId="expertModeDescription">
          <SwitchToggleField fieldName="isExpert" default={false} removeVerticalPadding />
        </CustomField>
        <CustomField labelId="defaultEditor" descriptionId="defaultEditorDescription" isDropdown>
          <EditorDropdown />
        </CustomField>
        <CustomField labelId="language" descriptionId="languageDescription" isDropdown>
          <LocaleSelector fullWidth removeBorder={false} />
        </CustomField>
        {props.userDetails.role === 'MAPPER' && (
          <CustomField
            labelId="becomeValidator"
            descriptionId="becomeValidatorDescription"
            isDropdown
          >
            <Link to="/learn/validate">
              <Button className="bg-blue-dark white dib settings-width">
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
