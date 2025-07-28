import { FormattedMessage } from 'react-intl';

import messages from './messages';
import userDetailMessages from '../userDetail/messages';
import { RoadIcon, HomeIcon, WavesIcon, MarkerIcon } from '../svgIcons';
import { StatsCard } from '../statsCard';
import StatsInfoFooter from '../statsInfoFooter';
import { useOsmStatsQuery } from '../../api/stats';

export const FeatureStats = () => {
  const { data: stats, isSuccess: hasStatsLoaded } = useOsmStatsQuery({
    topics: ['building', 'road', 'edit', 'poi', 'waterway'],
  });

  const iconClass = 'h-50 w-50';
  const iconStyle = { height: '45px' };

  return (
    <>
      <div className="flex items-center">
        <h4 className="f3 fw6 ttu barlow-condensed blue-dark">
          <FormattedMessage {...messages.totalFeatures} />
        </h4>
      </div>
      <div className="w-100 cf">
        <StatsInfoFooter className="mb4" />

        <div className="flex gap-1 flex-nowrap-l flex-wrap">
          <StatsCard
            icon={<HomeIcon className={iconClass} style={iconStyle} />}
            description={<FormattedMessage {...userDetailMessages.buildingsMapped} />}
            value={hasStatsLoaded ? stats?.topics?.building?.value : 0}
            className={'w-25-l w-50-m w-100 mv1'}
          />
          <StatsCard
            icon={<RoadIcon className={iconClass} style={iconStyle} />}
            description={<FormattedMessage {...userDetailMessages.roadMapped} />}
            value={hasStatsLoaded ? stats?.topics?.road?.value : 0}
            className={'w-25-l w-50-m w-100 mv1'}
          />
          <StatsCard
            icon={<MarkerIcon className={iconClass} style={iconStyle} />}
            description={<FormattedMessage {...userDetailMessages.poiMapped} />}
            value={hasStatsLoaded ? stats?.topics?.poi?.value : 0}
            className={'w-25-l w-50-m w-100 mv1'}
          />
          <StatsCard
            icon={<WavesIcon className={iconClass} style={iconStyle} />}
            description={<FormattedMessage {...userDetailMessages.waterwaysMapped} />}
            value={hasStatsLoaded ? stats?.topics?.waterway?.value : 0}
            className={'w-25-l w-50-m w-100 mv1'}
          />
        </div>
      </div>
    </>
  );
};
