import { Alert } from './alert';
import { FormattedMessage } from 'react-intl';
import messages from './messages';

export default function WebglUnsupported({ className }) {
  return (
    <div className={className}>
      <Alert type="warning" iconClassName="h2 w2">
        <h3 className="barlow-condensed f3 fw6 mv0 dib">
          <FormattedMessage {...messages.webglUnsupportedTitle} />
        </h3>
        <div className="mv4 lh-title">
          <FormattedMessage
            {...messages.webglUnsupportedDescription}
            values={{
              a: (msg) => (
                <a target="_blank" rel="noreferrer" href="https://get.webgl.org/">
                  {msg}
                </a>
              ),
            }}
          />
        </div>
      </Alert>
    </div>
  );
}
