import { useNavigate, Link } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { Button } from '../components/button';
import { SERVICE_DESK } from '../config';

export const FallbackComponent = () => {
  const navigate = useNavigate();

  return (
    <div className="cf w-100 pv5 base-font">
      <h3 className="f2 fw5 barlow-condensed tc">
        <FormattedMessage {...messages.errorFallback} />
      </h3>
      <div className="tc pv4">
        <p>
          <FormattedMessage {...messages.errorFallbackMessage} />
        </p>
        <p className="pt2">
          {SERVICE_DESK ? (
            <a href={SERVICE_DESK} target="_blank" rel="noreferrer">
              <Button className="dib tc bg-red white mh1">
                <FormattedMessage {...messages.contactUs} />
              </Button>
            </a>
          ) : (
            <Link to="/contact">
              <Button className="dib tc bg-red white mh1">
                <FormattedMessage {...messages.contactUs} />
              </Button>
            </Link>
          )}
          <Button className="dib tc bg-red white mh1" onClick={() => navigate(-1)}>
            <FormattedMessage {...messages.return} />
          </Button>
        </p>
      </div>
    </div>
  );
};
