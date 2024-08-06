import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQueryParam, StringParam } from 'use-query-params';
import ReactPlaceholder from 'react-placeholder';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { fetchLocalJSONAPI } from '../network/genericJSONRequest';
import { useSetTitleTag } from '../hooks/UseMetaTags';

export function EmailVerification() {
  useSetTitleTag('Verify email');
  /* eslint-disable-next-line */
  const [token, setToken] = useQueryParam('token', StringParam);
  /* eslint-disable-next-line */
  const [username, setUsername] = useQueryParam('username', StringParam);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    if (token && username) {
      fetchLocalJSONAPI(`/api/v2/system/authentication/email/?token=${token}&username=${username}`)
        .then((success) => setStatus('emailVerified'))
        .catch((error) => setStatus('verificationError'));
    }
  }, [token, username]);

  return (
    <div className="cf w-100 pv5 ph6-l ph4">
      <ReactPlaceholder
        showLoadingAnimation={true}
        rows={2}
        height="10rem"
        delay={10}
        ready={status !== 'loading'}
      >
        <h3 className="f2 fw5 barlow-condensed tc">
          <FormattedMessage {...messages[status]} />
        </h3>
        <p className="f5 tc">
          <FormattedMessage {...messages[`${status}Explanation`]} />
        </p>
        {status === 'emailVerified' && (
          <p className="f5 tc">
            <FormattedMessage
              {...messages.successExtraLine}
              values={{
                link: (
                  <Link to={'/settings'} className="red link">
                    <FormattedMessage {...messages.profileSettings} />
                  </Link>
                ),
              }}
            />
          </p>
        )}
      </ReactPlaceholder>
    </div>
  );
}
