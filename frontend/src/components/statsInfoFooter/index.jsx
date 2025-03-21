import { useIntl } from 'react-intl';

import { useOsmStatsMetadataQuery } from '../../api/stats';
import { dateOptions } from '../statsTimestamp';
import { InfoIcon } from '../svgIcons';
import '../../views/partnersMapswipeStats.scss';

export default function StatsInfoFooter({ className }) {
  const intl = useIntl();

  const { data: osmStatsMetadata } = useOsmStatsMetadataQuery();

  return (
    <div
      className={`pr3 pv2 pl0 relative inline-flex mapswipe-stats-info-banner
      blue-dark ${className}`}
    >
      <span className="inline-flex items-center ">
        <InfoIcon className="mr2" style={{ height: '20px' }} />
        <span>
          These statistics come from{' '}
          <a
            className="blue-grey"
            href="https://stats.now.ohsome.org/about"
            target="_blank"
            rel="noreferrer"
          >
            ohsomeNow Stats
          </a>{' '}
          and were last updated at{' '}
          <span className="fw5 stats-info-datetime">
            {intl.formatDate(osmStatsMetadata?.max_timestamp, dateOptions)}
          </span>{' '}
          ({intl.timeZone})
        </span>
      </span>
    </div>
  );
}
