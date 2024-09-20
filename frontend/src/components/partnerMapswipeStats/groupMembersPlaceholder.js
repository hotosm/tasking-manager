import { FormattedMessage } from 'react-intl';
import ReactPlaceholder from 'react-placeholder';
import { TextRow } from 'react-placeholder/lib/placeholders';

import { fetchLocalJSONAPI } from '../../network/genericJSONRequest';
import { BanIcon, CircleExclamationIcon } from '../svgIcons';
import { PaginatorLine } from '../paginator';
import messages from './messages';

export const GroupMembersPlaceholder = () => {
  return (
    <div>
      <h3 className="f2 fw6 ttu barlow-condensed blue-dark mt0 pt2 mb4">
        <FormattedMessage {...messages.groupMembers} />
      </h3>
      Loading ...
    </div>
  )
}
