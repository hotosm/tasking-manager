import { Link } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';

import messages from './messages';

export default function ClearFilters({ url, className = '' }: {
  url: string;
  className?: string;
}) {
  return (
    <Link to={url} className={`red link ph3 pv2 f6 ${className}`}>
      <FormattedMessage {...messages.clearFilters} />
    </Link>
  );
}
