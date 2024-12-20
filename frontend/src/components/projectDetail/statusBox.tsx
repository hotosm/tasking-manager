import { FormattedMessage } from 'react-intl';

import messages from './messages';

export const ProjectStatusBox = ({ status, className }: {
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED",
  className: string,
}) => {
  const colour = status === 'DRAFT' ? 'orange' : 'blue-grey';
  return (
    <div className={`tc br1 f7 ttu ba b--${colour} ${colour} ${className}`}>
      <FormattedMessage {...messages[`status_${status}`]} />
    </div>
  );
};
