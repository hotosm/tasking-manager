import { useState, useEffect } from 'react';
import { useIntl } from 'react-intl';
import { Tooltip as ReactTooltip } from 'react-tooltip';

import { fetchExternalJSONAPI } from '../../network/genericJSONRequest';
import { OHSOME_STATS_BASE_URL } from '../../config';
import { InfoIcon } from '../svgIcons';
import messages from './messages';

function StatsTimestamp({ messageType }) {
  const intl = useIntl();
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    fetchExternalJSONAPI(`${OHSOME_STATS_BASE_URL}/metadata`, false, { signal: controller.signal })
      .then((res) => {
        setLastUpdated(res.result.max_timestamp);
      })
      .catch((error) => {
        if (!controller.signal.aborted) console.error(error);
      });
    return () => controller.abort();
  }, []);

  const dateOptions = {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: 'numeric',
    minute: 'numeric',
  };

  return (
    <div>
      <InfoIcon
        className="blue-grey h1 w1 v-mid ml2 pointer"
        data-tip={intl.formatMessage(messages[messageType], {
          formattedDate: intl.formatDate(lastUpdated, dateOptions),
          timeZone: intl.timeZone,
        })}
        data-for="ohsome-timestamp"
      />
      <ReactTooltip id="ohsome-timestamp" place="top" className="mw6" effect="solid" />
    </div>
  );
}

export default StatsTimestamp;
