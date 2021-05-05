import React from 'react';
import { FormattedMessage, FormattedNumber } from 'react-intl';

import messages from './messages';
import { StatsCardContent } from '../statsCard';

export const OrganisationProjectStats = ({ projects }) => {
  return (
    <>
      {projects ? (
        <>
          <div className="pa2 w-25-l w-50-m w-100 fl">
            <div className="cf pa3 bg-white shadow-4">
              <StatsCardContent
                label={<FormattedMessage {...messages.publishedProjects} />}
                className="tc"
                value={<FormattedNumber value={projects.published} />}
              />
            </div>
          </div>
          <div className="pa2 w-25-l w-50-m w-100 fl">
            <div className="cf pa3 bg-white shadow-4">
              <StatsCardContent
                label={<FormattedMessage {...messages.currentProjects} />}
                className="tc"
                value={<FormattedNumber value={projects.recent} />}
              />
            </div>
          </div>
          <div className="pa2 w-25-l w-50-m w-100 fl">
            <div className="cf pa3 bg-white shadow-4">
              <StatsCardContent
                label={<FormattedMessage {...messages.staleProjects} />}
                className="tc"
                value={<FormattedNumber value={projects.stale} />}
              />
            </div>
          </div>
        </>
      ) : (
        ''
      )}
    </>
  );
};
