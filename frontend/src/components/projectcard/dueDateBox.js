import React from "react";
import { FormattedMessage, FormattedRelative, injectIntl } from "react-intl";
import humanizeDuration from 'humanize-duration'

import messages from "./messages";

export function DueDateBox({intl, dueDate}: Object) {
    if (dueDate === undefined) {
      return null;
    }
    const milliDifference = (dueDate - Date.now());
    const langCodeOnly = intl.locale.slice(0,2)

    if (milliDifference > 0) {
      return (
      <span className="fr w-50 f7 tc br1 link ph1 pv1 bg-grey-light blue-grey truncate mw4">
        <FormattedMessage
          {...messages["dueDateRelativeRemainingDays"]}
          values={{
            daysLeft: (<FormattedRelative value={dueDate} />),
            daysLeftHumanize: humanizeDuration(milliDifference, { language: langCodeOnly, fallbacks: ['en'], largest: 1 }) 
          }}
        />
      </span>
      );
     } else {
       return null;
     }
  }

//decorator pattern to provide the intl object from IntlProvider into function props.
export default injectIntl(DueDateBox)