import React from 'react';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { getEditors } from '../../utils/editorsList';
import { Dropdown } from '../dropdown';
import { Button } from '../button';
import { Imagery } from './imagery';
import { MappingTypes } from './mappingTypes';

export class TaskSelectionFooter extends React.Component {
  renderContributeButton() {
    if (this.props.type === 'mapping') {
      return <Button className="white bg-red">
        <FormattedMessage {...messages.mapRandomTask}/>
      </Button>;
    }
    if (this.props.type === 'validation') {
      return <Button className="white bg-red">
        <FormattedMessage {...messages.validateRandomTask}/>
      </Button>;
    }
  }
  render() {
    const titleClasses = 'db ttu f6 blue-light mb2';
    return (
      <div className="cf">
        <div className="w-20 fl">
          <h3 className={titleClasses}>
            <FormattedMessage {...messages.typesOfMapping} />
          </h3>
          <div className="db fl pt1">
            <MappingTypes types={this.props.mappingTypes} />
          </div>
        </div>
        <div className="w-20 fl">
          <h3 className={titleClasses}>
            <FormattedMessage {...messages.imagery} />
          </h3>
          <Imagery value={this.props.imagery} />
        </div>
        <div className="w-20 fl">
          <h3 className={titleClasses}>
            <FormattedMessage {...messages.editor} />
          </h3>
          <Dropdown
            options={getEditors()}
            value={this.props.defaultUserEditor || ''}
            display={<FormattedMessage {...messages.selectEditor} />}
          />
        </div>
        <div className="w-40 fl tr">
          <div className="mt3">
            {this.renderContributeButton()}
          </div>
        </div>
      </div>
    );
  }
}
