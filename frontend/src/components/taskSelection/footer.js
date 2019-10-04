import React from 'react';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { getEditors } from '../../utils/editorsList';
import { Dropdown } from '../dropdown';
import { Button } from '../button';
import { Imagery } from './imagery';
import { MappingTypes } from './mappingTypes';

export function ContributeButton({type}: Object) {
  if (type === 'validation') {
    return <Button className="white bg-red">
      <FormattedMessage {...messages.validateRandomTask}/>
    </Button>;
  }
  return <Button className="white bg-red">
    <FormattedMessage {...messages.mapRandomTask}/>
  </Button>;
}

export const TaskSelectionFooter = props => {
  const titleClasses = 'db ttu f6 blue-light mb2';

  return (
    <div className="cf">
      <div className="w-25 fl">
        <h3 className={titleClasses}>
          <FormattedMessage {...messages.typesOfMapping} />
        </h3>
        <div className="db fl pt1">
          <MappingTypes types={props.mappingTypes} />
        </div>
      </div>
      <div className="w-25 fl">
        <h3 className={titleClasses}>
          <FormattedMessage {...messages.imagery} />
        </h3>
        <Imagery value={props.imagery} />
      </div>
      <div className="w-20 fl">
        <h3 className={titleClasses}>
          <FormattedMessage {...messages.editor} />
        </h3>
        <Dropdown
          options={getEditors()}
          value={props.defaultUserEditor || ''}
          display={<FormattedMessage {...messages.selectEditor} />}
        />
      </div>
      <div className="w-30 fl tr">
        <div className="mt3">
          {/* type value will be changed soon */}
          <ContributeButton type={props.type || 'mapping'} />
        </div>
      </div>
    </div>
  );
}
