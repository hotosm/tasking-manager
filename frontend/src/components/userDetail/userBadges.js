import { FormattedMessage } from 'react-intl';
import messages from './messages';
import { useBadgesQuery } from '../../api/badges';

export const UserBadges = ({ userId }) => {
  const { data: badges } = useBadgesQuery(userId);

  if (!badges || badges.length == 0) {
    return '';
  }

  return <div>
    <h4 className="ttu"><FormattedMessage {...messages.achievements} /></h4>

    <div className="flex flex-wrap" style={{gap: "1rem"}}>
      {badges?.map((badge) => <img className="w3 h3" title={badge.name} src={badge.imagePath} />)}
    </div>
  </div>;
}
