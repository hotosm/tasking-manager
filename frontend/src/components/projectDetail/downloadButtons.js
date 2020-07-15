import React from 'react';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { API_URL } from '../../config';
import { CustomButton } from '../button';

export const DownloadAOIButton = ({ projectId, className }: Object) => (
  <a
    href={`${API_URL}projects/${projectId}/queries/aoi/?as_file=true`}
    download={`project-${projectId}-aoi.geojson`}
    className="ph2"
  >
    <CustomButton className={className}>
      <FormattedMessage {...messages.downloadProjectAOI} />
    </CustomButton>
  </a>
);

export const DownloadTaskGridButton = ({ projectId, className }: Object) => (
  <a
    href={`${API_URL}projects/${projectId}/tasks/?as_file=true`}
    download={`project-${projectId}-tasks.geojson`}
    className="ph2"
  >
    <CustomButton className={className}>
      <FormattedMessage {...messages.downloadTaskGrid} />
    </CustomButton>
  </a>
);
