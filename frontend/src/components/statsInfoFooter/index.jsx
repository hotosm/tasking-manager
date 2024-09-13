import { useIntl } from 'react-intl';

import { useOsmStatsMetadataQuery } from '../../api/stats';
import { dateOptions } from '../statsTimestamp';

export default function StatsInfoFooter() {
  const intl = useIntl();

  const { data: osmStatsMetadata } = useOsmStatsMetadataQuery();

  return (
    <div className="cf w-100 relative tr pt3">
      <span className="ma0 f7 fw4 blue-grey mb1 i">
        These statistics come from{' '}
        <a
          className="blue-grey fw7"
          href="https://stats.now.ohsome.org/about"
          target="_blank"
          rel="noreferrer"
        >
          ohsomeNow Stats
        </a>{' '}
        and were last updated at{' '}
        <strong>{intl.formatDate(osmStatsMetadata?.max_timestamp, dateOptions)}</strong> (
        {intl.timeZone}).
      </span>
    </div>
  );
}
