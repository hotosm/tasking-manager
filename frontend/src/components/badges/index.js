import { FormattedMessage } from 'react-intl';
import ReactPlaceholder from 'react-placeholder';
import { Link } from 'react-router-dom';

import messages from '../teamsAndOrgs/messages';
import { Management } from '../teamsAndOrgs/management';
import { nCardPlaceholders } from '../licenses/licensesPlaceholder';

export const BadgeCard = ({ badge }) => {
  return (
    <Link to={`${badge.badgeId}/`} className="w-50-ns w-100 fl pr3">
      hola
    </Link>
  );
};

export const BadgesManagement = ({badges, isFetched}) => {
  return (
    <Management
      title={
        <FormattedMessage
          {...messages.manage}
          values={{ entity: <FormattedMessage {...messages.badges} /> }}
        />
      }
      showAddButton={true}
      managementView
    >
      <ReactPlaceholder
        showLoadingAnimation={true}
        customPlaceholder={nCardPlaceholders(4)}
        delay={10}
        ready={isFetched}
      >
        {badges?.length ? (
          badges.map((i, n) => <BadgeCard key={n} badge={i} />)
        ) : (
          <div className="pv3">
            <FormattedMessage {...messages.noBadges} />
          </div>
        )}
      </ReactPlaceholder>
    </Management>
  );
};
