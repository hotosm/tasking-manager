import { FormattedMessage } from 'react-intl';

import { InfoIcon } from '../components/svgIcons';
import { Overview } from '../components/partnerMapswipeStats/overview';
import { GroupMembers } from '../components/partnerMapswipeStats/groupMembers';
import { ContributionsGrid } from '../components/partnerMapswipeStats/contributionsGrid';
import { TimeSpentContributing } from '../components/partnerMapswipeStats/timeSpentContributing';
import { TimeSpentContributingByDay } from '../components/partnerMapswipeStats/timeSpentContributingByDay';
import { ProjectTypeAreaStats } from '../components/partnerMapswipeStats/projectTypeAreaStats';
import { SwipesByProjectType } from '../components/partnerMapswipeStats/swipesByProjectType';
import { SwipesByOrganisation } from '../components/partnerMapswipeStats/swipesByOrganisation';
import { StatsCardWithFooter } from '../components/statsCard';
import messages from './messages';
import './partnersMapswipeStats.css';

const InfoBanner = () => {
  return (
    <div className="pr3 pv2 pl0 relative inline-flex mv3 mapswipe-stats-info-banner">
      <span className="inline-flex items-center ">
        <InfoIcon className="mr2" style={{ height: '20px' }} />
        <FormattedMessage {...messages.mapswipeInfo} />
      </span>
    </div>
  );
};

export const PartnersMapswipeStats = () => {
  return (
    <div className="pa4 bg-tan flex flex-column" style={{ gap: '1.25rem' }}>
      <InfoBanner />
      <Overview />

      <div className="mt3">
        <ContributionsGrid />
      </div>

      <div className="mt3">
        <TimeSpentContributing />
      </div>

      <div className="mt3">
        <TimeSpentContributingByDay />
      </div>

      <div className="mt4">
        <ProjectTypeAreaStats />
      </div>

      <div className="mt4 flex items-center justify-between">
        <StatsCardWithFooter
          description={<FormattedMessage {...messages.swipes} />}
          value="338K"
          style={{ width: '48.5%' }}
        />
        <StatsCardWithFooter
          description={<FormattedMessage {...messages.timeSpentContributing} />}
          value="11 days 5 hrs"
          className="w-100"
          style={{ width: '48.5%' }}
        />
      </div>

      <div className="mt3 flex items-center justify-between">
        <SwipesByProjectType />
        <SwipesByOrganisation />
      </div>

      <div className="mt3">
        <GroupMembers />
      </div>
    </div>
  );
};
