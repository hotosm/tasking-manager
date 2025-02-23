import { FormattedMessage } from 'react-intl';
import messages from '../../views/messages';

import { StatsSection } from './partnersStats';
import { Activity } from './partnersActivity';
import { CurrentProjects } from './currentProjects';
import StatsInfoFooter from '../statsInfoFooter';

export const Leaderboard = ({ partner, partnerStats }) => {
  return (
    <div className="pa4 bg-tan flex flex-column gap-1.25">
      <StatsInfoFooter className="mv3" />

      <div className="flex justify-between items-center">
        <h3 className="f2 blue-dark fw7 ma0 barlow-condensed v-mid dib">
          {partner.primary_hashtag
            ?.split(',')
            ?.map((str) => `#${str}`)
            ?.join(', ')}
        </h3>
      </div>

      <StatsSection partner={partnerStats} />

      <CurrentProjects currentProjects={partner.current_projects} />

      {/* activity section */}
      <div className="w-100 fl cf">
        <h3 className="f2 fw6 ttu barlow-condensed blue-dark mt0 pt2 mb3">
          <FormattedMessage {...messages.contributions} />
        </h3>
        <Activity partner={partner} />
      </div>
    </div>
  );
};
