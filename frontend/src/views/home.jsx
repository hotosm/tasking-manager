import { ErrorBoundary } from 'react-error-boundary';
import { FormattedMessage } from 'react-intl';

import { Jumbotron, SecondaryJumbotron } from '../components/homepage/jumbotron';
import { StatsSection } from '../components/homepage/stats';
import { MappingFlow } from '../components/homepage/mappingFlow';
import { WhoIsMapping } from '../components/homepage/whoIsMapping';
import { Testimonials } from '../components/homepage/testimonials';
import { Alert } from '../components/alert';
import homeMessages from '../components/homepage/messages';

export function Home() {
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
      </ErrorBoundary>
      <MappingFlow />
      <WhoIsMapping />
      <Testimonials />
      <SecondaryJumbotron />
    </div>
  );
}
