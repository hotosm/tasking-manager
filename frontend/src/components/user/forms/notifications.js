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
      default: true,
    },
    {
      labelId: 'teamUpdates',
      descriptionId: 'teamUpdatesDescription',
      fieldName: 'teamsAnnouncementNotifications',
      default: false,
    },
    {
      labelId: 'taskUpdates',
      descriptionId: 'taskUpdatesDescription',
      fieldName: 'tasksNotifications',
      default: true,
    },
    {
      labelId: 'projectUpdates',
      descriptionId: 'projectUpdatesDescription',
      fieldName: 'projectsNotifications',
      default: true,
    },
    {
      labelId: 'questionsAndComments',
      descriptionId: 'questionsAndCommentsDescription',
      fieldName: 'questionsAndCommentsNotifications',
      default: false,
    },
    {
      labelId: 'taskComments',
      descriptionId: 'taskCommentsDescription',
      fieldName: 'taskCommentsNotifications',
      default: false,
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
            <SwitchToggleField
              fieldName={field.fieldName}
              default={field.default}
              removeVerticalPadding
            />
          </CustomField>
        ))}
      </div>
    </div>
  );
}
