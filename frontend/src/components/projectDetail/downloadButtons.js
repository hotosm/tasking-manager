import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { API_URL } from '../../config';
import { CustomButton } from '../button';
import { NineCellsGridIcon, MappedIcon } from '../svgIcons';

export const DownloadAOIButton = ({ projectId, className }: Object) => (
  <a
    href={`${API_URL}projects/${projectId}/queries/aoi/?as_file=true`}
    download={`project-${projectId}-aoi.geojson`}
  >
    <CustomButton className={className} icon={<MappedIcon className="h1 v-mid" />}>
      <FormattedMessage {...messages.downloadProjectAOI} />
    </CustomButton>
  </a>
);

export const DownloadTaskGridButton = ({ projectId, className }: Object) => (
  <a
    href={`${API_URL}projects/${projectId}/tasks/?as_file=true`}
    download={`project-${projectId}-tasks.geojson`}
  >
    <CustomButton className={className} icon={<NineCellsGridIcon className="h1 v-mid" />}>
      <FormattedMessage {...messages.downloadTaskGrid} />
    </CustomButton>
  </a>
);
