import { FormattedMessage } from 'react-intl';

import messages from './messages';

export function ChangesetCommentTags({ tags }: Object) {
  return (
    <div className="cf pb3 blue-dark">
      <span className="fw6">
        <FormattedMessage {...messages.changesetComment} />:
      </span>
      <span className="pl2">{tags}</span>
    </div>
  );
}
