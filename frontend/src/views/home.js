import React, { useState, useEffect } from 'react';
import ReactTooltip from 'react-tooltip';
import { ErrorBoundary } from 'react-error-boundary';
import { FormattedMessage } from 'react-intl';
import { useIntl } from 'react-intl';

import { Jumbotron, SecondaryJumbotron } from '../components/homepage/jumbotron';
import { StatsSection } from '../components/homepage/stats';
import { MappingFlow } from '../components/homepage/mappingFlow';
import { WhoIsMapping } from '../components/homepage/whoIsMapping';
import { Testimonials } from '../components/homepage/testimonials';
import { Alert } from '../components/alert';
import homeMessages from '../components/homepage/messages';
import { InfoIcon } from '../components/svgIcons';
import { fetchExternalJSONAPI } from '../network/genericJSONRequest';
import { OHSOME_STATS_BASE_URL } from '../config/';
import messages from '../components/homepage/messages.js';

export function Home() {
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
    // timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };

  return (
    <div className="pull-center">
      <Jumbotron />
      <ErrorBoundary
        fallback={
          <div className="pt5 pb2 ph6-l ph4">
            <Alert type="error">
              <FormattedMessage {...homeMessages.statsLoadingError} />
            </Alert>
          </div>
        }
      >
        <StatsSection />
        <div className="info-ohsome-tooltip">
          <InfoIcon
            className="blue-grey h1 w1 v-mid ml2 pointer"
            data-tip={intl.formatMessage(messages['statsTooltip'], {
              formattedDate: new Intl.DateTimeFormat('en', dateOptions).format(
                new Date(lastUpdated),
              ),
              timeZone: intl.timeZone,
            })}
            data-for="ohsome-timestampx"
          />
          <ReactTooltip id="ohsome-timestampx" place="top" className="mw6" effect="solid" />
        </div>
      </ErrorBoundary>
      <MappingFlow />
      <WhoIsMapping />
      <Testimonials />
      <SecondaryJumbotron />
    </div>
  );
}
