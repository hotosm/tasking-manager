import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { StatsCardWithDelta } from '../statsCard';
import { MappingIcon, SwipeIcon, ClockIcon } from '../svgIcons';

const iconClass = 'w-100';
const iconStyle = { height: '55px' };

export const Overview = () => {
  return (
    <div className="flex justify-between items-center flex-wrap flex-nowrap-ns" style={{ gap: '1.6rem' }}>
      <StatsCardWithDelta
        icon={<SwipeIcon className={iconClass} style={iconStyle} />}
        description={<FormattedMessage {...messages.totalSwipes} />}
        value={'1 M'}
        delta={<span><b>66k</b> swipes in the last 30 days</span>}
        className="w-100"
      />
      <StatsCardWithDelta
        icon={<ClockIcon className={iconClass} style={iconStyle} />}
        description={<FormattedMessage {...messages.totalTimeSpent} />}
        value={'1 Mo 2 Days'}
        delta={<span><b>2 days 15 hours</b> in the last 30 days</span>}
        className="w-100"
      />
      <StatsCardWithDelta
        icon={<MappingIcon className={iconClass} style={iconStyle} />}
        description={<FormattedMessage {...messages.totalContributors} />}
        value={'407'}
        delta={<span><b>33</b> active contributors in the last 30 days</span>}
        className="w-100"
      />
    </div>
  );
};
