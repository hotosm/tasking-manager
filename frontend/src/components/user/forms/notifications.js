import React from 'react';
import { FormattedMessage } from 'react-intl';

import messages from '../messages';
import { CustomField } from './customField';
import { SwitchToggleField } from './switchToggleField';

export function UserNotificationsForm(props) {
  const fields = [
    {
      labelId: 'mentions',
      descriptionId: 'mentionsDescription',
      fieldName: 'mentionsNotifications',
    },
    {
      labelId: 'teamUpdates',
      descriptionId: 'teamUpdatesDescription',
      fieldName: 'teamsAnnouncementNotifications',
    },
    {
      labelId: 'taskUpdates',
      descriptionId: 'taskUpdatesDescription',
      fieldName: 'tasksNotifications',
    },
    {
      labelId: 'projectUpdates',
      descriptionId: 'projectUpdatesDescription',
      fieldName: 'projectsNotifications',
    },
    {
      labelId: 'questionsAndComments',
      descriptionId: 'questionsAndCommentsDescription',
      fieldName: 'questionsAndCommentsNotifications',
    },
    {
      labelId: 'taskComments',
      descriptionId: 'taskCommentsDescription',
      fieldName: 'taskCommentsNotifications',
    },
  ];

  return (
    <div id="notifications" className="bg-white b--card ba br1 pa4 mb4">
      <h3 className="f3 blue-dark mt0 fw7">
        <FormattedMessage {...messages.notifications} />
      </h3>
      <div className="blue-grey">
        {fields.map((field) => (
          <CustomField
            key={field.labelId}
            labelId={field.labelId}
            descriptionId={field.descriptionId}
          >
            <SwitchToggleField fieldName={field.fieldName} removeVerticalPadding />
          </CustomField>
        ))}
      </div>
    </div>
  );
}
