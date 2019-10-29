import React, { useState, useEffect } from 'react';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { getEditors } from '../../utils/editorsList';
import { Dropdown } from '../dropdown';
import { Button } from '../button';
import { Imagery } from './imagery';
import { MappingTypes } from './mappingTypes';

export function ContributeButton({ action }: Object) {
  if (action) {
    return (
      <Button className="white bg-red">
        <FormattedMessage {...messages[action]} />
      </Button>
    );
  }
  return (
    <Button className="white bg-red">
      <FormattedMessage {...messages.mapATask} />
    </Button>
  );
}

export const TaskSelectionFooter = props => {
  const [editor, setEditor] = useState(props.defaultUserEditor);
  const [editorOptions, setEditorOptions] = useState([]);
  const titleClasses = 'db ttu f6 blue-light mb2';

  useEffect(() => {
    if (props.taskAction && props.mappingEditors && props.taskAction.startsWith('validate')) {
      setEditorOptions(getEditors().filter(i => props.validationEditors.includes(i.backendValue)));
    } else {
      setEditorOptions(getEditors().filter(i => props.mappingEditors.includes(i.backendValue)));
    }
  }, [props.taskAction, props.mappingEditors, props.validationEditors]);

  const updateEditor = arr => setEditor(arr[0].value);

  return (
    <div className="cf bg-white pb2 ph4-l ph2">
      <div className="w-25-ns w-40 fl">
        <h3 className={titleClasses}>
          <FormattedMessage {...messages.typesOfMapping} />
        </h3>
        <div className="db fl pt1">
          <MappingTypes types={props.mappingTypes} />
        </div>
      </div>
      <div className="w-25-ns w-60 fl">
        <h3 className={titleClasses}>
          <FormattedMessage {...messages.imagery} />
        </h3>
        <Imagery value={props.imagery} />
      </div>
      <div className="w-20-ns w-40 fl">
        <h3 className={titleClasses}>
          <FormattedMessage {...messages.editor} />
        </h3>
        <Dropdown
          options={editorOptions}
          value={editor}
          display={<FormattedMessage {...messages.selectEditor} />}
          className="bg-white bn"
          toTop={true}
          onChange={updateEditor}
          onAdd={() => {}}
          onRemove={() => {}}
        />
      </div>
      <div className="w-30-ns w-60 fl tr">
        <div className="mt3">
          {/* type value will be changed soon */}
          <ContributeButton action={props.taskAction} />
        </div>
      </div>
    </div>
  );
};
