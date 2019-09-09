import React from 'react';
import { Link } from '@reach/router';
import { FormattedMessage } from 'react-intl';

import { Button } from '../button';
import messages from './messages';

function JumbotronButtons() {
  return (
    <p>
      <Link to={'contribute'}>
        <Button className="bg-red white mr3">
          <FormattedMessage {...messages.startButton} />
        </Button>
      </Link>
      <Link to={'sign-up'}>
        <Button className="bg-white blue-dark mt3 mt0-ns">
          <FormattedMessage {...messages.joinButton} />
        </Button>
      </Link>
    </p>
  );
}

export function Jumbotron() {
  return (
    <div className="cover bg-jumbotron white">
      <div className="pl6-l pl4 pv5-ns pv3">
        <h3 className="mb4 mw6-ns mw-20rem f-4rem-l f1 ttu barlow-condensed fw8">
          <FormattedMessage {...messages.jumbotronTitle} />
        </h3>
        <p className="pr2 f4 f3-ns mw7 mb4">
          <FormattedMessage {...messages.jumbotronHeadLine} />
        </p>
        <JumbotronButtons />
      </div>
    </div>
  );
}

export function SecondaryJumbotron() {
  return (
    <div className="cover bg-sec-jumbotron white">
      <div className="pl6-l pl4 pv5-ns pv2">
        <h3 className="mb4 mw6 f2 ttu barlow-condensed fw8">
          <FormattedMessage {...messages.secJumbotronTitle} />
        </h3>
        <p className="pr2 f5 f4-ns mw6">
          <FormattedMessage
            {...messages.secJumbotronHeadLine}
            values={{
              link: (
                <Link to={'learn'} className="link white">
                  <FormattedMessage {...messages.howItWorks} />
                </Link>
              ),
            }}
          />
        </p>
        <p className="pr2 f5 f4-ns mw6 mb4">
          <FormattedMessage {...messages.secJumbotronHeadLine2} />
        </p>
        <JumbotronButtons />
      </div>
    </div>
  );
}
