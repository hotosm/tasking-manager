import React from 'react';
import { FormattedMessage } from 'react-intl';

import messages from '../messages';
import { CustomField } from './customField';
import { SwitchToggleField } from './switchToggleField';

export function UserNotificationsForm(props) {
  return (
    <div id="notifications" className="bg-white shadow-4 pa4 mb3">
      <h3 className="f3 blue-dark mt0 fw6">
        <FormattedMessage {...messages.notifications} />
      </h3>
      <div className="blue-grey">
        <CustomField labelId="mentions" descriptionId="mentionsDescription">
          <SwitchToggleField fieldName="mentionsNotifications" />
        </CustomField>
        <CustomField labelId="teamUpdates" descriptionId="teamUpdatesDescription">
          <SwitchToggleField fieldName="teamsNotifications" />
        </CustomField>
        <CustomField labelId="taskUpdates" descriptionId="taskUpdatesDescription">
          <SwitchToggleField fieldName="tasksNotifications" />
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
