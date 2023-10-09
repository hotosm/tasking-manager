import { useState, useEffect } from 'react';
import { useIntl } from 'react-intl';
import ReactTooltip from 'react-tooltip';

import { fetchExternalJSONAPI } from '../../network/genericJSONRequest';
import { OHSOME_STATS_BASE_URL } from '../../config';
import { InfoIcon } from '../svgIcons';
import messages from './messages';

function StatsTimestamp({ messageType }) {
  const intl = useIntl();
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    fetchExternalJSONAPI(`${OHSOME_STATS_BASE_URL}/metadata`)
      .then((res) => {
        setLastUpdated(res.result.max_timestamp);
      })
      .catch((error) => console.error(error));
  }, []);

  const dateOptions = {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: 'numeric',
    minute: 'numeric',
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };

  return (
    <div>
      <InfoIcon
        className="blue-grey h1 w1 v-mid ml2 pointer"
        data-tip={intl.formatMessage(messages[messageType], {
          // formattedDate: intl.formatDate(lastUpdated, dateOptions),
          formattedDate: new Intl.DateTimeFormat('en', dateOptions).format(new Date(lastUpdated)),
          timeZone: intl.timeZone,
        })}
        data-for="ohsome-timestamp"
      />
      <ReactTooltip id="ohsome-timestamp" place="top" className="mw6" effect="solid" />
    </div>
  );
}

export default StatsTimestamp;
