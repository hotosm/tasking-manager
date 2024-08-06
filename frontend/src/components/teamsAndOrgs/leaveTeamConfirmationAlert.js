import { FormattedMessage } from 'react-intl';

import commonMessages from '../../views/messages';
import messages from './messages';
import { Button } from '../button';
import { styleClasses } from '../../views/projectEdit';

export const LeaveTeamConfirmationAlert = ({ teamName, close, leaveTeam }) => {
  return (
    <div className={styleClasses.modalClass}>
      <h2 className={styleClasses.modalTitleClass}>
        <FormattedMessage {...messages.leaveTheTeam} />
      </h2>
      <p className={`${styleClasses.pClass} pb2`}>
        <FormattedMessage
          {...messages.leaveTheTeamDescription}
          values={{
            name: teamName,
            b: (chunks) => <strong>{chunks}</strong>,
          }}
        />
      </p>
      <p>
        <Button className={styleClasses.whiteButtonClass} onClick={close}>
          <FormattedMessage {...commonMessages.cancel} />
        </Button>
        <Button className={styleClasses.redButtonClass} onClick={() => leaveTeam()}>
          <FormattedMessage {...messages.leave} />
        </Button>
      </p>
    </div>
  );
};
