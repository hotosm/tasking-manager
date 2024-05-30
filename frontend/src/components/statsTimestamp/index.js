import { useIntl } from 'react-intl';
import ReactTooltip from 'react-tooltip';

import { InfoIcon } from '../svgIcons';
import messages from './messages';
import { useOsmStatsMetadataQuery } from '../../api/stats';

export const dateOptions = {
  year: 'numeric',
  month: 'short',
  day: '2-digit',
  hour: 'numeric',
  minute: 'numeric',
};

function StatsTimestamp({ messageType }) {
  const intl = useIntl();

  const { data: osmStatsMetadata } = useOsmStatsMetadataQuery();

  return (
    <div>
      <InfoIcon
        className="blue-grey h1 w1 v-mid ml2 pointer"
        data-tip={intl.formatMessage(messages[messageType], {
          formattedDate: intl.formatDate(osmStatsMetadata?.max_timestamp, dateOptions, dateOptions),
          timeZone: intl.timeZone,
        })}
        data-for="ohsome-timestamp"
      />
      <ReactTooltip id="ohsome-timestamp" place="top" className="mw6" effect="solid" />
    </div>
  );
}

export default StatsTimestamp;
