import { FormattedMessage } from 'react-intl';

import messages from './messages';

export const NotFound = ({ projectId }) => {
  return (
    <div className="cf w-100 pv5">
      <div className="tc">
        <h3 className="f1 fw8 mb4 barlow-condensed">
          {projectId ? (
            <FormattedMessage {...messages.projectNotFound} values={{ id: projectId }} />
          ) : (
            <FormattedMessage {...messages.pageNotFound} />
          )}
        </h3>
        <p>
          <FormattedMessage {...messages.notFoundLead} />
        </p>
      </div>
    </div>
  );
};
