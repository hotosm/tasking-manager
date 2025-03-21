import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { ProgressBar } from '../progressBar';

export default function ProjectProgressBar({
  percentMapped,
  percentValidated,
  percentBadImagery,
  className,
  small = true,
}: Object) {
  return (
    <>
      <ProgressBar
        className={className}
        firstBarValue={percentMapped}
        secondBarValue={percentValidated}
        height="half"
        small={small}
      >
        <p className="f6 lh-copy ma0 white f7 fw4">
          <FormattedMessage
            {...messages['percentMapped']}
            values={{ n: <span className="fw8">{percentMapped}</span> }}
          />
        </p>
        <p className="f6 lh-copy ma0 white f7 fw4">
          <FormattedMessage
            {...messages['percentValidated']}
            values={{ n: <span className="fw8">{percentValidated}</span> }}
          />
        </p>
        {![null, undefined].includes(percentBadImagery) && (
          <p className="f6 lh-copy ma0 white f7 fw4">
            <FormattedMessage
              {...messages['percentBadImagery']}
              values={{ n: <span className="fw8">{percentBadImagery}</span> }}
            />
          </p>
        )}
      </ProgressBar>
    </>
  );
}
