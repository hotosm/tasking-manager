import React from 'react';
import { Link } from '@reach/router';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { Button } from '../button';

function contactCard() {
  return (
    <div className="w-25-l w-100 fl pv2 ph3 bg-white blue-dark shadow-4">
      <h3 className="ma1 pb3 w-70-l w-60-m f3 fw8 ttu barlow-condensed">
        <FormattedMessage {...messages.organizationContactTitle} />
      </h3>
      <div className="tc cf mb2">
        <p className="w-100 w-60-m fl tl pr2 f5 lh-title mb4">
          <FormattedMessage {...messages.organizationContactHeadline} />
        </p>
        <p>
          <Link to={'/contact'}>
            <Button className="w-100 w-40-m fl tc bg-red white">
              <FormattedMessage {...messages.organizationContactButton} />
            </Button>
          </Link>
        </p>
      </div>
    </div>
  );
}

export function WhoIsMapping() {
  const organizations = [
    { url: 'https://www.gfdrr.org/', name: 'gfdrr' },
    { url: 'https://www.usaid.gov/', name: 'usaid' },
    { url: 'https://www.redcross.org/', name: 'redcross' },
    { url: 'https://www.unicef.org/', name: 'unicef' },
    { url: 'http://aws.amazon.com/', name: 'aws' },
    { url: 'https://www.msf.org/', name: 'msf' },
  ];
  return (
    <div className="cf v-mid bg-split-blue-white">
      <div className="ph6-l ph4 pt3 pb5 white cf">
        <div className="bg-red mw5">
          <h3 className="pa1 f2 fw8 tc lh-copy white ttu barlow-condensed">
            <FormattedMessage {...messages.whoIsMappingTitle} />
          </h3>
        </div>
        <div className="w-75-l w-100 fl">
          <p className="pr2 mb4 f5 f4-ns lh-title mw6">
            <FormattedMessage {...messages.whoIsMappingHeadline} />
          </p>
          <div className="cf pb4 pb2-l">
            {organizations.map((org, n) => (
              <div key={n} className="w-50 w-third-l fl pr5 pv4">
                <a href={org.url}>
                  <div className={`contain org-${org.name} w-auto h3`}></div>
                </a>
              </div>
            ))}
          </div>
        </div>
        {contactCard()}
      </div>
    </div>
  );
}
